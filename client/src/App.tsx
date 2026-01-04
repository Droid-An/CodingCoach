import './App.css'
import { useState, useRef, useCallback } from 'react';
import { getCodeFeedback, findSimilarPoints, mergeFeedbackPointsByTitle } from './networks/gpt';
import FeedbackPoint from './FeedbackPoint';
import { FeedbackPointModel } from './models/FeedbackModel';
import CodeEditor from '@uiw/react-textarea-code-editor';
import rehypePrism from 'rehype-prism-plus';
import rehypeRewrite from "rehype-rewrite";
import FeedbackModal from './FeedbackModal';
import { useLocation } from 'react-router';
import NavBar from './NavBar';

const FEEDBACK_TYPES = ["Performance", "Readability", "Advanced", "Bug"];

const App = () => {
  const { state } = useLocation();
  const fileContents = state?.fileContents

  const [code, setCode] = useState<string | undefined>(fileContents ?? undefined);
  const [feedbackList, setFeedbackList] = useState<FeedbackPointModel[]>([]);
  const [language, setLanguage] = useState<string | undefined>(undefined);

  const [hoveredPoint, setHoveredPoint] = useState<FeedbackPointModel | undefined>(undefined);
  const [expandedPoint, setExpandedPoint] = useState<FeedbackPointModel | undefined>(undefined);
  const [hasCodeChanged, setHasCodeChanged] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onSubmit = useCallback(async (code: string) => {
    if (!code) {
      return;
    }

    try {
      setHasCodeChanged(false);
      setFeedbackList([]);
      setIsLoading(true);

      const feedbackPromises = FEEDBACK_TYPES.map(type => getCodeFeedback(code, type));

      const results = await Promise.allSettled(feedbackPromises);

      const combinedPoints: FeedbackPointModel[] = [];
      let detectedLanguage: string | undefined;

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const feedback = result.value;
          if (!detectedLanguage) {
            detectedLanguage = feedback.language;
          }
          combinedPoints.push(...feedback.feedbackPoints);
        } else {
          console.error(`Error fetching ${FEEDBACK_TYPES[index]} feedback:`, result.reason);
        }
      });

      if (detectedLanguage) {
        setLanguage(detectedLanguage);
      }

      combinedPoints.sort((a, b) => b.severity - a.severity);

      const similarPoints = await findSimilarPoints(combinedPoints);
      const mergedFeedback = await mergeFeedbackPointsByTitle(combinedPoints, similarPoints.merge_groups)
      setFeedbackList(mergedFeedback);


    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  const getReloadMessage = () => {
    return <div className="alert alert-primary" role="alert">
      Your code has changed; click submit to get new feedback.
      <br />
      <br />
      {getSubmitButton()}
    </div>
  }

  const getLoadingPanel = () => {
    return <div className="spinner" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  }

  const getFeedbackSidePanel = () => {
    if (expandedPoint) {
      return <></>
    }

    const getSeverityColor = (severity: number) => {
      switch (severity) {
        case 5: return '#74a57d';  // critical
        case 4: return '#93b99a';  // high
        case 3: return '#b2cdb7';  // medium
        case 2: return '#d1e1d4';  // low
        default: return '#f0f5f1'; // informational
      }
    };

    const getSeverityLabel = (severity: number) => {
      switch (severity) {
        case 5: return 'Critical';
        case 4: return 'High';
        case 3: return 'Medium';
        case 2: return 'Low';
        default: return 'Informational';
      }
    };

    const groupedBySeverity = feedbackList.reduce((acc, point) => {
      (acc[point.severity] = acc[point.severity] || []).push(point);
      return acc;
    }, {} as Record<number, FeedbackPointModel[]>);

    return (
      <div>
        {hasCodeChanged && getReloadMessage()}
        {Object.keys(groupedBySeverity).sort((a, b) => Number(b) - Number(a)).map(sev => {
          const severity = Number(sev);
          return (
            <div
              key={sev}
              style={{
                backgroundColor: getSeverityColor(severity),
                padding: '16px',
                marginBottom: '32px',
                borderRadius: '8px'
              }}
            >
              <h4>{getSeverityLabel(severity)}</h4>
              {groupedBySeverity[severity].map((point, idx) => (
                <FeedbackPoint
                  key={idx}
                  point={point}
                  onLeave={() => {
                    setHoveredPoint(undefined);
                  }}
                  onHover={(hoveredPoint) => {
                    setHoveredPoint(hoveredPoint);
                    scrollToDepth(hoveredPoint.getLinesToHighlight()[0] * 21);
                  }}
                  onExpandClicked={() => {
                    setExpandedPoint(point);
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  const getSubmitButton = () => {
    return <button type="button" className="btn btn-primary" onClick={() => onSubmit(code || '')}>
      Submit
    </button>
  }

  const getLinesToHighlight = (lineNumbers: string): number[] => {
    const lines: number[] = [];
    const parts = lineNumbers.split(',');

    parts.forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        for (let i = start; i <= end; i++) {
          lines.push(i);
        }
      } else {
        lines.push(Number(part));
      }
    });

    return lines;
  };

  const codeEditorRef = useRef<HTMLDivElement>(null);

  const scrollToDepth = (depth: number) => {
    if (codeEditorRef.current) {
      const containerHeight = codeEditorRef.current.clientHeight;
      const scrollTop = depth - containerHeight / 2;
      codeEditorRef.current.scrollTo({
        top: scrollTop < 0 ? 0 : scrollTop,
        behavior: 'smooth',
      });
    }
  };

  const getIntroPanel = () => {
    return <div>
      <p>Submit your code to get feedback on performance, readability, bugs and advanced topics.</p>
      <p>Feedback is categorized by severity:</p>
      <ul>
        <li><strong>Critical</strong>: Important issues that need attention to ensure your code runs smoothly.</li>
        <li><strong>High</strong>: Significant improvements that can enhance your code's performance or functionality.</li>
        <li><strong>Medium</strong>: Useful suggestions to make your code more efficient and effective.</li>
        <li><strong>Low</strong>: Minor tweaks that can help polish your code.</li>
        <li><strong>Informational</strong>: Helpful tips and best practices to consider.</li>
      </ul>
      {getSubmitButton()}
    </div>
  }

  const showIntroPanel = feedbackList.length === 0;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', margin: 0, overflow: 'hidden' }}>
      <NavBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div ref={codeEditorRef} style={{ position: 'relative', flex: 1, padding: '12px', overflowY: 'auto', zIndex: 0 }}>
          <CodeEditor
            value={code}
            language={feedbackList.length > 0 ? language : "text"}
            placeholder="Copy and paste your code here"
            onChange={(evn) => {
              const newCode = evn.target.value;
              if (newCode !== code) {
                setHasCodeChanged(true);
                setCode(newCode);
              }
            }
            }
            padding={15}
            rehypePlugins={[
              [rehypePrism, { ignoreMissing: true }],
              [
                rehypeRewrite,
                {
                  rewrite: (node: any, index: number) => {
                    if (node.properties?.className?.includes("code-line")) {
                      const point = hoveredPoint || expandedPoint;

                      if (point && point.line_numbers) {
                        const linesToHighlight = getLinesToHighlight(point.line_numbers);

                        if (linesToHighlight.includes(index + 1)) {
                          node.properties.className.push("code_highlighted");
                        } else {
                          node.properties.className.push("code_greyed");
                        }

                      }
                    }
                  }
                }
              ]
            ]}
            style={{
              marginLeft: '12px',
              borderRadius: '8px',
              backgroundColor: "#f5f5f5",
              minHeight: '100%',
              fontSize: 14,
              fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
            }}
          />
        </div>
        <div style={{ flex: 1, padding: '12px', overflowY: 'auto', zIndex: 0 }}>
          {isLoading ? getLoadingPanel() : showIntroPanel ? getIntroPanel() : getFeedbackSidePanel()}
        </div>
      </div>
      <FeedbackModal point={expandedPoint || { title: 'Loading', description: '', questions: '', line_numbers: '', code_example: '', summary: '' } as FeedbackPointModel} language={language ? language : "text"} initialCode={code} isModalOpen={expandedPoint !== undefined} onModalClose={
        () => {
          setExpandedPoint(undefined);
        }
      } />
    </div>
  );
}
export default App

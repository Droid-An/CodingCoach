import React, { useState, useCallback } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { FeedbackPointModel } from './models/FeedbackModel';
import { continueConversation } from './networks/gpt';
import Markdown from 'react-markdown'



interface FeedbackModalProps {
    point: FeedbackPointModel;
    language: string;
    initialCode: string | undefined;
    isModalOpen: boolean;
    onModalClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ point, isModalOpen, language, initialCode, onModalClose }) => {
    const [messages, setMessages] = useState<string[]>([]);

    const convertFeedbackPointToString = useCallback((feedback_point: FeedbackPointModel): string => {
        return `${feedback_point.title}\n${feedback_point.description}\n${feedback_point.questions}\n${feedback_point.code_example}`;
    }, []);

    const handleUserMessage = useCallback(async (message: string, feedback_point: FeedbackPointModel) => {
        setMessages((prev) => [...prev, message]);
        continueConversation(initialCode, convertFeedbackPointToString(feedback_point), messages, message)
            .then(response => {
                setMessages((prevMessages) => [...prevMessages, response]);
            });
    }, [initialCode, messages, convertFeedbackPointToString]);

    const handleClose = () => {
        setMessages([]);
        onModalClose();
    };

    return (
        <div className={`modal fade ${isModalOpen ? 'show' : ''}`}
            style={{ display: isModalOpen ? 'block' : 'none', position: 'fixed', top: "11%", right: 0, bottom: 0, width: '50%', marginLeft: 'auto', height: '88%', paddingLeft: "10px", paddingRight: "20px" }}
            tabIndex={-1}
            aria-labelledby="staticBackdropLabel"
            aria-hidden="true">
            <div className="modal-dialog modal-dialog-scrollable" style={{ height: '100%', margin: 0, maxWidth: '100%' }}>
                <div className="modal-content" style={{ height: '100%' }}>
                    <div className="modal-header">
                        <h1 className="modal-title fs-5" id="staticBackdropLabel">{point.title}</h1>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={handleClose}></button>
                    </div>
                    <div className="modal-body" style={{ overflowY: 'auto' }}>
                        <p>{point.description}</p>
                        <p>{point.questions}</p>
                        <SyntaxHighlighter language={language} style={docco} wrapLongLines={true}>
                            {point.code_example}
                        </SyntaxHighlighter>
                        <div>
                            {messages.map((message, idx) => (
                                <div key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f0f0f0' : '#ffffff', padding: '10px', borderRadius: '5px', marginBottom: '5px' }}>
                                    <Markdown>{message}</Markdown>
                                </div>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Ask a follow-up question"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                                    handleUserMessage(e.currentTarget.value, point);
                                    e.currentTarget.value = '';
                                }
                            }}
                            style={{ width: '100%', padding: '8px', marginTop: '10px' }}
                        />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={handleClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;
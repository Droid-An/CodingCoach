import axios from 'axios';
import { FeedbackModel, FeedbackPointModel } from '../models/FeedbackModel';

const API_URL = 'https://api.openai.com/v1/chat/completions';


const MODEL_GPT_4O = 'gpt-4o';
// const MODEL_GPT_4O_MINI = 'gpt-4o-mini';
// const MODEL_GPT_35_TURBO = 'gpt-3.5-turbo';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

const getBaseCoach = (area: string): string => (
    `You are a coding coach who is trained to give feedback only on "${area}". Your task is to provide constructive feedback on the code provided by the user. You will be given the initial and edited code in the first message. You should reply with a JSON object containing feedback on the edited code only on the area that you have been assigned to below.

    You should never, under any circumstances, give the feedback that there should be more code comments or better function documentation. Aim for better, more useful feedback.
    
    All feedback should be in markdown format. All titles used should use H3 as the largest heading.
    `
)

const getAdvancedTechniquesCoach = (): ChatMessage => ({
    role: 'system',
    content: `${getBaseCoach("Advanced Programming Techniques")}
    
    You should focus only on teaching the user advanced techniques and best practices. Explain how they could improve their code by using techniques, approaches, syntax, patterns and language features that they might not be familiar with.
    
    Do not feature feedback anything to do with Performance or Readability. Only give feedback on the Advanced Techniques as shown above.`
});

const getBugCoach = (): ChatMessage => ({
    role: 'system',
    content: `${getBaseCoach("Bugs and Errors")}
    
    You should focus on identifying and explaining bugs and errors in the code. This might include syntax errors, runtime errors, or logical errors. Do not give away the solution, but provide hints and guidance on how to fix the issue. Try to coach the user of understanding the error and how to debug it.
    
    Do not feature feedback anything to do with Performance or Readability. Only give feedback on the Advanced Techniques as shown above.`
});

const getReadabilityCoach = (): ChatMessage => ({
    role: 'system',
    content: `${getBaseCoach("Readability and Code Quality")}

    You should focus on the Readability of the code and general code quality. This might include elements like variable names, code structure, DRY, and overall readability.
    
    Do not feature feedback about Performance. Only give feedback Readability.`
});

const getPerformanceCoach = (): ChatMessage => ({
    role: 'system',
    content: `${getBaseCoach("Performance")}

    You should focus on the Performance of the code. This might include things like algorithmic complexity, memory usage, and execution speed. Some red flags might be inefficient loops, unnecessary memory allocations, or slow algorithms.
    
    Do not feature feedback about Readability. Only give feedback on Performance..`
});

const getConversationalCoach = (): ChatMessage => ({
    role: 'system',
    content: `You are a coding coach. Your task is to provide constructive feedback on the edited code provided by the user. 
    
    You will know the codebase, the previous feedback given and then you will be answering questions and queries the trainees has about the feedback.
    
    Keep responses fairly short and conversational.`
});

const groupCommentsPrompt = (): ChatMessage => ({
    role: "system",
    content: `
You are a similarity classifier for code review feedback.

You are given a list of feedback points.
Your task is ONLY to identify which feedback points describe the SAME underlying issue
and therefore could be merged.

Rules:
1. Do NOT rewrite, summarize, or remove any feedback.
2. Do NOT create new feedback.
3. Only decide grouping.
4. Two feedback points can be grouped ONLY IF:
   - They refer to the exact same line_numbers
   - They describe the same root problem, not just related concepts
5. If nothing should be grouped, return an empty list.

Each merge group is an array of feedback point titles that could be merged.
Only include groups with 2 or more titles.

This is a classification task, not an editing task.
`
})

const getSchema = () => (
    {
        "name": "feedback_list",
        "schema": {
            "type": "object",
            "properties": {
                "language": {
                    "type": "string",
                    "description": "The programming language of the code given in prism format."
                },
                "feedback_points": {
                    "type": "array",
                    "description": "A collection of feedback points.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {
                                "type": "string",
                                "description": "The title of the feedback point."
                            },
                            "summary": {
                                "type": "string",
                                "description": "A very short summary of the problem, explained in the context of a beginner coder, without using any of the words in the title."
                            },
                            "description": {
                                "type": "string",
                                "description": "A detailed explanation of the feedback given."
                            },
                            "questions": {
                                "type": "string",
                                "description": "Acting as a coach, use questioning to help the trainee understand the feedback."
                            },
                            "line_numbers": {
                                "type": "string",
                                "description": "The line numbers in the code where the feedback applies. Denoted as a comma separated list, with individual numbers or ranges of numbers (e.g. 3,4,10-15)"
                            },
                            "code_example": {
                                "type": "string",
                                "description": "A code example providing a solution or illustration related to the feedback."
                            }, "type": {
                                "type": "string",
                                "enum": ["Performance", "Readability", "Advanced", "Bug"],
                            }, "severity": {
                                "type": "integer",
                                "description": "The severity of the feedback. 1 is the lowest severity and 5 is the highest. The severity should be classified as 5=Critical, 4=High, 3=Medium, 2=Low, 1=Informational."
                            }
                        },
                        "required": [
                            "title",
                            "description",
                            "code_example",
                            "questions",
                            "line_numbers",
                            "summary",
                            "type",
                            "severity"
                        ],
                        "additionalProperties": false
                    }
                }
            },
            "required": [
                "feedback_points",
                "language"
            ],
            "additionalProperties": false
        },
        "strict": true
    }
);

const mergeSchema = () => (
    {
        "name": "merge_decisions",
        "schema": {
            "type": "object",
            "properties": {
                "merge_groups": {
                    "type": "array",
                    "items": {
                        "type": "array",
                        "items": { "type": "string" },
                        "minItems": 2
                    }
                }
            },
            "required": ["merge_groups"],
            "additionalProperties": false
        },
        "strict": true

    }
)
const addLineNumbers = (code: string): string => {
    const lines = code.split('\n');
    return lines.map((line, index) => `${index + 1}: ${line}`).join('\n');
}

export const getCodeFeedback = async (code: string, feedbackType: string): Promise<FeedbackModel> => {
    const messages: ChatMessage[] = [
        {
            role: 'user',
            content: addLineNumbers(code),
        },
    ];

    if (feedbackType.toLowerCase() === 'readability') {
        messages.unshift(getReadabilityCoach());
    } else if (feedbackType.toLowerCase() === 'advanced') {
        messages.unshift(getAdvancedTechniquesCoach());
    } else if (feedbackType.toLowerCase() === 'performance') {
        messages.unshift(getPerformanceCoach());
    } else if (feedbackType.toLowerCase() === 'bug') {
        messages.unshift(getBugCoach());
    }

    try {
        // const response = await axios.post(
        //     API_URL,
        // {
        //     model: MODEL_GPT_4O,
        //     messages: messages,
        //     response_format: {
        //         type: "json_schema",
        //         json_schema: getSchema(),
        //     }
        //     },
        //     {
        //         headers: {
        //             'Content-Type': 'application/json',
        //             'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`,
        //         },
        //     }
        // );
        const response = await axios.post('/api/chat', {
            model: MODEL_GPT_4O,
            messages: messages,
            response_format: {
                type: "json_schema",
                json_schema: getSchema(),
            }
        });
        const feedbackData = JSON.parse(response.data.choices[0].message.content);
        const feedbackPoints = feedbackData.feedback_points.map((point: any) => new FeedbackPointModel(
            point.title,
            point.description,
            point.questions,
            point.line_numbers,
            point.code_example,
            point.summary,
            point.type,
            point.severity));

        return {
            feedbackType: feedbackType,
            feedbackPoints: feedbackPoints,
            language: feedbackData.language,
        } as FeedbackModel;
    } catch (error) {
        console.error('Error starting conversation:', error);
        throw error;
    }
};

export const findSimilarPoints = async (prevFeedbackPoints: FeedbackPointModel[]) => {

    const convertFeedbackPointToString = (feedback_point: FeedbackPointModel): string => {
        const stringOutput: string[] = []
        for (const [key, value] of Object.entries(feedback_point)) {
            stringOutput.push(`${key}:${value}`)
        }
        return stringOutput.join("\n")
    };
    const stringFeedback = prevFeedbackPoints
        .map(convertFeedbackPointToString)
        .join('\n\n');

    const messages: ChatMessage[] = [
        {
            role: 'user',
            content: stringFeedback,
        },
    ]
    messages.unshift(groupCommentsPrompt());

    try {
        // const response = await axios.post(
        //     API_URL,
        //     {
        // model: MODEL_GPT_4O,
        // messages: messages,
        // response_format: {
        //     type: "json_schema",
        //     json_schema: mergeSchema(),
        //         }
        //     },
        //     {
        //         headers: {
        //             'Content-Type': 'application/json',
        //             'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`,
        //         },
        //     }
        // );
        const response = await axios.post("/api/chat", {
            model: MODEL_GPT_4O,
            messages: messages,
            response_format: {
                type: "json_schema",
                json_schema: mergeSchema(),
            }
        })
        const feedbackData = JSON.parse(response.data.choices[0].message.content);
        return feedbackData
    } catch (error) {
        console.error('Error starting conversation:', error);
        throw error;
    }
}


export const mergeFeedbackPointsByTitle = async (
    points: FeedbackPointModel[],
    mergeGroups: string[][]
) => {

    // map: title → FeedbackPointModel
    const pointMap = new Map(
        points.map(p => [p.title, p])
    );

    // set of titles that were merged
    const mergedTitles = new Set<string>();

    const result: FeedbackPointModel[] = [];

    for (const group of mergeGroups) {
        //create an array of points that must be grouped
        const groupPoints: FeedbackPointModel[] = [];

        for (const title of group) {
            const point = pointMap.get(title);
            if (!point) {
                throw new Error(`Missing feedback for title: ${title}`);
            }
            groupPoints.push(point);
        }

        group.forEach(title => mergedTitles.add(title));

        const mostSeverePoint = groupPoints.reduce((max, current) =>
            current.severity > max.severity ? current : max
        );
        result.push(mostSeverePoint)
    }

    // Add points that weren't merged
    for (const p of points) {
        if (!mergedTitles.has(p.title)) {
            result.push(p);
        }
    }
    return result;
}


export const continueConversation = async (initialCode: string | undefined, feedbackPoint: string, previousMessages: string[], newMessage: string): Promise<string> => {
    const messages: ChatMessage[] = [
        {
            role: 'user',
            content: addLineNumbers(initialCode ?? ""),
        },
        {
            role: 'assistant',
            content: feedbackPoint,
        },
        ...previousMessages.map(message => ({
            role: 'user',
            content: message,
        })) as ChatMessage[],
        {
            role: 'user',
            content: newMessage,
        },
    ];

    try {
        // const response = await axios.post(
        //     API_URL,
        //     {
        //         model: MODEL_GPT_4O,
        //         messages: [getConversationalCoach(), ...messages],
        //     },
        //     {
        //         headers: {
        //             'Content-Type': 'application/json',
        //             'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`,
        //         },
        //     }
        // );
        const response = await axios.post('/api/chat', {
            model: MODEL_GPT_4O,
            messages: [getConversationalCoach(), ...messages]
        })

        return response.data.choices[0].message.content
    } catch (error) {
        console.error('Error continuing conversation:', error);
        throw error;
    }
};
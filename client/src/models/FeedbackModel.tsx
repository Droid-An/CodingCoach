export class FeedbackPointModel {
    title: string;
    description: string;
    questions: string;
    line_numbers: string;
    code_example: string;
    summary: string;
    type: string;
    severity: number;

    constructor(title: string, description: string, questions: string, line_numbers: string, code_example: string, summary: string, type: string, severity: number) {
        this.title = title;
        this.description = description;
        this.questions = questions;
        this.line_numbers = line_numbers;
        this.code_example = code_example;
        this.summary = summary;
        this.type = type;
        this.severity = severity
    }

    getLinesToHighlight(): number[] {
        const lines: number[] = [];
        const parts = this.line_numbers.split(',');

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
    }
}

export interface FeedbackModel {
    feedbackPoints: FeedbackPointModel[];
    language: string;
    feedbackType: string;
}
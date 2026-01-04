import React from 'react';
import { FeedbackPointModel } from './models/FeedbackModel';

interface FeedbackProps {
    point: FeedbackPointModel;
    onHover?: (point: FeedbackPointModel) => void;
    onExpandClicked?: (point: FeedbackPointModel) => void;
    onLeave?: () => void;
}

const formatLineCount = (lineNumbers: string): string => {
    if (lineNumbers.includes('-') || lineNumbers.includes(',')) {
        return `Lines ${lineNumbers}`;
    } else {
        return `Line ${lineNumbers}`;
    }
}

const FeedbackPoint: React.FC<FeedbackProps> = ({ point, onHover, onLeave, onExpandClicked }) => {
    const [_, setIsHovering] = React.useState<boolean>(false);

    const getHeaderColor = (type: string): React.CSSProperties => {
        switch (type.toLowerCase()) {
            case 'performance':
                return { backgroundColor: '#a8d5ba', color: '#000' };
            case 'readability':
                return { backgroundColor: '#a8c5d5', color: '#000' };
            case 'advanced':
                return { backgroundColor: '#d5c5a8', color: '#000' };
            case 'bug':
                return { backgroundColor: '#ff9994', color: '#000' };
            default:
                return { backgroundColor: '#d5d5d5', color: '#000' };
        }
    };

    return (
        <div className="card" key={point.title} style={{ marginBottom: '20px' }} onMouseEnter={() => {
            if (onHover) {
                setIsHovering(true);
                onHover(point);
            }
        }} onMouseLeave={() => {
            onLeave && onLeave()
            setIsHovering(false);
        }}>
            <div className="card-header" style={{ ...getHeaderColor(point.type) }}>
                {point.type}
            </div>
            <div className="card-body">
                <h5 className="card-title">{point.title} <i>({formatLineCount(point.line_numbers)})</i></h5>
                <p className="card-text">{point.summary}</p>
                <button type="button" className="btn btn-outline-dark" onClick={() => {
                    onExpandClicked && onExpandClicked(point);
                }}>More</button>
            </div>
        </div>
    );
};

export default FeedbackPoint;
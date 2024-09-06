import axios from 'axios';
import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../config';
import './TimelineView.css';

const TimelineView = () => {
    const [timelineData, setTimelineData] = useState([]);
    const [projectDuration, setProjectDuration] = useState(0);
    const [personnelHours, setPersonnelHours] = useState({});
    const [taskDurations, setTaskDurations] = useState({});
    const [personnelNames, setPersonnelNames] = useState({});
    const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });

    const getColorForPersonnel = (personnelId) => {
        const colors = ['#FF6B6B', '#4ECDC4', '#FFA07A', '#6A5ACD', '#20B2AA', '#FF69B4', '#32CD32', '#FF7F50', '#8A2BE2', '#00CED1'];
        return colors[personnelId % colors.length]; // Ensure this matches the Gantt bar colors
    };

    useEffect(() => {
        const fetchTimelineData = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/timeline`);
                setTimelineData(response.data.timeline);
                setProjectDuration(response.data.project_duration);
                setPersonnelHours(response.data.personnel_hours);
                setTaskDurations(response.data.task_durations);
                setPersonnelNames(response.data.personnel_names);
            } catch (err) {
                console.error('Failed to fetch timeline data', err);
            }
        };

        fetchTimelineData();
    }, []);

    const renderTimelineTable = () => {
        if (timelineData.length === 0) return <p>No timeline data available</p>;

        const days = Array.from({ length: projectDuration }, (_, i) => i + 1);
        const tasks = [...new Set(timelineData.map(item => item.task_id))];

        return (
            <div>
                <h2 style={{ textAlign: 'center' }}>Project Timeline</h2>
                <h3 style={{ textAlign: 'left', fontSize: '1.2em' }}>Project Duration: {projectDuration} days</h3>

                <table className="timeline-table">
                    <thead>
                        <tr>
                            <th>Tasks</th>
                            <th>Personnel</th>
                            {days.map(day => <th key={day}>Day {day}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map(taskId => {
                            const taskAssignments = timelineData.filter(item => item.task_id === taskId);
                            const uniquePersonnel = [...new Set(taskAssignments.map(item => item.person_id))];

                            return uniquePersonnel.map((personnelId, index) => {
                                const personTaskAssignments = taskAssignments.filter(item => item.person_id === personnelId);
                                const totalDuration = personTaskAssignments.reduce((total, item) => total + item.duration, 0);

                                return (
                                    <tr key={`${taskId}-${personnelId}`} className="task-row"> 
                                        {index === 0 && <td rowSpan={uniquePersonnel.length}>{taskAssignments[0].task_name}</td>}
                                        <td>{personnelNames[personnelId] || personnelId}</td>
                                        {days.map(day => (
                                            <td key={day} className="gantt-cell">
                                                {personTaskAssignments
                                                    .filter(item => item.day === day)
                                                    .map((item, index) => (
                                                        <div 
                                                            key={index}
                                                            className="gantt-bar"
                                                            style={{
                                                                width: `${(item.duration / 8) * 100}%`,
                                                                marginLeft: `${(item.start_hour / 8) * 100}%`,
                                                                backgroundColor: getColorForPersonnel(personnelId)
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                setTooltip({
                                                                    visible: true,
                                                                    text: `Time spent: ${totalDuration} hours`,
                                                                    x: e.clientX,
                                                                    y: e.clientY
                                                                });
                                                            }}
                                                            onMouseLeave={() => setTooltip({ ...tooltip, visible: false })}
                                                        />
                                                    ))
                                                }
                                            </td>
                                        ))}
                                    </tr>
                                );
                            });
                        })}
                    </tbody>
                </table>
                {tooltip.visible && (
                    <div 
                        className="custom-tooltip"
                        style={{ 
                            left: `${tooltip.x}px`, 
                            top: `${tooltip.y}px` 
                        }}
                    >
                        {tooltip.text}
                    </div>
                )}
                <div className="timeline-summary">
                    <h4>Personnel Work Hours:</h4>
                    <ul className="personnel-hours">
                        {Object.entries(personnelHours).map(([personnelId, hours]) => (
                            <li key={personnelId}>
                                <div 
                                    className="color-box" 
                                    style={{ backgroundColor: getColorForPersonnel(personnelId) }}
                                ></div>
                                <span><strong>{personnelNames[personnelId] || personnelId}</strong>: {hours} hours</span>
                            </li>
                        ))}
                    </ul>
                    <h4 style={{ textAlign: 'left', fontSize: '1.2em' }}>Task Durations:</h4>
                    <ul className="task-durations">
                        {Object.entries(taskDurations).map(([taskId, duration]) => (
                            <li key={taskId}>
                                <strong>{duration.name}</strong>: {duration.duration} hours (Day {duration.start.day} Hour {duration.start.hour} - Day {duration.end.day} Hour {duration.end.hour})
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <div className="timeline-container">
            {renderTimelineTable()}
        </div>
    );
};

export default TimelineView;
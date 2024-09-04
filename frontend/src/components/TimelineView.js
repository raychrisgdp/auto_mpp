import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import API_BASE_URL from '../config';
import './TimelineView.css';

const TimelineView = () => {
    const [timelineData, setTimelineData] = useState([]);
    const [projectDuration, setProjectDuration] = useState(0);
    const [personnelHours, setPersonnelHours] = useState({});
    const [taskDurations, setTaskDurations] = useState({});
    const [personnel, setPersonnel] = useState([]);

    const getColorForPersonnel = (personnelId) => {
        const colors = ['#FF6B6B', '#4ECDC4', '#FFA07A', '#6A5ACD', '#20B2AA', '#FF69B4', '#32CD32', '#FF7F50', '#8A2BE2', '#00CED1'];
        return colors[personnelId % colors.length];
    };

    const generateTimeline = useCallback((tasks) => {
        const timeline = [];
        const personnelWorkload = {};
        let maxDay = 0;
        const personnelHours = {};
        const taskDurations = {};

        tasks.forEach(task => {
            let taskStartDay = 1;
            let taskEndDay = 0;
            let taskStartHour = 0;
            let taskEndHour = 0;

            task.assignments.forEach(assignment => {
                let remainingHours = assignment.hours;
                let startDay = taskStartDay;
                let startHour = 0;

                while (remainingHours > 0) {
                    while (personnelWorkload[assignment.personnel_id]?.[startDay] >= 8) {
                        startDay++;
                        startHour = 0;
                    }

                    if (personnelWorkload[assignment.personnel_id]?.[startDay]) {
                        startHour = personnelWorkload[assignment.personnel_id][startDay];
                    }

                    const availableHours = Math.min(8 - (personnelWorkload[assignment.personnel_id]?.[startDay] || 0), remainingHours);

                    timeline.push({
                        taskId: task.id,
                        taskName: task.name,
                        personnelId: assignment.personnel_id,
                        day: startDay,
                        startHour: startHour,
                        duration: availableHours
                    });

                    remainingHours -= availableHours;
                    personnelWorkload[assignment.personnel_id] = {
                        ...personnelWorkload[assignment.personnel_id],
                        [startDay]: (personnelWorkload[assignment.personnel_id]?.[startDay] || 0) + availableHours
                    };

                    if (startDay < taskStartDay || (startDay === taskStartDay && startHour < taskStartHour)) {
                        taskStartDay = startDay;
                        taskStartHour = startHour;
                    }

                    if (startDay > taskEndDay || (startDay === taskEndDay && startHour + availableHours > taskEndHour)) {
                        taskEndDay = startDay;
                        taskEndHour = startHour + availableHours;
                    }

                    maxDay = Math.max(maxDay, startDay);

                    startHour += availableHours;
                    if (startHour >= 8) {
                        startDay++;
                        startHour = 0;
                    }
                }

                const personnelId = assignment.personnel_id;
                personnelHours[personnelId] = (personnelHours[personnelId] || 0) + assignment.hours;
            });

            taskDurations[task.id] = {
                name: task.name,
                duration: task.assignments.reduce((sum, a) => sum + a.hours, 0),
                start: { day: taskStartDay, hour: taskStartHour },
                end: { day: taskEndDay, hour: taskEndHour }
            };
        });

        return { timeline, duration: maxDay, hours: personnelHours, taskDurations };
    }, []);

    const fetchTimelineData = useCallback(async () => {
        try {
            const tasksResponse = await axios.get(`${API_BASE_URL}/tasks`);
            const { timeline, duration, hours, taskDurations } = generateTimeline(tasksResponse.data);
            setTimelineData(timeline);
            setProjectDuration(duration);
            setPersonnelHours(hours);
            setTaskDurations(taskDurations);
        } catch (err) {
            console.error('Failed to fetch timeline data', err);
        }
    }, [generateTimeline]);

    const fetchPersonnelData = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/personnel`);
            setPersonnel(response.data);
        } catch (err) {
            console.error('Failed to fetch personnel data', err);
        }
    }, []);

    useEffect(() => {
        fetchPersonnelData();
        fetchTimelineData();
    }, [fetchPersonnelData, fetchTimelineData]);

    const renderTimelineTable = () => {
        if (timelineData.length === 0) return <p>No timeline data available</p>;

        const days = Array.from({ length: projectDuration }, (_, i) => i + 1);
        const tasks = [...new Set(timelineData.map(item => item.taskId))];

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
                            const taskAssignments = timelineData.filter(item => item.taskId === taskId);
                            const uniquePersonnel = [...new Set(taskAssignments.map(item => item.personnelId))];

                            return uniquePersonnel.map((personnelId, index) => (
                                <tr key={`${taskId}-${personnelId}`}>
                                    {index === 0 && <td rowSpan={uniquePersonnel.length}>{taskAssignments[0].taskName}</td>}
                                    <td>{personnel.find(p => p.id === personnelId)?.name || `Person ${personnelId}`}</td>
                                    {days.map(day => (
                                        <td key={day} className="gantt-cell">
                                            {taskAssignments
                                                .filter(item => item.personnelId === personnelId && item.day === day)
                                                .map((item, index) => (
                                                    <div 
                                                        key={index}
                                                        className="gantt-bar"
                                                        style={{
                                                            width: `${(item.duration / 8) * 100}%`,
                                                            marginLeft: `${(item.startHour / 8) * 100}%`,
                                                            backgroundColor: getColorForPersonnel(personnelId)
                                                        }}
                                                        title={`${item.duration} hours`}
                                                    />
                                                ))
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ));
                        })}
                    </tbody>
                </table>
                <div className="timeline-summary">
                    <h4 style={{ textAlign: 'left', fontSize: '1.2em' }}>Personnel Work Hours:</h4>
                    <ul className="personnel-hours">
                        {Object.entries(personnelHours).map(([personnelId, hours]) => {
                            const personnelName = personnel.find(p => p.id === parseInt(personnelId))?.name || `Person ${personnelId}`;
                            return (
                                <li key={personnelId}>
                                    <span 
                                        className="color-legend" 
                                        style={{backgroundColor: getColorForPersonnel(personnelId)}}
                                    ></span>
                                    <strong>{personnelName}</strong>: {hours} hours
                                </li>
                            );
                        })}
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
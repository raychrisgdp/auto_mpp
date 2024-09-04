import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { FaCheck, FaPlus } from 'react-icons/fa';
import API_BASE_URL from '../config';
import TaskForm from './TaskForm';
import './TaskView.css';

function TasksView() {
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState('');
    const [personnel, setPersonnel] = useState([]);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [taskName, setTaskName] = useState('');
    const [allTasks, setAllTasks] = useState([]);
    const [addingDependencyForTask, setAddingDependencyForTask] = useState(null);
    const [addingAssignmentForTask, setAddingAssignmentForTask] = useState(null);
    const [selectedPersonnel, setSelectedPersonnel] = useState('');
    const [newAssignmentHours, setNewAssignmentHours] = useState('');

    useEffect(() => {
        fetchTasks();
        fetchPersonnel();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/tasks`);
            setTasks(response.data);
            setAllTasks(response.data);
        } catch (err) {
            setError('Failed to fetch tasks');
        }
    };

    const fetchPersonnel = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/personnel`);
            setPersonnel(response.data);
        } catch (err) {
            setError('Failed to fetch personnel');
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await axios.delete(`${API_BASE_URL}/tasks/${taskId}`);
            fetchTasks();
        } catch (err) {
            setError('Failed to delete task');
        }
    };

    const handleEditTask = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        setEditingTaskId(taskId);
        setTaskName(task.name);
    };

    const handleUpdateTask = async (taskId) => {
        try {
            await axios.put(`${API_BASE_URL}/tasks/${taskId}`, { name: taskName });
            setEditingTaskId(null);
            fetchTasks();
        } catch (err) {
            setError('Failed to update task');
        }
    };

    const handleAddAssignment = (taskId) => {
        setAddingAssignmentForTask(taskId);
    };

    const handleEditAssignment = (taskId, index) => {
        const updatedTask = tasks.find(t => t.id === taskId);
        updatedTask.assignments[index].isEditing = true;
        updatedTask.assignments[index].originalHours = updatedTask.assignments[index].hours;
        setTasks([...tasks]);
    };

    const handleUpdateAssignment = (taskId, index, field, value) => {
        const updatedTask = tasks.find(t => t.id === taskId);
        updatedTask.assignments[index][field] = value;
        setTasks([...tasks]);
    };

    const handleSubmitAssignment = async (taskId, personnelId, hours) => {
        try {
            await axios.post(`${API_BASE_URL}/tasks/${taskId}/assignments`, {
                personnel_id: personnelId,
                hours: hours
            });
            fetchTasks();
            setAddingAssignmentForTask(null);
        } catch (err) {
            setError('Failed to add assignment');
        }
    };

    const handleRemoveAssignment = async (taskId, assignmentId) => {
        try {
            await axios.delete(`${API_BASE_URL}/tasks/${taskId}/assignments/${assignmentId}`);
            fetchTasks();
        } catch (err) {
            setError('Failed to remove assignment');
        }
    };

    const handleAddDependency = (taskId) => {
        setAddingDependencyForTask(taskId);
    };

    const handleSubmitDependency = async (taskId, dependencyId) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            const updatedDependencies = [...(task.dependencies || []), dependencyId];
            await axios.put(`${API_BASE_URL}/tasks/${taskId}`, {
                name: task.name,
                dependencies: updatedDependencies
            });
            fetchTasks();
            setAddingDependencyForTask(null);
        } catch (err) {
            setError('Failed to add dependency');
        }
    };

    const handleEditDependency = async (taskId, dependencyId) => {
        // This function is not needed as we're not editing dependencies, only adding or removing
    };

    const handleRemoveDependency = async (taskId, dependencyId) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            const updatedDependencies = (task.dependencies || []).filter(id => id !== dependencyId);
            await axios.put(`${API_BASE_URL}/tasks/${taskId}`, {
                name: task.name,
                dependencies: updatedDependencies
            });
            fetchTasks();
        } catch (err) {
            setError('Failed to remove dependency');
        }
    };

    return (
        <div className="tasks-view">
            <h2>Task Management</h2>
            {error && <p className="error-message">{error}</p>}
            <TaskForm onTaskAdded={fetchTasks} fetchTasks={fetchTasks} />
            {tasks.map((task) => (
                <div key={task.id} className="task-section">
                    <div className="task-header">
                        {editingTaskId === task.id ? (
                            <div className="edit-task-container">
                                <input
                                    type="text"
                                    value={taskName}
                                    onChange={(e) => setTaskName(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleUpdateTask(task.id);
                                        }
                                    }}
                                    className="task-input"
                                />
                                <button onClick={() => handleUpdateTask(task.id)} className="submit-button">
                                    <FaCheck />
                                </button>
                            </div>
                        ) : (
                            <>
                                <span className="task-name">{task.name}</span>
                                <div className="button-group">
                                    <button onClick={() => handleEditTask(task.id)} className="edit-button">
                                        ✏️
                                    </button>
                                    <button onClick={() => handleDeleteTask(task.id)} className="delete-button">
                                        🗑️
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    <hr className="soft-line" />
                    <div className="assignments">
                        {task.assignments.map((assignment, index) => (
                            <div key={index} className="assignment-row">
                                <span className="assignment-content">
                                    {personnel.find(p => p.id === assignment.personnel_id)?.name}: {assignment.hours} hours
                                </span>
                                <div className="button-group">
                                    <button onClick={() => handleEditAssignment(task.id, index)} className="edit-button">
                                        ✏️
                                    </button>
                                    <button onClick={() => handleRemoveAssignment(task.id, assignment.id)} className="delete-button">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="button-container">
                        {addingAssignmentForTask === task.id ? (
                            <div className="add-assignment-form">
                                <select onChange={(e) => setSelectedPersonnel(e.target.value)}>
                                    <option value="">Select Personnel</option>
                                    {personnel
                                        .filter(p => !task.assignments.some(a => a.personnel_id === p.id))
                                        .map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))
                                    }
                                </select>
                                <input 
                                    type="number" 
                                    placeholder="Hours" 
                                    value={newAssignmentHours}
                                    onChange={(e) => setNewAssignmentHours(e.target.value)}
                                />
                                <button onClick={() => handleSubmitAssignment(task.id, selectedPersonnel, newAssignmentHours)}>
                                    Submit
                                </button>
                                <button onClick={() => setAddingAssignmentForTask(null)}>Cancel</button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => handleAddAssignment(task.id)} 
                                className="add-button"
                                disabled={personnel.filter(p => 
                                    !task.assignments.some(a => a.personnel_id === p.id)
                                ).length === 0}
                            >
                                <FaPlus /> Add Assignment
                            </button>
                        )}
                    </div>
                    <div className="dependencies">
                        <h4 style={{ textAlign: 'left' }}>Dependencies</h4>
                        {task.dependencies && task.dependencies.map(depId => {
                            const depTask = allTasks.find(t => t.id === depId);
                            return (
                                <div key={depId} className="dependency-item">
                                    <span>{depTask ? depTask.name : `Task ${depId}`}</span>
                                    <button onClick={() => handleRemoveDependency(task.id, depId)} className="delete-button">
                                        🗑️
                                    </button>
                                </div>
                            );
                        })}
                        <div className="button-container">
                            {addingDependencyForTask === task.id ? (
                                <div className="add-dependency-form">
                                    <select onChange={(e) => handleSubmitDependency(task.id, parseInt(e.target.value))}>
                                        <option value="">Select Dependency</option>
                                        {allTasks
                                            .filter(t => t.id !== task.id && !task.dependencies.includes(t.id))
                                            .map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))
                                        }
                                    </select>
                                    <button onClick={() => setAddingDependencyForTask(null)}>Cancel</button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => handleAddDependency(task.id)} 
                                    className="add-button"
                                    disabled={allTasks.filter(t => t.id !== task.id && !task.dependencies.includes(t.id)).length === 0}
                                >
                                    <FaPlus /> Add Dependency
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default TasksView;
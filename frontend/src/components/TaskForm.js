import axios from 'axios';
import React, { useState } from 'react';
import { FaPlus } from 'react-icons/fa'; // Ensure this is included
import API_BASE_URL from '../config';

function TaskForm({ onTaskAdded }) {
  const [taskName, setTaskName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/tasks`, { name: taskName });
      setTaskName('');
      onTaskAdded();
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <input
        type="text"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        placeholder="Enter task name"
        required
        className="task-input"
      />
      <button type="submit" className="add-button">
        <FaPlus /> Add Task
      </button>
    </form>
  );
}

export default TaskForm;
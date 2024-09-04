import axios from 'axios';
import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../config';
import './PersonnelView.css';

const PersonnelView = () => {
    const [personnel, setPersonnel] = useState([]);
    const [name, setName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPersonnel();
    }, []);

    const fetchPersonnel = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/personnel`);
            setPersonnel(response.data);
        } catch (err) {
            setError('Failed to fetch personnel');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) {
            setError('Personnel name is required');
            return;
        }
        try {
            await axios.post(`${API_BASE_URL}/personnel`, { name });
            setName('');
            fetchPersonnel();
        } catch (err) {
            setError('Failed to add personnel. Please try again.');
        }
    };

    const handleUpdatePersonnel = async (id) => {
        try {
            await axios.put(`${API_BASE_URL}/personnel/${id}`, { name });
            setEditingId(null);
            setName(''); // Clear the name input after updating
            fetchPersonnel();
        } catch (err) {
            setError('Failed to update personnel.');
        }
    };

    const handleDeletePersonnel = async (id) => {
        try {
            await axios.delete(`${API_BASE_URL}/personnel/${id}`);
            fetchPersonnel();
        } catch (err) {
            setError('Failed to delete personnel.');
        }
    };

    return (
        <div>
            <h2>Personnel Management</h2>
            <form onSubmit={handleSubmit} className="personnel-form">
                <input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Personnel Name" 
                    required
                    className="personnel-input"
                />
                <button type="submit" className="add-button">
                    + Add Personnel
                </button>
            </form>
            {error && <p className="error-message">{error}</p>}
            <ul className="personnel-list">
                {personnel.map((person) => (
                    <li key={person.id} className="personnel-item">
                        {editingId === person.id ? (
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={() => handleUpdatePersonnel(person.id)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') handleUpdatePersonnel(person.id);
                                }}
                                autoFocus
                            />
                        ) : (
                            <span>{person.name}</span>
                        )}
                        <div className="button-group">
                            <button 
                                onClick={() => {
                                    setName(''); // Clear the name input when clicking edit
                                    setEditingId(person.id);
                                }} 
                                className="edit-button"
                            >
                                ✏️
                            </button>
                            <button 
                                onClick={() => handleDeletePersonnel(person.id)} 
                                className="delete-button"
                            >
                                🗑️
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PersonnelView;
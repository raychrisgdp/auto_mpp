import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react'; // Import useRef
import API_BASE_URL from '../config';
import './PersonnelView.css';

const PersonnelView = () => {
    const [personnel, setPersonnel] = useState([]);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [error, setError] = useState('');
    const editableRef = useRef(null); // Create a ref for the editable input

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
        if (!newName.trim()) {
            setError('Personnel name is required');
            return;
        }
        try {
            await axios.post(`${API_BASE_URL}/personnel`, { name: newName });
            setNewName('');
            fetchPersonnel();
        } catch (err) {
            setError('Failed to add personnel. Please try again.');
        }
    };

    const handleUpdatePersonnel = async (id) => {
        try {
            await axios.put(`${API_BASE_URL}/personnel/${id}`, { name: editingName });
            setEditingId(null);
            setEditingName('');
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

    useEffect(() => {
        if (editingId !== null && editableRef.current) {
            editableRef.current.focus(); // Focus the editable input when editing
            editableRef.current.setSelectionRange(editableRef.current.value.length, editableRef.current.value.length); // Set cursor at the end
        }
    }, [editingId]); // Run this effect when editingId changes

    return (
        <div>
            <h2>Personnel Management</h2>
            <form onSubmit={handleSubmit} className="personnel-form">
                <input 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
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
                                ref={editableRef} // Attach the ref to the editable input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={() => handleUpdatePersonnel(person.id)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault(); // Prevent new line
                                        handleUpdatePersonnel(person.id);
                                    }
                                }}
                                autoFocus
                                className="personnel-edit-input" // Optional: Add a class for styling
                            />
                        ) : (
                            <span>{person.name}</span>
                        )}
                        <div className="button-group">
                            <button 
                                onClick={() => {
                                    setEditingName(person.name);
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
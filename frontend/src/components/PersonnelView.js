import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react'; // Import useRef
import API_BASE_URL from '../config';
import './PersonnelView.css';

const PersonnelView = () => {
    const [personnel, setPersonnel] = useState([]);
    const [roles, setRoles] = useState([]);
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [error, setError] = useState('');
    const editableRef = useRef(null); // Create a ref for the editable input
    const [isUpdating, setIsUpdating] = useState(false); // Add state to track updating

    useEffect(() => {
        fetchPersonnel();
        fetchRoles();
    }, []);

    const fetchPersonnel = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/personnel`);
            setPersonnel(response.data);
        } catch (err) {
            setError('Failed to fetch personnel');
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/roles`);
            setRoles(response.data);
        } catch (err) {
            setError('Failed to fetch roles');
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
            await axios.post(`${API_BASE_URL}/personnel`, { name: newName, role_id: newRole });
            setNewName('');
            setNewRole('');
            fetchPersonnel();
        } catch (err) {
            setError('Failed to add personnel. Please try again.');
        }
    };

    const handleUpdatePersonnel = async (id, updatedName, updatedRoleId) => {
        setIsUpdating(true); // Set updating state to true
        try {
            await axios.put(`${API_BASE_URL}/personnel/${id}`, { name: updatedName, role_id: updatedRoleId });
            setEditingId(null);
            setEditingName('');
            fetchPersonnel();
        } catch (err) {
            setError('Failed to update personnel.');
        } finally {
            setIsUpdating(false); // Reset updating state
        }
    };

    const handleDeletePersonnel = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this personnel?");
        if (confirmDelete) {
            try {
                await axios.delete(`${API_BASE_URL}/personnel/${id}`);
                fetchPersonnel();
            } catch (err) {
                setError('Failed to delete personnel.');
            }
        }
    };

    useEffect(() => {
        if (editingId !== null && editableRef.current) {
            editableRef.current.focus(); // Focus the editable input when editing
            editableRef.current.setSelectionRange(editableRef.current.value.length, editableRef.current.value.length); // Set cursor at the end
        }
    }, [editingId]); // Run this effect when editingId changes

    const groupedPersonnel = personnel.reduce((acc, person) => {
        const roleId = person.role_id || 'unassigned';
        if (!acc[roleId]) {
            acc[roleId] = [];
        }
        acc[roleId].push(person);
        return acc;
    }, {});

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
                <select 
                    value={newRole} 
                    onChange={(e) => setNewRole(e.target.value)} 
                    required
                    className="role-select"
                >
                    <option value="">Select Role</option>
                    {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                </select>
                <button type="submit" className="add-button">
                    + Add Personnel
                </button>
            </form>
            {error && <p className="error-message">{error}</p>}
            {Object.entries(groupedPersonnel).map(([roleId, personnelList]) => (
                <div key={roleId} className="role-group">
                    <h3>{roleId === 'unassigned' ? 'Unassigned' : roles.find(r => r.id === parseInt(roleId))?.name}</h3>
                    <ul className="personnel-list">
                        {personnelList.map((person) => (
                            <li key={person.id} className="personnel-item">
                                {editingId === person.id ? (
                                    <>
                                        <input
                                            ref={editableRef}
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onBlur={(e) => {
                                                if (!e.relatedTarget || e.relatedTarget.className !== 'role-select') {
                                                    handleUpdatePersonnel(person.id, editingName, person.role_id);
                                                }
                                            }}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleUpdatePersonnel(person.id, editingName, person.role_id);
                                                }
                                            }}
                                            autoFocus
                                            className="personnel-edit-input"
                                        />
                                        <div className="role-select-container">
                                            <select
                                                value={person.role_id || ''}
                                                onChange={(e) => handleUpdatePersonnel(person.id, person.name, e.target.value)}
                                                className="role-select"
                                                title="Select a role for this personnel"
                                            >
                                                <option value="">Unassigned</option>
                                                {roles.map(role => (
                                                    <option key={role.id} value={role.id}>{role.name}</option>
                                                ))}
                                            </select>
                                            <span className="role-select-description">Assign a role</span>
                                        </div>
                                        <div className="button-group">
                                            <button 
                                                onClick={() => handleUpdatePersonnel(person.id, editingName, person.role_id)} 
                                                className="submit-button" 
                                                disabled={isUpdating}
                                            >
                                                ✓
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setEditingId(null);
                                                    setEditingName('');
                                                }} 
                                                className="cancel-button"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span>{person.name}</span>
                                        <div className="button-group">
                                            <button 
                                                onClick={() => {
                                                    setEditingName(person.name);
                                                    setEditingId(person.id);
                                                }} 
                                                className="edit-button"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDeletePersonnel(person.id)} 
                                                className="delete-button"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default PersonnelView;
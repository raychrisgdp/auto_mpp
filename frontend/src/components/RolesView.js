import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import API_BASE_URL from '../config';
import './RolesView.css';

const RolesView = () => {
    const [roles, setRoles] = useState([]);
    const [newRole, setNewRole] = useState({ name: '', description: '' });
    const [error, setError] = useState('');
    const [editingRole, setEditingRole] = useState(null);
    const editInputRef = useRef(null);

    useEffect(() => {
        fetchRoles();
    }, []);

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
        try {
            await axios.post(`${API_BASE_URL}/roles`, newRole);
            setNewRole({ name: '', description: '' });
            fetchRoles();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add role');
        }
    };

    const handleUpdateRole = async (id, updatedRole) => {
        try {
            await axios.put(`${API_BASE_URL}/roles/${id}`, updatedRole);
            setEditingRole(null);
            fetchRoles();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update role');
        }
    };

    const handleDeleteRole = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this role?");
        if (confirmDelete) {
            try {
                await axios.delete(`${API_BASE_URL}/roles/${id}`);
                fetchRoles(); // Refresh the roles list after deletion
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to delete role');
            }
        }
    };

    return (
        <div className="roles-view">
            <h2>Role Management</h2>
            <form onSubmit={handleSubmit} className="role-form">
                <input
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    placeholder="Role Name"
                    required
                    maxLength={50}
                    className="role-input"
                />
                <input
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    placeholder="Role Description"
                    maxLength={100}
                    className="role-input"
                />
                <button type="submit" className="add-button">
                    + Add Role
                </button>
            </form>
            {error && <p className="error-message">{error}</p>}
            <ul className="role-list">
                {roles.map((role) => (
                    <li key={role.id} className="role-item">
                        <div className="role-details">
                            {editingRole === role.id ? (
                                <>
                                    <label htmlFor={`name-${role.id}`} className="edit-label">Role Name:</label>
                                    <input
                                        id={`name-${role.id}`}
                                        ref={editInputRef}
                                        defaultValue={role.name}
                                        onBlur={(e) => handleUpdateRole(role.id, { name: e.target.value, description: role.description })}
                                        className="role-name-edit"
                                        title="Enter the name of the role"
                                    />
                                    <label htmlFor={`description-${role.id}`} className="edit-label">Role Description:</label>
                                    <input
                                        id={`description-${role.id}`}
                                        defaultValue={role.description}
                                        onBlur={(e) => handleUpdateRole(role.id, { name: role.name, description: e.target.value })}
                                        className="role-description-edit"
                                        title="Enter a brief description of the role"
                                    />
                                </>
                            ) : (
                                <>
                                    <span className="role-name">{role.name}</span>
                                    <span className="role-description">{role.description}</span>
                                </>
                            )}
                        </div>
                        <div className="button-group">
                            {editingRole === role.id ? (
                                <>
                                    <button onClick={() => handleUpdateRole(role.id, { name: editInputRef.current.value, description: role.description })} className="submit-button">✓</button>
                                    <button onClick={() => setEditingRole(null)} className="cancel-button">Cancel</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setEditingRole(role.id)} className="edit-button">Edit</button>
                                    <button onClick={() => handleDeleteRole(role.id)} className="delete-button">Delete</button>
                                </>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RolesView;
import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';

const ManageUsersWidget = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await userService.getUsers();
        const list = Array.isArray(data) ? data : (data.data || data.users || []);
        setUsers(list);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Unable to load users');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-error/20 text-error';
      case 'Doctor': return 'bg-primary/20 text-primary';
      case 'Hospital Staff': return 'bg-success/20 text-success';
      case 'Ambulance Staff': return 'bg-warning/20 text-warning';
      case 'Traffic Authority': return 'bg-secondary/20 text-secondary';
      case 'Citizen': return 'bg-surface/20 text-text-secondary';
      default: return 'bg-surface/20 text-text-secondary';
    }
  };

  const getStatusColor = (status) => {
    switch (String(status || 'inactive').toLowerCase()) {
      case 'active': return 'bg-success/20 text-success';
      case 'inactive': return 'bg-error/20 text-error';
      case 'suspended': return 'bg-warning/20 text-warning';
      case 'pending': return 'bg-secondary/20 text-secondary';
      default: return 'bg-surface/20 text-text-secondary';
    }
  };

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">User Management</h2>
        <div className="flex items-center gap-3">
          <button className="btn-outline btn-sm p-2">
            Refresh Users
          </button>
          <button className="btn-primary btn-sm p-2">
            Invite New User
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error && users.length === 0 ? (
        <p className="text-text-secondary text-center py-4">{error}</p>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/50">
              <thead className="bg-border/50">
                <tr>
                  <th className="px-4 py-3 text-left text-text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Hospital / Org
                  </th>
                  <th className="px-4 py-3 text-left text-text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-4 py-3 text-left text-text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border/50">
                {users.map(user => (
                  <tr key={user._id || user.id} className="hover:bg-primary/5">
                    <td className="px-4 py-4 text-text-sm font-medium text-text-primary">
                      {user.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-4 text-text-sm break-all">
                      {user.email}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-text-sm">{user.hospital || user.organization || 'N/A'}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status || (user.isActive ? 'Active' : 'Inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-text-sm">{user.lastLogin || user.lastSeen || 'N/A'}</td>
                    <td className="px-4 py-4 text-text-sm">{user.phone || user.phoneNumber || 'N/A'}</td>
                    <td className="px-4 py-4 text-right space-x-2">
                      <button
                        onClick={() => alert(`Editing user ${user.name || user.email}`)}
                        className="btn-outline px-3 py-1 text-text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => alert(`Viewing profile for ${user.name || user.email}`)}
                        className="btn-outline px-3 py-1 text-text-xs"
                      >
                        View
                      </button>
                      <button
                        onClick={() => alert(`Resetting password for ${user.name || user.email}`)}
                        className="btn-outline px-3 py-1 text-text-xs"
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between text-text-sm">
            <span className="text-text-secondary">Total Users: {users.length}</span>
            <span className="text-text-secondary">Active Users: {users.filter(u => u.isActive || String(u.status || '').toLowerCase() === 'active').length}</span>
          </div>

          <div className="mt-4 pt-4 border-t border-border/50">
            <h3 className="font-medium text-text-primary mb-3">Role Distribution</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <p className="text-text-sm text-text-secondary">Doctors</p>
                <p className="text-2xl font-bold text-primary">{users.filter(u => u.role === 'Doctor' || u.role === 'doctor').length}</p>
              </div>
              <div className="text-center">
                <p className="text-text-sm text-text-secondary">Hospital Staff</p>
                <p className="text-2xl font-bold text-success">{users.filter(u => u.role === 'Hospital Staff').length}</p>
              </div>
              <div className="text-center">
                <p className="text-text-sm text-text-secondary">Ambulance Staff</p>
                <p className="text-2xl font-bold text-warning">{users.filter(u => u.role === 'Ambulance Staff').length}</p>
              </div>
              <div className="text-center">
                <p className="text-text-sm text-text-secondary">Traffic Authority</p>
                <p className="text-2xl font-bold text-secondary">{users.filter(u => u.role === 'Traffic Authority').length}</p>
              </div>
              <div className="text-center">
                <p className="text-text-sm text-text-secondary">Citizens</p>
                <p className="text-2xl font-bold text-primary">{users.filter(u => u.role === 'Citizen').length}</p>
              </div>
              <div className="text-center">
                <p className="text-text-sm text-text-secondary">Administrators</p>
                <p className="text-2xl font-bold text-error">{users.filter(u => u.role === 'Admin').length}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsersWidget;
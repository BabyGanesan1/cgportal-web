'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Search, Edit2, Trash2, Shield, Power, Upload, Plus, Download } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import DatePicker from '../../components/ui/DatePicker';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import BulkUpload from '../../components/ui/BulkUpload';
import BulkResult from '../../components/ui/BulkResult';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { formatDate } from '../../lib/utils';
import { getAdmin } from '../../lib/auth';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 20;

// Format ISO string to Indian date DD/MM/YYYY
function toIndianDate(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    department: '',
    zonal: '',
    employee_id: '',
    is_active: true
  });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => { setCurrentPage(1); }, [search, startDate, endDate]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post(`/auth/users`, newUser);
      toast.success('User added successfully');
      setAddModalOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'user', department: '', zonal: '', employee_id: '', is_active: true });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to add user');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/auth/users/${selectedUser.id}`, {
        name: selectedUser.name,
        role: selectedUser.role,
        department: selectedUser.department,
        zonal: selectedUser.zonal,
        employee_id: selectedUser.employee_id,
        is_active: selectedUser.is_active,
        ...(selectedUser.password ? { password: selectedUser.password } : {})
      });
      toast.success('User updated successfully');
      setEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/auth/users/${selectedUser.id}`);
      toast.success('User deleted successfully');
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  // Filter by search + createdAt range (API field is "createdAt")
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.employee_id && u.employee_id.toLowerCase().includes(search.toLowerCase()));

    const createdAt = u.createdAt ? new Date(u.createdAt) : null;
    const matchesStart = startDate ? (createdAt && createdAt >= new Date(startDate)) : true;
    const matchesEnd = endDate ? (createdAt && createdAt <= new Date(endDate + 'T23:59:59')) : true;

    return matchesSearch && matchesStart && matchesEnd;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Showing X–Y of Z values
  const showingFrom = filteredUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(currentPage * PAGE_SIZE, filteredUsers.length);

  // Export as .xlsx — only Name, Email, Role, Created At (Indian date, no time)
  const handleExport = () => {
    if (filteredUsers.length === 0) { toast.error('No users to export'); return; }
    setExporting(true);
    try {
      const rows = filteredUsers.map(u => ({
        'Name': u.name,
        'Email': u.email,
        'Role': u.role,
        'Created At': toIndianDate(u.createdAt),
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 12 }, { wch: 15 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Users');

      const dateTag = startDate || endDate
        ? `_${startDate || 'start'}_to_${endDate || 'end'}`
        : '';
      XLSX.writeFile(wb, `users${dateTag}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`Exported ${filteredUsers.length} users`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppLayout title="User Management" subtitle="Manage admin and staff accounts">
      <div className="space-y-5">

        {/* Top bar — all items align to bottom edge (items-end) so inputs + buttons sit flush */}
        <div className="flex flex-wrap items-end gap-3">

          {/* Search */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-brand-500 leading-none opacity-0 select-none">Search</label>
            <div className="w-64 min-w-[180px]">
              <Input
                placeholder="Search users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* From date */}
          <div className="w-48">
            <DatePicker
              label="From"
              value={startDate}
              onChange={(val) => setStartDate(val)}
            />
          </div>

          {/* To date */}
          <div className="w-48">
            <DatePicker
              label="To"
              value={endDate}
              onChange={(val) => setEndDate(val)}
            />
          </div>

          {/* Clear dates */}
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="text-xs text-brand-400 hover:text-brand-700 underline mb-2"
            >
              Clear
            </button>
          )}

          {/* Right-side actions */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="inline-flex items-center px-3 h-10 rounded-lg bg-brand-50 border border-brand-100 text-sm font-medium text-brand-600">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'User' : 'Users'}
            </span>
            <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExport} loading={exporting}>
              Export
            </Button>
            <Button variant="secondary" icon={<Upload className="w-4 h-4" />} onClick={() => setBulkModalOpen(true)}>
              Bulk Upload
            </Button>
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setAddModalOpen(true)}>
              Add User
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-brand-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead className="bg-[#102a43]">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-white whitespace-nowrap">#</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-white whitespace-nowrap">User</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-white whitespace-nowrap">Role</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-white whitespace-nowrap">Department</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-white whitespace-nowrap">Zonal</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-white whitespace-nowrap">Employee ID</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-white whitespace-nowrap">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-white whitespace-nowrap">Last Login</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-white whitespace-nowrap">Created At</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-white whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-16 text-brand-400">No users found</td>
                    </tr>
                  ) : paginatedUsers.map((user, index) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3 text-sm text-brand-500">
                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${user.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-brand-50 text-brand-500'}`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-brand-800">{user.name}</div>
                            <div className="text-xs text-brand-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-yellow-100 text-yellow-800' : 'bg-brand-50 text-brand-600'}`}>
                          <Shield className="w-3 h-3" />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-brand-600">{user.department || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-brand-600 capitalize">{user.zonal || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-brand-600">{user.employee_id || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          <Power className="w-3 h-3" />
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-500">
                        {user.last_login ? formatDate(user.last_login) : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-500">
                        {toIndianDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelectedUser(user); setEditModalOpen(true); }}
                            className="p-1.5 rounded-lg text-brand-400 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {user.id !== getAdmin()?.id && (
                            <button
                              onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true); }}
                              className="p-1.5 rounded-lg text-brand-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer: showing text left, pagination right — inside the card */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-brand-100">
              <p className="text-sm text-brand-500">
                Showing{' '}
                <span className="font-medium text-brand-700">{showingFrom}</span>
                –
                <span className="font-medium text-brand-700">{showingTo}</span>
                {' '}of{' '}
                <span className="font-medium text-brand-700">{filteredUsers.length}</span>
              </p>
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                total={filteredUsers.length}
                limit={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit User">
        {selectedUser && (
          <form onSubmit={handleUpdate} className="space-y-5 p-1">
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Full Name</label>
              <Input value={selectedUser.name} onChange={e => setSelectedUser({ ...selectedUser, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Password</label>
              <Input type="password" value={selectedUser.password || ''} onChange={e => setSelectedUser({ ...selectedUser, password: e.target.value })} placeholder="Leave blank to keep current password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">User Role</label>
              <select value={selectedUser.role} onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value })} className="w-full border border-brand-200 rounded-lg px-3 py-2 text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Department</label>
              <select value={selectedUser.department || ''} onChange={e => setSelectedUser({ ...selectedUser, department: e.target.value })} className="w-full border border-brand-200 rounded-lg px-3 py-2 text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                <option value="">None</option>
                <option value="sales">Sales</option>
                <option value="marketing">Marketing</option>
                <option value="finance">Finance</option>
                <option value="FLS-Booking">FLS-Booking</option>
                <option value="FLS-Checking">FLS-Checking</option>
                <option value="FLS-Source">FLS-Source</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Zonal</label>
              <select value={selectedUser.zonal || ''} onChange={e => setSelectedUser({ ...selectedUser, zonal: e.target.value })} className="w-full border border-brand-200 rounded-lg px-3 py-2 text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" required>
                <option value="">Select Zonal</option>
                <option value="chennai">Chennai</option>
                <option value="banglore">Banglore</option>
                <option value="hydrabad">Hydrabad</option>
                <option value="combatore">Combatore</option>
                <option value="dubai">Dubai</option>
                <option value="pune">Pune</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Employee ID</label>
              <Input value={selectedUser.employee_id || ''} onChange={e => setSelectedUser({ ...selectedUser, employee_id: e.target.value })} placeholder="e.g. EMP123" />
            </div>
            <div className="flex items-center gap-2 py-2">
              <input type="checkbox" id="is_active" checked={selectedUser.is_active} onChange={e => setSelectedUser({ ...selectedUser, is_active: e.target.checked })} className="w-4 h-4 text-brand-600 border-brand-300 rounded focus:ring-brand-500" />
              <label htmlFor="is_active" className="text-sm text-brand-700">User is active</label>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-brand-50">
              <Button variant="secondary" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Save Changes</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add User">
        <form onSubmit={handleAddUser} className="space-y-4 p-1">
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-1.5">Full Name</label>
            <Input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-1.5">Email</label>
            <Input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-1.5">Password</label>
            <Input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">User Role</label>
              <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="w-full border border-brand-200 rounded-lg px-3 py-2 text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Department</label>
              <select value={newUser.department} onChange={e => setNewUser({ ...newUser, department: e.target.value })} className="w-full border border-brand-200 rounded-lg px-3 py-2 text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                <option value="">None</option>
                <option value="sales">Sales</option>
                <option value="marketing">Marketing</option>
                <option value="finance">Finance</option>
                <option value="FLS-Booking">FLS-Booking</option>
                <option value="FLS-Checking">FLS-Checking</option>
                <option value="FLS-Source">FLS-Source</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Zonal</label>
              <select value={newUser.zonal} onChange={e => setNewUser({ ...newUser, zonal: e.target.value })} className="w-full border border-brand-200 rounded-lg px-3 py-2 text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" required>
                <option value="">Select Zonal</option>
                <option value="chennai">Chennai</option>
                <option value="banglore">Banglore</option>
                <option value="hydrabad">Hydrabad</option>
                <option value="combatore">Combatore</option>
                <option value="dubai">Dubai</option>
                <option value="pune">Pune</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Employee ID</label>
              <Input value={newUser.employee_id} onChange={e => setNewUser({ ...newUser, employee_id: e.target.value })} placeholder="e.g. EMP123" />
            </div>
          </div>
          <div className="flex items-center gap-2 py-2">
            <input type="checkbox" id="new_is_active" checked={newUser.is_active} onChange={e => setNewUser({ ...newUser, is_active: e.target.checked })} className="w-4 h-4 text-brand-600 border-brand-300 rounded focus:ring-brand-500" />
            <label htmlFor="new_is_active" className="text-sm text-brand-700">User is active</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-brand-50">
            <Button variant="secondary" onClick={() => setAddModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={adding}>Add User</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.`}
        loading={deleting}
      />

      <Modal open={bulkModalOpen} onClose={() => { setBulkModalOpen(false); setBulkResult(null); }} title="Bulk Upload Users">
        <div className="space-y-4">
          <p className="text-sm text-brand-600">Upload an Excel or CSV file with columns: <strong>Name</strong>, <strong>Email</strong>, <strong>Role</strong>, <strong>Department</strong>, <strong>Zonal</strong>, <strong>Employee_ID</strong>. Users with existing emails will be skipped.</p>
          <BulkUpload
            endpoint="/auth/users/bulk"
            sampleFileName="sample_users.xlsx"
            sampleUrl="/auth/users/sample-download"
            onComplete={(result) => {
              setBulkResult(result);
              if (result.success) fetchUsers();
            }}
          />
          {bulkResult && <BulkResult result={bulkResult} />}
        </div>
      </Modal>
    </AppLayout>
  );
}
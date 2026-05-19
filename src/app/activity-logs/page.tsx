'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import api from '../../lib/api';
import DatePicker from '../../components/ui/DatePicker';
import Select from '../../components/ui/Select';
import {
  History,
  Search,
  Filter,
  User,
  Tag,
  Loader2,
  Eye,
  X,
  History as HistoryIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    model: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  // ✅ Fetch Logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filters.action && { action: filters.action }),
        ...(filters.model && { model: filters.model }),
        ...(filters.user_id && { user_id: filters.user_id }),
        ...(filters.search && { search: filters.search }),
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate })
      });

      const res = await api.get(`/activity-logs?${queryParams}`);

      if (res.data.success) {
        setLogs(res.data.data || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.pages || 1);
      } else {
        setLogs([]);
        setTotal(0);
      }
    } catch (error) {
      console.error(error);
      setLogs([]);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Trigger API
  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  // ✅ Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // ✅ Search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  // ✅ Clear filters
  const clearFilters = () => {
    setFilters({
      user_id: '',
      action: '',
      model: '',
      startDate: '',
      endDate: '',
      search: ''
    });
  };

  // ✅ Action colors
  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800';
      case 'BULK_UPLOAD':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AppLayout title="Activity Logs" subtitle="Track administrative changes and actions">
      <div className="space-y-5">
        {/* Filter Section */}
        <div className="relative z-20 bg-white rounded-2xl shadow-sm border border-brand-100 transition-all duration-300">
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              {/* Main Search and Action */}
              <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                  <input
                    type="text"
                    placeholder="Search logs by keyword..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-brand-200 rounded-lg text-sm text-brand-800 placeholder-brand-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>

                <div className="sm:w-48">
                  <Select
                    value={filters.action}
                    onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                    placeholder="All Actions"
                    options={[
                      { value: 'CREATE', label: 'Create' },
                      { value: 'UPDATE', label: 'Update' },
                      { value: 'DELETE', label: 'Delete' },
                      { value: 'RESTORE', label: 'Restore' },
                      { value: 'LOGIN', label: 'Login' },
                      { value: 'REGISTER_SUCCESS', label: 'Register' },
                      { value: 'BULK_UPLOAD', label: 'Bulk Upload' },
                      { value: 'BULK_DELETE', label: 'Bulk Delete' },
                      { value: 'BULK_STATUS_UPDATE', label: 'Bulk Status Update' },
                      { value: 'CREATE_BULK', label: 'Create Bulk' },
                      { value: 'UPDATE_STATUS', label: 'Update Status' },
                      { value: 'VIEW_PROJECT_LIST', label: 'View Project List' },
                      { value: 'DOWNLOAD_COST_SHEET', label: 'Download Cost Sheet' },
                      { value: 'SEND_COST_SHEET_EMAIL', label: 'Send Cost Sheet Email' },
                      { value: 'REQUEST_COST_SHEET_DOWNLOAD', label: 'Request Cost Sheet Download' },
                      { value: 'REQUEST_COST_SHEET_EMAIL', label: 'Request Cost Sheet Email' },
                      { value: 'UNIT_BOOKING', label: 'Unit Booking' },
                    ]}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${showFilters
                    ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-inner'
                    : 'border-brand-100 text-brand-500 hover:bg-brand-50 hover:border-brand-200'
                    }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>{showFilters ? 'Hide Filters' : 'More Filters'}</span>
                </button>

                <button
                  onClick={clearFilters}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 text-sm font-medium transition-all"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </div>
            </div>

            {/* Extended Filters Expansion */}
            {showFilters && (
              <div className="pt-4 border-t border-brand-50 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <DatePicker
                    label="Start Date"
                    value={filters.startDate}
                    onChange={(val) => setFilters({ ...filters, startDate: val })}
                  />

                  <DatePicker
                    label="End Date"
                    value={filters.endDate}
                    onChange={(val) => setFilters({ ...filters, endDate: val })}
                  />

                  <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium text-brand-700 mb-1 flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      Model / Module
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                      <input
                        type="text"
                        placeholder="e.g. Property, User, Master"
                        value={filters.model}
                        onChange={(e) => setFilters({ ...filters, model: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 border border-brand-200 rounded-lg text-sm text-brand-800 placeholder-brand-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-brand-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="w-16">#</th>
                  <th>Date & Time</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Model / Record</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
                        <span className="text-sm text-brand-500">Loading logs...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20 text-brand-400 italic">
                      No logs found matching your criteria
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any, idx: number) => (
                    <tr key={log.id} className="animate-fade-in group">
                      <td className="text-brand-400">{(page - 1) * 20 + idx + 1}</td>
                      <td>
                        <div className="font-medium text-brand-800">
                          {log.createdAt ? format(new Date(log.createdAt), 'dd MMM yyyy') : 'N/A'}
                        </div>
                        <div className="text-xs text-brand-400 mt-0.5">
                          {log.createdAt ? format(new Date(log.createdAt), 'HH:mm:ss') : ''}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                            {(log.user?.name || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-brand-800">{log.user?.name || 'Unknown'}</div>
                            <div className="text-xs text-brand-400">{log.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getActionColor(log.action).replace('bg-', 'bg-').replace('text-', 'text- border-')}`}>
                          {log.action}
                        </span>
                        {log.action === 'SEND_COST_SHEET_EMAIL' && log.details?.sent_to && (
                          <div className="flex items-center gap-1 pl-1.5 mt-1.5">
                            <span className="text-xs font-semibold text-brand-600">Sent to: </span>
                            <span className="text-xs text-brand-700 font-medium">{log.details.sent_to}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="text-sm font-medium text-brand-800">{log.model}</div>
                        {log.record_id && <div className="text-xs text-brand-400">ID: #{log.record_id}</div>}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-2 rounded-lg text-brand-400 hover:text-brand-800 hover:bg-brand-50 transition-all opacity-0 group-hover:opacity-100"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={20}
            onPageChange={setPage}
          />
        </div>
      </div>

      <Modal
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Activity Log Details"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-brand-50 rounded-lg">
              <div className="text-xs text-brand-400 uppercase font-bold mb-1">Action</div>
              <div className="font-semibold text-brand-800">{selectedLog?.action}</div>
            </div>
            <div className="p-3 bg-brand-50 rounded-lg">
              <div className="text-xs text-brand-400 uppercase font-bold mb-1">Model</div>
              <div className="font-semibold text-brand-800">{selectedLog?.model}</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-brand-400 uppercase font-bold mb-2 ml-1 text-center">Payload Details</div>
            <div className="bg-gray-950 p-4 rounded-xl overflow-auto max-h-[400px]">
              <pre className="text-xs text-emerald-400 font-mono">
                {JSON.stringify(selectedLog?.details, null, 2)}
              </pre>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setSelectedLog(null)}>Close</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
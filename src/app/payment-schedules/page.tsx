'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../lib/api';
import { Pencil, Trash2, Plus, Upload, RotateCcw, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import Modal from '../../components/ui/Modal';
import BulkUpload from '../../components/ui/BulkUpload';
import BulkResult from '../../components/ui/BulkResult';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';

const PAGE_SIZE = 20;

export default function PaymentSchedulesPage() {
  const [allData, setAllData] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [filterProject, setFilterProject] = useState('');
  const [filterAlphabet, setFilterAlphabet] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<any>(null);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [resultOpen, setResultOpen] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [restoring, setRestoring] = useState(false);

  // Custom Form State
  const [formProjectId, setFormProjectId] = useState('');
  const [formUnitAlphabet, setFormUnitAlphabet] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPercentage, setFormPercentage] = useState('');
  const [formMilestoneDate, setFormMilestoneDate] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [availableAlphabets, setAvailableAlphabets] = useState<string[]>([]);

  useEffect(() => {
    api.get('/projects', { params: { limit: 500 } })
      .then(res => setProjects(res.data.data || []))
      .catch(err => console.error('Failed to fetch projects', err));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { limit: 9999 };
      if (filterProject) params.project_id = filterProject;
      if (filterAlphabet) params.unit_alphabet = filterAlphabet;

      const res = await api.get('/payment-schedules', { params });
      setAllData(res.data.data || []);
      setPage(1);
    } catch (err) {
      console.error('Failed to fetch payment schedules', err);
    } finally {
      setLoading(false);
    }
  }, [filterProject, filterAlphabet]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch alphabets dynamically when project changes
  useEffect(() => {
    if (formProjectId) {
      api.get(`/properties/${formProjectId}/details`, { params: { limit: 1000 } })
        .then(res => {
          const units = res.data.data || [];
          const alphabets = new Set<string>(
            units
              .filter((u: any) => u.unit_no)
              .map((u: any) => String(u.unit_no).charAt(0).toUpperCase())
          );
          setAvailableAlphabets(Array.from(alphabets));
        })
        .catch(err => {
          console.error('Failed to fetch units for project', err);
          setAvailableAlphabets([]);
        });
    } else {
      setAvailableAlphabets([]);
    }
  }, [formProjectId]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment schedule?')) return;
    try {
      await api.delete(`/payment-schedules/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete payment schedule');
    }
  };

  const handleRestoreOpen = async (item: any) => {
    setCurrentEdit(item);
    try {
      const res = await api.get('/activity-logs', { params: { model: 'PaymentSchedule', record_id: item.id, limit: 100 } });
      const allLogs = res.data.data || [];
      console.log('Activity logs for payment schedule:', allLogs);
      const logs = allLogs.filter((log: any) =>
        log.action === 'UPDATE' || log.action === 'RESTORE' || log.action === 'CREATE'
      );
      if (logs.length > 0) {
        setSelectedVersion(logs[0]);
      } else {
        setSelectedVersion(null);
      }
      setActivityLogs(logs);
      setRestoreOpen(true);
    } catch (e: any) {
      console.error('Failed to load history:', e?.response?.data || e.message);
      setActivityLogs([]);
      alert('No edit history found for this record');
    }
  };

  const handleRestore = async () => {
    if (!selectedVersion || !currentEdit) return;
    setRestoring(true);
    try {
      const details = selectedVersion.details || {};
      const cleanData: any = {};
      const skipped: string[] = [];

      console.log('Restoring from details:', details);

      Object.keys(details).forEach((key: string) => {
        if (!key || typeof key !== 'string') return;
        const val = details[key];

        if (['id', 'createdAt', 'updatedAt', 'created_by', 'updated_by', 'details', 'changes', 'previous', 'project_id'].includes(key)) return;
        if (val === null || val === undefined || val === '') return;

        const k = String(key).toLowerCase();
        if (k.includes('image') || k.includes('photo') || k.includes('receipt') || k.includes('proof') || k.includes('document') || k.includes('url')) {
          skipped.push(key);
          return;
        }
        if (typeof val === 'string' && (val.match(/\.(jpg|jpeg|png|gif|webp|pdf)$/i) || val.startsWith('data:') || val.startsWith('/uploads/'))) {
          skipped.push(key);
          return;
        }
        cleanData[key] = val;
      });

      console.log('Restore cleanData:', cleanData);
      const res = await api.put(`/payment-schedules/${currentEdit.id}`, cleanData, { headers: { 'X-Restore-From-Version': selectedVersion.id } });
      console.log('Restore response:', res.data);
      alert(skipped.length > 0 ? `Restored (skipped: ${skipped.join(', ')})` : 'Restored successfully');
      setRestoreOpen(false);
      setCurrentEdit(null);
      setActivityLogs([]);
      setSelectedVersion(null);
      fetchData();
    } catch (err: any) {
      console.error('Restore error:', err);
      alert(err.response?.data?.message || 'Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params: any = { page: 1, limit: 9999 };
      if (filterProject) params.project_id = filterProject;
      if (filterAlphabet) params.unit_alphabet = filterAlphabet;
      const res = await api.get('/payment-schedules', { params });
      const rows: any[] = res.data.data || [];
      if (rows.length === 0) { alert('No data to export'); return; }
      const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('en-GB') : '-';
      const sheetData = rows.map(r => ({
        'ID': r.id,
        'PROJECT': r.projectData?.name || r.project_id || '-',
        'UNIT ALPHABET': r.unit_alphabet || 'Project Wide',
        'DESCRIPTION': r.description || '-',
        'MILESTONE DATE': fmtDate(r.milestone_date),
        'DUE DATE': fmtDate(r.due_date),
        '% VALUE': r.percentage ? `${r.percentage}%` : '-',
        'STATUS': r.is_active ? 'Active' : 'Inactive',
      }));
      const ws = XLSX.utils.json_to_sheet(sheetData);
      ws['!cols'] = [8, 28, 16, 28, 16, 16, 10, 10].map(wch => ({ wch }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Payment Schedules');
      XLSX.writeFile(wb, `payment_schedules_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch { alert('Export failed'); }
    finally { setExporting(false); }
  };

  const openAddModal = () => {
    setCurrentEdit(null);
    setFormProjectId('');
    setFormUnitAlphabet('');
    setFormDesc('');
    setFormPercentage('');
    setFormMilestoneDate('');
    setFormDueDate('');
    setAvailableAlphabets([]);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setCurrentEdit(item);
    setFormProjectId(item.project_id?.toString() || '');
    setFormUnitAlphabet(item.unit_alphabet || '');
    setFormDesc(item.description || '');
    setFormPercentage(item.percentage?.toString() || '');
    setFormMilestoneDate(item.milestone_date ? item.milestone_date.split('T')[0] : '');
    setFormDueDate(item.due_date ? item.due_date.split('T')[0] : '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProjectId || !formDesc || !formPercentage) {
      alert('Please fill out all required fields.');
      return;
    }

    const payload = {
      project_id: parseInt(formProjectId),
      unit_alphabet: formUnitAlphabet,
      description: formDesc,
      percentage: parseFloat(formPercentage),
      milestone_date: formMilestoneDate || null,
      due_date: formDueDate || null,
      is_active: true,
    };

    try {
      if (currentEdit) {
        await api.put(`/payment-schedules/${currentEdit.id}`, payload);
      } else {
        await api.post('/payment-schedules', payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save schedule');
    }
  };

  // ─── Pagination derived values ───────────────────────────────────────────────
  const total = allData.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Clamp page so it never goes out of range after data/filter changes
  const safePage = Math.min(page, totalPages);
  const pageData = allData.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(newPage, totalPages));
    setPage(clamped);
  };
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Payment Schedules" subtitle="Manage payment schedules for projects and units">
      {/* ── Filters & Actions ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="min-w-[200px]">
            <Select
              value={filterProject}
              placeholder="All Projects..."
              onChange={e => { setFilterProject(e.target.value); setPage(1); }}
              options={projects.map(p => ({ value: p.id, label: p.name }))}
            />
          </div>
          <input
            type="text"
            placeholder="Unit Alphabet (e.g., A)"
            className="border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent w-48"
            value={filterAlphabet}
            onChange={e => { setFilterAlphabet(e.target.value); setPage(1); }}
          />
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExportExcel} loading={exporting}>
            Export Excel
          </Button>
          <Button variant="secondary" size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => setIsBulkOpen(true)}>
            Bulk Upload
          </Button>
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
            Add Schedule
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-[#102a43]">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-white">ID</th>
                <th className="px-6 py-4 text-sm font-medium text-white">Project</th>
                <th className="px-6 py-4 text-sm font-medium text-white text-center">Alphabet</th>
                <th className="px-6 py-4 text-sm font-medium text-white">Description</th>
                <th className="px-6 py-4 text-sm font-medium text-white">Milestone Date</th>
                <th className="px-6 py-4 text-sm font-medium text-white">Due Date</th>
                <th className="px-6 py-4 text-sm font-medium text-white">% Value</th>
                <th className="px-6 py-4 text-sm font-medium text-white text-center">Status</th>
                <th className="px-6 py-4 text-sm font-medium text-white text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-500">Loading...</td>
                </tr>
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-500">No schedules found</td>
                </tr>
              ) : (
                pageData.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">{item.id}</td>
                    <td className="px-6 py-4 font-medium">{item.projectData?.name || item.project_id}</td>
                    <td className="px-6 py-4 font-bold text-center">
                      {item.unit_alphabet ? (
                        <span className="bg-brand-100 text-brand-800 px-3 py-1 rounded inline-block">{item.unit_alphabet}</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded inline-block">Project Wide</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{item.description}</td>
                    <td className="px-6 py-4">{item.milestone_date ? new Date(item.milestone_date).toLocaleDateString('en-GB') : '-'}</td>
                    <td className="px-6 py-4">{item.due_date ? new Date(item.due_date).toLocaleDateString('en-GB') : '-'}</td>
                    <td className="px-6 py-4 font-bold text-brand-600">{item.percentage}%</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-3">
                      <button onClick={() => handleRestoreOpen(item)} className="text-yellow-600 hover:text-yellow-800 p-1" title="Restore">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEditModal(item)} className="text-brand-600 hover:text-brand-800 p-1">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <Pagination
          page={safePage}
          totalPages={totalPages}
          total={total}
          limit={PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      </div>

      {/* ── Add / Edit Modal ── */}
      {isModalOpen && (
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={currentEdit ? 'Edit Payment Schedule' : 'Add Payment Schedule'}
        >
          <form onSubmit={handleSubmit} className="p-1 space-y-5">
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">Project</label>
              <Select
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
                required
                placeholder="Select a project..."
                options={projects.map(p => ({ value: p.id, label: p.name }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">Unit Alphabet</label>
              <Select
                value={formUnitAlphabet}
                onChange={(e) => setFormUnitAlphabet(e.target.value)}
                placeholder="Project Wide"
                options={availableAlphabets.map(alpha => ({ value: alpha, label: alpha }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">Description</label>
              <input
                type="text"
                className="w-full border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 placeholder-brand-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="e.g., Booking Advance"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">Percentage (%)</label>
              <input
                type="number"
                step="0.01"
                className="w-full border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                value={formPercentage}
                onChange={(e) => setFormPercentage(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1">Milestone Date</label>
                <input
                  type="date"
                  className="w-full border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={formMilestoneDate}
                  onChange={e => setFormMilestoneDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={formDueDate}
                  onChange={e => setFormDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-brand-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-lg border border-brand-200 text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
              >
                {currentEdit ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Bulk Upload Modal ── */}
      {isBulkOpen && (
        <Modal open={isBulkOpen} onClose={() => setIsBulkOpen(false)} title="Bulk Upload Payment Schedules" size="lg">
          <BulkUpload
            endpoint="/payment-schedules/bulk-upload"
            onComplete={(res) => { setIsBulkOpen(false); setBulkResult(res); setResultOpen(true); fetchData(); }}
            sampleUrl="/payment-schedules/sample-download"
            sampleFileName="payment_schedule_sample.xlsx"
          />
        </Modal>
      )}

      {/* ── Bulk Result Modal ── */}
      {resultOpen && (
        <Modal open={resultOpen} onClose={() => setResultOpen(false)} title="Upload Result" size="2xl">
          <BulkResult result={bulkResult} />
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setResultOpen(false)}>Close</Button>
          </div>
        </Modal>
      )}

      {/* ── Restore Modal ── */}
      {restoreOpen && (
        <Modal
          open={restoreOpen}
          onClose={() => { setRestoreOpen(false); setCurrentEdit(null); setActivityLogs([]); setSelectedVersion(null); }}
          title="Restore Payment Schedule"
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-brand-600">Select a version to restore.</p>
            {activityLogs.length === 0 ? (
              <div className="text-center py-8 text-brand-400">No edit history found</div>
            ) : (
              <>
                <div className="max-h-48 overflow-y-auto border border-brand-200 rounded-lg divide-y divide-brand-100">
                  {activityLogs.map((log: any) => {
                    const recordLabel = `${currentEdit?.description || `ID: ${currentEdit?.id}`}`;
                    return (
                      <label
                        key={log.id}
                        className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-brand-50 ${selectedVersion?.id === log.id ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : ''}`}
                      >
                        <input
                          type="radio"
                          name="version"
                          checked={selectedVersion?.id === log.id}
                          onChange={() => setSelectedVersion(log)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-brand-800">{recordLabel}</div>
                          <div className="text-xs text-brand-500">
                            {new Date(log.createdAt).toLocaleString()} • {log.action} by{' '}
                            {log.user_email || log.adminEmail || log.user?.name || log.user?.email || 'System'}
                          </div>
                          {log.details && (
                            <div className="text-xs text-brand-400 mt-1">
                              {Object.keys(log.details).slice(0, 3).map(k => `${k}: ${log.details[k]}`).join(', ')}
                              {Object.keys(log.details).length > 3 && '...'}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
                {selectedVersion?.details && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-sm font-medium text-slate-700 mb-2">Data to restore:</div>
                    <pre className="text-xs text-slate-600 overflow-x-auto">
                      {JSON.stringify(selectedVersion.details, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-brand-100">
              <Button
                variant="secondary"
                onClick={() => { setRestoreOpen(false); setCurrentEdit(null); setActivityLogs([]); }}
              >
                Cancel
              </Button>
              <Button onClick={handleRestore} loading={restoring} disabled={activityLogs.length === 0}>
                <RotateCcw className="w-4 h-4 mr-2" />Restore
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
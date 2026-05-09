'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Upload, RotateCcw, History, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import AppLayout from '../layout/AppLayout';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import BulkUpload from '../ui/BulkUpload';
import BulkResult from '../ui/BulkResult';
import MasterForm from '../forms/MasterForm';
import MasterTable from './MasterTable';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { usePagination } from '../../hooks/useApi';
import Select from '../ui/Select';

interface MasterPageProps {
  title: string;
  subtitle: string;
  endpoint: string;
  columns: { key: string; label: string; render?: (row: any, onRefresh?: () => void) => React.ReactNode }[];
  formFields?: {
    name: string;
    label: string;
    type?: string;
    required?: boolean;
    span?: number;
    options?: { value: string | number; label: string }[];
    pattern?: { value: RegExp; message: string };
  }[];
  sampleHeaders?: string[];
  sampleRows?: (string | number)[][];
  sampleUrl?: string;
  modalSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  activityModel?: string;
  showExport?: boolean;
  showProjectFilter?: boolean;
  showProductTypeFilter?: boolean;
  exportColumns?: { key: string; label: string; formatDate?: boolean }[];
}

const MODEL_NAME_MAP: Record<string, string> = {
  '/projects': 'Project',
  '/project-locations': 'ProjectLocation',
  '/handover-details': 'HandoverDetail',
  '/properties': 'PropertyList',
  '/units': 'PropertyDetail',
  '/unit-status': 'PropertyDetail',
  '/payment-schedules': 'PaymentSchedule',
  '/users': 'Admin',
  '/activity-logs': 'ActivityLog',
  '/bulk-upload-history': 'BulkUploadHistory',
};

export default function MasterPageTemplate({
  title, subtitle, endpoint, columns, formFields, sampleHeaders, sampleRows, sampleUrl,
  modalSize = 'md', activityModel, showExport = false,
  showProjectFilter = false, showProductTypeFilter = false, exportColumns,
}: MasterPageProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterProductType, setFilterProductType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [projectOptions, setProjectOptions] = useState<{ value: string | number; label: string }[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const { page, setPage, limit, total, totalPages, updatePagination } = usePagination(20);

  const getModelName = () => {
    if (activityModel) return activityModel;
    return MODEL_NAME_MAP[endpoint] || title;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit, search };
      if (filterProject) params.project_id = filterProject;
      if (filterProductType) params.product_type = filterProductType;
      const res = await api.get(endpoint, { params });
      setData(res.data.data);
      updatePagination(res.data.pagination);
    } catch (e) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, limit, search, filterProject, filterProductType, updatePagination]);

  const fetchProjectOptions = useCallback(async () => {
    try {
      const pRes = await api.get('/projects', { params: { limit: 1000 } });
      const options = (pRes.data.data || []).map((p: any) => ({ value: p.id, label: p.name }));
      setProjectOptions(options);
    } catch (e) {
      console.error('Failed to fetch project options');
    }
  }, []);

  const fetchActivityLogs = useCallback(async (recordId: number) => {
    try {
      const modelName = getModelName();
      const res = await api.get('/activity-logs', {
        params: { model: modelName, record_id: recordId, limit: 50 }
      });
      const allLogs = res.data.data || [];
      const validLogs = allLogs.filter((log: any) => log.action === 'UPDATE' || log.action === 'RESTORE' || log.action === 'CREATE');
      setActivityLogs(validLogs);
      setSelectedVersion(validLogs.length > 0 ? validLogs[0] : null);
    } catch (e: any) {
      console.error('Failed to fetch activity logs:', e?.response?.data || e.message);
      setActivityLogs([]);
    }
  }, [endpoint]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (showProjectFilter) fetchProjectOptions();
  }, [showProjectFilter, fetchProjectOptions]);

  useEffect(() => {
    if (modalOpen) fetchProjectOptions();
  }, [modalOpen, fetchProjectOptions]);

  const handleSave = async (formData: any) => {
    setSaving(true);
    try {
      const { image_url, image, photo, logo, banner, floor_plan, ...cleanData } = formData;
      if (selected) {
        await api.put(`${endpoint}/${selected.id}`, cleanData);
        toast.success('Updated successfully');
      } else {
        await api.post(endpoint, formData);
        toast.success('Created successfully');
      }
      setModalOpen(false);
      setSelected(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await api.delete(`${endpoint}/${selected.id}`);
      toast.success('Deleted successfully');
      setDeleteOpen(false);
      setSelected(null);
      fetchData();
    } catch (e) {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestoreOpen = async (item: any) => {
    setSelected(item);
    await fetchActivityLogs(item.id);
    setRestoreOpen(true);
  };

  const handleRestore = async () => {
    if (!selectedVersion || !selected) return;
    setRestoring(true);
    try {
      const details = selectedVersion.details || {};
      const cleanData: any = {};
      const skipped: string[] = [];

      Object.keys(details).forEach((key: string) => {
        if (!key || key.length === 0) return;
        if (['id', 'createdAt', 'updatedAt', 'created_by', 'updated_by', 'details', 'changes', 'previous', 'user_id', 'user_email', 'adminEmail', 'userEmail', 'record_id'].includes(key)) return;
        const val = details[key];
        const k = key.toLowerCase();
        if (k.includes('image') || k.includes('photo') || k.includes('logo') || k.includes('banner') || k.includes('url') || k.includes('link') || k.includes('file') || k.includes('doc')) {
          skipped.push(key); return;
        }
        if (typeof val === 'string' && (val.match(/\.(jpg|jpeg|png|gif|webp|pdf|doc|docx)$/i) || val.startsWith('data:') || val.startsWith('/uploads/') || val.startsWith('http'))) {
          skipped.push(key); return;
        }
        if (val !== null && val !== undefined && val !== '') cleanData[key] = val;
      });

      await api.put(`${endpoint}/${selected.id}`, cleanData, { headers: { 'X-Restore-From-Version': selectedVersion.id } });
      toast.success(skipped.length > 0 ? `Restored (skipped: ${skipped.join(', ')})` : 'Restored successfully');
      setRestoreOpen(false);
      setSelected(null);
      setActivityLogs([]);
      setSelectedVersion(null);
      fetchData();
    } catch (err: any) {
      console.error('Restore error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params: any = { page: 1, limit: 9999, search };
      if (filterProject) params.project_id = filterProject;
      if (filterProductType) params.product_type = filterProductType;
      const res = await api.get(endpoint, { params });
      const rows: any[] = res.data.data || [];
      if (rows.length === 0) { toast.error('No data to export'); return; }

      const colsToExport = exportColumns
        || columns.filter(c => !c.render).map(c => ({ key: c.key, label: c.label, formatDate: false }));

      const sheetData = rows.map((row: any) => {
        const obj: Record<string, any> = {};
        colsToExport.forEach(col => {
          let val = row[col.key] ?? '';
          if (col.formatDate && val) val = new Date(val).toLocaleDateString('en-GB');
          obj[col.label] = val;
        });
        return obj;
      });

      const ws = XLSX.utils.json_to_sheet(sheetData);
      ws['!cols'] = colsToExport.map(() => ({ wch: 22 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
      XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s+/g, '_')}_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`Exported ${rows.length} records`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppLayout title={title} subtitle={subtitle}>
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-sm border border-brand-100 p-3">
          <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
            {/* Left: search + filters */}
            <div className="flex flex-wrap gap-2 items-center flex-1">
              <div className="w-64">
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
              {showProjectFilter && (
                <div className="w-52">
                  <Select
                    value={filterProject}
                    onChange={e => { setFilterProject(e.target.value); setPage(1); }}
                    placeholder="All Projects"
                    options={projectOptions}
                  />
                </div>
              )}
              {showProductTypeFilter && (
                <div className="w-40">
                  <Select
                    value={filterProductType}
                    onChange={e => { setFilterProductType(e.target.value); setPage(1); }}
                    placeholder="All Types"
                    options={[
                      { value: 'Apartment', label: 'Apartment' },
                      { value: 'Villa', label: 'Villa' },
                    ]}
                  />
                </div>
              )}
            </div>
            {/* Right: action buttons */}
            <div className="flex gap-2 flex-shrink-0">
              {showExport && (
                <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExportExcel} loading={exporting}>
                  Export Excel
                </Button>
              )}
              <Button variant="secondary" size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => setBulkOpen(true)}>
                Bulk Upload
              </Button>
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setSelected(null); setModalOpen(true); }}>
                Add New
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <MasterTable
          data={data} columns={columns} loading={loading}
          onEdit={(item) => { setSelected(item); setModalOpen(true); }}
          onDelete={(item) => { setSelected(item); setDeleteOpen(true); }}
          onRestore={(item) => handleRestoreOpen(item)}
          onRefresh={fetchData}
          page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage}
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelected(null); }}
        title={selected ? `Edit ${title}` : `Add ${title}`}
        size={modalSize}
      >
        <MasterForm
          initialData={selected}
          onSubmit={handleSave}
          loading={saving}
          fields={formFields?.map(f => f.name === 'project_id' ? { ...f, options: projectOptions } : f)}
          onClose={() => { setModalOpen(false); setSelected(null); }}
        />
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title={`Bulk Upload ${title}`} size="lg">
        <BulkUpload
          endpoint={`${endpoint}/bulk-upload`}
          onComplete={(res) => {
            setBulkOpen(false);
            setBulkResult(res);
            setResultOpen(true);
            fetchData();
          }}
          sampleUrl={sampleUrl || `${endpoint}/sample-download`}
          sampleFileName={`sample_${title.toLowerCase().replace(/\s+/g, '_')}.xlsx`}
          sampleHeaders={sampleHeaders}
          sampleRows={sampleRows}
        />
      </Modal>

      <Modal open={resultOpen} onClose={() => setResultOpen(false)} title="Upload Result" size="2xl">
        <BulkResult result={bulkResult} />
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setResultOpen(false)}>Close Summary</Button>
        </div>
      </Modal>

      {/* Restore Modal */}
      <Modal open={restoreOpen} onClose={() => { setRestoreOpen(false); setSelected(null); setActivityLogs([]); setSelectedVersion(null); }} title={`Restore ${title}`} size="lg">
        <div className="space-y-4">
          <p className="text-sm text-brand-600">
            Select a version to restore. The current data will be replaced with the selected version data.
          </p>

          {activityLogs.length === 0 ? (
            <div className="text-center py-8 text-brand-400">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No edit history found for this record.</p>
              <p className="text-sm">Only records that have been edited will show history.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-brand-700">Select Version to Restore</label>
                <div className="max-h-48 overflow-y-auto border border-brand-200 rounded-lg divide-y divide-brand-100">
                  {activityLogs.map((log: any) => {
                    const recordName = selected?.project_name || selected?.name || selected?.unit_no || selected?.title || `ID: ${selected?.id}`;
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
                          <div className="flex items-center gap-2 text-sm font-medium text-brand-800">
                            <span>{recordName}</span>
                          </div>
                          <div className="text-xs text-brand-500 mt-0.5">
                            {new Date(log.createdAt).toLocaleString()} • {log.action} by {log.user_email || log.adminEmail || log.user?.name || log.user?.email || 'System'}
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

          {selectedVersion && selectedVersion.details && (
            <div className="mt-4 p-4 bg-brand-50 rounded-lg border border-brand-200">
              <h4 className="text-sm font-medium text-brand-700 mb-2">Changed Data:</h4>
              <div className="text-xs text-brand-500 max-h-40 overflow-y-auto space-y-1">
                {Object.entries(selectedVersion.details).filter(([key]) => !['id', 'createdAt', 'updatedAt', 'created_by', 'updated_by', 'details', 'changes', 'previous', 'adminEmail', 'userEmail'].includes(key)).slice(0, 10).map(([key, value]) => {
                  const keyLower = key.toLowerCase();
                  if (keyLower.includes('image') || keyLower.includes('photo') || keyLower.includes('url')) return null;
                  return (
                    <div key={key} className="flex gap-2">
                      <span className="font-medium text-brand-600 capitalize">{key}:</span>
                      <span className="text-brand-800 break-all">{value !== null && value !== undefined ? String(value) : '-'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-brand-100">
            <Button variant="secondary" onClick={() => { setRestoreOpen(false); setSelected(null); setActivityLogs([]); setSelectedVersion(null); }}>
              Cancel
            </Button>
            <Button onClick={handleRestore} loading={restoring} disabled={activityLogs.length === 0 || !selectedVersion}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Restore
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Delete ${title}`}
        message={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
        loading={deleting}
      />
    </AppLayout>
  );
}

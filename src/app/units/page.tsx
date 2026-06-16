'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Upload, Edit2, Trash2, Building2, Download, Table as TableIcon, RotateCcw } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import BulkUpload from '../../components/ui/BulkUpload';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import PropertyDetailForm from '../../components/forms/PropertyDetailForm';
import BulkResult from '../../components/ui/BulkResult';
import Select from '../../components/ui/Select';
import MultiSelect from '../../components/ui/MultiSelect';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { usePagination } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate } from '../../lib/utils';

const HEADERS = [
  'Project', 'Product Type', 'Unit No', 'Status', 'BHK', 'Floor', 'Facing', 'Unit Type', 'Carpet Area',
  'Land Area (SQFT)', 'Land Rate / SQFT', 'Land Area (SQ.YDS)', 'Land Rate / SQ.YDS', 'Land Rate (L)',
  'Super Built-up Area', 'This Week Price', 'Next Week Price', 'PLC / SQFT', 'FRC / SQFT',
  'Terrace (SQFT)', 'Car Park Type', 'This Week Price Incl CP (L)', 'Next Week Price Incl CP (L)',
  'Other Charges (L)', 'Infra Charges (L)', 'Any Other Charges (L)', 'Any Other Charges (Remarks)', 'Corpus Fund', 'Total Values (L)', 'GST', 'Grand Total (L)', 'PLC Reason', 'Block', 'Phase', 'OTP',
  'CP Charges', 'Modification', 'UDS', 'No of CP', 'Image URL',
  'Unit Area', 'Balcony Area', 'Total Area', 'DLD Charges', 'Admin Fee',
];

export default function GlobalUnitsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterProject, setFilterProject] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [resultOpen, setResultOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSelectAllPages, setIsSelectAllPages] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const [restoreOpen, setRestoreOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [restoring, setRestoring] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { page, setPage, limit, total, totalPages, updatePagination } = usePagination(25);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data.data)).catch(() => { });
    api.get('/properties/units/statuses').then(r => setStatuses(r.data.data)).catch(() => { });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/properties/units', {
        params: {
          page,
          limit,
          search: debouncedSearch,
          status: filterStatus.join(','),
          project_id: filterProject
        }
      });
      setData(res.data.data);
      updatePagination(res.data.pagination);
    } catch (e) {
      toast.error('Failed to load global units');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filterStatus, filterProject]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (formData: any) => {
    setSaving(true);
    try {
      if (selected) {
        const cleanData: any = {};
        Object.keys(formData).forEach((key: string) => {
          const keyLower = key.toLowerCase();
          if (keyLower.includes('image') || keyLower.includes('photo') || keyLower.includes('floor_plan')) return;
          const val = formData[key];
          if (val !== undefined && val !== null && val !== '') cleanData[key] = val;
        });
        await api.put(`/properties/${selected.project_id}/details/${selected.id}`, cleanData);
        toast.success('Unit updated');
      } else {
        toast.error('Global Add Unit not supported. Please add from a specific project.');
      }
      setModalOpen(false); setSelected(null); fetchData();
    } catch (err: any) {
      console.error('Save error:', err.response?.data || err);
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await api.delete(`/properties/${selected.project_id}/details/${selected.id}`);
      toast.success('Unit deleted');
      setDeleteOpen(false); fetchData();
      setSelectedIds(prev => prev.filter(id => id !== selected.id));
    } catch (e) {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      const payload = isSelectAllPages
        ? { all: true, filters: { search: debouncedSearch, status: filterStatus, project_id: filterProject } }
        : { ids: selectedIds };

      await api.post('/properties/units/bulk-delete', payload);
      toast.success(isSelectAllPages ? 'All matching units deleted' : `${selectedIds.length} units deleted`);
      setBulkDeleteOpen(false);
      setSelectedIds([]);
      setIsSelectAllPages(false);
      fetchData();
    } catch (e) {
      toast.error('Bulk delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestoreOpen = async (item: any) => {
    setSelected(item);
    try {
      const res = await api.get('/activity-logs', { params: { model: 'PropertyDetail', record_id: item.id, limit: 50 } });
      const logs = res.data.data?.filter((log: any) => log.action === 'UPDATE') || [];
      setActivityLogs(logs);
      if (logs.length > 0) setSelectedVersion(logs[0]);
      setRestoreOpen(true);
    } catch (e) {
      toast.error('Failed to load history');
    }
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
        if (['id', 'createdAt', 'updatedAt', 'created_by', 'updated_by', 'details', 'changes', 'previous', 'project_id'].includes(key)) return;

        const val = details[key];
        const k = key.toLowerCase();
        if (k.includes('image') || k.includes('photo') || k.includes('logo') || k.includes('banner') || k.includes('url') || k.includes('file')) {
          skipped.push(key);
          return;
        }
        if (typeof val === 'string' && (val.match(/\.(jpg|jpeg|png|gif|webp|pdf)$/i) || val.startsWith('data:') || val.startsWith('/uploads/'))) {
          skipped.push(key);
          return;
        }
        if (val !== null && val !== undefined && val !== '') {
          cleanData[key] = val;
        }
      });

      await api.put(`/properties/${selected.project_id}/details/${selected.id}`, cleanData, { headers: { 'X-Restore-From-Version': selectedVersion.id } });
      toast.success(skipped.length > 0 ? `Restored (skipped: ${skipped.join(', ')})` : 'Restored successfully');
      setRestoreOpen(false);
      setSelected(null);
      setActivityLogs([]);
      setSelectedVersion(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  const toggleSelect = (id: number) => {
    setIsSelectAllPages(false);
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (isSelectAllPages || selectedIds.length === data.length) {
      setSelectedIds([]);
      setIsSelectAllPages(false);
    } else {
      setSelectedIds(data.map(d => d.id));
      setIsSelectAllPages(true);
    }
  };

  const handleDownloadExcel = async () => {
    setExporting(true);
    try {
      const res = await api.get('/properties/units/export', {
        params: {
          search: debouncedSearch,
          status: filterStatus.join(','),
          project_id: filterProject
        },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'property_units_export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export complete');
    } catch (e) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppLayout title="Projects & Units" subtitle="Global search and bulk management of all property units">
      <div className="space-y-5">

        {/* Toolbar */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-brand-100">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center flex-1">
              <div className="w-56">
                <Input
                  placeholder="Search unit or project..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
              <div className="w-44">
                <Select
                  value={filterProject}
                  onChange={e => { setFilterProject(e.target.value); setPage(1); }}
                  placeholder="All Projects"
                  options={projects.map(p => ({ value: p.id, label: p.name }))}
                />
              </div>
              <div className="w-44">
                <MultiSelect
                  value={filterStatus}
                  onChange={val => { setFilterStatus(val as string[]); setPage(1); }}
                  placeholder="All Status"
                  options={statuses.map(s => ({ value: s, label: s }))}
                />
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="secondary" size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => setBulkOpen(true)}>
                Bulk Upload
              </Button>
              <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleDownloadExcel} loading={exporting}>
                Export Excel
              </Button>
              {selectedIds.length > 0 && (
                <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => setBulkDeleteOpen(true)}>
                  {isSelectAllPages ? `Delete All (${total})` : `Delete (${selectedIds.length})`}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Units Table */}
        <div className="bg-white rounded-xl shadow-sm border border-brand-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-table text-[10px] whitespace-nowrap">
              <thead className="bg-brand-50">
                <tr>
                  <th className="px-3 py-2 text-left border-b border-brand-100">
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={isSelectAllPages || (data.length > 0 && selectedIds.length === data.length)}
                      className="rounded border-brand-300 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                  {HEADERS.map(h => <th key={h} className="px-3 py-2 text-left font-semibold text-brand-900 border-b border-brand-100">{h}</th>)}
                  <th className="px-3 py-2 text-left font-semibold text-white border-b border-brand-100 sticky right-0 bg-[#102a43] z-20 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={HEADERS.length + 2} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
                        <span className="text-brand-400 text-sm">Loading units...</span>
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={HEADERS.length + 2} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2 text-brand-300">
                        <TableIcon className="w-12 h-12 stroke-[1]" />
                        <span className="text-sm">No units found matching your criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : data.map(row => (
                  <tr key={row.id} className={`group hover:bg-brand-50/50 transition-colors border-b border-brand-50 last:border-0 ${selectedIds.includes(row.id) ? 'bg-brand-50' : ''}`}>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        className="rounded border-brand-300 text-brand-600 focus:ring-brand-500"
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-brand-900">{row.project?.name}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${row.project?.product_type === 'Villa' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {row.project?.product_type || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-bold text-brand-800">{row.unit_no}</td>
                    <td className="px-3 py-2"><Badge status={row.status || '-'} /></td>
                    <td className="px-3 py-2">{row.bhk}</td>
                    <td className="px-3 py-2">{row.floor}</td>
                    <td className="px-3 py-2">{row.facing}</td>
                    <td className="px-3 py-2">{row.unit_type}</td>
                    <td className="px-3 py-2 text-right">{row.carpet_area}</td>

                    <td className="px-3 py-2 text-right text-brand-500">{row.land_area_sqft}</td>
                    <td className="px-3 py-2 text-right text-brand-500">{row.land_rate_sqft}</td>
                    <td className="px-3 py-2 text-right text-brand-500">{row.land_area_sqyards}</td>
                    <td className="px-3 py-2 text-right text-brand-500">{row.land_rate_sqyards}</td>
                    <td className="px-3 py-2 text-right text-brand-500">{row.land_rate_lakhs}</td>

                    <td className="px-3 py-2 text-right">{row.super_builtup_area}</td>
                    <td className="px-3 py-2 text-right font-medium">{row.this_week_price}</td>
                    <td className="px-3 py-2 text-right">{row.next_week_price}</td>
                    <td className="px-3 py-2 text-right">{row.plc_charges_per_sqft}</td>
                    <td className="px-3 py-2 text-right">{row.frc_charges_per_sqft}</td>
                    <td className="px-3 py-2 text-right">{row.private_terrace}</td>
                    <td className="px-3 py-2">{row.car_park_type}</td>
                    <td className="px-3 py-2 text-right font-bold text-brand-700">{row.this_week_price_incl_car_park}</td>
                    <td className="px-3 py-2 text-right text-brand-600">{row.next_week_price_incl_car_park}</td>
                    <td className="px-3 py-2 text-right">{row.other_charges}</td>
                    <td className="px-3 py-2 text-right">{row.infra_charges}</td>
                    <td className="px-3 py-2 text-right text-amber-700 font-medium">{row.any_other_charges}</td>
                    <td className="px-3 py-2 max-w-[140px] truncate text-amber-600 italic text-[10px]" title={row.any_other_charges_remarks}>{row.any_other_charges_remarks || '-'}</td>
                    <td className="px-3 py-2">{row.corpus_fund || '-'}</td>
                    <td className="px-3 py-2 text-right font-bold">{row.total_values}</td>
                    <td className="px-3 py-2 text-right">{row.gst}</td>
                    <td className="px-3 py-2 text-right font-black text-brand-900 text-xs text-brand-800">₹{row.grand_total}L</td>
                    <td className="px-3 py-2">{row.plc_reason}</td>
                    <td className="px-3 py-2">{row.block}</td>
                    <td className="px-3 py-2">{row.phase}</td>
                    <td className="px-3 py-2">{row.otp}</td>
                    <td className="px-3 py-2 text-right">{row.car_park_charges}</td>
                    <td className="px-3 py-2 text-right">{row.modification}</td>
                    <td className="px-3 py-2 text-right">{row.uds}</td>
                    <td className="px-3 py-2 text-center">{row.no_of_car_park}</td>
                    <td className="px-3 py-2 max-w-[100px] truncate underline text-blue-500">{row.image_url}</td>
                    <td className="px-3 py-2 text-right">{row.unit_area}</td>
                    <td className="px-3 py-2 text-right">{row.balcony_area}</td>
                    <td className="px-3 py-2 text-right">{row.total_area}</td>
                    <td className="px-3 py-2 text-right">{row.dld_charges}</td>
                    <td className="px-3 py-2 text-right">{row.admin_fee}</td>

                    <td className="px-3 py-2 sticky right-0 bg-white group-hover:bg-brand-50/80 transition-colors shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)] z-10">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleRestoreOpen(row)}
                          className="p-1 px-2 rounded bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors flex items-center gap-1"
                          title="Restore">
                          <RotateCcw className="w-3 h-3" />
                        </button>
                        <button onClick={() => { setSelected(row); setModalOpen(true); }}
                          className="p-1 px-2 rounded bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors flex items-center gap-1">
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button onClick={() => { setSelected(row); setDeleteOpen(true); }}
                          className="p-1 px-2 rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center gap-1">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setSelected(null); }}
        title={selected ? `Edit Unit ${selected.unit_no} - ${selected.project?.name}` : 'Add Unit'} size="3xl">
        <PropertyDetailForm initialData={selected} onSubmit={handleSave} loading={saving} onClose={() => { setModalOpen(false); setSelected(null); }} />
      </Modal>

      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Upload Units (Cross-Project)" size="xl">
        <div className="space-y-4 p-1">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex gap-2">
            <TableIcon className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Multiple Project Upload</p>
              <p className="text-xs opacity-80 mt-1">This Excel file can contain units for DIFFERENT projects. Ensure the <b>"PROJECT"</b> column exactly matches the project name in our system.</p>
            </div>
          </div>
          <BulkUpload
            endpoint={`/properties/units/bulk-upload`}
            onComplete={(res) => {
              setBulkOpen(false);
              setBulkResult(res);
              setResultOpen(true);
              fetchData();
            }}
            sampleUrl={`/properties/units/sample-download`}
            sampleFileName="global_units_upload_sample.xlsx"
          />
        </div>
      </Modal>

      <Modal open={resultOpen} onClose={() => setResultOpen(false)} title="Upload Result" size="2xl">
        <BulkResult result={bulkResult} />
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setResultOpen(false)}>Close Summary</Button>
        </div>
      </Modal>

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete}
        title="Delete Unit" message={`Delete unit "${selected?.unit_no}" from ${selected?.project?.name}? This cannot be undone.`} loading={deleting} />

      <ConfirmDialog open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} onConfirm={handleBulkDelete}
        title="Bulk Delete Units"
        message={isSelectAllPages
          ? `Are you sure you want to delete ALL ${total} units matching the current filters? This action cannot be undone.`
          : `Are you sure you want to delete ${selectedIds.length} units? This action cannot be undone.`
        }
        loading={deleting} />

      <Modal open={restoreOpen} onClose={() => { setRestoreOpen(false); setSelected(null); setActivityLogs([]); setSelectedVersion(null); }} title={`Restore Unit ${selected?.unit_no}`} size="lg">
        <div className="space-y-4">
          <p className="text-sm text-brand-600">Select a version to restore.</p>
          {activityLogs.length === 0 ? (
            <div className="text-center py-8 text-brand-400">No edit history found.</div>
          ) : (
            <>
              <div className="max-h-48 overflow-y-auto border border-brand-200 rounded-lg divide-y divide-brand-100">
                {activityLogs.map((log: any) => {
                  const unitLabel = `${selected?.unit_no} - ${selected?.project?.name || ''}`;
                  return (
                    <label key={log.id} className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-brand-50 ${selectedVersion?.id === log.id ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : ''}`}>
                      <input type="radio" name="version" checked={selectedVersion?.id === log.id} onChange={() => setSelectedVersion(log)} className="mt-1" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-brand-800">{unitLabel}</div>
                        <div className="text-xs text-brand-500">{new Date(log.createdAt).toLocaleString()} • {log.action} by {log.user_email || log.adminEmail || log.user?.name || log.user?.email || 'System'}</div>
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
            <Button variant="secondary" onClick={() => { setRestoreOpen(false); setSelected(null); setActivityLogs([]); }}>Cancel</Button>
            <Button onClick={handleRestore} loading={restoring} disabled={activityLogs.length === 0}><RotateCcw className="w-4 h-4 mr-2" />Restore</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

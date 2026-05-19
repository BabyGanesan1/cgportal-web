'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Search, Upload, Building2, Table as TableIcon, Check, X, Edit2, Download } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import BulkUpload from '../../components/ui/BulkUpload';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import BulkResult from '../../components/ui/BulkResult';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { usePagination } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { format } from 'date-fns';
import { getUnitStatuses, updateUnitStatus } from '../../lib/unitStatus';
import Select from '../../components/ui/Select';

const HEADERS = ['Project', 'Unit No', 'Status', 'Car Park Type', 'Car Park Charges(In Lakhs)', 'Updated By', 'Updated At'];

export default function UnitStatusPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [filterProject, setFilterProject] = useState('');
  const [projects, setProjects] = useState<any[]>([]);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [resultOpen, setResultOpen] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const { page, setPage, limit, total, totalPages, updatePagination } = usePagination(25);

  useEffect(() => {
    api.get('/projects?limit=1000').then(r => setProjects(r.data.data)).catch(() => { });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUnitStatuses({
        page,
        limit,
        search: debouncedSearch,
        project_id: filterProject
      });
      setData(res.data);
      updatePagination(res.pagination);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load unit statuses');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filterProject, updatePagination]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEdit = (row: any) => {
    setEditingId(row.id);
    setEditValue(row.status || '');
  };

  const handleSaveStatus = async (id: number) => {
    try {
      await updateUnitStatus(id, editValue);
      toast.success('Status updated');
      setEditingId(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <AppLayout title="Unit Status Management" subtitle="Manage and bulk update property unit statuses">
      <div className="space-y-6">

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white p-4 rounded-xl shadow-sm border border-brand-100">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full lg:w-auto flex-1">
            <div className="flex-1 min-w-[250px] sm:max-w-md">
              <Input
                placeholder="Search project or unit no..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                icon={<Search className="w-4 h-4" />}
                className="w-full"
              />
            </div>

            <div className="w-full sm:w-72">
              <Select
                value={filterProject}
                onChange={e => { setFilterProject(e.target.value); setPage(1); }}
                placeholder="All Projects"
                options={projects.map(p => ({ value: p.id, label: p.name }))}
              />
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto mt-2 lg:mt-0">
            <Button
              variant="secondary"
              size="sm"
              icon={<Upload className="w-4 h-4" />}
              onClick={() => setBulkOpen(true)}
              className="flex-1 sm:flex-none"
            >
              Bulk Upload
            </Button>
          </div>
        </div>

        {/* Units Table */}
        <div className="bg-white rounded-xl shadow-sm border border-brand-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-table text-[11px] whitespace-nowrap">
              <thead className="bg-[#102a43]">
                <tr>
                  {HEADERS.map(h => (
                    <th key={h} className="px-3 py-3 text-left font-bold text-white uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {loading ? (
                  <tr>
                    <td colSpan={HEADERS.length} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
                        <span className="text-brand-400 text-sm font-medium">Loading unit statuses...</span>
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={HEADERS.length} className="text-center py-20">
                      <div className="flex flex-col items-center gap-4 text-brand-200">
                        <Building2 className="w-12 h-12 stroke-[1]" />
                        <span className="text-sm font-medium">No units matching your criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : data.map(row => (
                  <tr key={row.id} className="group hover:bg-brand-50/50 transition-colors border-b border-brand-50">
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-brand-900">{row.project?.name || 'Unknown Project'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="inline-flex items-center px-2 py-0.5 bg-brand-50 rounded border border-brand-100 font-bold text-brand-800">
                        {row.unit_no}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 min-w-[180px]">
                      {editingId === row.id ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
                          <input
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveStatus(row.id); if (e.key === 'Escape') setEditingId(null); }}
                            className="border border-brand-400 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-brand-500/50 outline-none w-36 shadow-sm"
                          />
                          <button onClick={() => handleSaveStatus(row.id)} className="p-1.5 bg-green-500 text-white hover:bg-green-600 rounded transition-colors shadow-sm"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded transition-colors border border-gray-200 shadow-sm"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <div
                          className="flex items-center justify-between group/status cursor-pointer p-1 rounded hover:bg-brand-50 transition-all border border-transparent hover:border-brand-100"
                          onClick={() => handleEdit(row)}
                        >
                          <Badge status={row.status || '-'} />
                          <div className="flex items-center gap-1 opacity-0 group-hover/status:opacity-100 transition-opacity transform translate-x-1 group-hover/status:translate-x-0">
                            <span className="text-[8px] font-bold text-brand-400 uppercase">Edit Status</span>
                            <Edit2 className="w-3 h-3 text-brand-300" />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-brand-700">{row.car_park_type || '-'}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-brand-900">
                        {row.car_park_charges ? `${Number(row.car_park_charges).toLocaleString('en-IN')}` : '-'}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-[10px] uppercase border-2 border-white ring-1 ring-brand-50 shadow-sm">
                          {row.updatedBy?.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex flex-col leading-tight">
                          <span className="text-brand-900 font-bold">{row.updatedBy?.name || '-'}</span>
                          <span className="text-[8px] text-brand-400 uppercase font-bold">{row.updatedBy?.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-0.5 opacity-70">
                        <span className="text-brand-800 font-bold">{row.updatedAt ? format(new Date(row.updatedAt), 'dd MMM yyyy') : '-'}</span>
                        <span className="text-[10px] text-brand-400 font-bold tabular-nums">
                          {row.updatedAt ? format(new Date(row.updatedAt), 'HH:mm') : ''}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-brand-50/30 px-4 py-2">
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
          </div>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Status Update" size="xl">
        <div className="space-y-4 p-1">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex gap-2">
            <TableIcon className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Status Update Synchronization</p>
              <p className="text-xs opacity-80 mt-1">
                Upload an Excel file with <b>PROJECT</b>, <b>UNIT NO</b>, <b>STATUS</b>, <b>CAR PARK TYPE</b>, and <b>CAR PARK CHARGES</b> columns.
                Existing unit statuses and car park details will be updated based on the matching project name and unit number.
              </p>
            </div>
          </div>

          <div className="p-1">
            <BulkUpload
              endpoint={`/unit-status/bulk-upload`}
              onComplete={(res) => {
                setBulkOpen(false);
                setBulkResult(res);
                setResultOpen(true);
                fetchData();
              }}
              sampleUrl={`/unit-status/sample-download`}
              sampleFileName="unit_status_update_sample.xlsx"
            />
          </div>
        </div>
      </Modal>

      {/* Result Modal */}
      <Modal open={resultOpen} onClose={() => setResultOpen(false)} title="Synchronization Report" size="2xl">
        <div className="p-1">
          <BulkResult result={bulkResult} />
          <div className="mt-8 flex justify-end">
            <Button onClick={() => setResultOpen(false)} className="rounded-2xl px-10 py-3 shadow-lg hover:shadow-brand-500/30 transition-all font-bold tracking-wide">Acknowledge & Sync</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

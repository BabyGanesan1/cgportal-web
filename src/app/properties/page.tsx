'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Upload, Eye, Edit2, Trash2, MapPin, Calendar, Building2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/layout/AppLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import BulkUpload from '../../components/ui/BulkUpload';
import BulkResult from '../../components/ui/BulkResult';
import Pagination from '../../components/ui/Pagination';
import PropertyForm from '../../components/forms/PropertyForm';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../lib/utils';
import { usePagination } from '../../hooks/useApi';

const statusColors: Record<string, string> = {
  'Ready to Move': 'bg-emerald-100 text-emerald-700',
  '0 to 6 Months': 'bg-blue-100 text-blue-700',
  '6 to 12 Months': 'bg-indigo-100 text-indigo-700',
  'Less than 6 Months': 'bg-blue-100 text-blue-700',
  '12 to 18 Months': 'bg-yellow-100 text-yellow-700',
  '18 to 24 Months': 'bg-orange-100 text-orange-700',
  '24 to 30 Months': 'bg-orange-100 text-orange-700',
  '24 to 36 Months': 'bg-red-100 text-red-700',
};

export default function PropertiesPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [cities, setCities] = useState<any[]>([]);
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
  const [exporting, setExporting] = useState(false);
  const { page, setPage, limit, total, totalPages, updatePagination } = usePagination(20);

  useEffect(() => {
    api.get('/masters/cities?active=true&limit=100').then(r => setCities(r.data.data)).catch(() => { });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/properties', { params: { page, limit, search, city_id: filterCity, admin: true } });
      setData(res.data.data);
      updatePagination(res.data.pagination);
    } catch (e) { toast.error('Failed to load properties'); }
    finally { setLoading(false); }
  }, [page, limit, search, filterCity]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (formData: any) => {
    setSaving(true);
    try {
      if (selected) {
        await api.put(`/properties/${selected.id}`, formData);
        toast.success('Project updated');
      } else {
        const variants = (formData.bhk_variants || []).filter((v: any) => v.bhk);
        if (variants.length === 0) { toast.error('Add at least one BHK variant'); setSaving(false); return; }
        await api.post('/properties', formData);
        toast.success('Project created');
      }
      setModalOpen(false); setSelected(null); fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (row: any) => {
    try {
      // Fetch full property with bhk_variants from property_bhk table
      const res = await api.get(`/properties/${row.id}`);
      setSelected(res.data.data || row);
    } catch {
      setSelected(row); // fallback to table row if fetch fails
    }
    setModalOpen(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/properties/${selected.id}`);
      toast.success('Project deleted');
      setDeleteOpen(false); fetchData();
      setSelectedIds(prev => prev.filter(id => id !== selected.id));
    } catch (e) { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      const payload = isSelectAllPages 
        ? { all: true, filters: { search, city_id: filterCity } }
        : { ids: selectedIds };

      await api.post('/properties/bulk-delete', payload);
      toast.success(isSelectAllPages ? 'All matching projects deleted' : `${selectedIds.length} projects deleted`);
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

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await api.get('/properties', {
        params: { page: 1, limit: 9999, search, city_id: filterCity, admin: true }
      });
      const rows: any[] = res.data.data || [];
      if (rows.length === 0) { toast.error('No projects to export'); return; }

      const fmtDate = (d: any) => {
        if (!d) return '-';
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return String(d);
        return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
      };

      const sheetData = rows.map(r => ({
        'PROJECT NAME': r.project_name || '-',
        'CITY': r.cityData?.name || '-',
        'LOCATION': r.locationData?.name || '-',
        'PRODUCT TYPE': r.product_type || '-',
        'BHK TYPES': r.bhk_variants?.map((v: any) => v.bhk).join(', ') || r.bhk || '-',
        'MIN PRICE (L)': r.min_price || 0,
        'MAX PRICE (L)': r.max_price || 0,
        'POSSESSION STATUS': r.possession_status || '-',
        'HANDING OVER DATE': fmtDate(r.handing_over_date),
        'RERA NO': r.rera_registration_no || '-',
        'SERVING LOCATIONS': r.serving_locations || '-',
        'AVAILABLE UNITS': r.available_units || 0,
      }));

      const ws = XLSX.utils.json_to_sheet(sheetData);
      ws['!cols'] = [22, 14, 18, 14, 18, 14, 14, 20, 18, 24, 28, 14].map(wch => ({ wch }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Projects');
      XLSX.writeFile(wb, `projects_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`Exported ${rows.length} projects`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  return (
    <AppLayout title="Properties" subtitle="Manage all property listings">
      <div className="space-y-5">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="flex gap-3 w-full sm:w-auto">
            <Input placeholder="Search project..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              icon={<Search className="w-4 h-4" />} className="w-52" />
            <select value={filterCity} onChange={e => { setFilterCity(e.target.value); setPage(1); }}
              className="border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">All Cities</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExportExcel} loading={exporting}>
              Export Excel
            </Button>
            <Button variant="secondary" size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => setBulkOpen(true)}>
              Bulk Upload
            </Button>
            {selectedIds.length > 0 && (
              <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => setBulkDeleteOpen(true)}>
                {isSelectAllPages ? `Delete All Matching (${total})` : `Delete Selected (${selectedIds.length})`}
              </Button>
            )}
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setSelected(null); setModalOpen(true); }}>
              Add Project
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-brand-500">
          <span className="font-medium text-brand-700">{total} Projects</span>
          <span>•</span>
          <span>Page {page} of {totalPages}</span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-brand-100 overflow-hidden">
            <div className="overflow-x-auto text-[11px]">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th className="w-10">
                      <input 
                        type="checkbox" 
                        onChange={toggleSelectAll} 
                        checked={isSelectAllPages || (data.length > 0 && selectedIds.length === data.length)}
                        className="rounded border-brand-300 text-brand-600 focus:ring-brand-500"
                      />
                    </th>
                    <th>Project Name</th>
                    <th>City / Location</th>
                    <th>BHK Types</th>
                    <th>Price Range</th>
                    <th>Possession</th>
                    <th>Handing Over</th>
                    <th>Avail. Units</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-16 text-brand-400">No projects found</td></tr>
                  ) : data.map((row, idx) => (
                    <tr key={row.id} className={`animate-fade-in ${selectedIds.includes(row.id) ? 'bg-brand-50' : ''}`}>
                      <td className="text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(row.id)}
                          onChange={() => toggleSelect(row.id)}
                          className="rounded border-brand-300 text-brand-600 focus:ring-brand-500"
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-brand-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-brand-800">{row.project_name}</div>
                            {row.rera_registration_no && (
                              <div className="text-xs text-brand-400 mt-0.5">RERA: {row.rera_registration_no}</div>
                            )}
                            {row.serving_locations && (
                              <div className="text-xs text-brand-400 mt-0.5 max-w-[180px] truncate">{row.serving_locations}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-brand-600">
                          <MapPin className="w-3 h-3" />{row.cityData?.name}
                        </div>
                        <div className="text-xs text-brand-400">{row.locationData?.name}</div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {(row.bhk_variants && row.bhk_variants.length > 0)
                            ? row.bhk_variants.map((v: any) => (
                              <span key={v.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                {v.bhk}
                              </span>
                            ))
                            : row.bhk
                              ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{row.bhk}</span>
                              : <span className="text-brand-300 text-xs">—</span>
                          }
                        </div>
                      </td>
                      <td>
                        {row.min_price || row.max_price ? (
                          <div className="text-brand-700 font-medium text-sm">
                            {formatCurrency(row.min_price)} – {formatCurrency(row.max_price)}
                          </div>
                        ) : <span className="text-brand-300">—</span>}
                      </td>
                      <td>
                        {row.possession_status ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[row.possession_status] || 'bg-gray-100 text-gray-600'}`}>
                            {row.possession_status}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-brand-400" />
                          {formatDate(row.handing_over_date)}
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${(row.available_units || 0) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {row.available_units || 0} units
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => router.push(`/properties/${row.id}/details`)}
                            className="p-1.5 rounded-lg text-brand-400 hover:text-brand-700 hover:bg-brand-50 transition-colors" title="View Units">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(row)}
                            className="p-1.5 rounded-lg text-brand-400 hover:text-brand-700 hover:bg-brand-50 transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSelected(row); setDeleteOpen(true); }}
                            className="p-1.5 rounded-lg text-brand-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
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
        )}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setSelected(null); }}
        title={selected ? 'Edit Project' : 'Add Project'} size="2xl">
        <PropertyForm initialData={selected} onSubmit={handleSave} loading={saving}
          onClose={() => { setModalOpen(false); setSelected(null); }} />
      </Modal>

      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Upload Properties">
        <BulkUpload
          endpoint="/properties/bulk-upload"
          onComplete={(res) => {
            setBulkOpen(false);
            setBulkResult(res);
            setResultOpen(true);
            fetchData();
          }}
          sampleUrl="/properties/sample-download"
          sampleFileName="sample_properties.xlsx"
        />
      </Modal>

      <Modal open={resultOpen} onClose={() => setResultOpen(false)} title="Upload Result" size="2xl">
        <BulkResult result={bulkResult} />
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setResultOpen(false)}>Close Summary</Button>
        </div>
      </Modal>

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete}
        title="Delete Project"
        message={`Delete "${selected?.project_name}"? All associated unit details will also be removed.`}
        loading={deleting} />

      <ConfirmDialog open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} onConfirm={handleBulkDelete}
        title="Bulk Delete Projects"
        message={isSelectAllPages 
          ? `Delete ALL ${total} projects matching the current filters? This will also remove ALL associated unit details. This action cannot be undone.`
          : `Delete ${selectedIds.length} projects? This will also remove ALL associated unit details for these projects. This action cannot be undone.`
        }
        loading={deleting} />
    </AppLayout>
  );
}
'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Upload, Edit2, Trash2, ArrowLeft, BarChart3, TrendingUp, Home } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '../../../../components/layout/AppLayout';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Modal from '../../../../components/ui/Modal';
import ConfirmDialog from '../../../../components/ui/ConfirmDialog';
import BulkUpload from '../../../../components/ui/BulkUpload';
import Pagination from '../../../../components/ui/Pagination';
import Badge from '../../../../components/ui/Badge';
import PropertyDetailForm from '../../../../components/forms/PropertyDetailForm';
import BulkResult from '../../../../components/ui/BulkResult';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../../lib/utils';
import { usePagination } from '../../../../hooks/useApi';
import { useDebounce } from '../../../../hooks/useDebounce';

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBhk, setFilterBhk] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const { page, setPage, limit, total, totalPages, updatePagination } = usePagination(25);

  useEffect(() => {
    api.get(`/properties/${id}`).then(r => setProperty(r.data.data)).catch(() => {});
    api.get(`/properties/${id}/details/stats`).then(r => setStats(r.data.data)).catch(() => {});
  }, [id]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/properties/${id}/details`, {
        params: { page, limit, search: debouncedSearch, status: filterStatus, bhk: filterBhk }
      });
      setData(res.data.data);
      updatePagination(res.data.pagination);
    } catch (e) { toast.error('Failed to load units'); }
    finally { setLoading(false); }
  }, [id, page, limit, debouncedSearch, filterStatus, filterBhk]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (formData: any) => {
    setSaving(true);
    try {
      if (selected) {
        await api.put(`/properties/${id}/details/${selected.id}`, formData);
        toast.success('Unit updated');
      } else {
        await api.post(`/properties/${id}/details`, formData);
        toast.success('Unit created');
      }
      setModalOpen(false); setSelected(null); fetchData();
      api.get(`/properties/${id}/details/stats`).then(r => setStats(r.data.data)).catch(() => {});
    } catch (err: any) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/properties/${id}/details/${selected.id}`);
      toast.success('Unit deleted');
      setDeleteOpen(false); fetchData();
    } catch (e) { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const STATUSES = ['Vacant', 'Sold', 'HSBC-Sold', 'Blocked', 'Open for Sale with 10%', 'HSBC-Open for sale with 10%', 'HSBC-vacant', 'Investor'];

  return (
    <AppLayout title={property?.project_name || 'Property Details'} subtitle="Unit-level price sheet management">
      <div className="space-y-5">
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg text-brand-400 hover:text-brand-700 hover:bg-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-display text-lg font-semibold text-brand-800">{property?.project_name}</h2>
            <p className="text-sm text-brand-400">{property?.cityData?.name} › {property?.locationData?.name} · {property?.bhk}</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Units', value: stats.total, color: 'bg-brand-800', icon: Home },
              { label: 'Available', value: stats.available, color: 'bg-emerald-600', icon: TrendingUp },
              { label: 'Sold', value: stats.sold, color: 'bg-red-500', icon: BarChart3 },
              { label: 'Blocked', value: stats.blocked, color: 'bg-amber-500', icon: BarChart3 },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-brand-100">
                <div className={`${card.color} w-8 h-8 rounded-lg flex items-center justify-center mb-3`}>
                  <card.icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold text-brand-900 font-display">{card.value}</div>
                <div className="text-xs text-brand-400 mt-0.5">{card.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* BHK-wise summary */}
        {stats?.bhkWise && Object.keys(stats.bhkWise).length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-brand-100">
            <h3 className="font-semibold text-brand-800 mb-3 text-sm">BHK-wise Available Inventory</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.bhkWise).map(([bhk, info]: any) => (
                <div key={bhk} className="bg-brand-50 rounded-lg px-4 py-2 text-sm">
                  <span className="font-medium text-brand-700">{bhk}</span>
                  <span className="text-brand-400 mx-2">·</span>
                  <span className="text-brand-600">{info.count} units</span>
                  <span className="text-brand-400 mx-2">·</span>
                  <span className="text-emerald-600 font-medium">{formatCurrency(info.minPrice)} – {formatCurrency(info.maxPrice)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Search unit..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              icon={<Search className="w-4 h-4" />} className="w-40" />
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 bg-white focus:outline-none">
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterBhk} onChange={e => { setFilterBhk(e.target.value); setPage(1); }}
              className="border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 bg-white focus:outline-none">
              <option value="">All BHK</option>
              {stats && Object.keys(stats.bhkWise || {}).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => setBulkOpen(true)}>Bulk Upload</Button>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setSelected(null); setModalOpen(true); }}>Add Unit</Button>
          </div>
        </div>

        {/* Units Table */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-700 rounded-full animate-spin" /></div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-brand-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full data-table text-[10px] whitespace-nowrap">
                <thead>
                  <tr className="bg-brand-50">
                    <th>Unit No</th><th>Status</th><th>BHK</th><th>Floor</th><th>Facing</th><th>Type</th>
                    <th>Carpet (sqft)</th><th>SBA (sqft)</th><th>This Week (L)</th><th>NW Price (L)</th>
                    <th>PLC/sqft</th><th>FRC/sqft</th><th>Car Park</th>
                    <th>Incl CP (L)</th><th>Total (L)</th><th>GST (L)</th><th>Grand Total (L)</th><th>Block/Phase</th>
                    <th>Unit Area</th><th>Balcony Area</th><th>Total Area</th><th>DLD Charges</th><th>Admin Fee</th>
                    <th className="px-3 py-2 text-left font-semibold text-white border-b border-brand-100 sticky right-0 bg-[#102a43] z-20 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan={24} className="text-center py-12 text-brand-400">No units found</td></tr>
                  ) : data.map(row => (
                    <tr key={row.id} className="group animate-fade-in hover:bg-brand-50/50">
                      <td className="font-bold text-brand-800">{row.unit_no}</td>
                      <td><Badge status={row.status || '-'} /></td>
                      <td>{row.bhk}</td><td>{row.floor}</td><td>{row.facing}</td><td>{row.unit_type}</td>
                      <td className="text-right">{row.carpet_area}</td>
                      <td className="text-right">{row.super_builtup_area}</td>
                      <td className="text-right font-medium">{row.this_week_price}</td>
                      <td className="text-right">{row.next_week_price}</td>
                      <td className="text-right">{row.plc_charges_per_sqft}</td>
                      <td className="text-right">{row.frc_charges_per_sqft}</td>
                      <td>{row.car_park_type}</td>
                      <td className="text-right font-bold text-brand-700">{row.this_week_price_incl_car_park}</td>
                      <td className="text-right font-medium">{row.total_values}</td>
                      <td className="text-right">{row.gst}</td>
                      <td className="text-right font-black text-brand-900">₹{row.grand_total}L</td>
                      <td>{row.block}{row.phase ? ` / ${row.phase}` : ''}</td>
                      <td className="text-right">{row.unit_area}</td>
                      <td className="text-right">{row.balcony_area}</td>
                      <td className="text-right">{row.total_area}</td>
                      <td className="text-right">{row.dld_charges}</td>
                      <td className="text-right">{row.admin_fee}</td>
                      <td className="px-3 py-2 sticky right-0 bg-white group-hover:bg-brand-50/80 transition-colors shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)] z-10">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setSelected(row); setModalOpen(true); }}
                            className="p-1 rounded text-brand-400 hover:text-brand-700 hover:bg-brand-50 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { setSelected(row); setDeleteOpen(true); }}
                            className="p-1 rounded text-brand-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
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
        title={selected ? 'Edit Unit' : 'Add Unit'} size="3xl">
        <PropertyDetailForm initialData={selected} onSubmit={handleSave} loading={saving} onClose={() => { setModalOpen(false); setSelected(null); }} />
      </Modal>

      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Upload Units (Price Sheet)" size="xl">
        <div className="space-y-3">
          <p className="text-sm text-brand-500 font-medium bg-brand-50 p-3 rounded-lg border border-brand-100 italic">
            Please use the new 36-column format for bulk uploading units.
          </p>
          <BulkUpload
            endpoint={`/properties/${id}/details/bulk-upload`}
            onComplete={(res) => {
              setBulkOpen(false);
              setBulkResult(res);
              setResultOpen(true);
              fetchData();
            }}
            sampleUrl={`/properties/${id}/details/sample-download`}
            sampleFileName="units_price_sheet_sample.xlsx"
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
        title="Delete Unit" message={`Delete unit "${selected?.unit_no}"? This cannot be undone.`} loading={deleting} />
    </AppLayout>
  );
}

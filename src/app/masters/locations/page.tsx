'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Upload } from 'lucide-react';
import AppLayout from '../../../components/layout/AppLayout';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import BulkUpload from '../../../components/ui/BulkUpload';
import BulkResult from '../../../components/ui/BulkResult';
import MasterTable from '../../../components/tables/MasterTable';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { usePagination } from '../../../hooks/useApi';

const LOCATION_SAMPLE_HEADERS = ['name', 'city_name'];
const LOCATION_SAMPLE_ROWS: (string | number)[][] = [
  ['Gottigere', 'Bangalore'],
  ['Perungalathur', 'Chennai'],
  ['Vandalur', 'Chennai'],
  ['Whitefield', 'Bangalore'],
];

export default function LocationsPage() {
  const [data, setData] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ name: '', city_id: '' });
  const [formErrors, setFormErrors] = useState<{ name?: string; city_id?: string }>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const { page, setPage, limit, total, totalPages, updatePagination } = usePagination(20);

  useEffect(() => {
    api.get('/masters/cities?active=true&limit=100').then(r => setCities(r.data.data)).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/masters/locations', { params: { page, limit, search, city_id: filterCity } });
      setData(res.data.data);
      updatePagination(res.data.pagination);
    } catch (e) {
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filterCity]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const validate = () => {
    const errs: { name?: string; city_id?: string } = {};
    if (!form.name.trim()) errs.name = 'Location name is required';
    if (!form.city_id) errs.city_id = 'City is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (selected) {
        await api.put(`/masters/locations/${selected.id}`, form);
        toast.success('Location updated');
      } else {
        await api.post('/masters/locations', form);
        toast.success('Location created');
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

  const columns = [
    { key: 'name', label: 'Location Name' },
    { key: 'city', label: 'City', render: (row: any) => row.cityData?.name || row.city?.name || '-' },
  ];

  return (
    <AppLayout title="Locations" subtitle="Manage location master data">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="flex gap-3 w-full sm:w-auto">
            <Input
              placeholder="Search..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              icon={<Search className="w-4 h-4" />}
              className="w-48"
            />
            <select
              value={filterCity}
              onChange={e => setFilterCity(e.target.value)}
              className="border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Cities</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => setBulkOpen(true)}>Bulk Upload</Button>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setSelected(null); setForm({ name: '', city_id: '' }); setFormErrors({}); setModalOpen(true); }}>Add New</Button>
          </div>
        </div>

        <MasterTable
          data={data} columns={columns} loading={loading}
          onEdit={(item) => { setSelected(item); setForm({ name: item.name, city_id: item.city_id }); setFormErrors({}); setModalOpen(true); }}
          onDelete={(item) => { setSelected(item); setDeleteOpen(true); }}
          page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage}
        />
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setSelected(null); }} title={selected ? 'Edit Location' : 'Add Location'}>
        <div className="space-y-4">
          <div>
            <Select
              label="City *"
              value={form.city_id}
              onChange={e => { setForm(f => ({ ...f, city_id: e.target.value })); setFormErrors(fe => ({ ...fe, city_id: undefined })); }}
              options={cities.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Select city..."
              error={formErrors.city_id}
            />
          </div>
          <div>
            <Input
              label="Location Name *"
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(fe => ({ ...fe, name: undefined })); }}
              placeholder="e.g. Gottigere"
              error={formErrors.name}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-brand-100">
            <button type="button" onClick={() => { setModalOpen(false); setSelected(null); }}
              className="px-4 py-2 rounded-lg border border-brand-200 text-sm text-brand-600 hover:bg-brand-50 transition-colors">
              Cancel
            </button>
            <Button loading={saving} onClick={handleSave}>{selected ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Upload Locations" size="lg">
        <div className="space-y-3">
          <p className="text-xs text-brand-500">
            The CSV must have columns: <code className="bg-brand-100 px-1 rounded">name</code> and <code className="bg-brand-100 px-1 rounded">city_name</code> (e.g. Chennai, Bangalore).
          </p>
          <BulkUpload
            endpoint="/masters/locations/bulk-upload"
            onComplete={(res) => {
              setBulkOpen(false);
              setBulkResult(res);
              setResultOpen(true);
              fetchData();
            }}
            sampleUrl="/masters/locations/sample-download"
            sampleFileName="sample_locations.xlsx"
            sampleHeaders={LOCATION_SAMPLE_HEADERS}
            sampleRows={LOCATION_SAMPLE_ROWS}
          />
        </div>
      </Modal>

      <Modal open={resultOpen} onClose={() => setResultOpen(false)} title="Upload Result" size="2xl">
        <BulkResult result={bulkResult} />
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setResultOpen(false)}>Close Summary</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setDeleting(true);
          try { await api.delete(`/masters/locations/${selected.id}`); toast.success('Deleted'); setDeleteOpen(false); fetchData(); }
          catch (e) { toast.error('Delete failed'); }
          finally { setDeleting(false); }
        }}
        title="Delete Location"
        message={`Delete "${selected?.name}"? This action cannot be undone.`}
        loading={deleting}
      />
    </AppLayout>
  );
}

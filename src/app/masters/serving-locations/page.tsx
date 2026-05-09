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

const SAMPLE_HEADERS = ['name', 'location_name', 'city_name'];
const SAMPLE_ROWS: (string | number)[][] = [
  ['Padappai', 'Tambaram', 'Chennai'],
  ['Vandalur', 'Perungalathur', 'Chennai'],
  ['Electronic City', 'Hosur Road', 'Bangalore'],
];

export default function ServingLocationsPage() {
  const [data, setData] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [filteredLocs, setFilteredLocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  
  const [form, setForm] = useState({ name: '', location_id: '', city_id: '' });
  const [formErrors, setFormErrors] = useState<{ name?: string; location_id?: string; city_id?: string }>({});
  const [formLocations, setFormLocations] = useState<any[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const { page, setPage, limit, total, totalPages, updatePagination } = usePagination(20);

  // Initial data fetch
  useEffect(() => {
    api.get('/masters/cities?active=true&limit=100').then(r => setCities(r.data.data)).catch(() => {});
    api.get('/masters/locations?active=true&limit=500').then(r => setLocations(r.data.data)).catch(() => {});
  }, []);

  // Filter locations by city for the header filters
  useEffect(() => {
    if (filterCity) {
      setFilteredLocs(locations.filter(l => (l.city_id === parseInt(filterCity)) || (l.city?.id === parseInt(filterCity))));
    } else {
      setFilteredLocs(locations);
    }
  }, [filterCity, locations]);

  // Filter locations by city for the modal form
  useEffect(() => {
    if (form.city_id) {
      setFormLocations(locations.filter(l => (l.city_id === parseInt(form.city_id)) || (l.city?.id === parseInt(form.city_id))));
    } else {
      setFormLocations([]);
    }
  }, [form.city_id, locations]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/masters/serving-locations', { 
        params: { page, limit, search, location_id: filterLocation, city_id: filterCity } 
      });
      setData(res.data.data);
      updatePagination(res.data.pagination);
    } catch (e) {
      toast.error('Failed to load serving locations');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filterCity, filterLocation]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const validate = () => {
    const errs: any = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.city_id) errs.city_id = 'City is required';
    if (!form.location_id) errs.location_id = 'Location is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (selected) {
        await api.put(`/masters/serving-locations/${selected.id}`, form);
        toast.success('Updated successfully');
      } else {
        await api.post('/masters/serving-locations', form);
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

  const columns = [
    { key: 'name', label: 'Serving Location' },
    { key: 'location', label: 'Main Location', render: (row: any) => row.location?.name || '-' },
    { key: 'city', label: 'City', render: (row: any) => row.location?.city?.name || '-' },
  ];

  return (
    <AppLayout title="Serving Locations" subtitle="Manage serving location master data">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <Input
              placeholder="Search..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              icon={<Search className="w-4 h-4" />}
              className="w-48"
            />
            <select
              value={filterCity}
              onChange={e => { setFilterCity(e.target.value); setFilterLocation(''); setPage(1); }}
              className="border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Cities</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={filterLocation}
              onChange={e => { setFilterLocation(e.target.value); setPage(1); }}
              className="border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 min-w-[150px]"
            >
              <option value="">All Locations</option>
              {filteredLocs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => setBulkOpen(true)}>Bulk Upload</Button>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { 
                setSelected(null); 
                setForm({ name: '', location_id: '', city_id: '' }); 
                setFormErrors({}); 
                setModalOpen(true); 
              }}>Add New</Button>
          </div>
        </div>

        <MasterTable
          data={data} columns={columns} loading={loading}
          onEdit={(item) => { 
            setSelected(item); 
            setForm({ 
              name: item.name, 
              location_id: item.location_id, 
              city_id: item.location?.city_id || item.location?.city?.id || '' 
            }); 
            setFormErrors({}); 
            setModalOpen(true); 
          }}
          onDelete={(item) => { setSelected(item); setDeleteOpen(true); }}
          page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage}
        />
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setSelected(null); }} title={selected ? 'Edit Serving Location' : 'Add Serving Location'}>
        <div className="space-y-4">
          <div>
            <Select
              label="City *"
              value={form.city_id}
              onChange={e => { setForm(f => ({ ...f, city_id: e.target.value, location_id: '' })); setFormErrors(fe => ({ ...fe, city_id: undefined })); }}
              options={cities.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Select city..."
              error={formErrors.city_id}
            />
          </div>
          <div>
            <Select
              label="Location *"
              value={form.location_id}
              disabled={!form.city_id}
              onChange={e => { setForm(f => ({ ...f, location_id: e.target.value })); setFormErrors(fe => ({ ...fe, location_id: undefined })); }}
              options={formLocations.map(l => ({ value: l.id, label: l.name }))}
              placeholder={form.city_id ? "Select location..." : "Select city first"}
              error={formErrors.location_id}
            />
          </div>
          <div>
            <Input
              label="Serving Location Name *"
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(fe => ({ ...fe, name: undefined })); }}
              placeholder="e.g. Padappai"
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

      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Upload Serving Locations" size="lg">
        <div className="space-y-3">
          <p className="text-xs text-brand-500">
            The CSV must have columns: <code className="bg-brand-100 px-1 rounded">name</code>, <code className="bg-brand-100 px-1 rounded">location_name</code>, and <code className="bg-brand-100 px-1 rounded">city_name</code>.
          </p>
          <BulkUpload
            endpoint="/masters/serving-locations/bulk-upload"
            onComplete={(res) => {
              setBulkOpen(false);
              setBulkResult(res);
              setResultOpen(true);
              fetchData();
            }}
            sampleUrl="/masters/serving-locations/sample-download"
            sampleFileName="sample_serving_locations.xlsx"
            sampleHeaders={SAMPLE_HEADERS}
            sampleRows={SAMPLE_ROWS}
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
          try { await api.delete(`/masters/serving-locations/${selected.id}`); toast.success('Deleted'); setDeleteOpen(false); fetchData(); }
          catch (e) { toast.error('Delete failed'); }
          finally { setDeleting(false); }
        }}
        title="Delete Serving Location"
        message={`Delete "${selected?.name}"? This action cannot be undone.`}
        loading={deleting}
      />
    </AppLayout>
  );
}

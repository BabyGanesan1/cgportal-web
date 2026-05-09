'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../../components/layout/AppLayout';
import api from '../../../lib/api';
import { Pencil, Trash2, Plus, Upload } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import BulkUpload from '../../../components/ui/BulkUpload';
import BulkResult from '../../../components/ui/BulkResult';
import Button from '../../../components/ui/Button';

export default function PaymentSchedulesPage() {
  const [data, setData] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filterProperty, setFilterProperty] = useState('');
  const [filterAlphabet, setFilterAlphabet] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<any>(null);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [resultOpen, setResultOpen] = useState(false);
  
  // Custom Form State
  const [formPropertyId, setFormPropertyId] = useState('');
  const [formUnitAlphabet, setFormUnitAlphabet] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPercentage, setFormPercentage] = useState('');
  const [availableAlphabets, setAvailableAlphabets] = useState<string[]>([]);
  
  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties', { params: { limit: 500 } });
      setProperties(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch properties', err);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (filterProperty) params.property_id = filterProperty;
      if (filterAlphabet) params.unit_alphabet = filterAlphabet;

      const res = await api.get('/payment-schedules', { params });
      setData(res.data.data || []);
      setTotal(res.data.pagination.total);
    } catch (err) {
      console.error('Failed to fetch payment schedules', err);
    } finally {
      setLoading(false);
    }
  }, [page, filterProperty, filterAlphabet]);

  useEffect(() => {
    fetchProperties();
    fetchData();
  }, [fetchData]);

  // Fetch alphabets dynamically when property changes
  useEffect(() => {
    if (formPropertyId) {
      api.get(`/properties/${formPropertyId}/details`, { params: { limit: 1000 } })
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
          console.error('Failed to fetch units for property', err);
          setAvailableAlphabets([]);
        });
    } else {
      setAvailableAlphabets([]);
    }
  }, [formPropertyId]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment schedule?')) return;
    try {
      await api.delete(`/payment-schedules/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete payment schedule');
    }
  };

  const openAddModal = () => {
    setCurrentEdit(null);
    setFormPropertyId('');
    setFormUnitAlphabet('');
    setFormDesc('');
    setFormPercentage('');
    setAvailableAlphabets([]);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setCurrentEdit(item);
    setFormPropertyId(item.property_id?.toString() || '');
    setFormUnitAlphabet(item.unit_alphabet || '');
    setFormDesc(item.description || '');
    setFormPercentage(item.percentage?.toString() || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedProp = properties.find(p => p.id.toString() === formPropertyId);
    if (!formPropertyId || !formDesc || !formPercentage) {
      alert('Please fill out all required fields.');
      return;
    }
    
    const payload = {
      property_id: parseInt(formPropertyId),
      unit_alphabet: formUnitAlphabet,
      description: formDesc,
      percentage: parseFloat(formPercentage),
      is_active: true
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
      const errMsg = err.response?.data?.message || 'Failed to save schedule';
      alert(errMsg);
    }
  };

  return (
    <AppLayout title="Payment Schedules">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        {/* Filter Section */}
        <div className="flex flex-wrap gap-4 items-center">
          <select 
            className="border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent min-w-[200px]"
            value={filterProperty}
            onChange={e => { setFilterProperty(e.target.value); setPage(1); }}
          >
            <option value="">All Properties...</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.project_name} (ID: {p.id})</option>
            ))}
          </select>
          <input 
            type="text"
            placeholder="Unit Alphabet (e.g., A)"
            className="border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent w-48"
            value={filterAlphabet}
            onChange={e => { setFilterAlphabet(e.target.value); setPage(1); }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-semibold transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </button>
          <button 
            onClick={openAddModal}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Schedule
          </button>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4 text-center">Alphabet</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">% Value</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No schedules found</td></tr>
              ) : (
                data.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">{item.id}</td>
                    <td className="px-6 py-4 font-medium">{item.propertyData?.project_name || item.property_id}</td>
                    <td className="px-6 py-4 font-bold text-center">
                      {item.unit_alphabet ? (
                        <span className="bg-brand-100 text-brand-800 px-3 py-1 rounded inline-block">{item.unit_alphabet}</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded inline-block">Project Wide</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{item.description}</td>
                    <td className="px-6 py-4 font-bold text-brand-600">{item.percentage}%</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-3">
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
        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 flex justify-between items-center text-sm text-slate-600">
          <div>
            Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total} entries
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 10 >= total}
              className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <Modal 
          open={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={currentEdit ? 'Edit Payment Schedule' : 'Add Payment Schedule'}
        >
          <form onSubmit={handleSubmit} className="p-1 space-y-5">
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">Property</label>
              <select 
                className="w-full border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                value={formPropertyId}
                onChange={(e) => setFormPropertyId(e.target.value)}
                required
              >
                <option value="" disabled>Select a property...</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.id} - {p.project_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">
                Unit Alphabet <span className="text-xs text-brand-400 font-normal ml-1">(Optional / Project Wide)</span>
              </label>
              <select 
                className="w-full border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-50 disabled:text-brand-400"
                value={formUnitAlphabet}
                onChange={(e) => setFormUnitAlphabet(e.target.value)}
                required={false}
                disabled={!formPropertyId}
              >
                <option value="">Project Wide (All Units)</option>
                {availableAlphabets.map(alpha => (
                  <option key={alpha} value={alpha}>{alpha}</option>
                ))}
              </select>
              {!formPropertyId && <p className="text-xs text-brand-400 mt-1">Select a property first to view available alphabets.</p>}
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
                min="0"
                max="100"
                className="w-full border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="10"
                value={formPercentage}
                onChange={(e) => setFormPercentage(e.target.value)}
                required
              />
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
                {currentEdit ? 'Update Schedule' : 'Create Schedule'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bulk Upload Modal */}
      {isBulkOpen && (
        <Modal 
          open={isBulkOpen} 
          onClose={() => setIsBulkOpen(false)} 
          title="Bulk Upload Payment Schedules" 
          size="lg"
        >
          <BulkUpload
            endpoint="/payment-schedules/bulk-upload"
            onComplete={(res) => {
              setIsBulkOpen(false);
              setBulkResult(res);
              setResultOpen(true);
              fetchData();
            }}
            sampleUrl="/payment-schedules/sample-download"
            sampleFileName="payment_schedule_sample.xlsx"
          />
        </Modal>
      )}

      {/* Upload Result Modal */}
      {resultOpen && (
        <Modal open={resultOpen} onClose={() => setResultOpen(false)} title="Upload Result" size="2xl">
          <BulkResult result={bulkResult} />
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setResultOpen(false)}>Close Summary</Button>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}

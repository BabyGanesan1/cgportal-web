'use client';
import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import AppLayout from '../../../../../components/layout/AppLayout';
import CheckingForm from '../../../_components/CheckingForm';
import api from '../../../../../lib/api';
import toast from 'react-hot-toast';

const DATE_FIELDS = ['login_counter_date'];

function toDateStr(val: any): string {
  if (!val) return '';
  try { return format(new Date(val), 'yyyy-MM-dd'); } catch { return ''; }
}

export default function CheckingEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [initialValues, setInitialValues] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/fls-booking/${id}`)
      .then(res => {
        const d = { ...res.data.data };
        DATE_FIELDS.forEach(f => { d[f] = toDateStr(d[f]); });
        setInitialValues(d);
      })
      .catch(() => {
        toast.error('Failed to load record');
        router.push('/fls-booking-portal/checking');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: any) => {
    setSaving(true);
    try {
      await api.put(`/fls-booking/${id}`, data);
      toast.success('Record updated successfully');
      router.push('/fls-booking-portal/checking');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Edit Checking Record" subtitle="Update FLS checking record">
      <div className="mb-4">
        <button onClick={() => router.push('/fls-booking-portal/checking')}
          className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Checking List
        </button>
      </div>
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">
          Loading record...
        </div>
      ) : (
        <CheckingForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          saving={saving}
          onCancel={() => router.push('/fls-booking-portal/checking')}
        />
      )}
    </AppLayout>
  );
}

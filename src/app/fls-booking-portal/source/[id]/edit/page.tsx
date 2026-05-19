'use client';
import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import AppLayout from '../../../../../components/layout/AppLayout';
import SourceForm from '../../../_components/SourceForm';
import api from '../../../../../lib/api';
import toast from 'react-hot-toast';

const DATE_FIELDS = [
  'pushed_date', 'iden_date',
  'pushed_date_lead1', 'sf_lead1_walkin_date',
  'pushed_date_lead2', 'sf_lead2_walkin_date',
  'pushed_date_lead3', 'sf_lead3_walkin_date',
  'walk_in_date',
];

function toDateStr(val: any): string {
  if (!val) return '';
  try { return format(new Date(val), 'yyyy-MM-dd'); } catch { return ''; }
}

export default function SourceEditPage() {
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
        router.push('/fls-booking-portal/source');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: any) => {
    setSaving(true);
    try {
      await api.put(`/fls-booking/${id}`, data);
      toast.success('Source record updated successfully');
      router.push('/fls-booking-portal/source');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Edit Source Record" subtitle="Update FLS source / lead record">
      <div className="mb-4">
        <button onClick={() => router.push('/fls-booking-portal/source')}
          className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Source List
        </button>
      </div>
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">
          Loading record...
        </div>
      ) : (
        <SourceForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          saving={saving}
          onCancel={() => router.push('/fls-booking-portal/source')}
        />
      )}
    </AppLayout>
  );
}

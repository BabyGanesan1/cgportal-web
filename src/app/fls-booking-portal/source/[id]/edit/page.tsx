'use client';
import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import FlsLayout from '../../../_components/FlsLayout';
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
    <FlsLayout title="Edit Source Record" subtitle="Update FLS source / lead record">
      <div className="mb-4">
        <button onClick={() => router.push('/fls-booking-portal/source')}
          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Source List
        </button>
      </div>
      {loading ? (
        <div className="bg-white rounded-xl border border-brand-100 shadow-sm p-12 text-center text-brand-500">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            Loading record...
          </div>
        </div>
      ) : (
        <SourceForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          saving={saving}
          onCancel={() => router.push('/fls-booking-portal/source')}
        />
      )}
    </FlsLayout>
  );
}

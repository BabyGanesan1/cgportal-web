'use client';
import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import AppLayout from '../../../../../components/layout/AppLayout';
import BookingForm from '../../../_components/BookingForm';
import api from '../../../../../lib/api';
import toast from 'react-hot-toast';

const DATE_FIELDS = [
  'booking_form_date', 'login_counter_date', 'bf_received_date', 'hold_date',
  'file_transfer_date', 'lbc_date', 'pdc_date', 'cheque_date',
  'sent_for_cit_verification_date', 'verified_date',
];

function toDateStr(val: any): string {
  if (!val) return '';
  try { return format(new Date(val), 'yyyy-MM-dd'); } catch { return ''; }
}

export default function BookingEditPage() {
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
        router.push('/fls-booking-portal/booking');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: any) => {
    setSaving(true);
    try {
      await api.put(`/fls-booking/${id}`, data);
      toast.success('Booking updated successfully');
      router.push('/fls-booking-portal/booking');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update booking');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Edit Booking" subtitle="Update FLS booking record">
      <div className="mb-4">
        <button onClick={() => router.push('/fls-booking-portal/booking')}
          className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Booking List
        </button>
      </div>
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">
          Loading record...
        </div>
      ) : (
        <BookingForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          saving={saving}
          onCancel={() => router.push('/fls-booking-portal/booking')}
        />
      )}
    </AppLayout>
  );
}

'use client';
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FlsLayout from '../../_components/FlsLayout';
import CheckingForm from '../../_components/CheckingForm';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';

export default function CheckingAddPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (data: any) => {
    setSaving(true);
    try {
      await api.post('/fls-booking', data);
      toast.success('Record created successfully');
      router.push('/fls-booking-portal/checking');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FlsLayout title="Add Checking Record" subtitle="Create a new FLS checking record">
      <div className="mb-4">
        <button onClick={() => router.push('/fls-booking-portal/checking')}
          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Checking List
        </button>
      </div>
      <CheckingForm
        onSubmit={handleSubmit}
        saving={saving}
        onCancel={() => router.push('/fls-booking-portal/checking')}
      />
    </FlsLayout>
  );
}

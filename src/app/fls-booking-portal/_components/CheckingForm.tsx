'use client';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

const INPUT_CLS = 'w-full border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 placeholder-brand-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent';
const DISABLED_CLS = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50 cursor-not-allowed';
const LABEL_CLS = 'block text-xs font-medium text-brand-700 mb-1';
const SECTION_CLS = 'col-span-1 md:col-span-2 lg:col-span-4 pt-4 border-t border-gray-100 first:pt-0 first:border-t-0';
const FULL_CLS = 'col-span-1 md:col-span-2 lg:col-span-4';

// Only these fields are sent to the API on checking update
const CHECKING_FIELDS = [
  'net_sales', 'gross_sales', 'msp', 'taken_price', 'discount',
  'upfront_details', 'checking_verify_status', 'remarks',
];

interface Props {
  initialValues?: any;
  onSubmit: (data: any) => Promise<void>;
  saving: boolean;
  onCancel: () => void;
}

export default function CheckingForm({ initialValues, onSubmit, saving, onCancel }: Props) {
  const { register, handleSubmit, reset, watch } = useForm({ defaultValues: initialValues || {} });
  const verifyStatus = watch('checking_verify_status');

  useEffect(() => {
    if (initialValues) reset(initialValues);
  }, [initialValues]);

  const submit = async (data: any) => {
    const clean: any = {};
    CHECKING_FIELDS.forEach(k => {
      clean[k] = data[k] === '' ? null : (data[k] ?? null);
    });
    await onSubmit(clean);
  };

  const section = (title: string, subtitle?: string) => (
    <div className={SECTION_CLS}>
      <h3 className="text-xs font-semibold text-green-600 uppercase tracking-wider">
        {title}{subtitle && <span className="ml-2 font-normal text-gray-400 normal-case">{subtitle}</span>}
      </h3>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(submit)}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">

          {section('Identification', '(read only — set during booking)')}
          <div>
            <label className={LABEL_CLS}>Project</label>
            <input {...register('project')} disabled className={DISABLED_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Unit No</label>
            <input {...register('unit_no')} disabled className={DISABLED_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Customer Name</label>
            <input {...register('name')} disabled className={DISABLED_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>FLS ID</label>
            <input {...register('fls_id')} disabled className={DISABLED_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>FLS Name</label>
            <input {...register('fls_name')} disabled className={DISABLED_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Login Counter Date</label>
            <input value={initialValues?.login_counter_date || ''} disabled className={DISABLED_CLS} />
          </div>

          {section('Sales Figures')}
          <div>
            <label className={LABEL_CLS}>Net Sales</label>
            <input {...register('net_sales')} className={INPUT_CLS} placeholder="Net Sales" />
          </div>
          <div>
            <label className={LABEL_CLS}>Gross Sales</label>
            <input {...register('gross_sales')} className={INPUT_CLS} placeholder="Gross Sales" />
          </div>
          <div>
            <label className={LABEL_CLS}>MSP</label>
            <input {...register('msp')} type="number" step="any" className={INPUT_CLS} placeholder="MSP" />
          </div>
          <div>
            <label className={LABEL_CLS}>Taken Price</label>
            <input {...register('taken_price')} type="number" step="any" className={INPUT_CLS} placeholder="Taken Price" />
          </div>
          <div>
            <label className={LABEL_CLS}>Discount</label>
            <input {...register('discount')} type="number" step="any" className={INPUT_CLS} placeholder="Discount" />
          </div>

          {section('Upfront & Verification')}
          <div className={FULL_CLS}>
            <label className={LABEL_CLS}>Upfront Details</label>
            <textarea {...register('upfront_details')} rows={2} className={INPUT_CLS + ' resize-none'} placeholder="Upfront Details" />
          </div>

          <div>
            <label className={LABEL_CLS}>Verify Status</label>
            <select {...register('checking_verify_status')} className={INPUT_CLS}>
              <option value="">Select Status</option>
              <option value="hold">Hold</option>
              <option value="verified">Verified</option>
            </select>
          </div>

          {verifyStatus === 'hold' && (
            <div className={FULL_CLS}>
              <label className={LABEL_CLS}>Remarks <span className="text-red-400">*</span></label>
              <textarea {...register('remarks')} rows={2} className={INPUT_CLS + ' resize-none'} placeholder="Remarks (required for Hold)" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button type="button" onClick={onCancel}
          className="px-5 py-2 text-sm text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-6 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-60 transition-colors">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

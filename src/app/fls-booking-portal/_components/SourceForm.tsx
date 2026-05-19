'use client';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import DatePicker from '../../../components/ui/DatePicker';

const INPUT_CLS = 'w-full border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 placeholder-brand-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent';
const DISABLED_CLS = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50 cursor-not-allowed';
const LABEL_CLS = 'block text-xs font-medium text-brand-700 mb-1';
const SECTION_CLS = 'col-span-1 md:col-span-2 lg:col-span-4 pt-4 border-t border-gray-100 first:pt-0 first:border-t-0';
const FULL_CLS = 'col-span-1 md:col-span-2 lg:col-span-4';
const HALF_CLS = 'col-span-1 md:col-span-2';

// Only these fields are sent to the API on source update
const SOURCE_FIELDS = [
  'source_taken_lead', 'pushed_date', 'source', 'sub_source', 'iden_date',
  'sf_lead_id1', 'sf_lead1_clone', 'sf_lead_id1_owner', 'pushed_date_lead1', 'sf_lead1_walkin_date', 'walkin_project_lead1',
  'sf_lead2', 'sf_lead2_clone', 'sf_lead_id2_owner', 'pushed_date_lead2', 'sf_lead2_walkin_date', 'walkin_project_lead2',
  'sf_lead3', 'sf_lead3_clone', 'sf_lead_id3_owner', 'pushed_date_lead3', 'sf_lead3_walkin_date', 'walkin_project_lead3',
  'sell_do_lead1', 'sell_do_lead2', 'sell_do_lead3',
  'walk_in_date', 'lead_remarks', 'source_verify_status',
];

interface Props {
  initialValues?: any;
  onSubmit: (data: any) => Promise<void>;
  saving: boolean;
  onCancel: () => void;
}

export default function SourceForm({ initialValues, onSubmit, saving, onCancel }: Props) {
  const { register, control, handleSubmit, reset, watch } = useForm({ defaultValues: initialValues || {} });
  const verifyStatus = watch('source_verify_status');

  useEffect(() => {
    if (initialValues) reset(initialValues);
  }, [initialValues]);

  const submit = async (data: any) => {
    const clean: any = {};
    SOURCE_FIELDS.forEach(k => {
      clean[k] = data[k] === '' ? null : (data[k] ?? null);
    });
    await onSubmit(clean);
  };

  const dateField = (name: string, label: string, cls = '') => (
    <div key={name} className={cls}>
      <Controller control={control} name={name}
        render={({ field }) => <DatePicker label={label} value={field.value || ''} onChange={field.onChange} />}
      />
    </div>
  );

  const textField = (name: string, label: string, cls = '') => (
    <div key={name} className={cls}>
      <label className={LABEL_CLS}>{label}</label>
      <input {...register(name)} type="text" className={INPUT_CLS} placeholder={label} />
    </div>
  );

  const section = (title: string, subtitle?: string) => (
    <div className={SECTION_CLS}>
      <h3 className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
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

          {section('Source Details')}
          {textField('source_taken_lead', 'Source Taken Lead')}
          {dateField('pushed_date', 'Pushed Date')}
          {textField('source', 'Source')}
          {textField('sub_source', 'Sub Source')}
          {dateField('iden_date', 'Iden Date')}

          {section('SF Lead 1')}
          {textField('sf_lead_id1', 'SF Lead ID 1')}
          {textField('sf_lead1_clone', 'SF Lead 1 Clone')}
          {textField('sf_lead_id1_owner', 'SF Lead ID 1 Owner')}
          {dateField('pushed_date_lead1', 'Pushed Date (Lead 1)')}
          {dateField('sf_lead1_walkin_date', 'SF Lead 1 Walk-in Date')}
          {textField('walkin_project_lead1', 'Walk-in Project (Lead 1)')}

          {section('SF Lead 2')}
          {textField('sf_lead2', 'SF Lead 2')}
          {textField('sf_lead2_clone', 'SF Lead 2 Clone')}
          {textField('sf_lead_id2_owner', 'SF Lead ID 2 Owner')}
          {dateField('pushed_date_lead2', 'Pushed Date (Lead 2)')}
          {dateField('sf_lead2_walkin_date', 'SF Lead 2 Walk-in Date')}
          {textField('walkin_project_lead2', 'Walk-in Project (Lead 2)')}

          {section('SF Lead 3')}
          {textField('sf_lead3', 'SF Lead 3')}
          {textField('sf_lead3_clone', 'SF Lead 3 Clone')}
          {textField('sf_lead_id3_owner', 'SF Lead ID 3 Owner')}
          {dateField('pushed_date_lead3', 'Pushed Date (Lead 3)')}
          {dateField('sf_lead3_walkin_date', 'SF Lead 3 Walk-in Date')}
          {textField('walkin_project_lead3', 'Walk-in Project (Lead 3)')}

          {section('Sell Do Leads')}
          {textField('sell_do_lead1', 'Sell Do Lead 1')}
          {textField('sell_do_lead2', 'Sell Do Lead 2')}
          {textField('sell_do_lead3', 'Sell Do Lead 3')}

          {section('Walk-in & Verification')}
          {dateField('walk_in_date', 'Walk In Date')}
          <div className={HALF_CLS}>
            <label className={LABEL_CLS}>Lead Remarks</label>
            <textarea {...register('lead_remarks')} rows={2} className={INPUT_CLS + ' resize-none'} placeholder="Lead Remarks" />
          </div>

          <div>
            <label className={LABEL_CLS}>Verify Status</label>
            <select {...register('source_verify_status')} className={INPUT_CLS}>
              <option value="">Select Status</option>
              <option value="hold">Hold</option>
              <option value="verified">Verified</option>
            </select>
          </div>

          {verifyStatus === 'hold' && (
            <div className={FULL_CLS}>
              <label className={LABEL_CLS}>Lead Remarks <span className="text-red-400">*</span></label>
              <textarea {...register('lead_remarks')} rows={2} className={INPUT_CLS + ' resize-none'} placeholder="Lead Remarks (required for Hold)" />
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
          className="px-6 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-60 transition-colors">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

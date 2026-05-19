'use client';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import DatePicker from '../../../components/ui/DatePicker';

const INPUT_CLS = 'w-full border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 placeholder-brand-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent';
const LABEL_CLS = 'block text-xs font-medium text-brand-700 mb-1';
const SECTION_CLS = 'col-span-1 md:col-span-2 lg:col-span-4 pt-4 border-t border-gray-100 first:pt-0 first:border-t-0';
const FULL_CLS = 'col-span-1 md:col-span-2 lg:col-span-4';
const HALF_CLS = 'col-span-1 md:col-span-2';

interface Props {
  initialValues?: any;
  onSubmit: (data: any) => Promise<void>;
  saving: boolean;
  onCancel: () => void;
}

export default function BookingForm({ initialValues, onSubmit, saving, onCancel }: Props) {
  const { register, control, handleSubmit, reset } = useForm({ defaultValues: initialValues || {} });

  useEffect(() => {
    if (initialValues) reset(initialValues);
  }, [initialValues]);

  const submit = async (data: any) => {
    const clean: any = {};
    Object.entries(data).forEach(([k, v]) => { clean[k] = v === '' ? null : v; });
    await onSubmit(clean);
  };

  const dateField = (name: string, label: string, cls = '') => (
    <div key={name} className={cls}>
      <Controller control={control} name={name}
        render={({ field }) => <DatePicker label={label} value={field.value || ''} onChange={field.onChange} />}
      />
    </div>
  );

  const textField = (name: string, label: string, type = 'text', cls = '') => (
    <div key={name} className={cls}>
      <label className={LABEL_CLS}>{label}</label>
      <input {...register(name)} type={type} step={type === 'number' ? 'any' : undefined} className={INPUT_CLS} placeholder={label} />
    </div>
  );

  const areaField = (name: string, label: string, cls = FULL_CLS) => (
    <div key={name} className={cls}>
      <label className={LABEL_CLS}>{label}</label>
      <textarea {...register(name)} rows={2} className={INPUT_CLS + ' resize-none'} placeholder={label} />
    </div>
  );

  const section = (title: string) => (
    <div className={SECTION_CLS}>
      <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{title}</h3>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(submit)}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">

          {section('Project & Unit Info')}
          {textField('project', 'Project')}
          {textField('region', 'Region')}
          {textField('stock', 'Stock')}
          {textField('pl_team', 'P & L Team')}
          {textField('type', 'Type')}
          {textField('con', 'CON')}
          {textField('unit_no', 'Unit No')}
          {textField('name', 'Customer Name')}
          {areaField('swap_from_unit_details', 'Swap From Unit Details')}

          {section('Dates & Values')}
          {dateField('booking_form_date', 'Booking Form Date')}
          {dateField('login_counter_date', 'Login Counter Date')}
          {textField('values_amount', 'Values', 'number')}
          {textField('rs_in_crs', 'Rs in Crs', 'number')}
          {textField('net_sales', 'Net Sales')}
          {textField('gross_sales', 'Gross Sales')}
          {textField('booking_form_status', 'Booking Form Status')}
          {textField('form_type', 'Form Type')}

          {section('Booking Form Details')}
          {dateField('bf_received_date', 'BF Received Date')}
          {textField('booking_form_received_by_whom', 'BF Received By Whom')}
          {dateField('hold_date', 'Hold Date')}
          {dateField('file_transfer_date', 'File Transfer Date')}
          {areaField('file_transfer_details', 'File Transfer Details')}
          {dateField('lbc_date', 'LBC Date')}

          {section('FLS & Manager Info')}
          {textField('fls_id', 'FLS ID')}
          {textField('fls_name', 'FLS Name')}
          {textField('mgr_id', 'Manager ID')}
          {textField('mgr_name', 'Manager Name')}
          {textField('avp_id', 'AVP ID')}
          {textField('avp_name', 'AVP Name')}
          {textField('scheme', 'Scheme')}
          {textField('customer_mail', 'Customer Mail', 'email')}

          {section('PDC Details')}
          {textField('pdc_status', 'PDC Status')}
          {textField('pdc_cheque_received', 'PDC Cheque Received')}
          {textField('pdc_amount', 'PDC Amount', 'number')}
          {dateField('pdc_date', 'PDC Date')}
          {textField('pdc_cheque_no', 'PDC Cheque No')}
          {textField('bank_name_pdc', 'Bank Name (PDC)')}

          {section('Payment Details')}
          {textField('payment_mode', 'Payment Mode')}
          {textField('booking_amount', 'Booking Amount', 'number')}
          {dateField('cheque_date', 'Cheque Date')}
          {textField('cheque_no', 'Cheque No')}
          {textField('bank_name', 'Bank Name')}
          {areaField('payment_confirmation_with_confirmed_date', 'Payment Confirmation with Date', HALF_CLS)}

          {section('CIT Verification')}
          {dateField('sent_for_cit_verification_date', 'Sent for CIT Verification Date')}
          {textField('sf_record_id', 'SF Record ID')}
          {textField('status_of_cit_verification', 'Status of CIT Verification')}
          {textField('verified_by_whom', 'Verified By Whom')}
          {dateField('verified_date', 'Verified Date')}

          {section('Contact Info')}
          {textField('phone_number_1', 'Phone Number 1')}
          {textField('phone_number_2', 'Phone Number 2')}
          {textField('phone_number_3', 'Phone Number 3')}
          {textField('phone_number_4', 'Phone Number 4')}
          {textField('mail_id_1', 'Mail ID 1', 'email')}
          {textField('mail_id_2', 'Mail ID 2', 'email')}
          {textField('mail_id_3', 'Mail ID 3', 'email')}
          {textField('mail_id_4', 'Mail ID 4', 'email')}

          {section('Remarks')}
          {areaField('remarks', 'Remarks')}
          {areaField('login_before_cancel_remarks', 'Login Before Cancel / Relogin Remarks')}
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button type="button" onClick={onCancel}
          className="px-5 py-2 text-sm text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-60 transition-colors">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

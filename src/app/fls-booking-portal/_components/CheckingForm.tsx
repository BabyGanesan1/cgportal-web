'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, Download, FileText } from 'lucide-react';
import api from '../../../lib/api';

const INPUT = 'w-full bg-white border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 placeholder-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors';
const DISABLED = 'w-full bg-brand-50 border border-brand-100 rounded-lg px-3 py-2 text-sm text-brand-400 cursor-not-allowed';
const LABEL = 'block text-xs font-medium text-brand-700 mb-1';
const SEC = 'col-span-1 md:col-span-2 lg:col-span-4 pt-4 mt-1 border-t border-brand-100 first:pt-0 first:mt-0 first:border-t-0';
const FULL = 'col-span-1 md:col-span-2 lg:col-span-4';
const HALF = 'col-span-1 md:col-span-2';

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
  const [attachedFiles, setAttachedFiles] = useState<{name: string; path: string; size: number}[]>([]);
  const verifyStatus = watch('checking_verify_status');

  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
      if (initialValues.attachments) {
        try { setAttachedFiles(JSON.parse(initialValues.attachments)); } catch {}
      }
    }
  }, [initialValues]);

  const submit = async (data: any) => {
    const clean: any = {};
    CHECKING_FIELDS.forEach(k => { clean[k] = data[k] === '' ? null : (data[k] ?? null); });
    await onSubmit(clean);
  };

  const sec = (title: string, subtitle?: string) => (
    <div className={SEC}>
      <h3 className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
        {title}{subtitle && <span className="ml-2 font-normal text-brand-400 normal-case">{subtitle}</span>}
      </h3>
    </div>
  );

  const dis = (name: string, label: string, cls = '') => (
    <div key={name} className={cls}>
      <label className={LABEL}>{label}</label>
      <input {...register(name)} disabled className={DISABLED} />
    </div>
  );

  const disArea = (name: string, label: string, cls = FULL) => (
    <div key={name} className={cls}>
      <label className={LABEL}>{label}</label>
      <textarea {...register(name)} rows={2} disabled className={DISABLED + ' resize-none'} />
    </div>
  );

  return (
    <form onSubmit={handleSubmit(submit)}>
      <div className="bg-white rounded-xl border border-brand-100 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">

          {sec('Identification', '(read only — set during booking)')}
          <div>
            <label className={LABEL}>Project</label>
            <input {...register('project')} disabled className={DISABLED} />
          </div>
          <div>
            <label className={LABEL}>Unit No</label>
            <input {...register('unit_no')} disabled className={DISABLED} />
          </div>
          <div>
            <label className={LABEL}>Customer Name</label>
            <input {...register('name')} disabled className={DISABLED} />
          </div>
          <div>
            <label className={LABEL}>FLS ID</label>
            <input {...register('fls_id')} disabled className={DISABLED} />
          </div>
          <div>
            <label className={LABEL}>FLS Name</label>
            <input {...register('fls_name')} disabled className={DISABLED} />
          </div>
          <div>
            <label className={LABEL}>Login Counter Date</label>
            <input value={initialValues?.login_counter_date || ''} disabled className={DISABLED} />
          </div>

          {sec('Sales Figures')}
          <div>
            <label className={LABEL}>Net Sales</label>
            <input {...register('net_sales')} className={INPUT} placeholder="Net Sales" />
          </div>
          <div>
            <label className={LABEL}>Gross Sales</label>
            <input {...register('gross_sales')} className={INPUT} placeholder="Gross Sales" />
          </div>
          <div>
            <label className={LABEL}>MSP</label>
            <input {...register('msp')} type="number" step="any" className={INPUT} placeholder="MSP" />
          </div>
          <div>
            <label className={LABEL}>Taken Price</label>
            <input {...register('taken_price')} type="number" step="any" className={INPUT} placeholder="Taken Price" />
          </div>
          <div>
            <label className={LABEL}>Discount</label>
            <input {...register('discount')} type="number" step="any" className={INPUT} placeholder="Discount" />
          </div>

          {sec('Upfront & Verification')}
          <div className={FULL}>
            <label className={LABEL}>Upfront Details</label>
            <textarea {...register('upfront_details')} rows={2} className={INPUT + ' resize-none'} placeholder="Upfront Details" />
          </div>

          <div>
            <label className={LABEL}>Verify Status</label>
            <select {...register('checking_verify_status')} className={INPUT}>
              <option value="">Select Status</option>
              <option value="hold">Hold</option>
              <option value="verified">Verified</option>
            </select>
          </div>

          {verifyStatus === 'hold' && (
            <div className={FULL}>
              <label className={LABEL}>Remarks <span className="text-red-400">*</span></label>
              <textarea {...register('remarks')} rows={2} className={INPUT + ' resize-none'} placeholder="Remarks (required for Hold)" />
            </div>
          )}

          {sec('Booking Info', '(read only)')}
          {dis('region', 'Region')}
          {dis('stock', 'Stock')}
          {dis('pl_team', 'P & L Team')}
          {dis('type', 'Type')}
          {dis('con', 'CON')}
          {disArea('swap_from_unit_details', 'Swap From Unit Details')}

          {sec('Booking Dates & Values', '(read only)')}
          {dis('booking_form_date', 'Booking Form Date')}
          {dis('values_amount', 'Values')}
          {dis('rs_in_crs', 'Rs in Crs')}
          {dis('booking_form_status', 'Booking Form Status')}
          {dis('form_type', 'Form Type')}

          {sec('Booking Form Details', '(read only)')}
          {dis('bf_received_date', 'BF Received Date')}
          {dis('booking_form_received_by_whom', 'BF Received By Whom')}
          {dis('hold_date', 'Hold Date')}
          {dis('file_transfer_date', 'File Transfer Date')}
          {disArea('file_transfer_details', 'File Transfer Details')}
          {dis('lbc_date', 'LBC Date')}

          {sec('FLS & Manager Info', '(read only)')}
          {dis('fls_id', 'FLS ID')}
          {dis('fls_name', 'FLS Name')}
          {dis('mgr_id', 'Manager ID')}
          {dis('mgr_name', 'Manager Name')}
          {dis('avp_id', 'AVP ID')}
          {dis('avp_name', 'AVP Name')}
          {dis('scheme', 'Scheme')}
          {dis('customer_mail', 'Customer Mail')}

          {sec('PDC Details', '(read only)')}
          {dis('pdc_status', 'PDC Status')}
          {dis('pdc_cheque_received', 'PDC Cheque Received')}
          {dis('pdc_amount', 'PDC Amount')}
          {dis('pdc_date', 'PDC Date')}
          {dis('pdc_cheque_no', 'PDC Cheque No')}
          {dis('bank_name_pdc', 'Bank Name (PDC)')}

          {sec('Payment Details', '(read only)')}
          {dis('payment_mode', 'Payment Mode')}
          {dis('booking_amount', 'Booking Amount')}
          {dis('cheque_date', 'Cheque Date')}
          {dis('cheque_no', 'Cheque No')}
          {dis('bank_name', 'Bank Name')}
          {disArea('payment_confirmation_with_confirmed_date', 'Payment Confirmation with Date', HALF)}

          {sec('CIT Verification', '(read only)')}
          {dis('sent_for_cit_verification_date', 'Sent for CIT Verification Date')}
          {dis('sf_record_id', 'SF Record ID')}
          {dis('status_of_cit_verification', 'Status of CIT Verification')}
          {dis('verified_by_whom', 'Verified By Whom')}
          {dis('verified_date', 'Verified Date')}

          {sec('Contact Info', '(read only)')}
          {dis('phone_number_1', 'Phone Number 1')}
          {dis('phone_number_2', 'Phone Number 2')}
          {dis('phone_number_3', 'Phone Number 3')}
          {dis('phone_number_4', 'Phone Number 4')}
          {dis('mail_id_1', 'Mail ID 1')}
          {dis('mail_id_2', 'Mail ID 2')}
          {dis('mail_id_3', 'Mail ID 3')}
          {dis('mail_id_4', 'Mail ID 4')}

          {sec('Booking Remarks', '(read only)')}
          {disArea('login_before_cancel_remarks', 'Login Before Cancel / Relogin Remarks')}
          {disArea('description', 'Description')}

          {attachedFiles.length > 0 && (
            <>
              {sec('Attachments', '(read only)')}
              <div className={FULL}>
                <div className="space-y-2">
                  {attachedFiles.map((file, idx) => {
                    const fileUrl = `${api.defaults.baseURL}${file.path}`;
                    const isPdf = file.name.toLowerCase().endsWith('.pdf');
                    const isImage = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file.name);
                    const iconColor = isPdf ? 'text-red-400' : isImage ? 'text-emerald-400' : 'text-blue-400';
                    return (
                      <div key={idx} className="flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                          <FileText className={`w-4 h-4 ${iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-brand-800 truncate font-medium">{file.name}</p>
                          <p className="text-xs text-brand-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-md text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                            title="View">
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                          <a href={fileUrl} download={file.name}
                            className="p-1.5 rounded-md text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                            title="Download">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button type="button" onClick={onCancel}
          className="px-5 py-2 text-sm text-brand-700 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-6 py-2 text-sm font-medium bg-brand-800 hover:bg-brand-900 text-white rounded-lg disabled:opacity-60 transition-colors">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

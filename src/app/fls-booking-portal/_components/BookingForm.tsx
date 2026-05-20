'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Upload, FileText, Eye, Download } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import DarkDatePicker from './DarkDatePicker';

const INPUT = 'w-full bg-white border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 placeholder-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors';
const DISABLED = 'w-full bg-brand-50 border border-brand-100 rounded-lg px-3 py-2 text-sm text-brand-400 cursor-not-allowed';
const LABEL = 'block text-xs font-medium text-brand-700 mb-1';
const SEC = 'col-span-1 md:col-span-2 lg:col-span-4 pt-4 mt-1 border-t border-brand-100 first:pt-0 first:mt-0 first:border-t-0';
const FULL = 'col-span-1 md:col-span-2 lg:col-span-4';
const HALF = 'col-span-1 md:col-span-2';

interface FileEntry { name: string; path: string; size: number }

interface Props {
  initialValues?: any;
  onSubmit: (data: any) => Promise<void>;
  saving: boolean;
  onCancel: () => void;
}

export default function BookingForm({ initialValues, onSubmit, saving, onCancel }: Props) {
  const { register, handleSubmit, reset, watch, setValue } = useForm({ defaultValues: initialValues || {} });
  const [attachedFiles, setAttachedFiles] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
      if (initialValues.attachments) {
        try { setAttachedFiles(JSON.parse(initialValues.attachments)); } catch {}
      }
    }
  }, [initialValues]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach(f => fd.append('files', f));
      const res = await api.post('/fls-booking/upload', fd);
      setAttachedFiles(prev => [...prev, ...(res.data.data || [])]);
      toast.success(`${files.length} file(s) uploaded`);
    } catch {
      toast.error('File upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const submit = async (data: any) => {
    const clean: any = {};
    Object.entries(data).forEach(([k, v]) => { clean[k] = v === '' ? null : v; });
    clean.attachments = attachedFiles.length ? JSON.stringify(attachedFiles) : null;
    await onSubmit(clean);
  };

  const f = (name: string, label: string, type = 'text', cls = '') => (
    <div key={name} className={cls}>
      <label className={LABEL}>{label}</label>
      <input {...register(name)} type={type} step={type === 'number' ? 'any' : undefined} className={INPUT} placeholder={label} />
    </div>
  );

  const fd = (name: string, label: string, cls = '') => (
    <div key={name} className={cls}>
      <label className={LABEL}>{label}</label>
      <DarkDatePicker
        value={watch(name) || ''}
        onChange={v => setValue(name, v, { shouldDirty: true })}
        placeholder={label}
        accent="blue"
      />
    </div>
  );

  const fa = (name: string, label: string, cls = FULL) => (
    <div key={name} className={cls}>
      <label className={LABEL}>{label}</label>
      <textarea {...register(name)} rows={2} className={INPUT + ' resize-none'} placeholder={label} />
    </div>
  );

  const sec = (title: string) => (
    <div className={SEC}>
      <h3 className="text-xs font-semibold text-brand-700 uppercase tracking-wider">{title}</h3>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(submit)}>
      <div className="bg-white rounded-xl border border-brand-100 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">

          {sec('Project & Unit Info')}
          {f('project', 'Project')}
          {f('region', 'Region')}
          {f('stock', 'Stock')}
          {f('pl_team', 'P & L Team')}
          {f('type', 'Type')}
          {f('con', 'CON')}
          {f('unit_no', 'Unit No')}
          {f('name', 'Customer Name')}
          {fa('swap_from_unit_details', 'Swap From Unit Details')}

          {sec('Dates & Values')}
          {fd('booking_form_date', 'Booking Form Date')}
          {fd('login_counter_date', 'Login Counter Date')}
          {f('values_amount', 'Values', 'number')}
          {f('rs_in_crs', 'Rs in Crs', 'number')}
          {f('net_sales', 'Net Sales')}
          {f('gross_sales', 'Gross Sales')}
          {f('booking_form_status', 'Booking Form Status')}
          {f('form_type', 'Form Type')}

          {sec('Booking Form Details')}
          {fd('bf_received_date', 'BF Received Date')}
          {f('booking_form_received_by_whom', 'BF Received By Whom')}
          {fd('hold_date', 'Hold Date')}
          {fd('file_transfer_date', 'File Transfer Date')}
          {fa('file_transfer_details', 'File Transfer Details')}
          {fd('lbc_date', 'LBC Date')}

          {sec('FLS & Manager Info')}
          {f('fls_id', 'FLS ID')}
          {f('fls_name', 'FLS Name')}
          {f('mgr_id', 'Manager ID')}
          {f('mgr_name', 'Manager Name')}
          {f('avp_id', 'AVP ID')}
          {f('avp_name', 'AVP Name')}
          {f('scheme', 'Scheme')}
          {f('customer_mail', 'Customer Mail', 'email')}

          {sec('PDC Details')}
          {f('pdc_status', 'PDC Status')}
          {f('pdc_cheque_received', 'PDC Cheque Received')}
          {f('pdc_amount', 'PDC Amount', 'number')}
          {fd('pdc_date', 'PDC Date')}
          {f('pdc_cheque_no', 'PDC Cheque No')}
          {f('bank_name_pdc', 'Bank Name (PDC)')}

          {sec('Payment Details')}
          {f('payment_mode', 'Payment Mode')}
          {f('booking_amount', 'Booking Amount', 'number')}
          {fd('cheque_date', 'Cheque Date')}
          {f('cheque_no', 'Cheque No')}
          {f('bank_name', 'Bank Name')}
          {fa('payment_confirmation_with_confirmed_date', 'Payment Confirmation with Date', HALF)}

          {sec('CIT Verification')}
          {fd('sent_for_cit_verification_date', 'Sent for CIT Verification Date')}
          {f('sf_record_id', 'SF Record ID')}
          {f('status_of_cit_verification', 'Status of CIT Verification')}
          {f('verified_by_whom', 'Verified By Whom')}
          {fd('verified_date', 'Verified Date')}

          {sec('Contact Info')}
          {f('phone_number_1', 'Phone Number 1')}
          {f('phone_number_2', 'Phone Number 2')}
          {f('phone_number_3', 'Phone Number 3')}
          {f('phone_number_4', 'Phone Number 4')}
          {f('mail_id_1', 'Mail ID 1', 'email')}
          {f('mail_id_2', 'Mail ID 2', 'email')}
          {f('mail_id_3', 'Mail ID 3', 'email')}
          {f('mail_id_4', 'Mail ID 4', 'email')}

          {sec('Remarks')}
          {fa('remarks', 'Remarks')}
          {fa('login_before_cancel_remarks', 'Login Before Cancel / Relogin Remarks')}

          {sec('Description & Attachments')}
          <div className={FULL}>
            <label className={LABEL}>Description</label>
            <textarea {...register('description')} rows={3} className={INPUT + ' resize-none'} placeholder="Enter description or additional notes..." />
          </div>

          <div className={FULL}>
            <label className={LABEL}>Attachments</label>
            <div className="space-y-3">
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-brand-200 rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-brand-400 hover:bg-brand-50'}`}
              >
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center">
                  {uploading
                    ? <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                    : <Upload className="w-5 h-5 text-brand-500" />
                  }
                </div>
                <p className="text-sm text-brand-600">{uploading ? 'Uploading...' : 'Click to upload files'}</p>
                <p className="text-xs text-brand-400">Multiple files supported · Max 50MB each</p>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
              </div>

              {attachedFiles.length > 0 && (
                <div className="space-y-2">
                  {attachedFiles.map((file, idx) => {
                    const fileUrl = `${api.defaults.baseURL}${file.path}`;
                    const isPdf = file.name.toLowerCase().endsWith('.pdf');
                    const isImage = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file.name);
                    const iconColor = isPdf ? 'text-red-400' : isImage ? 'text-emerald-400' : 'text-blue-400';
                    return (
                      <div key={idx} className="flex items-center gap-3 bg-white border border-brand-100 rounded-lg px-3 py-2.5 group">
                        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
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
                          <button type="button" onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            title="Remove">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button type="button" onClick={onCancel}
          className="px-5 py-2 text-sm text-brand-700 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving || uploading}
          className="px-6 py-2 text-sm font-medium bg-brand-800 hover:bg-brand-900 text-white rounded-lg disabled:opacity-60 transition-colors">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

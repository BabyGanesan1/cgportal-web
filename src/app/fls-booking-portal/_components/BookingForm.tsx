'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Upload, FileText, Eye, Download } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import DarkDatePicker from './DarkDatePicker';

const INPUT = 'w-full bg-white border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 placeholder-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors';
const INPUT_ERR = 'w-full bg-white border border-red-400 rounded-lg px-3 py-2 text-sm text-brand-800 placeholder-brand-300 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors';
const DISABLED = 'w-full bg-brand-50 border border-brand-100 rounded-lg px-3 py-2 text-sm text-brand-400 cursor-not-allowed';
const LABEL = 'block text-xs font-medium text-brand-700 mb-1';
const SEC = 'col-span-1 md:col-span-2 lg:col-span-4 pt-4 mt-1 border-t border-brand-100 first:pt-0 first:mt-0 first:border-t-0';
const FULL = 'col-span-1 md:col-span-2 lg:col-span-4';
const HALF = 'col-span-1 md:col-span-2';

const DEFAULTS = {
  net_sales: 'L',
  gross_sales: 'L',
  booking_form_status: 'L',
  form_type: 'hard copy',
};

const REQUIRED_FIELDS = new Set([
  'project', 'region', 'stock', 'pl_team', 'type', 'con', 'unit_no', 'name',
  'swap_from_unit_details', 'booking_form_date', 'login_counter_date',
  'values_amount', 'rs_in_crs', 'net_sales', 'gross_sales',
  'booking_form_status', 'form_type', 'bf_received_date',
  'booking_form_received_by_whom', 'hold_date', 'file_transfer_details',
  'file_transfer_date', 'fls_id', 'fls_name', 'mgr_id', 'mgr_name',
  'avp_id', 'avp_name', 'scheme', 'acknowledgement', 'pdc_status',
  'payment_mode', 'payment_confirmation_with_confirmed_date',
  'booking_amount', 'cheque_date', 'cheque_no', 'bank_name',
  'sent_for_cit_verification_date', 'sf_record_id',
  'status_of_cit_verification', 'verified_by_whom', 'verified_date',
  'phone_number_1', 'phone_number_2', 'phone_number_3', 'phone_number_4',
  'mail_id_1', 'mail_id_2', 'mail_id_3', 'mail_id_4',
]);

const DATE_REQUIRED: Record<string, string> = {
  booking_form_date: 'Booking Form Date',
  login_counter_date: 'Login Counter Date',
  bf_received_date: 'BF Received Date',
  hold_date: 'Hold Date',
  file_transfer_date: 'File Transfer Date',
  cheque_date: 'Cheque Date',
  sent_for_cit_verification_date: 'Sent for CIT Verification Date',
  verified_date: 'Verified Date',
};

interface FileEntry { name: string; path: string; size: number }

interface Props {
  initialValues?: any;
  onSubmit: (data: any) => Promise<void>;
  saving: boolean;
  onCancel: () => void;
}

export default function BookingForm({ initialValues, onSubmit, saving, onCancel }: Props) {
  const { register, handleSubmit, reset, watch, setValue, setError, clearErrors, formState: { errors } } = useForm({
    defaultValues: { ...DEFAULTS, ...(initialValues || {}) },
  });
  const [attachedFiles, setAttachedFiles] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acknowledgement  = watch('acknowledgement');
  const checkingVerified = initialValues?.checking_verify_status === 'verified';

  useEffect(() => {
    if (initialValues) {
      reset({ ...DEFAULTS, ...initialValues });
      if (initialValues.attachments) {
        try { setAttachedFiles(JSON.parse(initialValues.attachments)); } catch {}
      }
      if (initialValues.fls_id) lookupMasterName('fls', initialValues.fls_id, 'fls_name');
      if (initialValues.mgr_id) lookupMasterName('mgr', initialValues.mgr_id, 'mgr_name');
      if (initialValues.avp_id) lookupMasterName('avp', initialValues.avp_id, 'avp_name');
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
    let hasDateError = false;
    for (const [name, label] of Object.entries(DATE_REQUIRED)) {
      if (!data[name]) {
        setError(name as any, { message: `${label} is required` });
        hasDateError = true;
      }
    }
    if (hasDateError) return;

    const clean: any = {};
    Object.entries(data).forEach(([k, v]) => { clean[k] = v === '' ? null : v; });
    clean.attachments = attachedFiles.length ? JSON.stringify(attachedFiles) : null;
    await onSubmit(clean);
  };

  const lookupMasterName = async (endpoint: string, id: string, nameField: string) => {
    if (!id?.trim()) { setValue(nameField, ''); return; }
    try {
      const res = await api.get(`/fls-masters/${endpoint}/${encodeURIComponent(id.trim())}`);
      setValue(nameField, res.data?.data?.[nameField] ?? '');
    } catch {
      setValue(nameField, '');
    }
  };

  const upsertMaster = async (
    endpoint: string,
    idField: string,
    nameField: string,
    idValue: string,
    nameValue: string
  ) => {
    if (!idValue?.trim() || !nameValue?.trim()) return;
    try {
      await api.post(`/fls-masters/${endpoint}/upsert`, {
        [idField]: idValue.trim(),
        [nameField]: nameValue.trim(),
      });
    } catch {}
  };

  const reqStar = (name: string) =>
    REQUIRED_FIELDS.has(name) ? <span className="text-red-500 ml-0.5">*</span> : null;

  const errMsg = (name: string) => {
    const e = (errors as any)[name];
    return e ? <p className="text-xs text-red-500 mt-0.5">{e.message}</p> : null;
  };

  const iCls = (name: string) => checkingVerified ? DISABLED : ((errors as any)[name] ? INPUT_ERR : INPUT);

  const f = (name: string, label: string, cls = '') => {
    const req = REQUIRED_FIELDS.has(name);
    return (
      <div key={name} className={cls}>
        <label className={LABEL}>{label}{reqStar(name)}</label>
        <input
          {...register(name, req ? { required: `${label} is required` } : {})}
          type="text"
          className={iCls(name)}
          placeholder={label}
          disabled={checkingVerified}
        />
        {errMsg(name)}
      </div>
    );
  };

  const fd = (name: string, label: string, cls = '') => {
    const err = (errors as any)[name];
    return (
      <div key={name} className={cls}>
        <label className={LABEL}>{label}{reqStar(name)}</label>
        {checkingVerified
          ? <input {...register(name)} disabled className={DISABLED} />
          : <DarkDatePicker
              value={watch(name) || ''}
              onChange={v => { setValue(name, v, { shouldDirty: true }); if (v) clearErrors(name as any); }}
              placeholder={label}
              accent="blue"
            />
        }
        {err && <p className="text-xs text-red-500 mt-0.5">{err.message}</p>}
      </div>
    );
  };

  const fa = (name: string, label: string, cls = FULL) => {
    const req = REQUIRED_FIELDS.has(name);
    return (
      <div key={name} className={cls}>
        <label className={LABEL}>{label}{reqStar(name)}</label>
        <textarea
          {...register(name, req ? { required: `${label} is required` } : {})}
          rows={2}
          className={(checkingVerified ? DISABLED : ((errors as any)[name] ? INPUT_ERR : INPUT)) + ' resize-none'}
          placeholder={label}
          disabled={checkingVerified}
        />
        {errMsg(name)}
      </div>
    );
  };

  const sec = (title: string) => (
    <div className={SEC}>
      <h3 className="text-xs font-semibold text-brand-700 uppercase tracking-wider">{title}</h3>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(submit)}>
      {checkingVerified && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          <span className="font-semibold">Locked:</span>
          <span>Checking is verified — booking fields are read-only.</span>
        </div>
      )}
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
          {f('values_amount', 'Values')}
          {f('rs_in_crs', 'Rs in Crs')}
          {f('net_sales', 'Net Sales')}
          {f('gross_sales', 'Gross Sales')}

          <div>
            <label className={LABEL}>Booking Form Status<span className="text-red-500 ml-0.5">*</span></label>
            <select
              {...register('booking_form_status', { required: 'Booking Form Status is required' })}
              className={iCls('booking_form_status')}
              disabled={checkingVerified}
            >
              <option value="">Select Status</option>
              <option value="L">L</option>
            </select>
            {errMsg('booking_form_status')}
          </div>

          <div>
            <label className={LABEL}>Form Type<span className="text-red-500 ml-0.5">*</span></label>
            <select
              {...register('form_type', { required: 'Form Type is required' })}
              className={iCls('form_type')}
              disabled={checkingVerified}
            >
              <option value="">Select Form Type</option>
              <option value="hard copy">Hard Copy</option>
            </select>
            {errMsg('form_type')}
          </div>

          {sec('Booking Form Details')}
          {fd('bf_received_date', 'BF Received Date')}
          {f('booking_form_received_by_whom', 'BF Received By Whom')}
          {fd('hold_date', 'Hold Date')}
          {fd('file_transfer_date', 'File Transfer Date')}
          {fa('file_transfer_details', 'File Transfer Details')}
          {fd('lbc_date', 'LBC Date')}

          {sec('FLS & Manager Info')}

          <div>
            <label className={LABEL}>FLS ID<span className="text-red-500 ml-0.5">*</span></label>
            <input
              {...register('fls_id', { required: 'FLS ID is required' })}
              type="text"
              className={iCls('fls_id')}
              placeholder="FLS ID"
              disabled={checkingVerified}
              onBlur={e => !checkingVerified && lookupMasterName('fls', e.target.value, 'fls_name')}
            />
            {errMsg('fls_id')}
          </div>
          <div>
            <label className={LABEL}>FLS Name<span className="text-red-500 ml-0.5">*</span></label>
            <input
              {...register('fls_name', { required: 'FLS Name is required' })}
              type="text"
              className={iCls('fls_name')}
              placeholder="FLS Name"
              disabled={checkingVerified}
              onBlur={e => !checkingVerified && upsertMaster('fls', 'fls_id', 'fls_name', watch('fls_id'), e.target.value)}
            />
            {errMsg('fls_name')}
          </div>

          <div>
            <label className={LABEL}>Manager ID<span className="text-red-500 ml-0.5">*</span></label>
            <input
              {...register('mgr_id', { required: 'Manager ID is required' })}
              type="text"
              className={iCls('mgr_id')}
              placeholder="Manager ID"
              disabled={checkingVerified}
              onBlur={e => !checkingVerified && lookupMasterName('mgr', e.target.value, 'mgr_name')}
            />
            {errMsg('mgr_id')}
          </div>
          <div>
            <label className={LABEL}>Manager Name<span className="text-red-500 ml-0.5">*</span></label>
            <input
              {...register('mgr_name', { required: 'Manager Name is required' })}
              type="text"
              className={iCls('mgr_name')}
              placeholder="Manager Name"
              disabled={checkingVerified}
              onBlur={e => !checkingVerified && upsertMaster('mgr', 'mgr_id', 'mgr_name', watch('mgr_id'), e.target.value)}
            />
            {errMsg('mgr_name')}
          </div>

          <div>
            <label className={LABEL}>AVP ID<span className="text-red-500 ml-0.5">*</span></label>
            <input
              {...register('avp_id', { required: 'AVP ID is required' })}
              type="text"
              className={iCls('avp_id')}
              placeholder="AVP ID"
              disabled={checkingVerified}
              onBlur={e => !checkingVerified && lookupMasterName('avp', e.target.value, 'avp_name')}
            />
            {errMsg('avp_id')}
          </div>
          <div>
            <label className={LABEL}>AVP Name<span className="text-red-500 ml-0.5">*</span></label>
            <input
              {...register('avp_name', { required: 'AVP Name is required' })}
              type="text"
              className={iCls('avp_name')}
              placeholder="AVP Name"
              disabled={checkingVerified}
              onBlur={e => !checkingVerified && upsertMaster('avp', 'avp_id', 'avp_name', watch('avp_id'), e.target.value)}
            />
            {errMsg('avp_name')}
          </div>
          {f('scheme', 'Scheme')}

          <div>
            <label className={LABEL}>Acknowledgement<span className="text-red-500 ml-0.5">*</span></label>
            <select
              {...register('acknowledgement', { required: 'Acknowledgement is required' })}
              className={iCls('acknowledgement')}
              disabled={checkingVerified}
            >
              <option value="">Select</option>
              <option value="mail">Mail</option>
              <option value="signed">Signed</option>
              <option value="non-acknowledgement">Non-Acknowledgement</option>
            </select>
            {errMsg('acknowledgement')}
          </div>
          {acknowledgement === 'non-acknowledgement' && (
            <div className={HALF}>
              <label className={LABEL}>Acknowledgement Remarks</label>
              <textarea {...register('acknowledgement_remarks')} rows={2} className={(checkingVerified ? DISABLED : INPUT) + ' resize-none'} placeholder="Acknowledgement Remarks" disabled={checkingVerified} />
            </div>
          )}

          {sec('PDC Details')}
          {f('pdc_status', 'PDC Status')}
          {f('pdc_cheque_received', 'PDC Cheque Received')}
          {f('pdc_amount', 'PDC Amount')}
          {fd('pdc_date', 'PDC Date')}
          {f('pdc_cheque_no', 'PDC Cheque No')}
          {f('bank_name_pdc', 'Bank Name (PDC)')}

          {sec('Payment Details')}
          {f('payment_mode', 'Payment Mode')}
          {f('booking_amount', 'Booking Amount')}
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
          {f('mail_id_1', 'Mail ID 1')}
          {f('mail_id_2', 'Mail ID 2')}
          {f('mail_id_3', 'Mail ID 3')}
          {f('mail_id_4', 'Mail ID 4')}

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
                onClick={() => !uploading && !checkingVerified && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-brand-200 rounded-xl p-5 flex flex-col items-center gap-2 transition-colors ${(uploading || checkingVerified) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-brand-400 hover:bg-brand-50'}`}
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
                          {!checkingVerified && (
                            <button type="button" onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                              className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                              title="Remove">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
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
        {!checkingVerified && (
          <button type="submit" disabled={saving || uploading}
            className="px-6 py-2 text-sm font-medium bg-brand-800 hover:bg-brand-900 text-white rounded-lg disabled:opacity-60 transition-colors">
            {saving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>
    </form>
  );
}

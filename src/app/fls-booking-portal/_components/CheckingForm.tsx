'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, Download, FileText, Upload, X } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import DarkDatePicker from './DarkDatePicker';

const INPUT    = 'w-full bg-white border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 placeholder-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors';
const LABEL    = 'block text-xs font-medium text-brand-700 mb-1';
const SEC      = 'col-span-1 md:col-span-2 lg:col-span-4 pt-4 mt-1 border-t border-brand-100 first:pt-0 first:mt-0 first:border-t-0';
const FULL     = 'col-span-1 md:col-span-2 lg:col-span-4';
const HALF     = 'col-span-1 md:col-span-2';

const ALL_CHECKING_FIELDS = [
  // Identification
  'project', 'unit_no', 'name', 'fls_id', 'fls_name', 'login_counter_date',
  // Sales Figures
  'net_sales', 'gross_sales', 'msp', 'taken_price', 'discount',
  'land_cost', 'construction_cost', 'msp_custom_amount',
  'offer', 'offer_description',
  // Source Details
  'source_taken_lead', 'pushed_date', 'source', 'sub_source', 'iden_date',
  'source_remarks', 'customer_type', 'source_customer_name',
  'source_verify_status', 'lead_remarks',
  // Upfront & Verification
  'upfront_details', 'checking_verify_status', 'remarks',
  // Booking Info
  'region', 'stock', 'pl_team', 'type', 'con', 'swap_from_unit_details',
  // Booking Dates
  'booking_form_date', 'values_amount', 'rs_in_crs', 'booking_form_status', 'form_type',
  // Booking Form Details
  'bf_received_date', 'booking_form_received_by_whom', 'hold_date',
  'file_transfer_date', 'file_transfer_details', 'lbc_date',
  // FLS & Manager
  'mgr_id', 'mgr_name', 'avp_id', 'avp_name', 'scheme',
  'acknowledgement', 'acknowledgement_remarks',
  // PDC
  'pdc_status', 'pdc_cheque_received', 'pdc_amount', 'pdc_date', 'pdc_cheque_no', 'bank_name_pdc',
  // Payment
  'payment_mode', 'booking_amount', 'cheque_date', 'cheque_no', 'bank_name',
  'payment_confirmation_with_confirmed_date',
  // CIT
  'sent_for_cit_verification_date', 'sf_record_id', 'status_of_cit_verification',
  'verified_by_whom', 'verified_date',
  // Contact
  'phone_number_1', 'phone_number_2', 'phone_number_3', 'phone_number_4',
  'mail_id_1', 'mail_id_2', 'mail_id_3', 'mail_id_4',
  // Remarks
  'login_before_cancel_remarks', 'description',
];

interface Props {
  initialValues?: any;
  onSubmit: (data: any) => Promise<void>;
  saving: boolean;
  onCancel: () => void;
}

export default function CheckingForm({ initialValues, onSubmit, saving, onCancel }: Props) {
  const { register, handleSubmit, reset, watch, setValue } = useForm({ defaultValues: initialValues || {} });
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; path: string; size: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const verifyStatus       = watch('checking_verify_status');
  const sourceVerifyStatus = watch('source_verify_status');
  const acknowledgement    = watch('acknowledgement');
  const msp                = watch('msp');
  const takenPrice         = watch('taken_price');
  const landCost           = watch('land_cost');
  const constructionCost   = watch('construction_cost');
  const mspCustomAmount    = watch('msp_custom_amount');
  const source    = watch('source');
  const subSource = watch('sub_source');
  const canVerify = !!(source?.trim() && subSource?.trim());

  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
      if (initialValues.attachments) {
        try { setAttachedFiles(JSON.parse(initialValues.attachments)); } catch {}
      }
      if (initialValues.fls_id) lookupMasterName('fls', initialValues.fls_id, 'fls_name');
      if (initialValues.mgr_id) lookupMasterName('mgr', initialValues.mgr_id, 'mgr_name');
      if (initialValues.avp_id) lookupMasterName('avp', initialValues.avp_id, 'avp_name');
    }
  }, [initialValues]);

  // Auto-calculate discount when MSP type or relevant amounts change
  useEffect(() => {
    if (!msp) return;
    const tp = parseFloat(takenPrice) || 0;
    let mspValue = 0;
    if (msp === 'villa') mspValue = (parseFloat(landCost) || 0) + (parseFloat(constructionCost) || 0);
    else if (msp === 'apartment') mspValue = parseFloat(constructionCost) || 0;
    else if (msp === 'others') mspValue = parseFloat(mspCustomAmount) || 0;

    if (mspValue !== 0 || tp !== 0) {
      setValue('discount', (mspValue - tp).toFixed(2), { shouldDirty: true });
    }
  }, [msp, takenPrice, landCost, constructionCost, mspCustomAmount]);

  const lookupMasterName = async (endpoint: string, id: string, nameField: string) => {
    if (!id?.trim()) { setValue(nameField, ''); return; }
    try {
      const res = await api.get(`/fls-masters/${endpoint}/${encodeURIComponent(id.trim())}`);
      setValue(nameField, res.data?.data?.[nameField] ?? '');
    } catch {
      setValue(nameField, '');
    }
  };

  const upsertMaster = async (endpoint: string, idField: string, nameField: string, idValue: string, nameValue: string) => {
    if (!idValue?.trim() || !nameValue?.trim()) return;
    try {
      await api.post(`/fls-masters/${endpoint}/upsert`, { [idField]: idValue.trim(), [nameField]: nameValue.trim() });
    } catch {}
  };

  const submit = async (data: any) => {
    const clean: any = { _module: 'CHECKING' };
    ALL_CHECKING_FIELDS.forEach(k => { clean[k] = data[k] === '' ? null : (data[k] ?? null); });
    clean.attachments = attachedFiles.length ? JSON.stringify(attachedFiles) : null;
    await onSubmit(clean);
  };

  const sec = (title: string, subtitle?: string) => (
    <div className={SEC}>
      <h3 className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
        {title}{subtitle && <span className="ml-2 font-normal text-brand-400 normal-case">{subtitle}</span>}
      </h3>
    </div>
  );

  const inp = (name: string, label: string, cls = '') => (
    <div key={name} className={cls}>
      <label className={LABEL}>{label}</label>
      <input {...register(name)} type="text" className={INPUT} placeholder={label} />
    </div>
  );

  const area = (name: string, label: string, cls = FULL) => (
    <div key={name} className={cls}>
      <label className={LABEL}>{label}</label>
      <textarea {...register(name)} rows={2} className={INPUT + ' resize-none'} placeholder={label} />
    </div>
  );

  const dt = (name: string, label: string, cls = '') => (
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

  const sel = (name: string, label: string, options: string[], cls = '') => (
    <div key={name} className={cls}>
      <label className={LABEL}>{label}</label>
      <select {...register(name)} className={INPUT}>
        <option value="">Select {label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(submit)}>
      <div className="bg-white rounded-xl border border-brand-100 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">

          {/* ── Identification ── */}
          {sec('Identification')}
          {inp('project',    'Project')}
          {inp('unit_no',    'Unit No')}
          {inp('name',       'Customer Name')}
          <div>
            <label className={LABEL}>FLS ID</label>
            <input {...register('fls_id')} type="text" className={INPUT} placeholder="FLS ID"
              onBlur={e => lookupMasterName('fls', e.target.value, 'fls_name')} />
          </div>
          <div>
            <label className={LABEL}>FLS Name</label>
            <input {...register('fls_name')} type="text" className={INPUT} placeholder="FLS Name"
              onBlur={e => upsertMaster('fls', 'fls_id', 'fls_name', watch('fls_id'), e.target.value)} />
          </div>
          {dt('login_counter_date', 'Login Counter Date')}

          {/* ── Sales Figures ── */}
          {sec('Sales Figures')}
          {inp('net_sales',   'Net Sales')}
          {inp('gross_sales', 'Gross Sales')}

          {/* MSP dropdown */}
          <div>
            <label className={LABEL}>MSP</label>
            <select {...register('msp')} className={INPUT}>
              <option value="">Select MSP</option>
              <option value="villa">Villa</option>
              <option value="apartment">Apartment</option>
              <option value="others">Others</option>
            </select>
          </div>

          {inp('taken_price', 'Taken Price')}
          {inp('discount',    'Discount')}

          {/* Conditional MSP amount fields */}
          {msp === 'villa' && (
            <>
              {inp('land_cost',         'Land Cost')}
              {inp('construction_cost', 'Construction Cost')}
            </>
          )}
          {msp === 'apartment' && inp('construction_cost', 'Construction Cost')}
          {msp === 'others'    && inp('msp_custom_amount', 'MSP Custom Amount')}

          {/* Offer fields */}
          {inp('offer', 'Offer')}
          {area('offer_description', 'Offer Description', HALF)}

          {/* ── Source Details ── */}
          {sec('Source Details')}
          {inp('source_taken_lead', 'Source Taken Lead')}
          {dt('pushed_date',        'Pushed Date')}
          {inp('source',            'Source')}
          {inp('sub_source',        'Sub Source')}
          {dt('iden_date',          'Iden Date')}
          {area('source_remarks',   'Source Remarks')}

          <div>
            <label className={LABEL}>Customer Type</label>
            <select {...register('customer_type')} className={INPUT}>
              <option value="">Select Type</option>
              <option value="Indian">Indian</option>
              <option value="NRI">NRI</option>
            </select>
          </div>
          {inp('source_customer_name', 'Customer Name (Source)', HALF)}

          {sel('source_verify_status', 'Source Verify Status', ['hold', 'verified'])}
          {sourceVerifyStatus === 'hold' && (
            <div className={FULL}>
              <label className={LABEL}>Lead Remarks <span className="text-red-400">*</span></label>
              <textarea {...register('lead_remarks')} rows={2} className={INPUT + ' resize-none'} placeholder="Lead Remarks (required for Hold)" />
            </div>
          )}
          {sourceVerifyStatus !== 'hold' && (
            <div className={HALF}>
              <label className={LABEL}>Lead Remarks</label>
              <textarea {...register('lead_remarks')} rows={2} className={INPUT + ' resize-none'} placeholder="Lead Remarks" />
            </div>
          )}

          {/* ── Upfront & Verification ── */}
          {sec('Upfront & Verification')}
          {area('upfront_details', 'Upfront Details')}

          <div>
            <label className={LABEL}>Checking Verify Status</label>
            <select {...register('checking_verify_status')} className={INPUT}>
              <option value="">Select Status</option>
              <option value="verified" disabled={!canVerify} title={!canVerify ? 'Fill Source and Sub Source first' : ''}>Verified</option>
              <option value="hold">Hold</option>
              <option value="canceled">Canceled</option>
            </select>
            {!canVerify && <p className="text-[10px] text-amber-600 mt-1">Source &amp; Sub Source required before verifying</p>}
          </div>

          <div className={FULL}>
            <label className={LABEL}>
              Remarks {(verifyStatus === 'hold' || verifyStatus === 'canceled') && <span className="text-red-400">*</span>}
            </label>
            <textarea
              {...register('remarks')}
              rows={2}
              className={INPUT + ' resize-none'}
              placeholder={
                verifyStatus === 'canceled' ? 'Cancellation reason (required)' :
                verifyStatus === 'hold' ? 'Hold reason (required)' : 'Remarks'
              }
            />
          </div>

          {/* ── Booking Info ── */}
          {sec('Booking Info')}
          {inp('region', 'Region')}
          {inp('stock',  'Stock')}
          {inp('pl_team','P & L Team')}
          {inp('type',   'Type')}
          {inp('con',    'CON')}
          {area('swap_from_unit_details', 'Swap From Unit Details')}

          {/* ── Booking Dates & Values ── */}
          {sec('Booking Dates & Values')}
          {dt('booking_form_date',   'Booking Form Date')}
          {inp('values_amount',      'Values')}
          {inp('rs_in_crs',          'Rs in Crs')}
          {inp('booking_form_status','Booking Form Status')}
          {inp('form_type',          'Form Type')}

          {/* ── Booking Form Details ── */}
          {sec('Booking Form Details')}
          {dt('bf_received_date',              'BF Received Date')}
          {inp('booking_form_received_by_whom','BF Received By Whom')}
          {dt('hold_date',                     'Hold Date')}
          {dt('file_transfer_date',            'File Transfer Date')}
          {area('file_transfer_details',       'File Transfer Details')}
          {dt('lbc_date',                      'LBC Date')}

          {/* ── FLS & Manager Info ── */}
          {sec('FLS & Manager Info')}
          <div>
            <label className={LABEL}>Manager ID</label>
            <input {...register('mgr_id')} type="text" className={INPUT} placeholder="Manager ID"
              onBlur={e => lookupMasterName('mgr', e.target.value, 'mgr_name')} />
          </div>
          <div>
            <label className={LABEL}>Manager Name</label>
            <input {...register('mgr_name')} type="text" className={INPUT} placeholder="Manager Name"
              onBlur={e => upsertMaster('mgr', 'mgr_id', 'mgr_name', watch('mgr_id'), e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>AVP ID</label>
            <input {...register('avp_id')} type="text" className={INPUT} placeholder="AVP ID"
              onBlur={e => lookupMasterName('avp', e.target.value, 'avp_name')} />
          </div>
          <div>
            <label className={LABEL}>AVP Name</label>
            <input {...register('avp_name')} type="text" className={INPUT} placeholder="AVP Name"
              onBlur={e => upsertMaster('avp', 'avp_id', 'avp_name', watch('avp_id'), e.target.value)} />
          </div>
          {inp('scheme',   'Scheme')}

          {/* Acknowledgement */}
          <div>
            <label className={LABEL}>Acknowledgement</label>
            <select {...register('acknowledgement')} className={INPUT}>
              <option value="">Select</option>
              <option value="mail">Mail</option>
              <option value="signed">Signed</option>
              <option value="non-acknowledgement">Non-Acknowledgement</option>
            </select>
          </div>
          {acknowledgement === 'non-acknowledgement' && (
            <div className={HALF}>
              <label className={LABEL}>Acknowledgement Remarks</label>
              <textarea {...register('acknowledgement_remarks')} rows={2} className={INPUT + ' resize-none'} placeholder="Acknowledgement Remarks" />
            </div>
          )}

          {/* ── PDC Details ── */}
          {sec('PDC Details')}
          {inp('pdc_status',          'PDC Status')}
          {inp('pdc_cheque_received', 'PDC Cheque Received')}
          {inp('pdc_amount',          'PDC Amount')}
          {dt('pdc_date',             'PDC Date')}
          {inp('pdc_cheque_no',       'PDC Cheque No')}
          {inp('bank_name_pdc',       'Bank Name (PDC)')}

          {/* ── Payment Details ── */}
          {sec('Payment Details')}
          {inp('payment_mode',   'Payment Mode')}
          {inp('booking_amount', 'Booking Amount')}
          {dt('cheque_date',     'Cheque Date')}
          {inp('cheque_no',      'Cheque No')}
          {inp('bank_name',      'Bank Name')}
          {area('payment_confirmation_with_confirmed_date', 'Payment Confirmation with Date', HALF)}

          {/* ── CIT Verification ── */}
          {sec('CIT Verification')}
          {dt('sent_for_cit_verification_date', 'Sent for CIT Verification Date')}
          {inp('sf_record_id',                  'SF Record ID')}
          {inp('status_of_cit_verification',    'Status of CIT Verification')}
          {inp('verified_by_whom',              'Verified By Whom')}
          {dt('verified_date',                  'Verified Date')}

          {/* ── Contact Info ── */}
          {sec('Contact Info')}
          {inp('phone_number_1', 'Phone Number 1')}
          {inp('phone_number_2', 'Phone Number 2')}
          {inp('phone_number_3', 'Phone Number 3')}
          {inp('phone_number_4', 'Phone Number 4')}
          {inp('mail_id_1',      'Mail ID 1')}
          {inp('mail_id_2',      'Mail ID 2')}
          {inp('mail_id_3',      'Mail ID 3')}
          {inp('mail_id_4',      'Mail ID 4')}

          {/* ── Booking Remarks ── */}
          {sec('Booking Remarks')}
          {area('login_before_cancel_remarks', 'Login Before Cancel / Relogin Remarks')}

          {/* ── Description & Attachments ── */}
          {sec('Description & Attachments')}
          {area('description', 'Description')}
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
                    const isPdf   = file.name.toLowerCase().endsWith('.pdf');
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
                            className="p-1.5 rounded-md text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 transition-colors" title="View">
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                          <a href={fileUrl} download={file.name}
                            className="p-1.5 rounded-md text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors" title="Download">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button type="button" onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Remove">
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

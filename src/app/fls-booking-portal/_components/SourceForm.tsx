'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, Download, FileText } from 'lucide-react';
import api from '../../../lib/api';
import DarkDatePicker from './DarkDatePicker';
import CommonSelect from './CommonSelect';
import { useFlsTheme } from './FlsThemeContext';

function makeClasses(isDark: boolean) {
  const INPUT = isDark
    ? 'w-full bg-[#0d1f33] border border-[#1e3a55] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors'
    : 'w-full bg-white border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 placeholder-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors';

  const DISABLED = isDark
    ? 'w-full bg-[#0a1827] border border-[#1e3a55] rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed'
    : 'w-full bg-brand-50 border border-brand-100 rounded-lg px-3 py-2 text-sm text-brand-400 cursor-not-allowed';

  const LABEL = isDark
    ? 'block text-xs font-medium text-slate-300 mb-1'
    : 'block text-xs font-medium text-brand-700 mb-1';

  const CARD = isDark
    ? 'bg-[#0d1f33] rounded-xl border border-[#1e3a55] shadow-sm p-6'
    : 'bg-white rounded-xl border border-brand-100 shadow-sm p-6';

  const SEC_BORDER = isDark ? 'border-[#1e3a55]' : 'border-brand-100';
  const SEC_TITLE = isDark ? 'text-slate-400' : 'text-brand-700';
  const SEC_SUB = isDark ? 'text-slate-500' : 'text-brand-400';

  const WARN_BG = isDark
    ? 'bg-amber-900/30 border-amber-700 text-amber-300'
    : 'bg-amber-50 border-amber-200 text-amber-700';

  return { INPUT, DISABLED, LABEL, CARD, SEC_BORDER, SEC_TITLE, SEC_SUB, WARN_BG };
}

const SEC = 'col-span-1 md:col-span-2 lg:col-span-4 pt-4 mt-1 border-t first:pt-0 first:mt-0 first:border-t-0';
const FULL = 'col-span-1 md:col-span-2 lg:col-span-4';
const HALF = 'col-span-1 md:col-span-2';

const SOURCE_FIELDS = [
  'source_taken_lead', 'pushed_date', 'source', 'sub_source', 'iden_date',
  'source_remarks', 'customer_type', 'source_customer_name',
  'sf_lead_id1', 'sf_lead1_clone', 'sf_lead_id1_owner', 'pushed_date_lead1', 'sf_lead1_walkin_date', 'walkin_project_lead1',
  'sf_lead2', 'sf_lead2_clone', 'sf_lead_id2_owner', 'pushed_date_lead2', 'sf_lead2_walkin_date', 'walkin_project_lead2',
  'sf_lead3', 'sf_lead3_clone', 'sf_lead_id3_owner', 'pushed_date_lead3', 'sf_lead3_walkin_date', 'walkin_project_lead3',
  'sell_do_lead1', 'sell_do_lead2', 'sell_do_lead3',
  'walk_in_date', 'lead_remarks', 'source_verify_status', 'phone_number_1',
  'phone_number_2',
  'phone_number_3',
  'phone_number_4',
  'mail_id_1',
  'mail_id_2',
  'mail_id_3',
  'mail_id_4',
];

const SOURCE_OPTIONS = [
  { value: 'PRINT', label: 'PRINT' },
  { value: 'ONLINE', label: 'ONLINE' },
  { value: 'PROPERTY PORTAL', label: 'PROPERTY PORTAL' },
  { value: 'INHOUSE CHANNEL PARTNER', label: 'INHOUSE CHANNEL PARTNER' },
  { value: 'CHANNEL PARTNER', label: 'CHANNEL PARTNER' },
  { value: 'OUTDOOR', label: 'OUTDOOR' },
  { value: 'PLM', label: 'PLM' },
  { value: 'REFERRAL', label: 'REFERRAL' },
  { value: 'EMPLOYEE BOOKING', label: 'EMPLOYEE BOOKING' },
  { value: 'TVC', label: 'TVC' },
  { value: 'THEATRE', label: 'THEATRE' },
  { value: 'BTL', label: 'BTL' },
  { value: 'RADIO', label: 'RADIO' },
  { value: 'OTHERS MEDIUMS', label: 'OTHERS MEDIUMS' },
];

const VERIFY_STATUS_OPTIONS = [
  { value: 'hold', label: 'Hold' },
  { value: 'verified', label: 'Verified' },
  { value: 'canceled', label: 'Canceled' },
];

const CUSTOMER_TYPE_OPTIONS = [
  { value: 'Indian', label: 'Indian' },
  { value: 'NRI', label: 'NRI' },
];

interface Props {
  initialValues?: any;
  onSubmit: (data: any) => Promise<void>;
  saving: boolean;
  onCancel: () => void;
}

export default function SourceForm({ initialValues, onSubmit, saving, onCancel }: Props) {
  const { isDark } = useFlsTheme();
  const cls = makeClasses(isDark);

  const { register, handleSubmit, reset, watch, setValue } = useForm({ defaultValues: initialValues || {} });
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; path: string; size: number }[]>([]);

  const verifyStatus = watch('source_verify_status');
  const checkingVerified = initialValues?.checking_verify_status === 'verified';

  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
      if (initialValues.attachments) {
        try { setAttachedFiles(JSON.parse(initialValues.attachments)); } catch { }
      }
    }
  }, [initialValues]);

  const submit = async (data: any) => {
    const clean: any = {};
    SOURCE_FIELDS.forEach(k => { clean[k] = data[k] === '' ? null : (data[k] ?? null); });
    await onSubmit(clean);
  };

  const txt = (name: string, label: string, colCls = '') => (
    <div key={name} className={colCls}>
      <label className={cls.LABEL}>{label}</label>
      <input {...register(name)} type="text" className={checkingVerified ? cls.DISABLED : cls.INPUT}
        placeholder={label} disabled={checkingVerified} />
    </div>
  );

  const dt = (name: string, label: string, colCls = '') => (
    <div key={name} className={colCls}>
      <label className={cls.LABEL}>{label}</label>
      {checkingVerified
        ? <input {...register(name)} disabled className={cls.DISABLED} />
        : <DarkDatePicker value={watch(name) || ''} onChange={v => setValue(name, v, { shouldDirty: true })} placeholder={label} accent="purple" />
      }
    </div>
  );

  const sec = (title: string, subtitle?: string) => (
    <div className={`${SEC} ${cls.SEC_BORDER}`}>
      <h3 className={`text-xs font-semibold uppercase tracking-wider ${cls.SEC_TITLE}`}>
        {title}{subtitle && <span className={`ml-2 font-normal normal-case ${cls.SEC_SUB}`}>{subtitle}</span>}
      </h3>
    </div>
  );

  const dis = (name: string, label: string, colCls = '') => (
    <div key={name} className={colCls}>
      <label className={cls.LABEL}>{label}</label>
      <input {...register(name)} disabled className={cls.DISABLED} />
    </div>
  );

  const disArea = (name: string, label: string, colCls = FULL) => (
    <div key={name} className={colCls}>
      <label className={cls.LABEL}>{label}</label>
      <textarea {...register(name)} rows={2} disabled className={cls.DISABLED + ' resize-none'} />
    </div>
  );

  return (
    <form onSubmit={handleSubmit(submit)}>
      {checkingVerified && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-3 border rounded-lg text-sm ${cls.WARN_BG}`}>
          <span className="font-semibold">Locked:</span>
          <span>Checking is verified — source fields are read-only.</span>
        </div>
      )}

      <div className={cls.CARD}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">

          {sec('Identification', '(read only — set during booking)')}
          {dis('project', 'Project')}
          {dis('unit_no', 'Unit No')}
          {dis('name', 'Customer Name')}
          {dis('avp_id', 'AVP ID')}
          {dis('avp_name', 'AVP Name')}
          {dis('booking_form_date', 'Booking Form Date')}
          {dis('login_counter_date', 'Login Counter Date')}

          {sec('Source Details')}
          {txt('source_taken_lead', 'Source Taken Lead')}
          {dt('pushed_date', 'Pushed Date')}

          {/* Source — CommonSelect (theme-aware) */}
          <CommonSelect
            label="Source"
            options={SOURCE_OPTIONS}
            value={watch('source') || ''}
            onChange={v => setValue('source', v, { shouldDirty: true })}
            placeholder="Select Source"
            disabled={checkingVerified}
          />

          {txt('sub_source', 'Sub Source')}
          {dt('iden_date', 'Iden Date')}

          <div className={FULL}>
            <label className={cls.LABEL}>Source Remarks</label>
            <textarea {...register('source_remarks')} rows={2}
              className={(checkingVerified ? cls.DISABLED : cls.INPUT) + ' resize-none'}
              placeholder="Source Remarks" disabled={checkingVerified} />
          </div>

          {/* Customer Type — CommonSelect (theme-aware) */}
          <CommonSelect
            label="Customer Type"
            options={CUSTOMER_TYPE_OPTIONS}
            value={watch('customer_type') || ''}
            onChange={v => setValue('customer_type', v, { shouldDirty: true })}
            placeholder="Select Type"
            disabled={checkingVerified}
          />
          {txt('source_customer_name', 'Customer Name', HALF)}

          {sec('SF Lead 1')}
          {txt('sf_lead_id1', 'SF Lead ID 1')}
          {txt('sf_lead1_clone', 'SF Lead 1 Clone')}
          {txt('sf_lead_id1_owner', 'SF Lead ID 1 Owner')}
          {dt('pushed_date_lead1', 'Pushed Date (Lead 1)')}
          {dt('sf_lead1_walkin_date', 'SF Lead 1 Walk-in Date')}
          {txt('walkin_project_lead1', 'Walk-in Project (Lead 1)')}

          {sec('SF Lead 2')}
          {txt('sf_lead2', 'SF Lead 2')}
          {txt('sf_lead2_clone', 'SF Lead 2 Clone')}
          {txt('sf_lead_id2_owner', 'SF Lead ID 2 Owner')}
          {dt('pushed_date_lead2', 'Pushed Date (Lead 2)')}
          {dt('sf_lead2_walkin_date', 'SF Lead 2 Walk-in Date')}
          {txt('walkin_project_lead2', 'Walk-in Project (Lead 2)')}

          {sec('SF Lead 3')}
          {txt('sf_lead3', 'SF Lead 3')}
          {txt('sf_lead3_clone', 'SF Lead 3 Clone')}
          {txt('sf_lead_id3_owner', 'SF Lead ID 3 Owner')}
          {dt('pushed_date_lead3', 'Pushed Date (Lead 3)')}
          {dt('sf_lead3_walkin_date', 'SF Lead 3 Walk-in Date')}
          {txt('walkin_project_lead3', 'Walk-in Project (Lead 3)')}

          {sec('Sell Do Leads')}
          {txt('sell_do_lead1', 'Sell Do Lead 1')}
          {txt('sell_do_lead2', 'Sell Do Lead 2')}
          {txt('sell_do_lead3', 'Sell Do Lead 3')}

          {sec('Walk-in & Verification')}
          {dt('walk_in_date', 'Walk In Date')}

          {/* Source Verify Status — CommonSelect (fixed: was incorrectly bound to `source`) */}
          {/* <CommonSelect
            label="Source Verify Status"
            options={VERIFY_STATUS_OPTIONS}
            value={watch('source_verify_status') || ''}
            onChange={v => setValue('source_verify_status', v, { shouldDirty: true })}
            placeholder="Select Status"
            disabled={checkingVerified}
          /> */}

          {/* <div className={HALF}>
            <label className={cls.LABEL}>
              Lead Remarks
              {(verifyStatus === 'hold' || verifyStatus === 'canceled') && (
                <span className="text-red-400 ml-1">*</span>
              )}
            </label>
            <textarea
              {...register('lead_remarks')}
              rows={2}
              className={(checkingVerified ? cls.DISABLED : cls.INPUT) + ' resize-none'}
              placeholder={
                verifyStatus === 'canceled' ? 'Cancellation reason (required)' :
                  verifyStatus === 'hold' ? 'Hold reason (required)' :
                    'Lead Remarks'
              }
              disabled={checkingVerified}
            />
          </div> */}

          {sec('Contact Info')}
          {txt('phone_number_1', 'Phone Number 1')}
          {txt('phone_number_2', 'Phone Number 2')}
          {txt('phone_number_3', 'Phone Number 3')}
          {txt('phone_number_4', 'Phone Number 4')}
          {txt('mail_id_1', 'Mail ID 1')}
          {txt('mail_id_2', 'Mail ID 2')}
          {txt('mail_id_3', 'Mail ID 3')}
          {txt('mail_id_4', 'Mail ID 4')}

          {sec('Booking Info', '(read only)')}
          {dis('region', 'Region')}
          {dis('stock', 'Stock')}
          {dis('pl_team', 'P & L Team')}
          {dis('type', 'Type')}
          {dis('con', 'CON')}
          {disArea('swap_from_unit_details', 'Swap From Unit Details')}

          {sec('Booking Dates & Values', '(read only)')}
          {dis('booking_form_date', 'Booking Form Date')}
          {dis('login_counter_date', 'Login Counter Date')}
          {dis('values_amount', 'Values')}
          {dis('rs_in_crs', 'Rs in Crs')}
          {dis('net_sales', 'Net Sales')}
          {dis('gross_sales', 'Gross Sales')}
          {dis('booking_form_status', 'Booking Form Status')}
          {dis('form_type', 'Form Type')}

          {sec('Booking Form Details', '(read only)')}
          {dis('bf_received_date', 'BF Received Date')}
          {dis('booking_form_received_by_whom', 'BF Received By Whom')}
          {dis('hold_date', 'Hold Date')}
          {dis('file_transfer_date', 'File Transfer Date')}
          {disArea('file_transfer_details', 'File Transfer Details')}
          {dis('lbc_date', 'LBC Date')}

          {sec('Manager & AVP', '(read only)')}
          {dis('mgr_id', 'Manager ID')}
          {dis('mgr_name', 'Manager Name')}
          {dis('avp_id', 'AVP ID')}
          {dis('avp_name', 'AVP Name')}
          {dis('scheme', 'Scheme')}
          {dis('acknowledgement', 'Acknowledgement')}

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


          {sec('Booking Remarks', '(read only)')}
          {disArea('remarks', 'Remarks')}
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
                      <div key={idx} className={`flex items-center gap-3 border rounded-lg px-3 py-2.5 ${isDark ? 'bg-[#0a1827] border-[#1e3a55]' : 'bg-brand-50 border-brand-100'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-[#0d1f33]' : 'bg-white'}`}>
                          <FileText className={`w-4 h-4 ${iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate font-medium ${isDark ? 'text-slate-200' : 'text-brand-800'}`}>{file.name}</p>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-brand-400'}`}>{(file.size / 1024).toFixed(1)} KB</p>
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
          className={`px-5 py-2 text-sm border rounded-lg transition-colors ${isDark ? 'text-slate-300 border-[#1e3a55] hover:bg-[#0a1827]' : 'text-brand-700 border-brand-200 hover:bg-brand-50'}`}>
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
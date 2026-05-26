'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, Download, FileText, Upload, X, ScrollText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
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

  return { INPUT, DISABLED, LABEL, CARD, SEC_BORDER, SEC_TITLE };
}

const SEC = 'col-span-1 md:col-span-2 lg:col-span-4 pt-4 mt-1 border-t first:pt-0 first:mt-0 first:border-t-0';
const FULL = 'col-span-1 md:col-span-2 lg:col-span-4';
const HALF = 'col-span-1 md:col-span-2';

const ALL_CHECKING_FIELDS = [
  'project', 'unit_no', 'name', 'fls_id', 'fls_name', 'login_counter_date',
  'net_sales', 'gross_sales', 'msp', 'msp_amount', 'taken_price', 'discount',
  'msp_land_cost', 'msp_construction_cost',
  'taken_land_cost', 'taken_construction_cost',
  'msp_apartment_cost', 'taken_apartment_cost',
  'msp_custom_amount',
  'offer', 'offer_description',
  'source_taken_lead', 'pushed_date', 'source', 'sub_source', 'iden_date',
  'source_remarks', 'customer_type', 'source_customer_name',
  // SF Lead 1
  'sf_lead_id1', 'sf_lead1_clone', 'sf_lead_id1_owner', 'pushed_date_lead1', 'sf_lead1_walkin_date', 'walkin_project_lead1',
  // SF Lead 2
  'sf_lead2', 'sf_lead2_clone', 'sf_lead_id2_owner', 'pushed_date_lead2', 'sf_lead2_walkin_date', 'walkin_project_lead2',
  // SF Lead 3
  'sf_lead3', 'sf_lead3_clone', 'sf_lead_id3_owner', 'pushed_date_lead3', 'sf_lead3_walkin_date', 'walkin_project_lead3',
  // Sell Do & Walk-in
  'sell_do_lead1', 'sell_do_lead2', 'sell_do_lead3', 'walk_in_date',
  'upfront_details', 'checking_verify_status', 'remarks',
  'region', 'stock', 'pl_team', 'type', 'con', 'swap_from_unit_details',
  'booking_form_date', 'values_amount', 'rs_in_crs', 'booking_form_status', 'form_type',
  'bf_received_date', 'booking_form_received_by_whom', 'hold_date',
  'file_transfer_date', 'file_transfer_details', 'lbc_date',
  'mgr_id', 'mgr_name', 'avp_id', 'avp_name', 'scheme',
  'acknowledgement', 'acknowledgement_remarks',
  'pdc_status', 'pdc_cheque_received', 'pdc_amount', 'pdc_date', 'pdc_cheque_no', 'bank_name_pdc',
  'payment_mode', 'booking_amount', 'cheque_date', 'cheque_no', 'bank_name',
  'payment_confirmation_with_confirmed_date',
  'sent_for_cit_verification_date', 'sf_record_id', 'status_of_cit_verification',
  'verified_by_whom', 'verified_date',
  'phone_number_1', 'phone_number_2', 'phone_number_3', 'phone_number_4',
  'mail_id_1', 'mail_id_2', 'mail_id_3', 'mail_id_4',
  'login_before_cancel_remarks', 'description',
];

const MSP_OPTIONS = [
  { value: 'villa', label: 'Villa' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'others', label: 'Others' },
];
const CUSTOMER_TYPE_OPTIONS = [
  { value: 'Indian', label: 'Indian' },
  { value: 'NRI', label: 'NRI' },
];
const SOURCE_VERIFY_OPTIONS = [
  { value: 'hold', label: 'Hold' },
  { value: 'verified', label: 'Verified' },
];
const CHECKING_VERIFY_OPTIONS = [
  { value: 'verified', label: 'Verified' },
  { value: 'hold', label: 'Hold' },
  { value: 'canceled', label: 'Canceled' },
];
const ACK_OPTIONS = [
  { value: 'mail', label: 'Mail' },
  { value: 'signed', label: 'Signed' },
  { value: 'non-acknowledgement', label: 'Non-Acknowledgement' },
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
const BOOKING_FORM_STATUS_OPTIONS = [
  { value: 'N', label: 'N' },
  { value: 'R', label: 'R' },
];
interface Props {
  initialValues?: any;
  onSubmit: (data: any) => Promise<void>;
  saving: boolean;
  onCancel: () => void;
  recordId?: string;
}
const FORM_TYPE_OPTIONS = [{ value: 'hard copy', label: 'Hard Copy' }];

export default function CheckingForm({ initialValues, onSubmit, saving, onCancel, recordId }: Props) {
  const { isDark } = useFlsTheme();
  const router = useRouter();
  const cls = makeClasses(isDark);

  // const { register, handleSubmit, reset, watch, setValue } = useForm({ defaultValues: initialValues || {} });
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      booking_form_status: 'N',
      ...(initialValues || {}),
    }
  });
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; path: string; size: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Stores remarks typed for each verify status so switching back restores them
  const remarksPerStatusRef = useRef<Record<string, string>>({});

  // ── Dropdown option state (dynamic search — options load on typing) ────────
  const [projectOptions, setProjectOptions] = useState<{ value: string; label: string }[]>([]);
  const [flsOptions, setFlsOptions] = useState<{ value: string; label: string; name: string }[]>([]);
  const [mgrOptions, setMgrOptions] = useState<{ value: string; label: string; name: string }[]>([]);
  const [avpOptions, setAvpOptions] = useState<{ value: string; label: string; name: string }[]>([]);

  // Debounce timers for search
  const projectSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flsSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mgrSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avpSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchProjects = useCallback((q: string) => {
    if (!q.trim()) { setProjectOptions([]); return; }
    if (projectSearchTimer.current) clearTimeout(projectSearchTimer.current);
    projectSearchTimer.current = setTimeout(() => {
      api.get(`/fls-booking/filter-values?fields=project&q=${encodeURIComponent(q)}`).then(r => {
        const vals: string[] = r.data?.data?.project || [];
        setProjectOptions(vals.map(v => ({ value: v, label: v })));
      }).catch(() => { });
    }, 300);
  }, []);

  const searchFls = useCallback((q: string) => {
    if (!q.trim()) { setFlsOptions([]); return; }
    if (flsSearchTimer.current) clearTimeout(flsSearchTimer.current);
    flsSearchTimer.current = setTimeout(() => {
      api.get(`/fls-masters/fls?q=${encodeURIComponent(q)}`).then(r => {
        const rows = r.data?.data || [];
        setFlsOptions(rows.map((x: any) => ({ value: x.fls_id, label: `${x.fls_id} — ${x.fls_name}`, name: x.fls_name })));
      }).catch(() => { });
    }, 300);
  }, []);

  const searchMgr = useCallback((q: string) => {
    if (!q.trim()) { setMgrOptions([]); return; }
    if (mgrSearchTimer.current) clearTimeout(mgrSearchTimer.current);
    mgrSearchTimer.current = setTimeout(() => {
      api.get(`/fls-masters/mgr?q=${encodeURIComponent(q)}`).then(r => {
        const rows = r.data?.data || [];
        setMgrOptions(rows.map((x: any) => ({ value: x.mgr_id, label: `${x.mgr_id} — ${x.mgr_name}`, name: x.mgr_name })));
      }).catch(() => { });
    }, 300);
  }, []);

  const searchAvp = useCallback((q: string) => {
    if (!q.trim()) { setAvpOptions([]); return; }
    if (avpSearchTimer.current) clearTimeout(avpSearchTimer.current);
    avpSearchTimer.current = setTimeout(() => {
      api.get(`/fls-masters/avp?q=${encodeURIComponent(q)}`).then(r => {
        const rows = r.data?.data || [];
        setAvpOptions(rows.map((x: any) => ({ value: x.avp_id, label: `${x.avp_id} — ${x.avp_name}`, name: x.avp_name })));
      }).catch(() => { });
    }, 300);
  }, []);

  // ── Dynamic search for "by whom" fields ─────────────────────────────────
  const [bfReceivedByOptions, setBfReceivedByOptions] = useState<{ value: string; label: string }[]>([]);
  const [verifiedByOptions, setVerifiedByOptions] = useState<{ value: string; label: string }[]>([]);
  const bfReceivedByTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verifiedByTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchBfReceivedBy = useCallback((q: string) => {
    if (!q.trim()) { setBfReceivedByOptions([]); return; }
    if (bfReceivedByTimer.current) clearTimeout(bfReceivedByTimer.current);
    bfReceivedByTimer.current = setTimeout(() => {
      api.get(`/fls-booking/filter-values?fields=booking_form_received_by_whom&q=${encodeURIComponent(q)}`)
        .then(r => {
          const vals: string[] = r.data?.data?.booking_form_received_by_whom || [];
          setBfReceivedByOptions(vals.map(v => ({ value: v, label: v })));
        }).catch(() => { });
    }, 300);
  }, []);

  const searchVerifiedBy = useCallback((q: string) => {
    if (!q.trim()) { setVerifiedByOptions([]); return; }
    if (verifiedByTimer.current) clearTimeout(verifiedByTimer.current);
    verifiedByTimer.current = setTimeout(() => {
      api.get(`/fls-booking/filter-values?fields=verified_by_whom&q=${encodeURIComponent(q)}`)
        .then(r => {
          const vals: string[] = r.data?.data?.verified_by_whom || [];
          setVerifiedByOptions(vals.map(v => ({ value: v, label: v })));
        }).catch(() => { });
    }, 300);
  }, []);

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

  const verifyStatus = watch('checking_verify_status');
  const sourceVerifyStatus = watch('source_verify_status');
  const acknowledgement = watch('acknowledgement');
  const msp = watch('msp');
  const source = watch('source');
  const subSource = watch('sub_source');
  const canVerify = !!(source?.trim() && subSource?.trim());

  // MSP amount fields (Villa)
  const mspLandCost = watch('msp_land_cost');
  const mspConstructionCost = watch('msp_construction_cost');
  // Taken amount fields (Villa)
  const takenLandCost = watch('taken_land_cost');
  const takenConstructionCost = watch('taken_construction_cost');
  // Apartment-only fields
  const mspApartmentCost = watch('msp_apartment_cost');
  const takenApartmentCost = watch('taken_apartment_cost');
  // Others
  const mspCustomAmount = watch('msp_custom_amount');

  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
      // Seed the per-status remarks map with the loaded record's status/remarks
      remarksPerStatusRef.current = {};
      const initStatus = initialValues.checking_verify_status || '';
      if (initStatus) {
        remarksPerStatusRef.current[initStatus] = initialValues.remarks || '';
      }
      if (initialValues.attachments) {
        try { setAttachedFiles(JSON.parse(initialValues.attachments)); } catch { }
      }
      // Pre-populate dropdown option for the currently selected value so it shows correctly in edit mode
      if (initialValues.project) {
        setProjectOptions([{ value: initialValues.project, label: initialValues.project }]);
      }
      if (initialValues.fls_id) {
        lookupMasterName('fls', initialValues.fls_id, 'fls_name');
        setFlsOptions([{ value: initialValues.fls_id, label: `${initialValues.fls_id} — ${initialValues.fls_name || ''}`, name: initialValues.fls_name || '' }]);
      }
      if (initialValues.mgr_id) {
        lookupMasterName('mgr', initialValues.mgr_id, 'mgr_name');
        setMgrOptions([{ value: initialValues.mgr_id, label: `${initialValues.mgr_id} — ${initialValues.mgr_name || ''}`, name: initialValues.mgr_name || '' }]);
      }
      if (initialValues.avp_id) {
        lookupMasterName('avp', initialValues.avp_id, 'avp_name');
        setAvpOptions([{ value: initialValues.avp_id, label: `${initialValues.avp_id} — ${initialValues.avp_name || ''}`, name: initialValues.avp_name || '' }]);
      }
      if (initialValues.booking_form_received_by_whom) {
        setBfReceivedByOptions([{ value: initialValues.booking_form_received_by_whom, label: initialValues.booking_form_received_by_whom }]);
      }
      if (initialValues.verified_by_whom) {
        setVerifiedByOptions([{ value: initialValues.verified_by_whom, label: initialValues.verified_by_whom }]);
      }
    }
  }, [initialValues]);

  // Auto-calculate MSP amount, Taken amount, and Discount
  useEffect(() => {
    if (!msp) return;
    let mspAmount = 0;
    let takenAmount = 0;
    let mspReady = false;
    let takenReady = false;
    if (msp === 'villa') {
      const lc = parseFloat(mspLandCost);
      const cc = parseFloat(mspConstructionCost);
      const tlc = parseFloat(takenLandCost);
      const tcc = parseFloat(takenConstructionCost);
      if (!isNaN(lc) && !isNaN(cc)) { mspAmount = lc + cc; mspReady = true; }
      if (!isNaN(tlc) && !isNaN(tcc)) { takenAmount = tlc + tcc; takenReady = true; }
    } else if (msp === 'apartment') {
      const ac = parseFloat(mspApartmentCost);
      const tac = parseFloat(takenApartmentCost);
      if (!isNaN(ac)) { mspAmount = ac; mspReady = true; }
      if (!isNaN(tac)) { takenAmount = tac; takenReady = true; }
    } else if (msp === 'others') {
      const ca = parseFloat(mspCustomAmount);
      if (!isNaN(ca)) { mspAmount = ca; mspReady = true; }
    }
    setValue('msp_amount', mspReady ? String(parseFloat(mspAmount.toFixed(10))) : '', { shouldDirty: true });
    setValue('taken_price', takenReady ? String(parseFloat(takenAmount.toFixed(10))) : '', { shouldDirty: true });
    if (mspReady && takenReady) {
      const disc = Math.abs(mspAmount - takenAmount);
      setValue('discount', String(parseFloat(disc.toFixed(10))), { shouldDirty: true });
    } else {
      setValue('discount', '', { shouldDirty: true });
    }
  }, [msp, mspLandCost, mspConstructionCost, takenLandCost, takenConstructionCost, mspApartmentCost, takenApartmentCost, mspCustomAmount]);

  const lookupMasterName = async (endpoint: string, id: string, nameField: string) => {
    if (!id?.trim()) { setValue(nameField, ''); return; }
    try {
      const res = await api.get(`/fls-masters/${endpoint}/${encodeURIComponent(id.trim())}`);
      setValue(nameField, res.data?.data?.[nameField] ?? '');
    } catch { setValue(nameField, ''); }
  };

  const upsertMaster = async (endpoint: string, idField: string, nameField: string, idValue: string, nameValue: string) => {
    if (!idValue?.trim() || !nameValue?.trim()) return;
    try {
      await api.post(`/fls-masters/${endpoint}/upsert`, { [idField]: idValue.trim(), [nameField]: nameValue.trim() });
      if (endpoint === 'fls') {
        setFlsOptions(prev => prev.map(o => o.value === idValue ? { ...o, label: `${idValue} — ${nameValue}`, name: nameValue } : o));
      } else if (endpoint === 'mgr') {
        setMgrOptions(prev => prev.map(o => o.value === idValue ? { ...o, label: `${idValue} — ${nameValue}`, name: nameValue } : o));
      } else if (endpoint === 'avp') {
        setAvpOptions(prev => prev.map(o => o.value === idValue ? { ...o, label: `${idValue} — ${nameValue}`, name: nameValue } : o));
      }
    } catch { }
  };

  const submit = async (data: any) => {
    // Validate: remarks required when verify status is hold or canceled
    const newStatus = data.checking_verify_status;
    const prevStatus = initialValues?.checking_verify_status ?? '';
    const statusChanged = newStatus !== prevStatus;
    const remarksValue = (data.remarks || '').trim();

    if (statusChanged && (newStatus === 'hold' || newStatus === 'canceled')) {
      if (!remarksValue) {
        toast.error(
          newStatus === 'hold'
            ? 'Remarks are required when setting status to Hold. Please enter the hold reason.'
            : 'Remarks are required when canceling. Please enter the cancellation reason.'
        );
        // Focus remarks field
        const el = document.querySelector('textarea[name="remarks"]') as HTMLTextAreaElement | null;
        el?.focus();
        return;
      }
    }

    const clean: any = { _module: 'CHECKING' };
    ALL_CHECKING_FIELDS.forEach(k => { clean[k] = data[k] === '' ? null : (data[k] ?? null); });
    clean.attachments = attachedFiles.length ? JSON.stringify(attachedFiles) : null;

    // Attach previous verify status so backend can log status-change with remarks
    if (statusChanged && newStatus) {
      clean._prev_checking_verify_status = prevStatus || null;
      clean._verify_status_remarks = remarksValue || null;
    }

    await onSubmit(clean);
  };

  const sec = (title: string, fields?: string[], subtitle?: string) => (
    <div className={`${SEC} ${cls.SEC_BORDER}`}>
      <div className="flex items-center gap-2">
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${cls.SEC_TITLE}`}>
          {title}{subtitle && <span className="ml-2 font-normal text-brand-400 normal-case">{subtitle}</span>}
        </h3>
        {recordId && fields && fields.length > 0 && (
          <button type="button"
            onClick={() => router.push(`/fls-booking-portal/checking/${recordId}/logs?fields=${fields.join(',')}&section=${encodeURIComponent(title)}&from=edit`)}
            className={`p-0.5 rounded transition-colors ${isDark ? 'text-slate-500 hover:text-blue-400 hover:bg-blue-400/10' : 'text-brand-300 hover:text-brand-600 hover:bg-brand-100'}`}
            title={`View ${title} logs`}>
            <ScrollText className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  const inp = (name: string, label: string, colCls = '') => (
    <div key={name} className={colCls}>
      <label className={cls.LABEL}>{label}</label>
      <input {...register(name)} type="text" className={cls.INPUT} placeholder={label} />
    </div>
  );

  const area = (name: string, label: string, colCls = FULL) => (
    <div key={name} className={colCls}>
      <label className={cls.LABEL}>{label}</label>
      <textarea {...register(name)} rows={2} className={cls.INPUT + ' resize-none'} placeholder={label} />
    </div>
  );

  const dt = (name: string, label: string, colCls = '') => (
    <div key={name} className={colCls}>
      <label className={cls.LABEL}>{label}</label>
      <DarkDatePicker
        value={watch(name) || ''}
        onChange={v => setValue(name, v, { shouldDirty: true })}
        placeholder={label}
        accent="blue"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit(submit)}>
      <div className={cls.CARD}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">

          {sec('Identification', ['project', 'unit_no', 'name', 'fls_id', 'fls_name'])}
          {/* Project — dynamic search dropdown */}
          <div>
            <label className={cls.LABEL}>Project</label>
            <CommonSelect
              options={projectOptions}
              value={watch('project') || ''}
              onChange={v => {
                setValue('project', v, { shouldDirty: true });
                if (v) {
                  setProjectOptions(prev => {
                    if (!prev.some(o => o.value === v)) {
                      return [...prev, { value: v, label: v }];
                    }
                    return prev;
                  });
                }
              }}
              onInputChange={searchProjects}
              isDynamicSearch={true}
              isCreatable={true}
              placeholder="Type to search project..."
            />
          </div>
          {inp('unit_no', 'Unit No')}
          {inp('name', 'Customer Name')}
          {/* FLS ID — dynamic search dropdown */}
          <div>
            <label className={cls.LABEL}>FLS ID</label>
            <CommonSelect
              options={flsOptions}
              value={watch('fls_id') || ''}
              onChange={v => {
                setValue('fls_id', v, { shouldDirty: true });
                if (v) {
                  const match = flsOptions.find(o => o.value === v);
                  setValue('fls_name', match?.name || '', { shouldDirty: true });
                  setFlsOptions(prev => {
                    if (!prev.some(o => o.value === v)) {
                      return [...prev, { value: v, label: `${v} — (New)`, name: '' }];
                    }
                    return prev;
                  });
                } else {
                  setValue('fls_name', '', { shouldDirty: true });
                }
              }}
              onInputChange={searchFls}
              isDynamicSearch={true}
              isCreatable={true}
              placeholder="Type to search FLS ID..."
            />
          </div>
          <div>
            <label className={cls.LABEL}>FLS Name</label>
            <input {...register('fls_name')} type="text" className={cls.INPUT} placeholder="FLS Name"
              onBlur={e => upsertMaster('fls', 'fls_id', 'fls_name', watch('fls_id'), e.target.value)} />
          </div>
          {/* {dt('login_counter_date', 'Login Counter Date')} */}

          {sec('Dates & Values', ['booking_form_date', 'login_counter_date', 'values_amount', 'rs_in_crs', 'net_sales', 'gross_sales', 'booking_form_status', 'form_type', 'msp', 'msp_land_cost', 'msp_construction_cost', 'msp_amount', 'taken_land_cost', 'taken_construction_cost', 'taken_price', 'discount', 'msp_apartment_cost', 'taken_apartment_cost', 'msp_custom_amount', 'offer', 'offer_description'])}
          {dt('booking_form_date', 'Booking Form Date')}
          {dt('login_counter_date', 'Login Counter Date')}
          {inp('values_amount', 'Values')}
          {inp('rs_in_crs', 'Rs in Crs')}
          {inp('net_sales', 'Net Sales')}
          {inp('gross_sales', 'Gross Sales')}
          <div>
            <label className={cls.LABEL}>Booking Form Status</label>
            <CommonSelect
              options={BOOKING_FORM_STATUS_OPTIONS}
              value={watch('booking_form_status') || 'N'}
              onChange={v => setValue('booking_form_status', v, { shouldDirty: true })}
              placeholder="Select Status"
            />
          </div>
          {/* {inp('form_type', 'Form Type')} */}
          <div>
            <label className={cls.LABEL}>
              Form Type<span className="text-red-500 ml-0.5">*</span>
            </label>
            <CommonSelect
              options={FORM_TYPE_OPTIONS}
              value={watch('form_type') || ''}
              onChange={v => setValue('form_type', v, { shouldDirty: true })}
              placeholder="Select Form Type"
            />
          </div>
          {/* MSP — CommonSelect */}
          <div>
            <label className={cls.LABEL}>Category</label>
            <CommonSelect
              options={MSP_OPTIONS}
              value={MSP_OPTIONS.some(o => o.value === watch('msp')) ? watch('msp') : ''}
              onChange={v => setValue('msp', v, { shouldDirty: true })}
              placeholder="Select MSP"
            />
          </div>

          {/* Villa: MSP = Land Cost + Construction Cost, Taken = Land Cost + Construction Cost */}
          {msp === 'villa' && (
            <>
              <div className="col-span-1 md:col-span-2 lg:col-span-4 pt-3 mt-1 border-t border-dashed" style={{ borderColor: 'inherit' }}>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${cls.SEC_TITLE}`}>MSP</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
                  {inp('msp_land_cost', 'Land Cost')}
                  {inp('msp_construction_cost', 'Construction Cost')}
                  <div>
                    <label className={cls.LABEL}>MSP Amount</label>
                    <input {...register('msp_amount')} type="text" readOnly className={cls.DISABLED} placeholder="Auto calculated" />
                  </div>
                </div>
              </div>
              <div className="col-span-1 md:col-span-2 lg:col-span-4 pt-3 mt-1 border-t border-dashed" style={{ borderColor: 'inherit' }}>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${cls.SEC_TITLE}`}>Taken</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
                  {inp('taken_land_cost', 'Land Cost')}
                  {inp('taken_construction_cost', 'Construction Cost')}
                  <div>
                    <label className={cls.LABEL}>Taken Amount </label>
                    <input {...register('taken_price')} type="text" readOnly className={cls.DISABLED} placeholder="Auto calculated" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Apartment: MSP Amount | Taken Amount | Discount — all in one row, no Land/Construction Cost */}
          {msp === 'apartment' && (
            <div className="col-span-1 md:col-span-2 lg:col-span-4 pt-3 mt-1 border-t border-dashed" style={{ borderColor: 'inherit' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
                <div>
                  <label className={cls.LABEL}>MSP Amount</label>
                  <input {...register('msp_apartment_cost')} type="text" className={cls.INPUT}
                    placeholder="MSP Amount" />
                </div>
                <div>
                  <label className={cls.LABEL}>Taken Amount</label>
                  <input {...register('taken_apartment_cost')} type="text" className={cls.INPUT}
                    placeholder="Taken Amount" />
                </div>
                {(watch('msp_apartment_cost') && watch('taken_apartment_cost')) ? (
                  <div>
                    <label className={cls.LABEL}>Discount</label>
                    <input {...register('discount')} type="text" readOnly className={cls.DISABLED} placeholder="Auto calculated" />
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {msp === 'others' && inp('msp_custom_amount', 'MSP Custom Amount')}

          {/* Discount for Villa — only shown when both msp_amount and taken_price are calculated */}
          {msp === 'villa' && watch('msp_amount') && watch('taken_price') ? (
            <div>
              <label className={cls.LABEL}>Discount </label>
              <input {...register('discount')} type="text" readOnly className={cls.DISABLED} placeholder="Auto calculated" />
            </div>
          ) : null}

          {inp('offer', 'Offer')}
          {area('offer_description', 'Offer Description', HALF)}

          {sec('Source Details', ['source_taken_lead', 'pushed_date', 'source', 'sub_source', 'iden_date', 'source_remarks'])}
          {inp('source_taken_lead', 'Source Taken Lead')}
          {dt('pushed_date', 'Pushed Date')}
          {/* {inp('source', 'Source')} */}
          {/* Source — CommonSelect (theme-aware) */}
          <CommonSelect
            label="Source"
            options={SOURCE_OPTIONS}
            value={watch('source') || ''}
            onChange={v => setValue('source', v, { shouldDirty: true })}
            placeholder="Select Source"
          />
          {inp('sub_source', 'Sub Source')}
          {dt('iden_date', 'Iden Date')}
          {area('source_remarks', 'Source Remarks')}

          {/* Customer Type — CommonSelect */}
          {/* <div>
            <label className={cls.LABEL}>Customer Type</label>
            <CommonSelect
              options={CUSTOMER_TYPE_OPTIONS}
              value={watch('customer_type') || ''}
              onChange={v => setValue('customer_type', v, { shouldDirty: true })}
              placeholder="Select Type"
            />
          </div> */}
          {/* {inp('source_customer_name', 'Customer Name', HALF)} */}

          {sec('SF Lead 1', ['sf_lead_id1', 'sf_lead1_clone', 'sf_lead_id1_owner', 'pushed_date_lead1', 'sf_lead1_walkin_date', 'walkin_project_lead1'])}
          {inp('sf_lead_id1', 'SF Lead ID 1')}
          {inp('sf_lead1_clone', 'SF Lead 1 Clone')}
          {inp('sf_lead_id1_owner', 'SF Lead ID 1 Owner')}
          {dt('pushed_date_lead1', 'Pushed Date (Lead 1)')}
          {dt('sf_lead1_walkin_date', 'SF Lead 1 Walk-in Date')}
          {inp('walkin_project_lead1', 'Walk-in Project (Lead 1)')}

          {sec('SF Lead 2', ['sf_lead2', 'sf_lead2_clone', 'sf_lead_id2_owner', 'pushed_date_lead2', 'sf_lead2_walkin_date', 'walkin_project_lead2'])}
          {inp('sf_lead2', 'SF Lead 2')}
          {inp('sf_lead2_clone', 'SF Lead 2 Clone')}
          {inp('sf_lead_id2_owner', 'SF Lead ID 2 Owner')}
          {dt('pushed_date_lead2', 'Pushed Date (Lead 2)')}
          {dt('sf_lead2_walkin_date', 'SF Lead 2 Walk-in Date')}
          {inp('walkin_project_lead2', 'Walk-in Project (Lead 2)')}

          {sec('SF Lead 3', ['sf_lead3', 'sf_lead3_clone', 'sf_lead_id3_owner', 'pushed_date_lead3', 'sf_lead3_walkin_date', 'walkin_project_lead3'])}
          {inp('sf_lead3', 'SF Lead 3')}
          {inp('sf_lead3_clone', 'SF Lead 3 Clone')}
          {inp('sf_lead_id3_owner', 'SF Lead ID 3 Owner')}
          {dt('pushed_date_lead3', 'Pushed Date (Lead 3)')}
          {dt('sf_lead3_walkin_date', 'SF Lead 3 Walk-in Date')}
          {inp('walkin_project_lead3', 'Walk-in Project (Lead 3)')}

          {sec('Sell Do Leads & Walk-in', ['sell_do_lead1', 'sell_do_lead2', 'sell_do_lead3', 'walk_in_date', 'lead_remarks'])}
          {inp('sell_do_lead1', 'Sell Do Lead 1')}
          {inp('sell_do_lead2', 'Sell Do Lead 2')}
          {inp('sell_do_lead3', 'Sell Do Lead 3')}
          {dt('walk_in_date', 'Walk In Date')}

          {sec('Upfront & Verification', ['upfront_details', 'checking_verify_status', 'remarks'])}
          {area('upfront_details', 'Upfront Details')}

          {/* Checking Verify Status — CommonSelect */}
          <div>
            <label className={cls.LABEL}>Checking Verify Status</label>
            <CommonSelect
              options={CHECKING_VERIFY_OPTIONS.map(o =>
                o.value === 'verified' && !canVerify
                  ? { ...o, label: o.label + ' (fill Source & Sub Source first)', isDisabled: true } as any
                  : o
              )}
              value={watch('checking_verify_status') || ''}
              onChange={v => {
                const prevStatus = watch('checking_verify_status') || '';
                // Save current remarks under the status being left
                if (prevStatus) {
                  remarksPerStatusRef.current[prevStatus] = watch('remarks') || '';
                }
                setValue('checking_verify_status', v, { shouldDirty: true });
                // Restore remarks for the new status, or clear if never set
                setValue('remarks', remarksPerStatusRef.current[v] ?? '', { shouldDirty: true });
              }}
              placeholder="Select Status"
            />
            {!canVerify && <p className="text-[10px] text-amber-600 mt-1">Source &amp; Sub Source required before verifying</p>}
          </div>

          <div className={FULL}>
            <label className={cls.LABEL}>
              Remarks {(verifyStatus === 'hold' || verifyStatus === 'canceled') && <span className="text-red-400">*</span>}
            </label>
            <textarea
              {...register('remarks')}
              rows={2}
              className={cls.INPUT + ' resize-none'}
              placeholder={
                verifyStatus === 'canceled' ? 'Cancellation reason (required)' :
                  verifyStatus === 'hold' ? 'Hold reason (required)' : 'Remarks'
              }
            />
          </div>

          {sec('Booking Info')}
          {inp('region', 'Region')}
          {inp('stock', 'Stock')}
          {inp('pl_team', 'P & L Team')}
          {inp('type', 'Type')}
          {inp('con', 'CON')}
          {area('swap_from_unit_details', 'Swap From Unit Details')}

          {sec('Booking Dates & Values')}
          {/* {dt('booking_form_date', 'Booking Form Date')} */}
          {/* {inp('values_amount', 'Values')} */}
          {/* {inp('rs_in_crs', 'Rs in Crs')} */}
          {/* {inp('booking_form_status', 'Booking Form Status')} */}
          {/* <div>
            <label className={cls.LABEL}>Booking Form Status</label>
            <CommonSelect
              options={BOOKING_FORM_STATUS_OPTIONS}
              value={watch('booking_form_status') || 'N'}
              onChange={v => setValue('booking_form_status', v, { shouldDirty: true })}
              placeholder="Select Status"
            />
          </div>
          {inp('form_type', 'Form Type')} */}

          {/* {sec('Booking Form Details')}
          {dt('bf_received_date', 'BF Received Date')}
          <div>
            <label className={cls.LABEL}>BF Received By Whom</label>
            <CommonSelect
              options={bfReceivedByOptions}
              value={watch('booking_form_received_by_whom') || ''}
              onChange={v => setValue('booking_form_received_by_whom', v, { shouldDirty: true })}
              onInputChange={searchBfReceivedBy}
              isDynamicSearch={true}
              isCreatable={true}
              placeholder="Type to search or enter name..."
            />
          </div>
          {dt('hold_date', 'Hold Date')}
          {dt('file_transfer_date', 'File Transfer Date')}
          {area('file_transfer_details', 'File Transfer Details')} */}
          {/* {dt('lbc_date', 'LBC Date')} */}

          {sec('FLS & Manager Info')}
          {/* Manager ID — dynamic search dropdown */}
          <div>
            <label className={cls.LABEL}>Manager ID</label>
            <CommonSelect
              options={mgrOptions}
              value={watch('mgr_id') || ''}
              onChange={v => {
                setValue('mgr_id', v, { shouldDirty: true });
                if (v) {
                  const match = mgrOptions.find(o => o.value === v);
                  setValue('mgr_name', match?.name || '', { shouldDirty: true });
                  setMgrOptions(prev => {
                    if (!prev.some(o => o.value === v)) {
                      return [...prev, { value: v, label: `${v} — (New)`, name: '' }];
                    }
                    return prev;
                  });
                } else {
                  setValue('mgr_name', '', { shouldDirty: true });
                }
              }}
              onInputChange={searchMgr}
              isDynamicSearch={true}
              isCreatable={true}
              placeholder="Type to search Manager ID..."
            />
          </div>
          <div>
            <label className={cls.LABEL}>Manager Name</label>
            <input {...register('mgr_name')} type="text" className={cls.INPUT} placeholder="Manager Name"
              onBlur={e => upsertMaster('mgr', 'mgr_id', 'mgr_name', watch('mgr_id'), e.target.value)} />
          </div>
          {/* AVP ID — dynamic search dropdown */}
          <div>
            <label className={cls.LABEL}>AVP ID</label>
            <CommonSelect
              options={avpOptions}
              value={watch('avp_id') || ''}
              onChange={v => {
                setValue('avp_id', v, { shouldDirty: true });
                if (v) {
                  const match = avpOptions.find(o => o.value === v);
                  setValue('avp_name', match?.name || '', { shouldDirty: true });
                  setAvpOptions(prev => {
                    if (!prev.some(o => o.value === v)) {
                      return [...prev, { value: v, label: `${v} — (New)`, name: '' }];
                    }
                    return prev;
                  });
                } else {
                  setValue('avp_name', '', { shouldDirty: true });
                }
              }}
              onInputChange={searchAvp}
              isDynamicSearch={true}
              isCreatable={true}
              placeholder="Type to search AVP ID..."
            />
          </div>
          <div>
            <label className={cls.LABEL}>AVP Name</label>
            <input {...register('avp_name')} type="text" className={cls.INPUT} placeholder="AVP Name"
              onBlur={e => upsertMaster('avp', 'avp_id', 'avp_name', watch('avp_id'), e.target.value)} />
          </div>
          {inp('scheme', 'Scheme')}

          {/* Acknowledgement — CommonSelect */}
          <div>
            <label className={cls.LABEL}>Acknowledgement</label>
            <CommonSelect
              options={ACK_OPTIONS}
              value={watch('acknowledgement') || ''}
              onChange={v => setValue('acknowledgement', v, { shouldDirty: true })}
              placeholder="Select"
            />
          </div>
          {acknowledgement === 'non-acknowledgement' && (
            <div className={HALF}>
              <label className={cls.LABEL}>Acknowledgement Remarks</label>
              <textarea {...register('acknowledgement_remarks')} rows={2} className={cls.INPUT + ' resize-none'} placeholder="Acknowledgement Remarks" />
            </div>
          )}

          {/* {sec('PDC Details')}
          {inp('pdc_status', 'PDC Status')}
          {inp('pdc_cheque_received', 'PDC Cheque Received')}
          {inp('pdc_amount', 'PDC Amount')}
          {dt('pdc_date', 'PDC Date')}
          {inp('pdc_cheque_no', 'PDC Cheque No')}
          {inp('bank_name_pdc', 'Bank Name (PDC)')} */}

          {sec('Payment Details')}
          {inp('payment_mode', 'Payment Mode')}
          {inp('booking_amount', 'Booking Amount')}
          {dt('cheque_date', 'Cheque Date')}
          {inp('cheque_no', 'Cheque No')}
          {inp('bank_name', 'Bank Name')}
          {area('payment_confirmation_with_confirmed_date', 'Payment Confirmation with Date', HALF)}

          {/* {sec('CIT Verification')}
          {dt('sent_for_cit_verification_date', 'Sent for CIT Verification Date')}
          {inp('sf_record_id', 'SF Record ID')}
          {inp('status_of_cit_verification', 'Status of CIT Verification')}
          <div>
            <label className={cls.LABEL}>Verified By Whom</label>
            <CommonSelect
              options={verifiedByOptions}
              value={watch('verified_by_whom') || ''}
              onChange={v => setValue('verified_by_whom', v, { shouldDirty: true })}
              onInputChange={searchVerifiedBy}
              isDynamicSearch={true}
              isCreatable={true}
              placeholder="Type to search or enter name..."
            />
          </div>
          {dt('verified_date', 'Verified Date')} */}

          {/* {sec('Contact Info')}
          {inp('phone_number_1', 'Phone Number 1')}
          {inp('phone_number_2', 'Phone Number 2')}
          {inp('phone_number_3', 'Phone Number 3')}
          {inp('phone_number_4', 'Phone Number 4')}
          {inp('mail_id_1', 'Mail ID 1')}
          {inp('mail_id_2', 'Mail ID 2')}
          {inp('mail_id_3', 'Mail ID 3')}
          {inp('mail_id_4', 'Mail ID 4')} */}

          {sec('Booking Remarks')}
          {area('login_before_cancel_remarks', 'Login Before Cancel / Relogin Remarks')}

          {sec('Description & Attachments')}
          {area('description', 'Description')}

          <div className={FULL}>
            <label className={cls.LABEL}>Attachments</label>
            <div className="space-y-3">
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 transition-colors
                  ${isDark ? 'border-[#1e3a55]' : 'border-brand-200'}
                  ${uploading ? 'opacity-50 cursor-not-allowed' : `cursor-pointer ${isDark ? 'hover:border-blue-500 hover:bg-[#0a1827]' : 'hover:border-brand-400 hover:bg-brand-50'}`}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#0a1827]' : 'bg-brand-50'}`}>
                  {uploading
                    ? <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDark ? 'border-slate-600 border-t-blue-400' : 'border-brand-200 border-t-brand-600'}`} />
                    : <Upload className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-brand-500'}`} />
                  }
                </div>
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-brand-600'}`}>{uploading ? 'Uploading...' : 'Click to upload files'}</p>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-brand-400'}`}>Multiple files supported · Max 50MB each</p>
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
                      <div key={idx} className={`flex items-center gap-3 border rounded-lg px-3 py-2.5 group ${isDark ? 'bg-[#0a1827] border-[#1e3a55]' : 'bg-white border-brand-100'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-[#0d1f33]' : 'bg-brand-50'}`}>
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

      <div className="mt-4 flex items-center gap-3">
        {recordId && (
          <button type="button"
            onClick={() => router.push(`/fls-booking-portal/checking/${recordId}/logs?module=CHECKING&from=edit`)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm border rounded-lg transition-colors ${isDark ? 'text-slate-300 border-[#1e3a55] hover:bg-[#0a1827]' : 'text-brand-700 border-brand-200 hover:bg-brand-50'}`}
            title="View Checking Logs">
            <ScrollText className="w-4 h-4" />
            Logs
          </button>
        )}
        <div className="flex-1" />
        <button type="button" onClick={onCancel}
          className={`px-5 py-2 text-sm border rounded-lg transition-colors ${isDark ? 'text-slate-300 border-[#1e3a55] hover:bg-[#0a1827]' : 'text-brand-700 border-brand-200 hover:bg-brand-50'}`}>
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
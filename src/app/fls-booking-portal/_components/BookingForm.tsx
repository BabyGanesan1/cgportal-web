'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Upload, FileText, Eye, Download, ScrollText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import DarkDatePicker from './DarkDatePicker';
import CommonSelect from './CommonSelect';
import { useFlsTheme } from './FlsThemeContext';

// ── Light / Dark class helpers ──────────────────────────────────────────────
function makeClasses(isDark: boolean) {
  const INPUT = isDark
    ? 'w-full bg-[#0d1f33] border border-[#1e3a55] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors'
    : 'w-full bg-white border border-brand-200 rounded-lg px-3 py-2 text-sm text-brand-800 placeholder-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors';

  const INPUT_ERR = isDark
    ? 'w-full bg-[#0d1f33] border border-red-500 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors'
    : 'w-full bg-white border border-red-400 rounded-lg px-3 py-2 text-sm text-brand-800 placeholder-brand-300 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors';

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

  const WARN_BG = isDark ? 'bg-amber-900/30 border-amber-700 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700';

  return { INPUT, INPUT_ERR, DISABLED, LABEL, CARD, SEC_BORDER, SEC_TITLE, WARN_BG };
}

const SEC = 'col-span-1 md:col-span-2 lg:col-span-4 pt-4 mt-1 border-t first:pt-0 first:mt-0 first:border-t-0';
const FULL = 'col-span-1 md:col-span-2 lg:col-span-4';
const HALF = 'col-span-1 md:col-span-2';

const DEFAULTS = {
  net_sales: 'L',
  gross_sales: 'L',
  booking_form_status: 'N',
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
  'phone_number_1',
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
  recordId?: string;
}

// ── Select option lists ─────────────────────────────────────────────────────
const BOOKING_STATUS_OPTIONS = [{ value: 'N', label: 'N' }, { value: 'R', label: 'R' }];
const FORM_TYPE_OPTIONS = [{ value: 'hard copy', label: 'Hard Copy' }];
const ACK_OPTIONS = [
  { value: 'mail', label: 'Mail' },
  { value: 'signed', label: 'Signed' },
  { value: 'non-acknowledgement', label: 'Non-Acknowledgement' },
];

export default function BookingForm({ initialValues, onSubmit, saving, onCancel, recordId }: Props) {
  const { isDark } = useFlsTheme();
  const router = useRouter();
  const cls = makeClasses(isDark);

  const { register, handleSubmit, reset, watch, setValue, setError, clearErrors, formState: { errors } } = useForm({
    defaultValues: { ...DEFAULTS, ...(initialValues || {}) },
  });
  const [attachedFiles, setAttachedFiles] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const acknowledgement = watch('acknowledgement');
  const checkingVerified = initialValues?.checking_verify_status === 'verified';

  useEffect(() => {
    if (initialValues) {
      reset({ ...DEFAULTS, ...initialValues });
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

  const reqStar = (name: string) =>
    REQUIRED_FIELDS.has(name) ? <span className="text-red-500 ml-0.5">*</span> : null;

  const errMsg = (name: string) => {
    const e = (errors as any)[name];
    return e ? <p className="text-xs text-red-500 mt-0.5">{e.message}</p> : null;
  };

  const iCls = (name: string) =>
    checkingVerified ? cls.DISABLED : ((errors as any)[name] ? cls.INPUT_ERR : cls.INPUT);

  const f = (name: string, label: string, colCls = '') => {
    const req = REQUIRED_FIELDS.has(name);
    return (
      <div key={name} className={colCls}>
        <label className={cls.LABEL}>{label}{reqStar(name)}</label>
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

  const fd = (name: string, label: string, colCls = '') => {
    const err = (errors as any)[name];
    return (
      <div key={name} className={colCls}>
        <label className={cls.LABEL}>{label}{reqStar(name)}</label>
        {checkingVerified
          ? <input {...register(name)} disabled className={cls.DISABLED} />
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

  const fa = (name: string, label: string, colCls = FULL) => {
    const req = REQUIRED_FIELDS.has(name);
    return (
      <div key={name} className={colCls}>
        <label className={cls.LABEL}>{label}{reqStar(name)}</label>
        <textarea
          {...register(name, req ? { required: `${label} is required` } : {})}
          rows={2}
          className={(checkingVerified ? cls.DISABLED : ((errors as any)[name] ? cls.INPUT_ERR : cls.INPUT)) + ' resize-none'}
          placeholder={label}
          disabled={checkingVerified}
        />
        {errMsg(name)}
      </div>
    );
  };

  const sec = (title: string, fields?: string[]) => (
    <div className={`${SEC} ${cls.SEC_BORDER}`}>
      <div className="flex items-center gap-2">
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${cls.SEC_TITLE}`}>{title}</h3>
        {recordId && fields && fields.length > 0 && (
          <button type="button"
            onClick={() => router.push(`/fls-booking-portal/booking/${recordId}/logs?fields=${fields.join(',')}&section=${encodeURIComponent(title)}&from=edit`)}
            className={`p-0.5 rounded transition-colors ${isDark ? 'text-slate-500 hover:text-blue-400 hover:bg-blue-400/10' : 'text-brand-300 hover:text-brand-600 hover:bg-brand-100'}`}
            title={`View ${title} logs`}>
            <ScrollText className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  // CommonSelect wrapper — respects checkingVerified lock, hasError, and theme automatically
  const sel = (
    name: string,
    label: string,
    options: { value: string; label: string }[],
    colCls = ''
  ) => {
    const req = REQUIRED_FIELDS.has(name);
    const err = (errors as any)[name];
    return (
      <div key={name} className={colCls}>
        <CommonSelect
          label={`${label}${req ? '' : ''}`}
          options={options}
          value={watch(name) || ''}
          onChange={v => {
            setValue(name, v, { shouldDirty: true });
            if (v && req) clearErrors(name as any);
          }}
          placeholder={`Select ${label}`}
          disabled={checkingVerified}
          hasError={!!err}
        />
        {/* required star in label is handled below */}
        {req && (
          // Inject * into the label rendered by CommonSelect via a sibling approach — easiest to do with a wrapper override
          <></>
        )}
        {err && <p className="text-xs text-red-500 mt-0.5">{err.message}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(submit)}>
      {checkingVerified && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-3 border rounded-lg text-sm ${cls.WARN_BG}`}>
          <span className="font-semibold">Locked:</span>
          <span>Checking is verified — booking fields are read-only.</span>
        </div>
      )}

      <div className={cls.CARD}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">

          {sec('Project & Unit Info', ['project', 'region', 'stock', 'pl_team', 'type', 'con', 'unit_no', 'name', 'swap_from_unit_details'])}
          {/* Project — dynamic search dropdown */}
          <div>
            <label className={cls.LABEL}>Project{reqStar('project')}</label>
            <CommonSelect
              options={projectOptions}
              value={watch('project') || ''}
              onChange={v => {
                setValue('project', v, { shouldDirty: true });
                if (v) {
                  clearErrors('project' as any);
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
              disabled={checkingVerified}
              hasError={!!(errors as any).project}
            />
            {errMsg('project')}
          </div>
          {f('region', 'Region')}
          {f('stock', 'Stock')}
          {f('pl_team', 'P & L Team')}
          {f('type', 'Type')}
          {f('con', 'CON')}
          {f('unit_no', 'Unit No')}
          {f('name', 'Customer Name')}
          {fa('swap_from_unit_details', 'Swap From Unit Details')}

          {sec('Dates & Values', ['booking_form_date', 'login_counter_date', 'values_amount', 'rs_in_crs', 'net_sales', 'gross_sales', 'booking_form_status', 'form_type'])}
          {fd('booking_form_date', 'Booking Form Date')}
          {fd('login_counter_date', 'Login Counter Date')}
          {f('values_amount', 'Values')}
          {f('rs_in_crs', 'Rs in Crs')}
          {f('net_sales', 'Net Sales')}
          {f('gross_sales', 'Gross Sales')}

          {/* Booking Form Status — CommonSelect */}
          {/* {f('booking_form_status', 'Booking Form Status')} */}
          <div>
            <label className={cls.LABEL}>
              Booking Form Status<span className="text-red-500 ml-0.5">*</span>
            </label>

            <CommonSelect
              options={BOOKING_STATUS_OPTIONS}
              value={watch('booking_form_status') || 'N'}
              onChange={v => {
                setValue('booking_form_status', v, { shouldDirty: true });
                if (v) clearErrors('booking_form_status' as any);
              }}
              placeholder="Select Status"
              disabled={checkingVerified}
              hasError={!!(errors as any).booking_form_status}
            />

            {errMsg('booking_form_status')}
          </div>
          {/* <div>
            <label className={cls.LABEL}>
              Booking Form Status<span className="text-red-500 ml-0.5">*</span>
            </label>
            <CommonSelect
              options={BOOKING_STATUS_OPTIONS}
              value={watch('booking_form_status') || 'N'}
              onChange={v => setValue('booking_form_status', v, { shouldDirty: true })}
              placeholder="Select Status"
              disabled={checkingVerified}
              hasError={!!(errors as any).booking_form_status}
            />
            {errMsg('booking_form_status')}
          </div> */}

          {/* Form Type — CommonSelect */}
          <div>
            <label className={cls.LABEL}>
              Form Type<span className="text-red-500 ml-0.5">*</span>
            </label>
            <CommonSelect
              options={FORM_TYPE_OPTIONS}
              value={watch('form_type') || ''}
              onChange={v => setValue('form_type', v, { shouldDirty: true })}
              placeholder="Select Form Type"
              disabled={checkingVerified}
              hasError={!!(errors as any).form_type}
            />
            {errMsg('form_type')}
          </div>

          {sec('Booking Form Details', ['bf_received_date', 'booking_form_received_by_whom', 'hold_date', 'file_transfer_details', 'file_transfer_date', 'lbc_date'])}
          {fd('bf_received_date', 'BF Received Date')}
          {/* BF Received By Whom — dynamic search + free-text */}
          <div>
            <label className={cls.LABEL}>BF Received By Whom{reqStar('booking_form_received_by_whom')}</label>
            <CommonSelect
              options={bfReceivedByOptions}
              value={watch('booking_form_received_by_whom') || ''}
              onChange={v => {
                setValue('booking_form_received_by_whom', v, { shouldDirty: true });
                if (v) clearErrors('booking_form_received_by_whom' as any);
              }}
              onInputChange={searchBfReceivedBy}
              isDynamicSearch={true}
              isCreatable={true}
              placeholder="Type to search or enter name..."
              disabled={checkingVerified}
              hasError={!!(errors as any).booking_form_received_by_whom}
            />
            {errMsg('booking_form_received_by_whom')}
          </div>
          {fd('hold_date', 'Hold Date')}
          {fd('file_transfer_date', 'File Transfer Date')}
          {fa('file_transfer_details', 'File Transfer Details')}
          {fd('lbc_date', 'LBC Date')}

          {sec('FLS & Manager Info', ['fls_id', 'fls_name', 'mgr_id', 'mgr_name', 'avp_id', 'avp_name', 'scheme', 'acknowledgement', 'acknowledgement_remarks'])}

          {/* FLS ID — dynamic search dropdown */}
          <div>
            <label className={cls.LABEL}>FLS ID<span className="text-red-500 ml-0.5">*</span></label>
            <CommonSelect
              options={flsOptions}
              value={watch('fls_id') || ''}
              onChange={v => {
                setValue('fls_id', v, { shouldDirty: true });
                if (v) {
                  clearErrors('fls_id' as any);
                  const match = flsOptions.find(o => o.value === v);
                  setValue('fls_name', match?.name || '', { shouldDirty: true });
                  if (match?.name) clearErrors('fls_name' as any);
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
              disabled={checkingVerified}
              hasError={!!(errors as any).fls_id}
            />
            {errMsg('fls_id')}
          </div>
          <div>
            <label className={cls.LABEL}>FLS Name<span className="text-red-500 ml-0.5">*</span></label>
            <input
              {...register('fls_name', { required: 'FLS Name is required' })}
              type="text" className={iCls('fls_name')} placeholder="FLS Name"
              disabled={checkingVerified}
              onBlur={e => !checkingVerified && upsertMaster('fls', 'fls_id', 'fls_name', watch('fls_id'), e.target.value)}
            />
            {errMsg('fls_name')}
          </div>

          {/* Manager ID — dynamic search dropdown */}
          <div>
            <label className={cls.LABEL}>Manager ID<span className="text-red-500 ml-0.5">*</span></label>
            <CommonSelect
              options={mgrOptions}
              value={watch('mgr_id') || ''}
              onChange={v => {
                setValue('mgr_id', v, { shouldDirty: true });
                if (v) {
                  clearErrors('mgr_id' as any);
                  const match = mgrOptions.find(o => o.value === v);
                  setValue('mgr_name', match?.name || '', { shouldDirty: true });
                  if (match?.name) clearErrors('mgr_name' as any);
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
              disabled={checkingVerified}
              hasError={!!(errors as any).mgr_id}
            />
            {errMsg('mgr_id')}
          </div>
          <div>
            <label className={cls.LABEL}>Manager Name<span className="text-red-500 ml-0.5">*</span></label>
            <input
              {...register('mgr_name', { required: 'Manager Name is required' })}
              type="text" className={iCls('mgr_name')} placeholder="Manager Name"
              disabled={checkingVerified}
              onBlur={e => !checkingVerified && upsertMaster('mgr', 'mgr_id', 'mgr_name', watch('mgr_id'), e.target.value)}
            />
            {errMsg('mgr_name')}
          </div>

          {/* AVP ID — dynamic search dropdown */}
          <div>
            <label className={cls.LABEL}>AVP ID<span className="text-red-500 ml-0.5">*</span></label>
            <CommonSelect
              options={avpOptions}
              value={watch('avp_id') || ''}
              onChange={v => {
                setValue('avp_id', v, { shouldDirty: true });
                if (v) {
                  clearErrors('avp_id' as any);
                  const match = avpOptions.find(o => o.value === v);
                  setValue('avp_name', match?.name || '', { shouldDirty: true });
                  if (match?.name) clearErrors('avp_name' as any);
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
              disabled={checkingVerified}
              hasError={!!(errors as any).avp_id}
            />
            {errMsg('avp_id')}
          </div>
          <div>
            <label className={cls.LABEL}>AVP Name<span className="text-red-500 ml-0.5">*</span></label>
            <input
              {...register('avp_name', { required: 'AVP Name is required' })}
              type="text" className={iCls('avp_name')} placeholder="AVP Name"
              disabled={checkingVerified}
              onBlur={e => !checkingVerified && upsertMaster('avp', 'avp_id', 'avp_name', watch('avp_id'), e.target.value)}
            />
            {errMsg('avp_name')}
          </div>
          {f('scheme', 'Scheme')}

          {/* Acknowledgement — CommonSelect */}
          <div>
            <label className={cls.LABEL}>
              Acknowledgement<span className="text-red-500 ml-0.5">*</span>
            </label>
            <CommonSelect
              options={ACK_OPTIONS}
              value={watch('acknowledgement') || ''}
              onChange={v => setValue('acknowledgement', v, { shouldDirty: true })}
              placeholder="Select"
              disabled={checkingVerified}
              hasError={!!(errors as any).acknowledgement}
            />
            {errMsg('acknowledgement')}
          </div>
          {acknowledgement === 'non-acknowledgement' && (
            <div className={HALF}>
              <label className={cls.LABEL}>Acknowledgement Remarks</label>
              <textarea
                {...register('acknowledgement_remarks')}
                rows={2}
                className={(checkingVerified ? cls.DISABLED : cls.INPUT) + ' resize-none'}
                placeholder="Acknowledgement Remarks"
                disabled={checkingVerified}
              />
            </div>
          )}

          {sec('PDC Details', ['pdc_status', 'pdc_cheque_received', 'pdc_amount', 'pdc_date', 'pdc_cheque_no', 'bank_name_pdc'])}
          {f('pdc_status', 'PDC Status')}
          {f('pdc_cheque_received', 'PDC Cheque Received')}
          {f('pdc_amount', 'PDC Amount')}
          {fd('pdc_date', 'PDC Date')}
          {f('pdc_cheque_no', 'PDC Cheque No')}
          {f('bank_name_pdc', 'Bank Name (PDC)')}

          {sec('Payment Details', ['payment_mode', 'payment_confirmation_with_confirmed_date', 'booking_amount', 'cheque_date', 'cheque_no', 'bank_name'])}
          {f('payment_mode', 'Payment Mode')}
          {f('booking_amount', 'Booking Amount')}
          {fd('cheque_date', 'Cheque Date')}
          {f('cheque_no', 'Cheque No')}
          {f('bank_name', 'Bank Name')}
          {fa('payment_confirmation_with_confirmed_date', 'Payment Confirmation with Date', HALF)}

          {sec('CIT Verification', ['sent_for_cit_verification_date', 'sf_record_id', 'status_of_cit_verification', 'verified_by_whom', 'verified_date'])}
          {fd('sent_for_cit_verification_date', 'Sent for CIT Verification Date')}
          {f('sf_record_id', 'SF Record ID')}
          {f('status_of_cit_verification', 'Status of CIT Verification')}
          {/* Verified By Whom — dynamic search + free-text */}
          <div>
            <label className={cls.LABEL}>Verified By Whom{reqStar('verified_by_whom')}</label>
            <CommonSelect
              options={verifiedByOptions}
              value={watch('verified_by_whom') || ''}
              onChange={v => {
                setValue('verified_by_whom', v, { shouldDirty: true });
                if (v) clearErrors('verified_by_whom' as any);
              }}
              onInputChange={searchVerifiedBy}
              isDynamicSearch={true}
              isCreatable={true}
              placeholder="Type to search or enter name..."
              disabled={checkingVerified}
              hasError={!!(errors as any).verified_by_whom}
            />
            {errMsg('verified_by_whom')}
          </div>
          {fd('verified_date', 'Verified Date')}

          {sec('Contact Info', ['phone_number_1', 'phone_number_2', 'phone_number_3', 'phone_number_4', 'mail_id_1', 'mail_id_2', 'mail_id_3', 'mail_id_4'])}
          {f('phone_number_1', 'Phone Number 1')}
          {f('phone_number_2', 'Phone Number 2')}
          {f('phone_number_3', 'Phone Number 3')}
          {f('phone_number_4', 'Phone Number 4')}
          {f('mail_id_1', 'Mail ID 1')}
          {f('mail_id_2', 'Mail ID 2')}
          {f('mail_id_3', 'Mail ID 3')}
          {f('mail_id_4', 'Mail ID 4')}

          {sec('Remarks', ['remarks', 'login_before_cancel_remarks'])}
          {fa('remarks', 'Remarks')}
          {fa('login_before_cancel_remarks', 'Login Before Cancel / Relogin Remarks')}

          {sec('Description & Attachments', ['description', 'attachments'])}
          <div className={FULL}>
            <label className={cls.LABEL}>Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className={cls.INPUT + ' resize-none'}
              placeholder="Enter description or additional notes..."
            />
          </div>

          <div className={FULL}>
            <label className={cls.LABEL}>Attachments</label>
            <div className="space-y-3">
              <div
                onClick={() => !uploading && !checkingVerified && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 transition-colors
                  ${isDark ? 'border-[#1e3a55]' : 'border-brand-200'}
                  ${(uploading || checkingVerified) ? 'opacity-50 cursor-not-allowed' : `cursor-pointer ${isDark ? 'hover:border-blue-500 hover:bg-[#0a1827]' : 'hover:border-brand-400 hover:bg-brand-50'}`}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#0a1827]' : 'bg-brand-50'}`}>
                  {uploading
                    ? <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDark ? 'border-slate-600 border-t-blue-400' : 'border-brand-200 border-t-brand-600'}`} />
                    : <Upload className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-brand-500'}`} />
                  }
                </div>
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-brand-600'}`}>
                  {uploading ? 'Uploading...' : 'Click to upload files'}
                </p>
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
                          {!checkingVerified && (
                            <button type="button" onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                              className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Remove">
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

      <div className="mt-4 flex items-center gap-3">
        {recordId && (
          <button type="button"
            onClick={() => router.push(`/fls-booking-portal/booking/${recordId}/logs?module=BOOKING&from=edit`)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm border rounded-lg transition-colors ${isDark ? 'text-slate-300 border-[#1e3a55] hover:bg-[#0a1827]' : 'text-brand-700 border-brand-200 hover:bg-brand-50'}`}
            title="View Booking Logs">
            <ScrollText className="w-4 h-4" />
            Logs
          </button>
        )}
        <div className="flex-1" />
        <button type="button" onClick={onCancel}
          className={`px-5 py-2 text-sm border rounded-lg transition-colors ${isDark ? 'text-slate-300 border-[#1e3a55] hover:bg-[#0a1827]' : 'text-brand-700 border-brand-200 hover:bg-brand-50'}`}>
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
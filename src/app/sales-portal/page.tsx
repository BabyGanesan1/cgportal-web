'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, X, RefreshCw, FileText, Building2, ChevronLeft } from 'lucide-react';
import { clearAuth, getAdmin } from '../../lib/auth';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import CostSheetModal from '../../components/portal/CostSheetModal';

// ── Searchable single-select ──────────────────────────────────────────────────
function SearchableDropdown({ options, value, onChange, placeholder, disabled }: {
  options: { label: string; value: string }[];
  value: string; onChange: (v: string) => void;
  placeholder: string; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} onClick={() => !disabled && setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold text-left"
        style={{ background: disabled ? '#f1f5f9' : '#f8fafc', border: '1.5px solid ' + (value ? '#f59e0b' : '#e2e8f0'), color: value ? '#1e293b' : '#94a3b8', cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ transform: open ? 'rotate(90deg)' : '', color: '#94a3b8', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl z-50 overflow-hidden" style={{ background: '#fff', border: '1.5px solid #e2e8f0' }}>
          <div className="p-2 border-b" style={{ borderColor: '#f1f5f9' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
              <input autoFocus type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {value && (
              <button onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
                className="w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2" style={{ color: '#ef4444' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <X className="w-4 h-4" /> Clear
              </button>
            )}
            {filtered.length === 0 && <div className="px-4 py-3 text-sm text-center" style={{ color: '#94a3b8' }}>No options</div>}
            {filtered.map(o => (
              <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); setSearch(''); }}
                className="w-full text-left px-4 py-3 text-sm font-medium transition-colors"
                style={{ color: o.value === value ? '#f59e0b' : '#334155', background: o.value === value ? '#fffbeb' : 'transparent' }}
                onMouseEnter={e => { if (o.value !== value) (e.currentTarget.style.background = '#f8fafc'); }}
                onMouseLeave={e => { if (o.value !== value) (e.currentTarget.style.background = 'transparent'); }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Multi-select Dropdown ─────────────────────────────────────────────────────
function MultiSelectDropdown({ options, value, onChange, placeholder, disabled }: {
  options: { label: string; value: string }[];
  value: string[]; onChange: (v: string[]) => void; placeholder: string; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} onClick={() => !disabled && setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold text-left"
        style={{ background: disabled ? '#f1f5f9' : '#f8fafc', border: '1.5px solid ' + (value.length ? '#f59e0b' : '#e2e8f0'), color: value.length ? '#1e293b' : '#94a3b8', cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <span className="truncate">{value.length ? `${placeholder} (${value.length})` : placeholder}</span>
        <ChevronRight className="w-4 h-4" style={{ transform: open ? 'rotate(90deg)' : '', color: '#94a3b8', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl z-50 overflow-hidden" style={{ background: '#fff', border: '1.5px solid #e2e8f0' }}>
          <div className="p-2 border-b" style={{ borderColor: '#f1f5f9' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
              <input autoFocus type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {value.length > 0 && (
              <button onClick={() => onChange([])} className="w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2" style={{ color: '#ef4444' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <X className="w-4 h-4" /> Clear all
              </button>
            )}
            {filtered.length === 0 && <div className="px-4 py-3 text-sm text-center" style={{ color: '#94a3b8' }}>No options</div>}
            {filtered.map(o => (
              <button key={o.value} onClick={() => toggle(o.value)}
                className="w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3"
                style={{ background: value.includes(o.value) ? '#fffbeb' : 'transparent', color: '#334155' }}
                onMouseEnter={e => { if (!value.includes(o.value)) (e.currentTarget.style.background = '#f8fafc'); }}
                onMouseLeave={e => { if (!value.includes(o.value)) (e.currentTarget.style.background = 'transparent'); }}>
                <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[10px]"
                  style={{ border: '2px solid ' + (value.includes(o.value) ? '#f59e0b' : '#cbd5e1'), background: value.includes(o.value) ? '#f59e0b' : 'transparent', color: '#0a1628' }}>
                  {value.includes(o.value) && '✓'}
                </span>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v: any) => (v == null || v === '') ? '—' : v;
const fmtNum = (v: any) => (v != null && v !== '') ? Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—';
const fmtPrice = (v: any) => (v != null && v !== '') ? `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

// All property_details columns to show in table
const TABLE_COLS: { key: string; label: string; render?: (v: any, row: any) => any }[] = [
  { key: 'project_name', label: 'Project' },
  { key: 'unit_no', label: 'Unit No' },
  { key: 'status', label: 'Status' },
  { key: 'bhk', label: 'BHK' },
  { key: 'block', label: 'Block' },
  { key: 'phase', label: 'Phase' },
  { key: 'floor', label: 'Floor' },
  { key: 'facing', label: 'Facing' },
  { key: 'unit_type', label: 'Unit Type' },
  { key: 'super_buildup_area', label: 'Super BUA (sft)', render: fmtNum },
  { key: 'carpet_area', label: 'Carpet Area (sft)', render: fmtNum },
  { key: 'no_of_car_park', label: 'Car Parks' },
  { key: 'car_park_type', label: 'Car Park Type' },
  { key: 'plc_reason', label: 'PLC Reason' },
  { key: 'plc_charges_per_sqft', label: 'PLC/sqft', render: fmtPrice },
  { key: 'frc_charges_per_sqft', label: 'FRC/sqft', render: fmtPrice },
  { key: 'private_terrace', label: 'Priv. Terrace (sft)', render: fmtNum },
  { key: 'infra_charges', label: 'Infra Charges (L)', render: fmtNum },
  { key: 'other_charges', label: 'Other Charges (L)', render: fmtNum },
  { key: 'car_park_charges', label: 'Car Park Charges (L)', render: fmtNum },
  { key: 'total_values', label: 'Total Values (L)', render: fmtNum },
  { key: 'gst', label: 'GST (L)', render: fmtNum },
  { key: 'grand_total', label: 'Grand Total (L)', render: fmtNum },
  { key: 'modification', label: 'Modification (L)', render: fmtNum },
  { key: 'this_week_price', label: 'This Week Price/sqft', render: fmtPrice },
  { key: 'next_week_price', label: 'Next Week Price/sqft', render: fmtPrice },
  { key: 'this_week_price_incl_car_park', label: 'This Wk Price (w/ CP)', render: fmtPrice },
  { key: 'next_week_price_incl_car_park', label: 'Next Wk Price (w/ CP)', render: fmtPrice },
  { key: 'land_area_sqft', label: 'Land Area (sqft)', render: fmtNum },
  { key: 'land_rate_sqft', label: 'Land Rate/sqft', render: fmtPrice },
  { key: 'land_area_sqyards', label: 'Land Area (sq.yds)', render: fmtNum },
  { key: 'land_rate_sqyards', label: 'Land Rate/sq.yd', render: fmtPrice },
  { key: 'land_rate_lakhs', label: 'Land Rate (L)', render: fmtNum },
  { key: 'uds', label: 'UDS (sft)', render: fmtNum },
  { key: 'otp', label: 'OTP' },
  { key: 'otp', label: 'OTP' },
  { key: 'action', label: 'Price Sheet' },
];

// Deduplicate TABLE_COLS (remove duplicate 'otp')
const COLS = TABLE_COLS.filter((c, i, arr) => arr.findIndex(x => x.key === c.key && x.label === c.label) === i);

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SalesPortal() {
  const router = useRouter();

  const [opts, setOpts] = useState<any>({ projects: [], bhks: [], facings: [], blocks: [], phases: [], floors: [], unitTypes: [], carParkTypes: [], plcReasons: [], units: [] });
  const [projectId, setProjectId] = useState('');
  const [bhk, setBhk] = useState<string[]>([]);
  const [facing, setFacing] = useState<string[]>([]);
  const [block, setBlock] = useState('');
  const [phase, setPhase] = useState('');
  const [floor, setFloor] = useState<string[]>([]);
  const [unitType, setUnitType] = useState('');
  const [carParkType, setCarParkType] = useState('');
  const [plcReason, setPlcReason] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [discountPrice, setDiscountPrice] = useState('');

  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingProps, setLoadingProps] = useState(false);
  const [searched, setSearched] = useState(false);
  const LIMIT = 20;
  const [openCardId, setOpenCardId] = useState<any>(null);

  // Cost sheet modal state
  const [costSheetUnit, setCostSheetUnit] = useState<any>(null);
  const [costSheetProperty, setCostSheetProperty] = useState<any>(null);
  const [costSheetOpen, setCostSheetOpen] = useState(false);

  useEffect(() => {
    const admin = getAdmin();
    if (!admin) { router.replace('/login'); return; }
    fetchFilters({});
  }, []);

  const buildParams = useCallback((overrides: any = {}) => {
    const p: Record<string, string> = {};
    if (projectId) p.project_id = projectId;
    if (bhk.length) p.bhk = bhk.join(',');
    if (facing.length) p.facing = facing.join(',');
    if (block) p.block = block;
    if (phase) p.phase = phase;
    if (floor.length) p.floor = floor.join(',');
    if (unitType) p.unit_type = unitType;
    if (carParkType) p.car_park_type = carParkType;
    if (plcReason) p.plc_reason = plcReason;
    return { ...p, ...overrides };
  }, [projectId, bhk, facing, block, phase, floor, unitType, carParkType, plcReason]);

  const fetchFilters = async (params: any) => {
    try {
      const q = new URLSearchParams(params).toString();
      const res = await api.get(`/sales/filters?${q}`);
      setOpts(res.data.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchFilters(buildParams());
    setSelectedUnits([]);
  }, [projectId, bhk, facing, block, phase, floor, unitType, carParkType, plcReason]);

  const handleSearch = async (p = 1) => {
    setLoadingProps(true);
    setSearched(true);
    try {
      const params: Record<string, string> = { ...buildParams(), page: String(p), limit: String(LIMIT) };
      if (selectedUnits.length > 0) params.unit_nos = selectedUnits.join(',');
      const q = new URLSearchParams(params).toString();
      const res = await api.get(`/sales/properties?${q}`);
      const newData = res.data.data.data;
      setProperties(newData);
      if (newData && newData.length > 0) setOpenCardId(newData[0].id);
      else setOpenCardId(null);
      setTotal(res.data.data.total);
      setPage(res.data.data.page);
      setTotalPages(res.data.data.totalPages);
    } catch {
      toast.error('Failed to fetch properties');
    } finally { setLoadingProps(false); }
  };

  const handleReset = () => {
    setProjectId(''); setBhk([]); setFacing([]); setBlock('');
    setPhase(''); setFloor([]); setUnitType(''); setCarParkType('');
    setPlcReason(''); setSelectedUnits([]); setDiscountPrice('');
    setProperties([]); setTotal(0); setSearched(false); setPage(1);
  };

  const handleViewPriceSheet = (row: any) => {
    // Shape the unit and property objects to match what CostSheetModal expects
    const unit = { ...row, super_builtup_area: row.super_buildup_area };
    const property = { id: row.project_id, project_name: row.project_name };
    setCostSheetUnit(unit);
    setCostSheetProperty(property);
    setCostSheetOpen(true);
  };

  const handleLogout = () => { clearAuth(); router.replace('/login'); };
  const unitHasSelection = selectedUnits.length > 0;

  const unitOptions = (opts.units || []).map((u: any) => ({ label: u.unit_no, value: u.unit_no }));
  const projectOptions = (opts.projects || []).map((p: any) => ({ label: p.name, value: String(p.id) }));
  const toOpts = (arr: string[]) => (arr || []).map((v: string) => ({ label: v, value: v }));

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fc' }}>

      {/* ── Topbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 shadow-sm" style={{ background: '#0a1628', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-[1500px] mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/assets/images/cg_logo.png" alt="Casagrand" className="h-8 object-contain" />
            <div className="h-5 w-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#f59e0b' }}>Sales Portal</span>
          </div>
          <button onClick={handleLogout}
            className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all"
            style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            onMouseEnter={e => { (e.currentTarget.style.background = '#ef4444'); (e.currentTarget.style.color = '#fff'); }}
            onMouseLeave={e => { (e.currentTarget.style.background = 'rgba(239,68,68,0.1)'); (e.currentTarget.style.color = '#ef4444'); }}>
            Logout
          </button>
        </div>
      </header>

      <div className="pt-20 pb-16 px-4 sm:px-6 max-w-[1500px] mx-auto space-y-6">

        {/* ── Hero Banner ── */}
        <div className="relative rounded-[1.5rem] overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%)' }}>
          <div className="absolute inset-0 opacity-10">
            <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1400&auto=format&fit=crop"
              alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(10,22,40,0.92) 0%,rgba(30,58,95,0.85) 100%)' }} />
          <div className="relative z-10 px-8 py-8">
            <h1 className="text-3xl font-black tracking-widest mb-1" style={{ color: '#f59e0b' }}>PRICE SHEET</h1>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Filter, explore and view property pricing details for available units</p>
          </div>
        </div>

        {/* ── Filter Card ── */}
        <div className="rounded-[1.5rem] shadow-lg border" style={{ background: 'rgba(255,255,255,0.97)', borderColor: '#e2e8f0' }}>
          <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b" style={{ borderColor: '#f1f5f9' }}>
            <span className="text-sm font-black uppercase tracking-widest" style={{ color: '#334155' }}>Search Filters</span>
            <button onClick={handleReset} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
              style={{ background: '#f1f5f9', color: '#64748b' }} title="Reset all filters">
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>PROJECT</label>
              <SearchableDropdown options={projectOptions} value={projectId} onChange={setProjectId} placeholder="Select Project" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>BHK TYPE</label>
              <MultiSelectDropdown options={toOpts(opts.bhks)} value={bhk} onChange={setBhk} placeholder="All" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>FACING</label>
              <MultiSelectDropdown options={toOpts(opts.facings)} value={facing} onChange={setFacing} placeholder="All" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>UNIT TYPE</label>
              <SearchableDropdown options={toOpts(opts.unitTypes)} value={unitType} onChange={setUnitType} placeholder="All" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>BLOCK</label>
              <SearchableDropdown options={toOpts(opts.blocks)} value={block} onChange={setBlock} placeholder="All" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>PHASE</label>
              <SearchableDropdown options={toOpts(opts.phases)} value={phase} onChange={setPhase} placeholder="All" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>FLOOR</label>
              <MultiSelectDropdown 
                options={toOpts((opts.floors || []).sort((a: any, b: any) => {
                  const na = parseInt(a), nb = parseInt(b);
                  if (isNaN(na) && isNaN(nb)) return String(a).localeCompare(String(b));
                  if (isNaN(na)) return -1;
                  if (isNaN(nb)) return 1;
                  return na - nb;
                }))} 
                value={floor} 
                onChange={setFloor} 
                placeholder="All" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>CAR PARK TYPE</label>
              <SearchableDropdown options={toOpts(opts.carParkTypes)} value={carParkType} onChange={setCarParkType} placeholder="All" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>PLC REASON</label>
              <SearchableDropdown options={toOpts(opts.plcReasons)} value={plcReason} onChange={setPlcReason} placeholder="All" />
            </div>
            {/* Unit No — multi select */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>UNIT NO</label>
              <MultiSelectDropdown options={unitOptions} value={selectedUnits} onChange={setSelectedUnits} placeholder="All Units" />
            </div>
            {/* Discount Price — numeric only, disabled unless unit selected */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: unitHasSelection ? '#64748b' : '#cbd5e1' }}>
                DISCOUNT PRICE (₹)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={unitHasSelection ? 'Enter amount...' : 'Select unit first'}
                disabled={!unitHasSelection}
                value={discountPrice}
                onChange={e => {
                  const v = e.target.value.replace(/[^0-9]/g, '');
                  setDiscountPrice(v);
                }}
                className="w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none transition-all"
                style={{ background: unitHasSelection ? '#f8fafc' : '#f1f5f9', border: '1.5px solid ' + (discountPrice ? '#f59e0b' : '#e2e8f0'), color: '#1e293b', cursor: unitHasSelection ? 'text' : 'not-allowed', opacity: unitHasSelection ? 1 : 0.5 }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
            <button onClick={() => handleSearch(1)} disabled={loadingProps}
              className="w-full sm:w-auto justify-center flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-60"
              style={{ background: '#0a1628', color: '#fff' }}
              onMouseEnter={e => { (e.currentTarget.style.background = '#f59e0b'); (e.currentTarget.style.color = '#0a1628'); }}
              onMouseLeave={e => { (e.currentTarget.style.background = '#0a1628'); (e.currentTarget.style.color = '#fff'); }}>
              <Search className="w-4 h-4" /> Search
            </button>

            <button disabled={!unitHasSelection}
              className="w-full sm:w-auto justify-center flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#1e3a5f', color: '#fff' }}
              onMouseEnter={e => { if (unitHasSelection) { (e.currentTarget.style.background = '#f59e0b'); (e.currentTarget.style.color = '#0a1628'); } }}
              onMouseLeave={e => { (e.currentTarget.style.background = '#1e3a5f'); (e.currentTarget.style.color = '#fff'); }}
              onClick={() => unitHasSelection && toast.success('Price updated (simulated)')}>
              Update Price
            </button>

            <button disabled={!unitHasSelection}
              className="w-full sm:w-auto justify-center flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#064e3b', color: '#fff' }}
              onMouseEnter={e => { if (unitHasSelection) { (e.currentTarget.style.background = '#f59e0b'); (e.currentTarget.style.color = '#0a1628'); } }}
              onMouseLeave={e => { (e.currentTarget.style.background = '#064e3b'); (e.currentTarget.style.color = '#fff'); }}
              onClick={() => {
                if (!unitHasSelection) return;
                // Open price sheet for first selected unit from results
                const row = properties.find(p => selectedUnits.includes(p.unit_no));
                if (row) handleViewPriceSheet(row);
                else toast.error('First click SEARCH to load results, then select a unit from the table');
              }}>
              <FileText className="w-4 h-4" /> View Cost Sheet
            </button>
          </div>
        </div>

        {/* ── Results Table ── */}
        <div className="bg-white shadow-sm border" style={{ borderColor: '#e2e8f0', borderRadius: '1.5rem' }}>
          <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: '#f1f5f9' }}>
            <span className="text-sm font-black uppercase tracking-widest" style={{ color: '#334155' }}>Property Details</span>
            {searched && !loadingProps && (
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: '#fffbeb', color: '#d97706' }}>
                {total} result{total !== 1 ? 's' : ''} found
              </span>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {loadingProps ? (
              <div className="px-6 py-20 text-center" style={{ color: '#94a3b8' }}>
                <div className="w-8 h-8 rounded-full mx-auto mb-4 animate-spin" style={{ border: '4px solid #e2e8f0', borderTopColor: '#f59e0b' }} />
                Loading...
              </div>
            ) : !searched ? (
              <div className="px-6 py-24 text-center">
                <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#cbd5e1' }} />
                <p className="font-bold text-base" style={{ color: '#334155' }}>Apply filters and click Search</p>
                <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Select a project and desired filters to view available units</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="px-6 py-24 text-center">
                <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#cbd5e1' }} />
                <p className="font-bold" style={{ color: '#64748b' }}>No available units found matching your filters</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 p-4" style={{ background: '#f8fafc', borderRadius: '0 0 1.5rem 1.5rem' }}>
                {properties.map((row: any) => {
                  const s = row.status || '';
                  const isInvestor = s.toLowerCase().includes('investor');
                  const isOpenSale = s.toLowerCase().includes('open for sale');
                  const isRent = s.toLowerCase().includes('rent') || s.toLowerCase().includes('lease');
                  const bg = isInvestor ? '#eff6ff' : isOpenSale ? '#fefce8' : isRent ? '#f0fdf4' : '#f0fdf4';
                  const color = isInvestor ? '#1d4ed8' : isOpenSale ? '#a16207' : '#15803d';

                  const isOpen = openCardId === row.id;

                  return (
                    <div key={row.id} className="bg-white rounded-[1.2rem] border overflow-hidden shadow-sm transition-all" style={{ borderColor: '#e2e8f0' }}>
                      <button 
                        onClick={() => setOpenCardId(isOpen ? null : row.id)}
                        className="w-full text-left p-4 flex items-center justify-between" 
                        style={{ background: 'linear-gradient(135deg, rgba(10,22,40,0.02) 0%, rgba(30,58,95,0.02) 100%)', borderBottom: isOpen ? '1px solid #f1f5f9' : 'none' }}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-black text-xl tracking-wide" style={{ color: '#f59e0b' }}>{fmt(row.unit_no)}</div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap" style={{ background: bg, color }}>
                              {fmt(s)}
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{fmt(row.project_name)}</div>
                        </div>
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-100">
                          <ChevronRight className="w-4 h-4 text-gray-400 transition-transform" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                        </div>
                      </button>
                      
                      {isOpen && (
                        <div>
                          <div className="p-4 grid grid-cols-2 gap-y-3 gap-x-3 text-xs border-b" style={{ borderColor: '#f1f5f9' }}>
                            {COLS.filter(c => !['action', 'status', 'unit_no', 'project_name'].includes(c.key)).map(c => {
                              const val = row[c.key];
                              const displayVal = c.render ? c.render(val, row) : fmt(val);
                              // Hide empty metric blocks on mobile to keep cards concise
                              if (displayVal === '—' || displayVal === '-') return null;
                              return (
                                <div key={c.key} className="bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                                  <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">{c.label}</div>
                                  <div className="font-bold text-slate-700">{displayVal}</div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="p-3">
                            <button
                              onClick={() => handleViewPriceSheet(row)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                              style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}
                            >
                              <FileText className="w-4 h-4" /> View Price Sheet
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto" style={{ borderRadius: '0 0 1.5rem 1.5rem' }}>
            <div style={{ maxHeight: '560px', overflowY: 'auto' }}>
              <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 2400 }}>
                <thead style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%)', position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    {COLS.map(c => (
                      <th key={c.key + c.label} className="px-4 py-4 text-left font-bold uppercase tracking-wider text-xs whitespace-nowrap"
                        style={{ color: 'rgba(255,255,255,0.7)' }}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingProps ? (
                    <tr><td colSpan={COLS.length} className="px-6 py-20 text-center" style={{ color: '#94a3b8' }}>
                      <div className="w-8 h-8 rounded-full mx-auto mb-4 animate-spin" style={{ border: '4px solid #e2e8f0', borderTopColor: '#f59e0b' }} />
                      Loading...
                    </td></tr>
                  ) : !searched ? (
                    <tr><td colSpan={COLS.length} className="px-6 py-24 text-center">
                      <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#cbd5e1' }} />
                      <p className="font-bold text-base" style={{ color: '#334155' }}>Apply filters and click Search</p>
                      <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Select a project and desired filters to view available units</p>
                    </td></tr>
                  ) : properties.length === 0 ? (
                    <tr><td colSpan={COLS.length} className="px-6 py-24 text-center">
                      <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#cbd5e1' }} />
                      <p className="font-bold" style={{ color: '#64748b' }}>No available units found matching your filters</p>
                    </td></tr>
                  ) : properties.map((row: any) => (
                    <tr key={row.id} className="border-b transition-colors" style={{ borderColor: '#f1f5f9' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fffbeb')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      {COLS.map(c => {
                        if (c.key === 'action') {
                          return (
                            <td key="action" className="px-4 py-3 whitespace-nowrap">
                              <button
                                onClick={() => handleViewPriceSheet(row)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                                style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}
                                onMouseEnter={e => { (e.currentTarget.style.background = '#f59e0b'); (e.currentTarget.style.color = '#0a1628'); }}
                                onMouseLeave={e => { (e.currentTarget.style.background = '#fffbeb'); (e.currentTarget.style.color = '#d97706'); }}>
                                <FileText className="w-3.5 h-3.5" /> View
                              </button>
                            </td>
                          );
                        }
                        if (c.key === 'status') {
                          const s = row.status || '';
                          const isInvestor = s.toLowerCase().includes('investor');
                          const isOpenSale = s.toLowerCase().includes('open for sale');
                          const isRent = s.toLowerCase().includes('rent') || s.toLowerCase().includes('lease');
                          const bg = isInvestor ? '#eff6ff' : isOpenSale ? '#fefce8' : isRent ? '#f0fdf4' : '#f0fdf4';
                          const color = isInvestor ? '#1d4ed8' : isOpenSale ? '#a16207' : '#15803d';
                          return (
                            <td key="status" className="px-4 py-3">
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                                style={{ background: bg, color }}>
                                {fmt(s)}
                              </span>
                            </td>
                          );
                        }
                        if (c.key === 'unit_no') {
                          return <td key="unit_no" className="px-4 py-3 font-bold whitespace-nowrap" style={{ color: '#f59e0b' }}>{fmt(row.unit_no)}</td>;
                        }
                        if (c.key === 'project_name') {
                          return <td key="project_name" className="px-4 py-3 font-bold whitespace-nowrap" style={{ color: '#1e293b' }}>{fmt(row.project_name)}</td>;
                        }
                        const val = row[c.key];
                        return (
                          <td key={c.key + c.label} className="px-4 py-3 whitespace-nowrap text-gray-700">
                            {c.render ? c.render(val, row) : fmt(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {searched && !loadingProps && totalPages > 1 && (
            <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ borderColor: '#f1f5f9', background: '#f8fafc', borderRadius: '0 0 1.5rem 1.5rem' }}>
              <div className="text-sm font-medium" style={{ color: '#64748b' }}>
                Showing <span className="font-bold" style={{ color: '#334155' }}>{(page - 1) * LIMIT + 1}</span>–
                <span className="font-bold" style={{ color: '#334155' }}>{Math.min(page * LIMIT, total)}</span> of{' '}
                <span className="font-bold" style={{ color: '#334155' }}>{total}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleSearch(page - 1)} disabled={page === 1}
                  className="p-2 rounded-xl border disabled:opacity-50" style={{ borderColor: '#e2e8f0', background: '#fff', color: '#64748b' }}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pg = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  if (pg < 1 || pg > totalPages) return null;
                  return (
                    <button key={pg} onClick={() => handleSearch(pg)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold border"
                      style={{ background: pg === page ? '#f59e0b' : '#fff', color: pg === page ? '#0a1628' : '#64748b', borderColor: pg === page ? '#f59e0b' : '#e2e8f0' }}>
                      {pg}
                    </button>
                  );
                })}
                <button onClick={() => handleSearch(page + 1)} disabled={page >= totalPages}
                  className="p-2 rounded-xl border disabled:opacity-50" style={{ borderColor: '#e2e8f0', background: '#fff', color: '#64748b' }}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Cost Sheet Modal (same as user portal) ── */}
      <CostSheetModal
        isOpen={costSheetOpen}
        onClose={() => setCostSheetOpen(false)}
        unit={costSheetUnit}
        property={costSheetProperty}
      />
    </div>
  );
}

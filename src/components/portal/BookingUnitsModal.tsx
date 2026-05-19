'use client';
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ChevronLeft, ChevronDown, X, Grid3X3, List, ChevronRight, Layers, Building2, Search, FileText, Compass } from 'lucide-react';

interface UnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  units: any[];        // available-only units (from backend filter)
  allUnits?: any[];    // ALL units (available + sold + blocked) for grid view
  onSelectUnit: (unit: any) => void;
  onBookNow: (unit: any) => void;
  initialView?: 'list' | 'grid';
  viewers?: Record<number, number>;
  costViewers?: Record<number, number>;
  socket?: any;
}

// Color palette for tile status types
const AVAIL = { tileBg: '#dbeafe', tileBorder: '#3b82f6', tileText: '#1d4ed8', glow: '#3b82f6', clickable: true };
const SOLD_C = { tileBg: '#fee2e2', tileBorder: '#ef4444', tileText: '#b91c1c', glow: '#ef4444', clickable: false };
const BLOCK_C = { tileBg: '#fef9c3', tileBorder: '#eab308', tileText: '#854d0e', glow: '#eab308', clickable: false };
const SELECT = { tileBg: '#dcfce7', tileBorder: '#22c55e', tileText: '#15803d', glow: '#22c55e', clickable: true };
const MGMT_C = { tileBg: '#f3e8ff', tileBorder: '#a855f7', tileText: '#6b21a8', glow: '#a855f7', clickable: false };
const LEASE_C = { tileBg: '#fff7ed', tileBorder: '#f97316', tileText: '#9a3412', glow: '#f97316', clickable: false };
const GRAY_C = { tileBg: '#f1f5f9', tileBorder: '#94a3b8', tileText: '#475569', glow: '#94a3b8', clickable: false };

const STATUS_CONFIG: Record<string, { label: string; tileBg: string; tileBorder: string; tileText: string; glow: string; clickable: boolean }> = {
  'vacant': { label: 'Vacant', ...AVAIL },
  'open for sale with 10%': { label: 'Available', ...AVAIL },
  'hsbc-open for sale with 10%': { label: 'Available', ...AVAIL },
  'hsbc-vacant': { label: 'Available', ...AVAIL },
  'hsbc-vacant-lo': { label: 'Available', ...AVAIL },
  'investor': { label: 'Investor', ...AVAIL },
  'investor-open for sale with 10%': { label: 'Inv Available', ...AVAIL },
  'vacant (rent or lease)': { label: 'Rent/Lease', ...LEASE_C },
  'selected': { label: 'Selected', ...SELECT },
  'sold': { label: 'Sold', ...SOLD_C },
  'sold - model villa': { label: 'Model Villa', ...SOLD_C },
  'sold for cp': { label: 'Sold CP', ...SOLD_C },
  'toi-sold': { label: 'TOI Sold', ...SOLD_C },
  'booked': { label: 'Booked', ...SOLD_C },
  'hsbc-sold': { label: 'HSBC Sold', ...SOLD_C },
  'hsbc-sold-lo': { label: 'HSBC Sold', ...SOLD_C },
  'hsbc-toi-sold': { label: 'TOI Sold', ...SOLD_C },
  'hsbc-mgmt-sold': { label: 'MGMT Sold', ...SOLD_C },
  'hsbc-sbf-nr': { label: 'SBF-NR', ...SOLD_C },
  'hsfc-sold': { label: 'HSFC Sold', ...SOLD_C },
  'investor-sold': { label: 'Inv Sold', ...SOLD_C },
  'mgmt-sold': { label: 'MGMT Sold', ...SOLD_C },
  'sbf-nr': { label: 'SBF-NR', ...SOLD_C },
  'blocked': { label: 'Blocked', ...BLOCK_C },
  'hmda': { label: 'HMDA', ...BLOCK_C },
  'hsbc-investor': { label: 'HSBC Inv', ...BLOCK_C },
  'hsbc-model house': { label: 'Model House', ...BLOCK_C },
  'management': { label: 'Management', ...MGMT_C },
  'unknown': { label: 'Unknown', ...GRAY_C },
};

function getStatusCfg(status: string) {
  const key = (status || '').toLowerCase().trim();
  if (STATUS_CONFIG[key]) return STATUS_CONFIG[key];
  if (key.includes('sold') || key.includes('booked')) return { label: status, tileBg: '#fee2e2', tileBorder: '#ef4444', tileText: '#b91c1c', glow: '#ef4444', clickable: false };
  if (key.includes('block') || key.includes('hmda')) return { label: status, tileBg: '#fef9c3', tileBorder: '#eab308', tileText: '#854d0e', glow: '#eab308', clickable: false };
  if (key.includes('vacant') || key.includes('open for sale') || key.includes('investor')) return { label: status, tileBg: '#dbeafe', tileBorder: '#3b82f6', tileText: '#1d4ed8', glow: '#3b82f6', clickable: true };
  if (key.includes('management') || key.includes('mgmt')) return { label: status, tileBg: '#f3e8ff', tileBorder: '#a855f7', tileText: '#6b21a8', glow: '#a855f7', clickable: false };
  return { label: status || '—', tileBg: '#f1f5f9', tileBorder: '#cbd5e1', tileText: '#64748b', glow: '#94a3b8', clickable: false };
}

function formatPrice(val: any, isDubai?: boolean) {
  if (!val) return '—';
  const n = parseFloat(val);
  if (isDubai) return `AED ${n.toFixed(2)} M`;
  if (n >= 100) return `₹${(n / 100).toFixed(2)} Cr`;
  return `₹${n.toFixed(2)} L`;
}

function bhkColor(bhk: string) {
  if (!bhk) return { bg: '#f1f5f9', text: '#475569' };
  if (bhk.startsWith('3') || bhk.startsWith('4')) return { bg: '#eff6ff', text: '#1d4ed8' };
  if (bhk.startsWith('2')) return { bg: '#fdf4ff', text: '#7e22ce' };
  return { bg: '#f0fdf4', text: '#15803d' };
}

function facingAbbr(f: string) {
  if (!f) return '—';
  const map: Record<string, string> = { NORTH: 'N', SOUTH: 'S', EAST: 'E', WEST: 'W', 'NORTH EAST': 'NE', 'NORTH WEST': 'NW', 'SOUTH EAST': 'SE', 'SOUTH WEST': 'SW' };
  return map[f.toUpperCase()] || f.charAt(0);
}

export default function BookingUnitsModal({ isOpen, onClose, property, units, allUnits, onSelectUnit, onBookNow, initialView = 'list', viewers = {}, costViewers = {}, socket }: UnitsModalProps) {
  const [view, setView] = useState<'list' | 'grid'>(initialView);
  const [isMobile, setMobile] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ unit: any; x: number; y: number; above: boolean } | null>(null);
  const [entered, setEntered] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setEntered(true), 50);
      setView(initialView);
      setSelectedUnitId('');
      setSearchTerm('');
    }
    else { 
      setEntered(false); setTooltip(null); 
      if (socket && property?.id) socket.emit('view_unit', { projectId: property.id, unitId: null });
    }
  }, [isOpen, initialView, property?.id, socket]);

  useEffect(() => {
    if (!isOpen || !isMobile) return;
    window.history.pushState({ cgModal: 'units' }, '');
    const fn = () => onClose();
    window.addEventListener('popstate', fn);
    return () => window.removeEventListener('popstate', fn);
  }, [isOpen, isMobile, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen || !property) return null;

  const isDubai = property?.cityData?.name?.toLowerCase() === 'dubai';
  const handleClose = () => { if (isMobile) window.history.back(); else onClose(); };
  const gridUnits = (allUnits && allUnits.length > 0 ? allUnits : units);

  const validStatuses = new Set([
    'vacant', 'hsbc-vacant', 'vacant (rent or lease)', 'open for sale with 10%',
    'hsbc-open for sale with 10%', 'investor', 'hsbc-investor', 'investor-open for sale with 10%', 'hsbc-vacant-lo',
  ]);

  const allValidUnits = units.filter(u => validStatuses.has(u.status?.toLowerCase()));
  const filteredUnits = allValidUnits.filter(u => u.unit_no?.toLowerCase().includes(searchTerm.toLowerCase()));
  const selectedUnit = allValidUnits.find(u => u.id.toString() === selectedUnitId.toString());

  const handleViewCostSheet = () => { if (selectedUnit) onSelectUnit(selectedUnit); };

  const availableCount = gridUnits.filter(u => getStatusCfg(u.status).clickable).length;
  const bookedCount = gridUnits.filter(u => { const k = (u.status || '').toLowerCase(); return k.includes('sold') || k.includes('booked') || k === 'hsbc-sbf-nr' || k === 'sbf-nr'; }).length;
  const blockedCount = gridUnits.filter(u => { const k = (u.status || '').toLowerCase(); return k.includes('blocked') || k.includes('hmda') || k.includes('management') || k.includes('mgmt'); }).length;

  // Only count viewers for units belonging to the current project
  const currentUnitIds = new Set(gridUnits.map(u => u.id.toString()));
  const totalCostViewers = Object.entries(costViewers || {}).reduce((acc, [id, count]) => {
    return currentUnitIds.has(id.toString()) ? acc + (count as number) : acc;
  }, 0);

  const floors: number[] = Array.from(new Set(gridUnits.map(u => Number(u.floor || 0)))).sort((a, b) => b - a);
  const byFloor: Record<number, any[]> = {};
  gridUnits.forEach(u => {
    const f = Number(u.floor || 0);
    if (!byFloor[f]) byFloor[f] = [];
    byFloor[f].push(u);
  });
  const maxCols = Math.max(...floors.map(f => (byFloor[f] || []).length), 0);

  const handleTileEnter = (e: React.MouseEvent, u: any) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const TW = 190; const TH = 170;
    let x = rect.left + rect.width / 2;
    x = Math.max(TW / 2 + 8, Math.min(x, vw - TW / 2 - 8));
    let y: number; let above: boolean;
    if (rect.top - TH - 12 > 60) { y = rect.top - 12; above = true; }
    else { y = rect.bottom + 12; above = false; }
    if (!above && y + TH > vh - 10) { y = rect.top - 12; above = true; }
    setTooltip({ unit: u, x, y, above }); setHovered(String(u.id));
    if (socket && u.id && property?.id) socket.emit('view_unit', { projectId: property.id, unitId: u.id });
  };

  const STAT_PILLS = [
    { label: 'Available', count: availableCount, dot: '#3b82f6' },
    { label: 'Booked', count: bookedCount, dot: '#ef4444' },
    { label: 'Blocked', count: blockedCount, dot: '#eab308' },
    ...(totalCostViewers > 0 ? [{ label: isMobile ? 'Viewing' : 'Viewing Cost Sheet', count: totalCostViewers, dot: '#10b981' }] : []),
  ];

  return (
    <>
      <div
        onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 24, paddingTop: isMobile ? 'env(safe-area-inset-top, 0px)' : 0, background: 'rgba(10,22,40,0.72)', backdropFilter: 'blur(8px)', opacity: entered ? 1 : 0, transition: 'opacity 0.3s' }}
      >
        <div style={{
          background: '#fff', width: '100%', maxWidth: isMobile ? '100%' : 1050,
          height: isMobile ? 'calc(95vh - env(safe-area-inset-top,0px))' : 'auto',
          maxHeight: isMobile ? 'calc(95vh - env(safe-area-inset-top,0px))' : '90vh',
          borderRadius: isMobile ? '20px 20px 0 0' : 20,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
          transform: entered ? 'translateY(0) scale(1)' : (isMobile ? 'translateY(40px)' : 'scale(0.96)'),
          transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%)', padding: isMobile ? '12px 16px' : '16px 24px', flexShrink: 0 }}>
            {isMobile && <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.25)', margin: '0 auto 10px' }} />}
            
            {isMobile ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                   <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                     <ChevronLeft size={16} />
                   </button>
                   <div style={{ minWidth: 0, flex: 1 }}>
                     <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2 }}>Available Units</div>
                     <h2 style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{property?.project_name}</h2>
                   </div>
                   <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: 9, padding: 3, gap: 2, flexShrink: 0 }}>
                    {(['list', 'grid'] as const).map(v => (
                      <button key={v} onClick={() => { setView(v); setTooltip(null); }}
                        style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: view === v ? 'rgba(255,255,255,0.2)' : 'transparent', color: view === v ? '#f59e0b' : 'rgba(255,255,255,0.45)', transition: 'all 0.2s' }}>
                        {v === 'list' ? <List size={14} /> : <Grid3X3 size={14} />}
                      </button>
                    ))}
                  </div>
                 </div>
                 <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2 }} className="no-scrollbar">
                   {STAT_PILLS.map(s => (
                     <div key={s.label} style={{ background: `${s.dot}22`, border: `1px solid ${s.dot}55`, borderRadius: 10, padding: '4px 8px', textAlign: 'center', flexShrink: 0, minWidth: 60 }}>
                       <div style={{ fontSize: 12, fontWeight: 900, color: s.dot, lineHeight: 1 }}>{s.count}</div>
                       <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{s.label}</div>
                     </div>
                   ))}
                 </div>
               </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2 }}>Available Units</div>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{property?.project_name}</h2>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {STAT_PILLS.map(s => (
                    <div key={s.label} style={{ background: `${s.dot}22`, border: `1px solid ${s.dot}55`, borderRadius: 10, padding: '5px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: s.dot, lineHeight: 1 }}>{s.count}</div>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: 9, padding: 3, gap: 2, flexShrink: 0 }}>
                  {(['list', 'grid'] as const).map(v => (
                    <button key={v} onClick={() => { setView(v); setTooltip(null); }}
                      style={{ width: 30, height: 30, borderRadius: 7, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: view === v ? 'rgba(255,255,255,0.2)' : 'transparent', color: view === v ? '#f59e0b' : 'rgba(255,255,255,0.45)', transition: 'all 0.2s' }}>
                      {v === 'list' ? <List size={14} /> : <Grid3X3 size={14} />}
                    </button>
                  ))}
                </div>
                <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <X size={15} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { color: '#3b82f6', label: 'Available' },
                { color: '#22c55e', label: 'Selected' },
                { color: '#ef4444', label: 'Sold / Booked' },
                { color: '#eab308', label: 'Blocked / HMDA' },
                { color: '#a855f7', label: 'Management' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{label}</span>
                </div>
              ))}
            </div>
            {view === 'list' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <div style={{ position: 'relative', flex: 1 }} ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={{ width: '100%', cursor: 'pointer', outline: 'none', textAlign: 'left', background: 'rgba(255,255,255,0.12)', color: selectedUnit ? '#fff' : 'rgba(255,255,255,0.6)', padding: '9px 34px 9px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedUnit ? selectedUnit.unit_no : '-- Select Unit No --'}
                    </span>
                    <ChevronDown size={14} style={{ flexShrink: 0 }} />
                  </button>
                  {dropdownOpen && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', marginTop: 6, background: '#0a1628', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 12px 32px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden' }}>
                      <div style={{ padding: 8, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ position: 'relative' }}>
                          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                          <input autoFocus type="text" placeholder="Search unit..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '7px 10px 7px 30px', fontSize: 12, outline: 'none' }} />
                        </div>
                      </div>
                      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                        {filteredUnits.length > 0 ? (
                          filteredUnits.map(u => (
                            <div key={u.id} onClick={() => { setSelectedUnitId(u.id); setDropdownOpen(false); setSearchTerm(''); }} style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, color: selectedUnitId === u.id ? '#f59e0b' : 'rgba(255,255,255,0.85)', background: selectedUnitId === u.id ? 'rgba(245,158,11,0.12)' : 'transparent', borderLeft: selectedUnitId === u.id ? '2px solid #f59e0b' : '2px solid transparent', transition: 'all 0.2s' }}>
                              <div style={{ fontWeight: 700 }}>{u.unit_no}</div>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{u.bhk} · {u.facing} · Floor {u.floor}</div>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>No units match your search</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button disabled={!selectedUnitId} onClick={handleViewCostSheet} style={{ display: 'flex', alignItems: 'center', gap: 6, background: selectedUnitId ? '#10b981' : 'rgba(16,185,129,0.3)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 14px', fontWeight: 700, fontSize: 13, cursor: selectedUnitId ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }} >
                  <FileText size={14} /> {isMobile ? 'Cost' : 'View Cost Sheet'}
                </button>
                <button disabled={!selectedUnitId} onClick={() => selectedUnit && onBookNow(selectedUnit)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: selectedUnitId ? '#f59e0b' : 'rgba(245,158,11,0.3)', color: '#0a1628', border: 'none', borderRadius: 10, padding: '9px 14px', fontWeight: 700, fontSize: 13, cursor: selectedUnitId ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }} >
                  <Layers size={14} /> Book
                </button>
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
            {units.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Building2 size={24} style={{ color: '#cbd5e1' }} />
                </div>
                <p style={{ fontWeight: 700, color: '#64748b', fontSize: 15 }}>No available units</p>
              </div>
            ) : view === 'grid' ? (
              <div style={{ padding: '16px 20px', overflowX: 'auto', position: 'relative', minHeight: 200 }}>
                <div style={{ display: 'inline-block', minWidth: '100%' }}>
                  <div style={{ display: 'flex', marginLeft: 44, gap: 3, marginBottom: 6 }}>
                    {Array.from({ length: maxCols }, (_, i) => (<div key={i} style={{ width: 42, textAlign: 'center', fontSize: 9, color: '#94a3b8', fontWeight: 700, letterSpacing: 1 }}>{i + 1}</div>))}
                  </div>
                  {floors.map(floor => (
                    <div key={floor} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 3 }}>
                      <div style={{ width: 40, textAlign: 'right', fontSize: 10, fontWeight: 800, color: '#64748b', paddingRight: 4, flexShrink: 0, letterSpacing: 0.5 }}>{floor === 0 ? 'GF' : `${floor}F`}</div>
                      {(byFloor[floor] || []).map((u, idx) => {
                        const isHov = hovered === String(u.id);
                        const cv = costViewers[u.id] || 0;
                        const vv = viewers[u.id] || 0;
                        const cfg = getStatusCfg(u.status);
                        
                        return (
                          <div key={u.id || idx} onClick={() => { if (cfg.clickable) { setTooltip(null); setHovered(null); onBookNow(u); } }} onMouseEnter={e => handleTileEnter(e, u)} onMouseLeave={() => { setHovered(null); setTooltip(null); }} style={{ width: 42, height: 42, borderRadius: 7, flexShrink: 0, background: isHov ? cfg.tileBorder : cfg.tileBg, border: `2px solid ${isHov ? cfg.tileBorder : (cv > 0 ? '#10b981' : (vv > 1 ? '#f59e0b' : cfg.tileBorder + '80'))}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: cfg.clickable ? 'pointer' : 'default', transition: 'all 0.15s ease', transform: isHov ? 'scale(1.18) translateZ(0)' : 'scale(1)', boxShadow: isHov ? `0 4px 14px ${cfg.glow}70` : (cv > 0 ? '0 0 10px rgba(16,185,129,0.5)' : (vv > 1 ? `0 0 10px #f59e0b55` : '0 1px 3px rgba(0,0,0,0.06)')), position: 'relative', zIndex: isHov ? 10 : 1, animation: cv > 0 ? 'pulseGreen 1.5s infinite' : (vv > 1 ? 'pulseBorder 2s infinite' : 'none') }}>
                            <span style={{ fontSize: 9, fontWeight: 900, color: isHov ? '#fff' : cfg.tileText, lineHeight: 1, letterSpacing: '0.03em' }}>{facingAbbr(u.facing)}</span>
                            {cv > 0 && !isHov && (
                              <div style={{ position: 'absolute', top: -6, right: -6, background: '#10b981', color: '#fff', fontSize: 8, fontWeight: 900, width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                <FileText size={8} />
                              </div>
                            )}
                            {vv > 1 && cv === 0 && !isHov && (
                              <div style={{ position: 'absolute', top: -6, right: -6, background: '#f59e0b', color: '#fff', fontSize: 8, fontWeight: 900, width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                {vv}
                              </div>
                            )}
                            {!cfg.clickable && <span style={{ fontSize: 7, color: isHov ? 'rgba(255,255,255,0.8)' : cfg.tileText + 'cc', marginTop: 1, fontWeight: 700 }}>✕</span>}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ) : isMobile ? (
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredUnits.map(u => {
                  const bc = bhkColor(u.bhk);
                  const cv = costViewers[u.id] || 0;
                  return (
                    <div key={u.id} style={{ 
                      background: cv > 0 ? '#f0fdf4' : '#fff', 
                      borderRadius: 16, 
                      border: `1px solid ${cv > 0 ? '#10b98155' : '#e8edf5'}`, 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', 
                      overflow: 'hidden',
                      animation: cv > 0 ? 'rowBlink 2s infinite' : 'none'
                    }}>
                      <div style={{ height: 3, background: cv > 0 ? '#10b981' : 'linear-gradient(90deg, #f59e0b, #0a1628)' }} />
                      <div style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 16, fontWeight: 900, color: '#0a1628', letterSpacing: 1 }}>{u.unit_no}</span>
                              {u.bhk && <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: bc.bg, color: bc.text }}>{u.bhk}</span>}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b', background: '#f8fafc', padding: '3px 10px', borderRadius: 99, border: '1px solid #e2e8f0' }}><Layers size={10} /> Floor {u.floor || 'G'}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b', background: '#f8fafc', padding: '3px 10px', borderRadius: 99, border: '1px solid #e2e8f0' }}><Compass size={10} /> {u.facing || '-'}</span>
                              <span style={{ fontSize: 11, color: '#d97706', background: '#fffbeb', padding: '3px 10px', borderRadius: 99, fontWeight: 600, border: '1px solid #fde68a' }}>{u.carpet_area || '-'} sft carpet</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', paddingLeft: 12 }}>
                            <div style={{ fontSize: 15, fontWeight: 900, color: '#0a1628' }}>{formatPrice(u.grand_total, isDubai)}</div>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 8 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div onClick={(e) => { e.stopPropagation(); onSelectUnit(u); }} style={{ width: 32, height: 32, borderRadius: 10, background: cv > 0 ? '#10b981' : '#f0fdf4', border: `1px solid ${cv > 0 ? '#10b981' : '#bcf2d1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><FileText size={16} style={{ color: cv > 0 ? '#fff' : '#15803d' }} /></div>
                                {cv > 0 && <span style={{ fontSize: 7, color: '#10b981', fontWeight: 800, whiteSpace: 'nowrap' }}>Viewing</span>}
                              </div>
                              <div onClick={(e) => { e.stopPropagation(); onBookNow(u); }} style={{ width: 32, height: 32, borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronRight size={14} style={{ color: '#d97706' }} /></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', fontSize: 13, textAlign: 'center' }}>
                  <thead style={{ background: '#0a1628', color: '#fff', position: 'sticky', top: 0, zIndex: 5 }}>
                    <tr>
                      {['Unit No', 'BHK', 'Facing', 'Floor', 'Carpet Area', 'Super BUA', 'Grand Total', 'Action'].map(h => (
                        <th key={h} style={{ padding: '14px 16px', fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnits.map((u, i) => {
                      const bc = bhkColor(u.bhk);
                      const cv = costViewers[u.id] || 0;
                      return (
                        <tr key={u.id} onClick={() => onSelectUnit(u)} 
                          style={{ 
                            borderBottom: '1px solid #f1f5f9', 
                            cursor: 'pointer', 
                            background: cv > 0 ? '#f0fdf4' : (i % 2 === 0 ? '#fff' : '#fafbfd'),
                            animation: cv > 0 ? 'rowBlink 2s infinite' : 'none'
                          }} 
                          onMouseEnter={e => { if (cv === 0) e.currentTarget.style.background = '#fffbeb'; }} 
                          onMouseLeave={e => { if (cv === 0) e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfd'; }}
                        >
                          <td style={{ padding: '14px 16px' }}><span style={{ color: '#1d4ed8', fontWeight: 800, letterSpacing: 1 }}>{u.unit_no}</span></td>
                          <td style={{ padding: '14px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: bc.bg, color: bc.text }}>{u.bhk}</span></td>
                          <td style={{ padding: '14px 16px', color: '#334155' }}>{u.facing || '-'}</td>
                          <td style={{ padding: '14px 16px', color: '#334155' }}>{u.floor || 'G'}</td>
                          <td style={{ padding: '14px 16px', color: '#334155' }}>{u.carpet_area || '-'}</td>
                          <td style={{ padding: '14px 16px', color: '#334155' }}>{u.super_builtup_area || '-'}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a' }}>{formatPrice(u.grand_total, isDubai)}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <button onClick={(e) => { e.stopPropagation(); onSelectUnit(u); }} style={{ background: cv > 0 ? '#10b981' : '#f0fdf4', color: cv > 0 ? '#fff' : '#15803d', border: cv > 0 ? '1px solid #10b981' : '1px solid #bcf2d1', borderRadius: 8, padding: '4px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Cost Sheet</button>
                                {cv > 0 && <span style={{ fontSize: 8, color: '#10b981', fontWeight: 800, whiteSpace: 'nowrap' }}>Viewing Cost Sheet</span>}
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); onBookNow(u); }} style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: 8, padding: '4px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Book Now</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      {tooltip && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div style={{ position: 'fixed', left: tooltip.x, top: tooltip.y, transform: tooltip.above ? 'translate(-50%, -100%)' : 'translate(-50%, 0%)', zIndex: 99999, pointerEvents: 'none', background: 'linear-gradient(135deg, #0a1628 0%, #0f2240 100%)', color: '#fff', borderRadius: 12, padding: '12px 14px', boxShadow: '0 12px 32px rgba(0,0,0,0.5)', width: 185, fontSize: 12, border: `1.5px solid ${getStatusCfg(tooltip.unit.status).tileBorder}`, animation: 'tooltipIn 0.15s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: '#f59e0b', marginBottom: 8, letterSpacing: 1 }}>{tooltip.unit.unit_no}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 10px', alignItems: 'center' }}>
            {[['BHK', tooltip.unit.bhk || '—'], ['Floor', tooltip.unit.floor || 'G'], ['Facing', tooltip.unit.facing || '—'], ['Price', formatPrice(tooltip.unit.grand_total, isDubai)],].map(([l, v]) => (
              <React.Fragment key={l}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</span>
                <span style={{ fontWeight: 700, fontSize: 12, color: l === 'Price' ? '#f59e0b' : '#fff' }}>{v}</span>
              </React.Fragment>
            ))}
          </div>
          <div style={{ marginTop: 8, padding: '4px 8px', background: `${getStatusCfg(tooltip.unit.status).tileBorder}25`, borderRadius: 6, fontSize: 10, fontWeight: 700, color: getStatusCfg(tooltip.unit.status).tileBorder, textAlign: 'center', border: `1px solid ${getStatusCfg(tooltip.unit.status).tileBorder}40` }}> {getStatusCfg(tooltip.unit.status).label} {getStatusCfg(tooltip.unit.status).clickable && ' · Tap to book'} </div>
          {costViewers[tooltip.unit.id] > 0 && (
            <div style={{ marginTop: 6, fontSize: 10, fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 1s infinite' }} />
              {costViewers[tooltip.unit.id]} user{costViewers[tooltip.unit.id] > 1 ? 's' : ''} viewing cost sheet
            </div>
          )}
          {viewers[tooltip.unit.id] > 1 && (
            <div style={{ marginTop: 6, fontSize: 10, fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1s infinite' }} />
              {viewers[tooltip.unit.id] - 1} other {viewers[tooltip.unit.id] - 1 === 1 ? 'person is' : 'people are'} looking at this
            </div>
          )}
          {tooltip.above && <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 9, height: 9, background: '#0a1628', borderRight: `1.5px solid ${getStatusCfg(tooltip.unit.status).tileBorder}`, borderBottom: `1.5px solid ${getStatusCfg(tooltip.unit.status).tileBorder}` }} />}
          {!tooltip.above && <div style={{ position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%) rotate(225deg)', width: 9, height: 9, background: '#0a1628', borderRight: `1.5px solid ${getStatusCfg(tooltip.unit.status).tileBorder}`, borderBottom: `1.5px solid ${getStatusCfg(tooltip.unit.status).tileBorder}` }} />}
        </div>, document.body
      )}
      <style>{` 
        @keyframes tooltipIn { from { opacity:0; transform:translate(-50%,-90%); } to { opacity:1; transform:translate(-50%,-100%); } } 
        @keyframes pulseBorder { 0% { border-color: #f59e0b55; box-shadow: 0 0 0px #f59e0b00; } 50% { border-color: #f59e0b; box-shadow: 0 0 10px #f59e0b44; } 100% { border-color: #f59e0b55; box-shadow: 0 0 0px #f59e0b00; } }
        @keyframes pulseGreen { 0% { border-color: #10b98155; box-shadow: 0 0 0px #10b98100; } 50% { border-color: #10b981; box-shadow: 0 0 10px #10b98144; } 100% { border-color: #10b98155; box-shadow: 0 0 0px #10b98100; } }
        @keyframes rowBlink { 0% { background-color: #f0fdf4; } 50% { background-color: #dcfce7; } 100% { background-color: #f0fdf4; } }
        .no-scrollbar::-webkit-scrollbar { display: none; } 
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } 
      `}</style>
    </>
  );
}
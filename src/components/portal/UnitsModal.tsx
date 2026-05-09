import React, { useState, useEffect } from 'react';
import { ChevronDown, FileText, Building2, ChevronRight, ChevronLeft, Layers, Compass, Search } from 'lucide-react';

interface UnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  units: any[];
  onSelectUnit: (unit: any) => void;
}

export default function UnitsModal({ isOpen, onClose, property, units, onSelectUnit }: UnitsModalProps) {
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedUnitId('');
      setSearchTerm('');
      setDropdownOpen(false);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  // Mobile back button → close modal instead of leaving website
  useEffect(() => {
    if (!isOpen || !isMobile) return;
    // Push a state so the back button pops this first
    window.history.pushState({ cgModal: 'units' }, '');
    const onPop = () => { onClose(); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [isOpen, isMobile, onClose]);

  if (!isOpen || !property) return null;

  const isDubai = property?.cityData?.name?.toLowerCase() === 'dubai';

  const validStatuses = new Set([
    'vacant',
    'hsbc-vacant',
    'vacant (rent or lease)',
    'open for sale with 10%',
    'hsbc-open for sale with 10%',
    'investor',
    'hsbc-investor',
    'investor-open for sale with 10%',
    'hsbc-vacant-lo',
  ]);

  const allValidUnits = units.filter(u => validStatuses.has(u.status?.toLowerCase()));

  const filteredUnits = allValidUnits.filter(u =>
    u.unit_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUnit = allValidUnits.find(u => u.id.toString() === selectedUnitId.toString());

  const handleViewCostSheet = () => {
    if (selectedUnit) onSelectUnit(selectedUnit);
  };

  const bhkColor = (bhk: string) => {
    if (!bhk) return { bg: '#f1f5f9', text: '#475569' };
    if (bhk.includes('3')) return { bg: '#eff6ff', text: '#1d4ed8' };
    if (bhk.includes('2')) return { bg: '#fdf4ff', text: '#7e22ce' };
    return { bg: '#f0fdf4', text: '#15803d' };
  };

  const formatPrice = (val: any) => {
    if (!val) return '—';
    if (isDubai) return `AED ${parseFloat(val).toFixed(2)} M`;
    return `₹${parseFloat(val).toFixed(2)} L`;
  };

  // On mobile: go back in history (triggers popstate → onClose)
  // On desktop: call onClose directly
  const handleClose = () => {
    if (isMobile) window.history.back();
    else onClose();
  };

  return (
    <>
      <div
        onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 24, paddingTop: isMobile ? 'env(safe-area-inset-top, 0px)' : 0, background: 'rgba(10,22,40,0.65)', backdropFilter: 'blur(6px)' }}
      >
        <div style={{
          background: '#fff', width: '100%', maxWidth: isMobile ? '100%' : '880px',
          height: isMobile ? 'calc(92vh - env(safe-area-inset-top, 0px))' : 'auto', maxHeight: isMobile ? 'calc(92vh - env(safe-area-inset-top, 0px))' : '88vh',
          borderRadius: isMobile ? '20px 20px 0 0' : '20px',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 32px 64px rgba(0,0,0,0.3)'
        }}>

          {/* ── Header ── */}
          <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%)', padding: isMobile ? '14px 16px 14px' : '20px 28px 18px', flexShrink: 0 }}>

            {/* Mobile: drag handle */}
            {isMobile && <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.25)', margin: '0 auto 12px' }} />}

            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Back button — mobile only */}
              {isMobile && (
                <button
                  onClick={handleClose}
                  style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <ChevronLeft size={18} />
                </button>
              )}

              {/* Project name — takes available space, truncates if needed */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 2 }}>Available Units</div>
                <h2 style={{ fontSize: isMobile ? 15 : 20, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: 1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {property?.project_name}
                </h2>
              </div>

              {/* Unit count badge */}
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: isMobile ? '6px 12px' : '8px 16px', flexShrink: 0 }}>
                <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>{allValidUnits.length}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginTop: 2 }}>Units</div>
              </div>

              {/* Close button — desktop only */}
              {!isMobile && (
                <button
                  onClick={onClose}
                  style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>✕</span>
                </button>
              )}
            </div>

            {/* INTEGRATED SEARCHABLE SELECT + View Cost Sheet */}
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
                    {/* Search inside dropdown */}
                    <div style={{ padding: 8, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ position: 'relative' }}>
                        <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search unit..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          style={{ width: '100%', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '7px 10px 7px 30px', fontSize: 12, outline: 'none' }}
                        />
                      </div>
                    </div>
                    {/* Options list */}
                    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                      {filteredUnits.length > 0 ? (
                        filteredUnits.map(u => (
                          <div
                            key={u.id}
                            onClick={() => { setSelectedUnitId(u.id); setDropdownOpen(false); setSearchTerm(''); }}
                            style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, color: selectedUnitId === u.id ? '#f59e0b' : 'rgba(255,255,255,0.85)', background: selectedUnitId === u.id ? 'rgba(245,158,11,0.12)' : 'transparent', borderLeft: selectedUnitId === u.id ? '2px solid #f59e0b' : '2px solid transparent', transition: 'all 0.2s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                            onMouseLeave={e => (e.currentTarget.style.background = selectedUnitId === u.id ? 'rgba(245,158,11,0.12)' : 'transparent')}
                          >
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

              <button
                disabled={!selectedUnitId}
                onClick={handleViewCostSheet}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: selectedUnitId ? '#10b981' : 'rgba(16,185,129,0.3)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 14px', fontWeight: 700, fontSize: 13, cursor: selectedUnitId ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}
              >
                <FileText size={14} /> {isMobile ? 'Cost Sheet' : 'View Cost Sheet'}
              </button>
            </div>
          </div>

          {/* ── Scrollable unit list ── */}
          <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
            {filteredUnits.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Building2 size={24} style={{ color: '#cbd5e1' }} />
                </div>
                <p style={{ fontWeight: 700, color: '#64748b', fontSize: 15 }}>No units found</p>
                <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Try searching for a different unit number.</p>
              </div>
            ) : isMobile ? (
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredUnits.map(u => {
                  const bc = bhkColor(u.bhk);
                  return (
                    <div
                      key={u.id}
                      onClick={() => onSelectUnit(u)}
                      style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8edf5', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', cursor: 'pointer' }}
                      onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                      onTouchEnd={e => { e.currentTarget.style.transform = ''; }}
                    >
                      <div style={{ height: 3, background: 'linear-gradient(90deg, #f59e0b, #0a1628)' }} />
                      <div style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 16, fontWeight: 900, color: '#0a1628', letterSpacing: 1 }}>{u.unit_no}</span>
                              {u.bhk && <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: bc.bg, color: bc.text }}>{u.bhk}</span>}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b', background: '#f8fafc', padding: '3px 10px', borderRadius: 99, border: '1px solid #e2e8f0' }}>
                                <Layers size={10} /> Floor {u.floor || 'G'}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b', background: '#f8fafc', padding: '3px 10px', borderRadius: 99, border: '1px solid #e2e8f0' }}>
                                <Compass size={10} /> {u.facing || '-'}
                              </span>
                              <span style={{ fontSize: 11, color: '#d97706', background: '#fffbeb', padding: '3px 10px', borderRadius: 99, fontWeight: 600, border: '1px solid #fde68a' }}>
                                {u.carpet_area || '-'} sft carpet
                              </span>
                              <span style={{ fontSize: 11, color: '#0369a1', background: '#f0f9ff', padding: '3px 10px', borderRadius: 99, fontWeight: 600, border: '1px solid #bae6fd' }}>
                                {u.super_builtup_area || '-'} sft SBA
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', paddingLeft: 12 }}>
                            <div style={{ fontSize: 15, fontWeight: 900, color: '#0a1628' }}>{formatPrice(u.grand_total)}</div>
                            <div style={{ marginTop: 8, width: 28, height: 28, borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' }}>
                              <ChevronRight size={14} style={{ color: '#d97706' }} />
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
                      {['Unit No', 'BHK', 'Facing', 'Floor', 'Carpet Area', 'Super BUA', 'Grand Total'].map(h => (
                        <th key={h} style={{ padding: '14px 16px', fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnits.map((u, i) => (
                      <tr key={u.id} onClick={() => onSelectUnit(u)}
                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: i % 2 === 0 ? '#fff' : '#fafbfd' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fffbeb')}
                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfd')}>
                        <td style={{ padding: '14px 16px' }}><span style={{ color: '#1d4ed8', fontWeight: 800, letterSpacing: 1 }}>{u.unit_no}</span></td>
                        <td style={{ padding: '14px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: bhkColor(u.bhk).bg, color: bhkColor(u.bhk).text }}>{u.bhk}</span></td>
                        <td style={{ padding: '14px 16px', color: '#334155' }}>{u.facing || '-'}</td>
                        <td style={{ padding: '14px 16px', color: '#334155' }}>{u.floor || 'G'}</td>
                        <td style={{ padding: '14px 16px', color: '#334155' }}>{u.carpet_area || '-'}</td>
                        <td style={{ padding: '14px 16px', color: '#334155' }}>{u.super_builtup_area || '-'}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a' }}>{formatPrice(u.grand_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

    </>
  );
}
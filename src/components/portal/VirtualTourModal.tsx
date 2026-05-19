'use client';
import React, { useState } from 'react';
import { X, Play, Maximize2 } from 'lucide-react';
import BookNowModal from './BookNowModal';
import SiteVisitModal from './SiteVisitModal';

interface VirtualTourModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: any;
    unit?: any;
}

const FLOOR_PLANS: Record<string, string> = {
    '1BHK': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    '2BHK': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    '3BHK': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'default': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
};

export default function VirtualTourModal({ isOpen, onClose, property, unit }: VirtualTourModalProps) {
    const [activeTab, setActiveTab] = useState<'floorplan' | 'video'>('video');
    const [zoomed, setZoomed] = useState(false);
    const [showBookNow, setShowBookNow] = useState(false);
    const [showSiteVisit, setShowSiteVisit] = useState(false);

    if (!isOpen) return null;

    const bhkKey = unit?.bhk?.replace(/[^0-9]/g, '') + 'BHK' || 'default';
    const floorPlanImg = FLOOR_PLANS[bhkKey] || FLOOR_PLANS.default;

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(5,8,20,0.9)', backdropFilter: 'blur(12px)', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                <div style={{ background: '#0d1b2e', borderRadius: 20, width: '100%', maxWidth: 860, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', overflow: 'hidden', animation: 'vtSlide 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>

                    {/* Header */}
                    <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2 }}>Virtual Tour</div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{property?.project_name} {unit ? `· Unit ${unit.unit_no}` : ''}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {/* Tab buttons */}
                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: 3, gap: 2 }}>
                                {([
                                    ...(unit ? [{ key: 'floorplan', label: '📐 Floor Plan' }] : []),
                                    { key: 'video', label: '🎬 360° Tour' },
                                ]).map((t: any) => (
                                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                                        style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: activeTab === t.key ? '#f59e0b' : 'transparent', color: activeTab === t.key ? '#0a1628' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    {activeTab === 'floorplan' ? (
                        <div style={{ position: 'relative' }}>
                            {/* Unit info strip */}
                            {unit && (
                                <div style={{ display: 'flex', gap: 12, padding: '12px 24px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
                                    {[
                                        { label: 'Unit', val: unit.unit_no },
                                        { label: 'BHK', val: unit.bhk },
                                        { label: 'Floor', val: unit.floor || 'G' },
                                        { label: 'Facing', val: unit.facing || '—' },
                                        { label: 'Carpet', val: unit.carpet_area ? `${unit.carpet_area} sft` : '—' },
                                        { label: 'SBA', val: unit.super_builtup_area ? `${unit.super_builtup_area} sft` : '—' },
                                    ].map(({ label, val }) => (
                                        <div key={label} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>{label}</div>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>{val}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Floor plan image */}
                            <div style={{ position: 'relative', background: '#081525', cursor: zoomed ? 'zoom-out' : 'zoom-in' }} onClick={() => setZoomed(!zoomed)}>
                                <div style={{ padding: zoomed ? 0 : '24px 40px', transition: 'padding 0.3s', background: 'linear-gradient(135deg, #0a1628 0%, #162840 100%)' }}>
                                    <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />
                                    <div style={{ position: 'relative', textAlign: 'center' }}>
                                        <svg viewBox="0 0 600 400" style={{ width: '100%', maxHeight: zoomed ? '70vh' : 320, transition: 'max-height 0.3s' }} fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="40" y="30" width="520" height="340" rx="4" stroke="#4b9af5" strokeWidth="3" fill="rgba(59,130,246,0.05)" />
                                            <rect x="40" y="30" width="220" height="180" stroke="#4b9af5" strokeWidth="2" fill="rgba(59,130,246,0.08)" />
                                            <text x="150" y="130" textAnchor="middle" fill="#93c5fd" fontSize="12" fontWeight="600">LIVING ROOM</text>
                                            <text x="150" y="148" textAnchor="middle" fill="#60a5fa" fontSize="10">18' × 14'</text>
                                            <rect x="260" y="30" width="200" height="170" stroke="#a78bfa" strokeWidth="2" fill="rgba(167,139,250,0.08)" />
                                            <text x="360" y="120" textAnchor="middle" fill="#c4b5fd" fontSize="12" fontWeight="600">MASTER BEDROOM</text>
                                            <text x="360" y="138" textAnchor="middle" fill="#a78bfa" fontSize="10">14' × 12'</text>
                                            <rect x="460" y="30" width="100" height="170" stroke="#86efac" strokeWidth="2" fill="rgba(134,239,172,0.08)" />
                                            <text x="510" y="110" textAnchor="middle" fill="#86efac" fontSize="10" fontWeight="600">BED 2</text>
                                            <text x="510" y="126" textAnchor="middle" fill="#86efac" fontSize="9">10'×12'</text>
                                            <rect x="40" y="210" width="140" height="160" stroke="#fde68a" strokeWidth="2" fill="rgba(253,230,138,0.08)" />
                                            <text x="110" y="298" textAnchor="middle" fill="#fde68a" fontSize="12" fontWeight="600">KITCHEN</text>
                                            <text x="110" y="316" textAnchor="middle" fill="#fcd34d" fontSize="10">10' × 12'</text>
                                            <rect x="180" y="210" width="80" height="80" stroke="#67e8f9" strokeWidth="2" fill="rgba(103,232,249,0.08)" />
                                            <text x="220" y="255" textAnchor="middle" fill="#67e8f9" fontSize="10" fontWeight="600">BATH</text>
                                            <rect x="40" y="30" width="50" height="100" stroke="#fca5a5" strokeWidth="1.5" strokeDasharray="6,3" fill="rgba(252,165,165,0.06)" />
                                            <text x="65" y="85" textAnchor="middle" fill="#fca5a5" fontSize="9">BALCONY</text>
                                            <text x="300" y="390" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="11">Total: {unit?.super_builtup_area || '—'} sft SBA · {unit?.carpet_area || '—'} sft Carpet</text>
                                            <circle cx="555" cy="365" r="18" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                            <text x="555" y="358" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="900">N</text>
                                            <line x1="555" y1="363" x2="555" y2="377" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                                            <text x="555" y="379" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8">S</text>
                                        </svg>
                                        <div style={{ position: 'absolute', bottom: 10, right: 14, display: 'flex', gap: 6 }}>
                                            <button onClick={e => { e.stopPropagation(); setZoomed(!zoomed); }}
                                                style={{ padding: '5px 10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, color: 'rgba(255,255,255,0.7)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Maximize2 size={11} /> {zoomed ? 'Minimize' : 'Zoom In'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    ) : (
                        /* Video / 360 tour */
                        <div style={{ background: '#050d1a' }}>
                            <div style={{ position: 'relative', background: '#000', paddingBottom: '56.25%' }}>
                                <video autoPlay muted loop playsInline
                                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}>
                                    <source src="/assets/videos/building.mp4" type="video/mp4" />
                                </video>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, transparent 40%, rgba(5,13,26,0.8) 100%)' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245,158,11,0.2)', border: '2px solid rgba(245,158,11,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', backdropFilter: 'blur(8px)' }}>
                                            <Play size={24} style={{ color: '#f59e0b', marginLeft: 3 }} />
                                        </div>
                                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>360° Building Tour</div>
                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4 }}>{property?.project_name}</div>
                                    </div>
                                </div>
                            </div>
                            {/* Info bar */}
                            <div style={{ padding: '14px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                                {[
                                    { label: 'Project', val: property?.project_name },
                                    { label: 'Location', val: property?.locationData?.name },
                                    { label: 'Possession', val: property?.possession_status },
                                ].filter(x => x.val).map(({ label, val }) => (
                                    <div key={label} style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                                        <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', fontSize: 9, letterSpacing: 1, display: 'block' }}>{label}</span>
                                        <span style={{ color: '#fff', fontWeight: 700 }}>{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Footer: Book Now + Site Visit — pastel outline style ── */}
                    <div style={{
                        padding: '14px 24px',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 10,
                        background: 'rgba(255,255,255,0.03)',
                    }}>
                        {/* Book Now — amber/yellow outline */}
                        <button
                            onClick={() => setShowBookNow(true)}
                            style={{
                                padding: '8px 24px',
                                borderRadius: 50,
                                border: '2px solid #f59e0b',
                                background: 'rgba(245,158,11,0.12)',
                                color: '#f59e0b',
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: 'pointer',
                                letterSpacing: '0.02em',
                                transition: 'background 0.2s, transform 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 7,
                            }}
                            onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(245,158,11,0.22)'); (e.currentTarget.style.transform = 'translateY(-2px)'); }}
                            onMouseLeave={e => { (e.currentTarget.style.background = 'rgba(245,158,11,0.12)'); (e.currentTarget.style.transform = 'translateY(0)'); }}>
                            📞 Book Now
                        </button>

                        {/* Site Visit — green outline */}
                        {/* <button
                            onClick={() => setShowSiteVisit(true)}
                            style={{
                                flex: 1,
                                padding: '11px 10px',
                                borderRadius: 50,
                                border: '2px solid #10b981',
                                background: 'rgba(16,185,129,0.12)',
                                color: '#10b981',
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: 'pointer',
                                letterSpacing: '0.02em',
                                transition: 'background 0.2s, transform 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 7,
                            }}
                            onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(16,185,129,0.22)'); (e.currentTarget.style.transform = 'translateY(-2px)'); }}
                            onMouseLeave={e => { (e.currentTarget.style.background = 'rgba(16,185,129,0.12)'); (e.currentTarget.style.transform = 'translateY(0)'); }}>
                            📍 Site Visit
                        </button> */}
                    </div>
                </div>

                <style>{`@keyframes vtSlide{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}`}</style>
            </div>

            {/* ── Action Modals ── */}
            <BookNowModal isOpen={showBookNow} onClose={() => setShowBookNow(false)} property={property} unit={unit} />
            <SiteVisitModal isOpen={showSiteVisit} onClose={() => setShowSiteVisit(false)} property={property} unit={unit} />
        </>
    );
}
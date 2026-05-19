'use client';
import React, { useState } from 'react';
import { X, MapPin, Video, Calendar, Clock, CheckCircle2, ChevronLeft } from 'lucide-react';
import BookNowModal from './BookNowModal';
import VirtualTourModal from './VirtualTourModal';

interface SiteVisitModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: any;
    unit?: any;
}

const TIMES = ['10 AM', '11 AM', '12 PM', '2 PM', '3 PM', '4 PM', '5 PM'];

function getNextDays(n: number) {
    const days = [];
    const d = new Date();
    for (let i = 0; i < n; i++) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() !== 0) days.push(new Date(d));
        if (days.length === n) break;
    }
    return days;
}

const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const fmtFull = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function SiteVisitModal({ isOpen, onClose, property, unit }: SiteVisitModalProps) {
    const [type, setType] = useState<'inperson' | 'video'>('inperson');
    const [date, setDate] = useState<Date | null>(null);
    const [time, setTime] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
    const [showBookNow, setShowBookNow] = useState(false);
    const [showVirtualTour, setShowVirtualTour] = useState(false);

    const days = getNextDays(6);

    const canSubmit = date && time && name.trim() && phone.trim().length >= 10;

    const handleBook = () => { if (!canSubmit) return; setStep('confirm'); };
    const handleConfirm = () => setStep('success');

    if (!isOpen) return null;

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(10,22,40,0.75)', backdropFilter: 'blur(8px)', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'svSlide 0.3s cubic-bezier(0.34,1.56,0.64,1)', display: 'flex', flexDirection: 'column' }}>

                    {/* Header */}
                    <div style={{ background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                        <div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 3 }}>
                                {type === 'inperson' ? '📍 In-Person' : '🎥 Video Call'} Visit
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{property?.project_name}</div>
                            {unit && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Unit {unit.unit_no} · {unit.bhk}</div>}
                        </div>
                        <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '20px 24px', maxHeight: '65vh', overflowY: 'auto', flex: 1 }}>

                        {step === 'success' ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', border: '3px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <CheckCircle2 size={36} style={{ color: '#22c55e' }} />
                                </div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: '#0a1628', marginBottom: 6 }}>Visit Booked!</div>
                                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                                    {type === 'inperson' ? 'Our team will meet you at the site.' : 'A video call link will be sent to your email.'}<br />
                                    <strong style={{ color: '#047857' }}>{date ? fmtFull(date) : ''} at {time}</strong>
                                </div>
                                <div style={{ marginTop: 20, padding: '14px 16px', background: '#f0fdf4', borderRadius: 14, border: '1px solid #bbf7d0', fontSize: 12, color: '#166534', textAlign: 'left' }}>
                                    <div>📱 Confirmation SMS sent to <strong>{phone}</strong></div>
                                    {email && <div style={{ marginTop: 4 }}>📧 Details sent to <strong>{email}</strong></div>}
                                </div>
                                <button onClick={onClose} style={{ marginTop: 20, width: '100%', padding: 14, background: 'linear-gradient(135deg, #047857, #10b981)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Done</button>
                            </div>

                        ) : step === 'confirm' ? (
                            <div>
                                <button onClick={() => setStep('form')} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#047857', fontWeight: 600, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
                                    <ChevronLeft size={14} /> Back
                                </button>
                                <div style={{ fontSize: 16, fontWeight: 800, color: '#0a1628', marginBottom: 16 }}>Confirm Your Booking</div>
                                <div style={{ background: '#f8fafc', borderRadius: 14, padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {[
                                        { label: 'Name', val: name },
                                        { label: 'Phone', val: phone },
                                        { label: 'Email', val: email || 'Not provided' },
                                        { label: 'Visit Type', val: type === 'inperson' ? '📍 In-Person' : '🎥 Video Call' },
                                        { label: 'Date', val: date ? fmtFull(date) : '' },
                                        { label: 'Time', val: time || '' },
                                        { label: 'Project', val: property?.project_name },
                                        ...(unit ? [{ label: 'Unit', val: `${unit.unit_no} · ${unit.bhk}` }] : []),
                                    ].map(({ label, val }) => (
                                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                            <span style={{ color: '#64748b' }}>{label}</span>
                                            <span style={{ fontWeight: 700, color: '#0a1628', textAlign: 'right', maxWidth: '60%' }}>{val}</span>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleConfirm} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #047857, #10b981)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
                                    ✓ Confirm Site Visit
                                </button>
                            </div>

                        ) : (
                            <>
                                {/* Visit Type */}
                                <div style={{ marginBottom: 18 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Visit Type</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        {[
                                            { key: 'inperson' as const, icon: <MapPin size={16} />, label: 'In-Person', sub: 'Visit the site' },
                                            { key: 'video' as const, icon: <Video size={16} />, label: 'Video Call', sub: 'Online tour' },
                                        ].map(opt => (
                                            <button key={opt.key} onClick={() => setType(opt.key)}
                                                style={{ padding: '12px 14px', borderRadius: 12, border: `2px solid ${type === opt.key ? '#10b981' : '#e2e8f0'}`, background: type === opt.key ? '#f0fdf4' : '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s' }}>
                                                <span style={{ color: type === opt.key ? '#047857' : '#94a3b8' }}>{opt.icon}</span>
                                                <div style={{ textAlign: 'left' }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: type === opt.key ? '#047857' : '#1e293b' }}>{opt.label}</div>
                                                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{opt.sub}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date picker */}
                                <div style={{ marginBottom: 18 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Calendar size={12} /> Select Date
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {days.map((d, i) => (
                                            <button key={i} onClick={() => setDate(d)}
                                                style={{ padding: '8px 14px', borderRadius: 10, border: `2px solid ${date && fmt(d) === fmt(date) ? '#10b981' : '#e2e8f0'}`, background: date && fmt(d) === fmt(date) ? '#f0fdf4' : '#fafafa', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: date && fmt(d) === fmt(date) ? '#047857' : '#334155', transition: 'all 0.2s' }}>
                                                {fmt(d)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Time picker */}
                                <div style={{ marginBottom: 18 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Clock size={12} /> Select Time
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {TIMES.map(t => (
                                            <button key={t} onClick={() => setTime(t)}
                                                style={{ padding: '8px 14px', borderRadius: 10, border: `2px solid ${time === t ? '#10b981' : '#e2e8f0'}`, background: time === t ? '#f0fdf4' : '#fafafa', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: time === t ? '#047857' : '#334155', transition: 'all 0.2s' }}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Contact Details */}
                                <div style={{ marginBottom: 18 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Your Details</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name *"
                                            style={{ padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', color: '#0a1628' }} />
                                        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Mobile Number *" type="tel"
                                            style={{ padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', color: '#0a1628' }} />
                                        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" type="email"
                                            style={{ padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', color: '#0a1628' }} />
                                    </div>
                                </div>

                                <button onClick={handleBook} disabled={!canSubmit}
                                    style={{ width: '100%', padding: 14, background: canSubmit ? 'linear-gradient(135deg, #047857, #10b981)' : '#e2e8f0', color: canSubmit ? '#fff' : '#94a3b8', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: canSubmit ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: canSubmit ? '0 4px 14px rgba(16,185,129,0.35)' : 'none' }}>
                                    {type === 'inperson' ? '📍 Book Site Visit' : '🎥 Schedule Video Tour'}
                                </button>
                            </>
                        )}
                    </div>

                    {/* ── Footer: Virtual Tour + Book Now buttons ── */}
                    {step !== 'success' && (
                        <div style={{
                            padding: '12px 24px',
                            borderTop: '1px solid #f1f5f9',
                            display: 'flex',
                            gap: 10,
                            background: '#fff',
                            flexShrink: 0,
                        }}>
                            {/* Virtual Tour — purple outline */}
                            <button
                                onClick={() => setShowVirtualTour(true)}
                                style={{
                                    flex: 1,
                                    padding: '11px 10px',
                                    borderRadius: 50,
                                    border: '2px solid #a855f7',
                                    background: 'rgba(168,85,247,0.07)',
                                    color: '#a855f7',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    letterSpacing: '0.02em',
                                    transition: 'background 0.2s, transform 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                }}
                                onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(168,85,247,0.15)'); (e.currentTarget.style.transform = 'translateY(-2px)'); }}
                                onMouseLeave={e => { (e.currentTarget.style.background = 'rgba(168,85,247,0.07)'); (e.currentTarget.style.transform = 'translateY(0)'); }}>
                                🎬 Virtual Tour
                            </button>

                            {/* Book Now — amber outline */}
                            <button
                                onClick={() => setShowBookNow(true)}
                                style={{
                                    flex: 1,
                                    padding: '11px 10px',
                                    borderRadius: 50,
                                    border: '2px solid #f59e0b',
                                    background: 'rgba(245,158,11,0.07)',
                                    color: '#f59e0b',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    letterSpacing: '0.02em',
                                    transition: 'background 0.2s, transform 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                }}
                                onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(245,158,11,0.15)'); (e.currentTarget.style.transform = 'translateY(-2px)'); }}
                                onMouseLeave={e => { (e.currentTarget.style.background = 'rgba(245,158,11,0.07)'); (e.currentTarget.style.transform = 'translateY(0)'); }}>
                                📞 Book Now
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`@keyframes svSlide{from{opacity:0;transform:scale(0.94) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

            {/* ── Action Modals ── */}
            <BookNowModal isOpen={showBookNow} onClose={() => setShowBookNow(false)} property={property} unit={unit} />
            <VirtualTourModal isOpen={showVirtualTour} onClose={() => setShowVirtualTour(false)} property={property} unit={unit} />
        </>
    );
}
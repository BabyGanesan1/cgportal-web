'use client';
import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, CheckCircle2, Shield } from 'lucide-react';
import api from '@/lib/api';

interface BookNowModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: any;
    unit?: any;
}

type Step = 'details' | 'success';

const fmtPrice = (val: any) => {
    if (!val) return '—';
    const n = parseFloat(val);
    if (n >= 100) return `₹${(n / 100).toFixed(2)} Cr`;
    return `₹${n.toFixed(2)} L`;
};

export default function BookNowModal({ isOpen, onClose, property, unit }: BookNowModalProps) {
    const [step, setStep] = useState<Step>('details');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [employeeName, setEmployeeName] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingId, setBookingId] = useState('');
    const [wasBookedByOther, setWasBookedByOther] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const adminStr = localStorage.getItem('cg_admin');
            if (adminStr) {
                try {
                    const admin = JSON.parse(adminStr);
                    if (admin.name) setEmployeeName(admin.name);
                    if (admin.employee_id) setEmployeeId(admin.employee_id);
                } catch (e) { console.error('Failed to parse admin data'); }
            }
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) { 
            setStep('details'); 
            setName(''); 
            setPhone(''); 
            setEmail(''); 
            setWasBookedByOther(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && unit && (unit.status?.toLowerCase().includes('sold') || unit.status?.toLowerCase().includes('booked'))) {
            setWasBookedByOther(true);
        } else {
            setWasBookedByOther(false);
        }
    }, [isOpen, unit?.status]);

    if (!isOpen) return null;

    const handleFinalBooking = async () => {
        if (!unit) return;
        setIsSubmitting(true);
        try {
            const res = await api.post('/portal/book-unit', {
                project_id: property.id,
                unit_id: unit.id,
                customer_name: name,
                customer_email: email,
                customer_mobile: phone,
                employee_name: employeeName,
                employee_id: employeeId
            });
            if (res.data?.booking_id) {
                setBookingId(res.data.booking_id);
            }
            setStep('success');
        } catch (err: any) {
            console.error('Booking failed:', err);
            const msg = err.response?.data?.message || '';
            if (msg.toLowerCase().includes('no longer available') || msg.toLowerCase().includes('already booked')) {
                setWasBookedByOther(true);
            } else {
                alert(msg || 'Failed to process booking. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const STEPS: { key: Step; label: string }[] = [
        { key: 'details', label: 'Details' },
        { key: 'success', label: 'Done' },
    ];
    const stepIdx = STEPS.findIndex(s => s.key === step);

    // const bookingAmt = unit?.grand_total ? (parseFloat(unit.grand_total) * 0.02).toFixed(2) : '1.00';

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(10,22,40,0.85)', backdropFilter: 'blur(10px)', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            <div style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 500, boxShadow: '0 32px 80px rgba(0,0,0,0.4)', overflow: 'hidden', animation: 'bnSlide 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>

                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%)', padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2 }}>Book Your Home</div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginTop: 2 }}>{property?.project_name}</div>
                            {unit && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Unit {unit.unit_no} · {unit.bhk} · {fmtPrice(unit.grand_total)}</div>}
                        </div>
                        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                            <X size={15} />
                        </button>
                    </div>
                    {/* Step indicator */}
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {STEPS.map((s, i) => (
                            <React.Fragment key={s.key}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                    <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, background: i < stepIdx ? '#10b981' : i === stepIdx ? '#f59e0b' : 'rgba(255,255,255,0.15)', color: i <= stepIdx ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s' }}>
                                        {i < stepIdx ? '✓' : i + 1}
                                    </div>
                                    <div style={{ fontSize: 8, color: i === stepIdx ? '#f59e0b' : 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                                </div>
                                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < stepIdx ? '#10b981' : 'rgba(255,255,255,0.12)', borderRadius: 99, marginBottom: 12, transition: 'all 0.3s' }} />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div style={{ padding: '22px 24px', maxHeight: '65vh', overflowY: 'auto' }}>

                    {/* STEP 1: Personal Details */}
                    {step === 'details' && (
                        <div>
                            {wasBookedByOther && (
                                <div style={{ background: '#fef2f2', border: '1.5px solid #ef4444', borderRadius: 12, padding: 12, marginBottom: 18, animation: 'shake 0.5s ease-in-out' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#b91c1c' }}>
                                        <X size={18} style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', padding: 2 }} />
                                        <div style={{ fontSize: 13, fontWeight: 800 }}>Unit Already Booked</div>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4, marginLeft: 28 }}>
                                        Sorry, this unit was just booked by another user. Please close this form and select another unit.
                                    </div>
                                </div>
                            )}
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0a1628', marginBottom: 4 }}>Your Details</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 18 }}>Please provide customer details for booking</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[
                                    { emoji: '👤', val: name, set: setName, ph: 'Full Name *', type: 'text' },
                                    { emoji: '📱', val: phone, set: setPhone, ph: 'Mobile Number *', type: 'tel' },
                                    { emoji: '✉️', val: email, set: setEmail, ph: 'Email Address (optional)', type: 'email' },
                                    { emoji: '👨‍💼', val: employeeName, set: setEmployeeName, ph: 'Admin User', type: 'text' },
                                    { emoji: '🆔', val: employeeId, set: setEmployeeId, ph: 'Employee ID *', type: 'text' },
                                ].map(({ emoji, val, set, ph, type }: any) => (
                                    <div key={ph} style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>{emoji}</span>
                                        <input value={val} onChange={(e: any) => set(e.target.value)} placeholder={ph} type={type}
                                            style={{ width: '100%', padding: '12px 14px 12px 38px', borderRadius: 11, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', color: '#0a1628', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                            onFocus={(e: any) => (e.currentTarget.style.borderColor = '#f59e0b')}
                                            onBlur={(e: any) => (e.currentTarget.style.borderColor = '#e2e8f0')} />
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleFinalBooking} disabled={wasBookedByOther || !name.trim() || phone.length < 10 || !employeeName.trim() || !employeeId.trim() || isSubmitting}
                                style={{ width: '100%', marginTop: 20, padding: 14, background: !wasBookedByOther && name.trim() && phone.length >= 10 && employeeName.trim() && employeeId.trim() && !isSubmitting ? 'linear-gradient(135deg, #0a1628, #1e3a5f)' : '#e2e8f0', color: !wasBookedByOther && name.trim() && phone.length >= 10 && employeeName.trim() && employeeId.trim() && !isSubmitting ? '#fff' : '#94a3b8', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: !wasBookedByOther && name.trim() && phone.length >= 10 && employeeName.trim() && employeeId.trim() && !isSubmitting ? 'pointer' : 'not-allowed', boxShadow: !wasBookedByOther && name.trim() && phone.length >= 10 && employeeName.trim() && employeeId.trim() && !isSubmitting ? '0 4px 14px rgba(10,22,40,0.25)' : 'none' }}>
                                {isSubmitting ? 'Booking Unit...' : wasBookedByOther ? 'Unit Unavailable' : 'Book Now →'}
                            </button>
                        </div>
                    )}


                    {/* STEP 4: Success */}
                    {step === 'success' && (
                        <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 16px' }}>
                                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', animation: 'pulse 2s infinite' }} />
                                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f0fdf4', border: '3px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    <CheckCircle2 size={36} style={{ color: '#22c55e' }} />
                                </div>
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#0a1628', marginBottom: 6 }}>Booking Confirmed! 🎉</div>
                            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>
                                Your booking for <strong style={{ color: '#0a1628' }}>Unit {unit?.unit_no}</strong> at <strong style={{ color: '#0a1628' }}>{property?.project_name}</strong> is confirmed.<br />
                                Booking ID: <strong style={{ color: '#f59e0b' }}>{bookingId ? `CG-BK-${bookingId}` : `CG${Date.now().toString().slice(-6)}`}</strong>
                            </div>
                            <div style={{ background: '#f8fafc', borderRadius: 14, padding: 16, marginBottom: 20, textAlign: 'left' }}>
                                {[
                                    { l: 'Buyer', v: name },
                                    { l: 'Unit', v: `${unit?.unit_no} · ${unit?.bhk}` },
                                    { l: 'Total Price', v: fmtPrice(unit?.grand_total) },
                                ].map(({ l, v }) => (
                                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                                        <span style={{ color: '#64748b' }}>{l}</span>
                                        <span style={{ fontWeight: 700, color: '#0a1628' }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#92400e', textAlign: 'left' }}>
                                📱 Confirmation sent to <strong>{phone}</strong><br />
                                {email && <>📧 Details emailed to <strong>{email}</strong></>}
                            </div>
                            <button onClick={onClose} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #0a1628, #1e3a5f)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
        @keyframes bnSlide{from{opacity:0;transform:scale(0.94) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1);opacity:0.4}50%{transform:scale(1.2);opacity:0}}
        @keyframes shake{0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)}}
      `}</style>
        </div>
    );
}
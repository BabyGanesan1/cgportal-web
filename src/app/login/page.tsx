'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Key, ArrowRight, Loader2, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { setAuth, isAuthenticated, getAdmin } from '../../lib/auth';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const ALLOWED_DOMAINS = ['casagrand.co.in', 'casagrandcontracts.com', 'digilogy.co', 'casagrandtravelogy.co.in'];

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [domain, setDomain] = useState(ALLOWED_DOMAINS[0]);
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
    const [forgotPassword, setForgotPassword] = useState(false);
    const [resetStep, setResetStep] = useState<'email' | 'otp' | 'password'>('email');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const flsDeptMap: Record<string, string> = {
        'FLS-Booking': '/fls-booking-portal/booking',
        'FLS-Checking': '/fls-booking-portal/checking',
        'FLS-Source': '/fls-booking-portal/source',
    };

    // If already logged in, redirect to the correct page
    useEffect(() => {
        if (!isAuthenticated()) return;
        const admin = getAdmin();
        if (admin?.role === 'admin') {
            if (admin.department && flsDeptMap[admin.department]) {
                router.replace(flsDeptMap[admin.department]);
            } else if (admin.owner === false && admin.zonal) {
                router.replace(`/${admin.zonal}/dashboard`);
            } else {
                router.replace('/dashboard');
            }
        } else if (admin?.role === 'user' && admin?.department === 'sales') {
            router.replace('/sales-portal');
        } else {
            router.replace('/portal/properties');
        }
    }, [router]);
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || (loginMode === 'password' && !password)) return;
        const fullEmail = `${email.trim()}@${domain}`;
        if (!ALLOWED_DOMAINS.includes(domain)) { toast.error('Please enter a valid authorized company email address'); return; }
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email: fullEmail, password });
            setAuth(res.data.data.token, res.data.data.admin);
            toast.success('Welcome back!');
            const adminData = res.data.data.admin;
            if (adminData.role === 'admin') {
                if (adminData.department && flsDeptMap[adminData.department]) {
                    router.replace(flsDeptMap[adminData.department]);
                } else if (adminData.owner === false && adminData.zonal) {
                    router.replace(`/${adminData.zonal}/dashboard`);
                } else {
                    router.replace('/dashboard');
                }
            }
            else if (adminData.role === 'user' && adminData.department === 'sales') router.replace('/sales-portal');
            else router.replace('/portal/properties');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Login failed. Please check credentials.');
        } finally { setLoading(false); }
    };

    const handleSendOTP = async () => {
        if (!email) return toast.error('Please enter your email');
        const fullEmail = `${email.trim()}@${domain}`;
        if (!ALLOWED_DOMAINS.includes(domain)) { toast.error('Please enter a valid authorized company email address'); return; }
        setLoading(true);
        try {
            await api.post('/auth/send-otp', { email: fullEmail });
            setOtpSent(true);
            toast.success('OTP sent to your email');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        } finally { setLoading(false); }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp) return;
        setLoading(true);
        const fullEmail = `${email.trim()}@${domain}`;
        try {
            const res = await api.post('/auth/verify-otp', { email: fullEmail, otp });
            setAuth(res.data.data.token, res.data.data.admin);
            toast.success('Welcome back!');
            const adminData = res.data.data.admin;
            if (adminData.role === 'admin') {
                if (adminData.department && flsDeptMap[adminData.department]) {
                    router.replace(flsDeptMap[adminData.department]);
                } else if (adminData.owner === false && adminData.zonal) {
                    router.replace(`/${adminData.zonal}/dashboard`);
                } else {
                    router.replace('/dashboard');
                }
            }
            else if (adminData.role === 'user' && adminData.department === 'sales') router.replace('/sales-portal');
            else router.replace('/portal/properties');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
        } finally { setLoading(false); }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return toast.error('Please enter your email');
        const fullEmail = `${email.trim()}@${domain}`;
        if (!ALLOWED_DOMAINS.includes(domain)) { toast.error('Please enter a valid authorized company email address'); return; }
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email: fullEmail });
            setResetStep('otp');
            setOtpSent(true);
            toast.success('OTP sent to your email');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to send reset OTP');
        } finally { setLoading(false); }
    };

    const handleVerifyResetOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp) return toast.error('Please enter the OTP');
        setLoading(true);
        const fullEmail = `${email.trim()}@${domain}`;
        try {
            await api.post('/auth/verify-reset-otp', { email: fullEmail, otp });
            setResetStep('password');
            toast.success('OTP verified! Now set your new password.');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
        } finally { setLoading(false); }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp) return toast.error('Please enter the OTP');
        if (!newPassword) return toast.error('Please enter new password');
        if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
        if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
        setLoading(true);
        const fullEmail = `${email.trim()}@${domain}`;
        try {
            await api.post('/auth/reset-password', { email: fullEmail, otp, newPassword });
            toast.success('Password reset successfully! Please login with your new password.');
            setForgotPassword(false);
            setResetStep('email');
            setEmail('');
            setOtp('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to reset password');
        } finally { setLoading(false); }
    };

    /* ─── helpers for reset-form submit ─── */
    const handleResetFormSubmit = (e: React.FormEvent) => {
        if (resetStep === 'email') handleForgotPassword(e);
        else if (resetStep === 'otp') handleVerifyResetOTP(e);
        else handleResetPassword(e);
    };

    return (
        <div className="min-h-screen flex" style={{ background: '#f8f9fc' }}>
            {/* Left Panel — Real Estate Visual (hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <img
                    //src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1400&auto=format&fit=crop"
                    src="/assets/images/cg_login_background.jpg"
                    alt="Luxury Property"
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                />
                <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(135deg, rgba(10,22,40,0.85) 0%, rgba(10,22,40,0.5) 100%)' }}
                />

                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    <div>
                        <img src="/assets/images/cg_logo.png" alt="Casagrand" className="h-10 w-auto object-contain" />
                    </div>

                    <div>
                        <h2 className="font-display font-black text-white leading-tight mb-4" style={{ fontSize: '2.5rem' }}>
                            Find Your<span style={{ color: '#f59e0b' }}>Dream Home</span>Today.
                        </h2>
                        <p className="font-medium leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 360 }}>
                            Access exclusive premium properties curated for quality living and smart investment.
                        </p>

                        <div className="flex gap-6">
                            {[{ v: '180+', l: 'Landmarks' }, { v: '155k+', l: 'Customers' }, { v: '88M+', l: 'Sq.Ft. Development' }].map(s => (
                                <div key={s.l}>
                                    <div className="text-2xl font-black" style={{ color: '#f59e0b' }}>{s.v}</div>
                                    <div className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.l}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div
                        className="rounded-2xl p-5"
                        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                                <img
                                    //src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=200&auto=format&fit=crop"
                                    src="/assets/images/cg_resital_image.jpg"
                                    alt=""
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                            <div>
                                <div className="font-black text-white text-sm">Residential Projects</div>
                                <div className="text-xs font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Starting from 50 Lakh</div>
                            </div>
                            {/* <div className="ml-auto px-3 py-1 rounded-full text-[10px] font-black" style={{ background: '#f59e0b', color: '#0a1628' }}>New</div> */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel — Login / Forgot Password Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <img src="/assets/images/cg_logo.png" alt="Casagrand" className="h-10 w-auto object-contain mx-auto" />
                    </div>

                    <div className="mb-8">
                        <h1 className="font-display font-black mb-2" style={{ fontSize: '2rem', color: '#0a1628' }}>
                            {forgotPassword ? 'Reset Password' : 'Welcome back'}
                        </h1>
                        <p className="font-medium text-sm" style={{ color: '#64748b' }}>
                            {forgotPassword ? 'Recover your account' : 'Sign in to access Casagrand property portal'}
                        </p>
                    </div>

                    {/* ── FORGOT PASSWORD FLOW ── */}
                    {forgotPassword ? (
                        <form onSubmit={handleResetFormSubmit} className="space-y-5" noValidate>
                            {/* Email — always visible */}
                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
                                    <input
                                        type="text" value={email} onChange={e => setEmail(e.target.value.replace(/@.*/, '').trim())} required
                                        placeholder="username" disabled={resetStep !== 'email'}
                                        className="w-full pl-11 pr-[180px] sm:pr-[240px] py-3.5 rounded-xl text-sm font-medium outline-none transition-all disabled:opacity-60"
                                        style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e293b' }}
                                        onFocus={e => (e.target.style.borderColor = '#f59e0b')}
                                        onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                                    />
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                        <div className="relative flex items-center pl-2 pr-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                            <span className="text-xs sm:text-sm font-semibold pointer-events-none truncate max-w-[120px] sm:max-w-none" style={{ color: '#0a1628' }}>@{domain}</span>
                                            <ChevronDown className="w-4 h-4 ml-1 text-slate-400 pointer-events-none" />
                                            <select
                                                value={domain} onChange={e => setDomain(e.target.value)} disabled={resetStep !== 'email'}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                            >
                                                {ALLOWED_DOMAINS.map(d => <option key={d} value={d}>@{d}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* OTP input */}
                            {resetStep === 'otp' && (
                                <div>
                                    <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>Enter 6-Digit OTP</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
                                        <input
                                            type="text" value={otp}
                                            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            required placeholder="000000" maxLength={6} autoFocus
                                            className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-mono text-center text-xl tracking-widest outline-none transition-all"
                                            style={{ background: '#f8fafc', border: '1.5px solid #f59e0b', color: '#1e293b', letterSpacing: '0.4em' }}
                                        />
                                    </div>
                                    <p className="text-xs mt-2 text-center" style={{ color: '#94a3b8' }}>Code sent to {email}</p>
                                </div>
                            )}

                            {/* New + Confirm password */}
                            {resetStep === 'password' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>New Password</label>
                                        <div className="relative">
                                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
                                            <input
                                                type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                                                placeholder="New password"
                                                className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm font-medium outline-none transition-all"
                                                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e293b' }}
                                                onFocus={e => (e.target.style.borderColor = '#f59e0b')}
                                                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 focus:outline-none"
                                                style={{ color: '#94a3b8' }}
                                            >
                                                {showNewPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>Confirm Password</label>
                                        <div className="relative">
                                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                                                placeholder="Confirm password"
                                                className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm font-medium outline-none transition-all"
                                                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e293b' }}
                                                onFocus={e => (e.target.style.borderColor = '#f59e0b')}
                                                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 focus:outline-none"
                                                style={{ color: '#94a3b8' }}
                                            >
                                                {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            <button
                                type="submit" disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                style={{ background: '#0a1628', color: '#fff' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#f59e0b'; e.currentTarget.style.color = '#0a1628'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#0a1628'; e.currentTarget.style.color = '#fff'; }}
                            >
                                {loading
                                    ? <Loader2 className="w-5 h-5 animate-spin" />
                                    : <><span>{resetStep === 'password' ? 'Reset Password' : resetStep === 'otp' ? 'Verify OTP' : 'Send OTP'}</span><ArrowRight className="w-4 h-4" /></>
                                }
                            </button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => { setForgotPassword(false); setResetStep('email'); setOtp(''); setNewPassword(''); setConfirmPassword(''); }}
                                    className="text-sm font-medium transition-colors"
                                    style={{ color: '#94a3b8' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#f59e0b')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                                >
                                    ← Back to Login
                                </button>
                            </div>
                        </form>

                    ) : (
                        /* ── NORMAL LOGIN FLOW ── */
                        <>
                            {/* Mode toggle */}
                            <div className="flex p-1 rounded-xl mb-6" style={{ background: '#f1f5f9' }}>
                                {(['password', 'otp'] as const).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => { setLoginMode(m); setOtpSent(false); setOtp(''); }}
                                        className="flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
                                        style={loginMode === m
                                            ? { background: '#fff', color: '#0a1628', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
                                            : { color: '#94a3b8' }}
                                    >
                                        {m === 'password' ? 'Password' : 'OTP Login'}
                                    </button>
                                ))}
                            </div>

                            {/* Password login */}
                            {loginMode === 'password' ? (
                                <form onSubmit={handleLogin} className="space-y-5" noValidate>
                                    <div>
                                        <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
                                            <input
                                                type="text" value={email} onChange={e => setEmail(e.target.value.replace(/@.*/, '').trim())} required
                                                placeholder="username"
                                                className="w-full pl-11 pr-[180px] sm:pr-[240px] py-3.5 rounded-xl text-sm font-medium outline-none transition-all"
                                                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e293b' }}
                                                onFocus={e => (e.target.style.borderColor = '#f59e0b')}
                                                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                                            />
                                            <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                                <div className="relative flex items-center pl-2 pr-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                                    <span className="text-xs sm:text-sm font-semibold pointer-events-none truncate max-w-[120px] sm:max-w-none" style={{ color: '#0a1628' }}>@{domain}</span>
                                                    <ChevronDown className="w-4 h-4 ml-1 text-slate-400 pointer-events-none" />
                                                    <select
                                                        value={domain} onChange={e => setDomain(e.target.value)}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    >
                                                        {ALLOWED_DOMAINS.map(d => <option key={d} value={d}>@{d}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>Password</label>
                                        <div className="relative">
                                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
                                            <input
                                                type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                                                placeholder="Enter Password"
                                                className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm font-medium outline-none transition-all"
                                                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e293b' }}
                                                onFocus={e => (e.target.style.borderColor = '#f59e0b')}
                                                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 focus:outline-none"
                                                style={{ color: '#94a3b8' }}
                                            >
                                                {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="submit" disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                        style={{ background: '#0a1628', color: '#fff' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#f59e0b'; e.currentTarget.style.color = '#0a1628'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#0a1628'; e.currentTarget.style.color = '#fff'; }}
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
                                    </button>
                                </form>
                            ) : (
                                /* OTP login */
                                <form
                                    onSubmit={otpSent ? handleVerifyOTP : (e) => { e.preventDefault(); handleSendOTP(); }}
                                    className="space-y-5"
                                    noValidate
                                >
                                    <div>
                                        <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
                                            <input
                                                type="text" value={email} onChange={e => setEmail(e.target.value.replace(/@.*/, '').trim())} required disabled={otpSent}
                                                placeholder="username"
                                                className="w-full pl-11 pr-[180px] sm:pr-[240px] py-3.5 rounded-xl text-sm font-medium outline-none transition-all disabled:opacity-60"
                                                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e293b' }}
                                                onFocus={e => (e.target.style.borderColor = '#f59e0b')}
                                                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                                            />
                                            <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                                <div className="relative flex items-center pl-2 pr-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                                    <span className="text-xs sm:text-sm font-semibold pointer-events-none truncate max-w-[120px] sm:max-w-none" style={{ color: '#0a1628' }}>@{domain}</span>
                                                    <ChevronDown className="w-4 h-4 ml-1 text-slate-400 pointer-events-none" />
                                                    <select
                                                        value={domain} onChange={e => setDomain(e.target.value)} disabled={otpSent}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                    >
                                                        {ALLOWED_DOMAINS.map(d => <option key={d} value={d}>@{d}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {otpSent && (
                                        <div>
                                            <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>Enter 6-Digit OTP</label>
                                            <div className="relative">
                                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
                                                <input
                                                    type="text" value={otp}
                                                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    required placeholder="000000" maxLength={6} autoFocus
                                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-mono text-center text-xl tracking-widest outline-none transition-all"
                                                    style={{ background: '#f8fafc', border: '1.5px solid #f59e0b', color: '#1e293b', letterSpacing: '0.4em' }}
                                                />
                                            </div>
                                            <p className="text-xs mt-2 text-center" style={{ color: '#94a3b8' }}>Code sent to {email}</p>
                                        </div>
                                    )}
                                    <button
                                        type="submit" disabled={loading || (otpSent && otp.length < 6)}
                                        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                        style={{ background: otpSent ? '#f59e0b' : '#0a1628', color: otpSent ? '#0a1628' : '#fff' }}
                                    >
                                        {loading
                                            ? <Loader2 className="w-5 h-5 animate-spin" />
                                            : otpSent
                                                ? <><span>Verify & Sign In</span><ArrowRight className="w-4 h-4" /></>
                                                : <><span>Send OTP</span><ArrowRight className="w-4 h-4" /></>
                                        }
                                    </button>
                                    {otpSent && (
                                        <button
                                            type="button" onClick={() => { setOtpSent(false); setOtp(''); }}
                                            className="w-full text-xs text-center transition-colors"
                                            style={{ color: '#94a3b8' }}
                                            onMouseEnter={e => (e.currentTarget.style.color = '#64748b')}
                                            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                                        >
                                            ← Change email or resend OTP
                                        </button>
                                    )}
                                </form>
                            )}

                            {/* Footer links */}
                            <div className="mt-6 text-center">
                                <button
                                    type="button" onClick={() => router.push('/signup')}
                                    className="text-sm font-medium transition-colors"
                                    style={{ color: '#94a3b8' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#f59e0b')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                                >
                                    New user? <span className="font-bold">Create an account</span>
                                </button>
                            </div>

                            {loginMode === 'password' && (
                                <div className="mt-4 text-center">
                                    <button
                                        type="button" onClick={() => setForgotPassword(true)}
                                        className="text-sm font-medium transition-colors"
                                        style={{ color: '#94a3b8' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#f59e0b')}
                                        onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    <p className="text-center text-xs mt-8" style={{ color: '#cbd5e1' }}>© 2026 CG Properties. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
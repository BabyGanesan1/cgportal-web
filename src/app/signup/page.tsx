'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Key, ArrowRight, Loader2, User, Eye, EyeOff, ChevronDown } from 'lucide-react';
import api from '../../lib/api';
import { setAuth } from '../../lib/auth';
import toast from 'react-hot-toast';

const ALLOWED_DOMAINS = ['casagrand.co.in', 'casagrandcontracts.com', 'digilogy.co', 'casagrandtravelogy.co.in'];

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState<'info' | 'otp'>('info');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [domain, setDomain] = useState(ALLOWED_DOMAINS[0]);
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !password) return;
        const fullEmail = `${email.trim()}@${domain}`;
        if (!ALLOWED_DOMAINS.includes(domain)) { toast.error('Please enter a valid authorized company email address'); return; }
        if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            await api.post('/auth/signup', { name, email: fullEmail, password });
            toast.success('Signup successful! Use the OTP sent to your email to verify.');
            setStep('otp');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Signup failed');
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
            toast.success(`Welcome, ${res.data.data.admin.name}!`);
            if (res.data.data.admin.role === 'admin') router.replace('/dashboard');
            else router.replace('/portal/properties');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex" style={{ background: '#f8f9fc' }}>
            {/* Left Panel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <img
                    //src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1400&auto=format&fit=crop"
                    src="https://casagrand-prod.s3.ap-south-1.amazonaws.com/wp-content/uploads/2026/04/Night-View-scaled.jpg"
                    alt="Luxury Property"
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,22,40,0.88) 0%, rgba(10,22,40,0.5) 100%)' }} />
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    <div>
                        <img src="/assets/images/cg_logo.png" alt="Casagrand" className="h-10 w-auto object-contain" />
                    </div>

                    <div>
                        <h2 className="font-display font-black text-white leading-tight mb-4" style={{ fontSize: '2.5rem' }}>
                            Begin Your<span style={{ color: '#f59e0b' }}>Property</span>Journey.
                        </h2>
                        <p className="font-medium leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 360 }}>
                            Join thousands of families who found their perfect home through Casagrand.
                        </p>
                        {/* Feature list */}
                        {['Browse exclusive premium listings', 'Get real-time price sheets'].map(f => (
                            <div key={f} className="flex items-center gap-3 mb-4">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f59e0b' }}>
                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="#0a1628" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                                <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>{f}</span>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                                <img src="https://casagrand-prod.s3.ap-south-1.amazonaws.com/wp-content/uploads/2026/04/Swimming-Pool-View-Day-490x365.jpg?ver=1.212"
                                    alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                                <div className="font-black text-white text-sm">Residential Projects</div>
                                <div className="text-xs font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Starting from 50 Lakhs</div>
                            </div>
                            {/* <div className="ml-auto px-3 py-1 rounded-full text-[10px] font-black" style={{ background: '#34d399', color: '#022c22' }}>Live</div> */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel — Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <img src="/assets/images/cg_logo.png" alt="Casagrand" className="h-10 w-auto object-contain mx-auto" />
                    </div>

                    {/* Progress indicator */}
                    <div className="flex items-center gap-3 mb-8">
                        {(['info', 'otp'] as const).map((s, i) => (
                            <React.Fragment key={s}>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
                                        style={step === s || (s === 'info' && step === 'otp') ? { background: '#0a1628', color: '#fff' } : { background: '#f1f5f9', color: '#94a3b8' }}>
                                        {s === 'info' && step === 'otp' ? '✓' : i + 1}
                                    </div>
                                    <span className="text-xs font-bold" style={{ color: step === s ? '#0a1628' : '#94a3b8' }}>
                                        {s === 'info' ? 'Details' : 'Verify'}
                                    </span>
                                </div>
                                {i === 0 && <div className="flex-1 h-0.5 rounded-full" style={{ background: step === 'otp' ? '#f59e0b' : '#e2e8f0' }} />}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="mb-8">
                        <h1 className="font-display font-black mb-2" style={{ fontSize: '2rem', color: '#0a1628' }}>
                            {step === 'info' ? 'Create Account' : 'Verify Email'}
                        </h1>
                        <p className="font-medium text-sm" style={{ color: '#64748b' }}>
                            {step === 'info' ? 'Join our real estate community today' : `We sent a 6-digit code to ${email}`}
                        </p>
                    </div>

                    {step === 'info' ? (
                        <form onSubmit={handleSignup} className="space-y-5" noValidate>
                            {[
                                { label: 'Full Name', type: 'text', name: 'name', value: name, onChange: setName, placeholder: 'Enter your name', Icon: User, suffix: undefined },
                                { label: 'Email Address', type: 'text', name: 'email', value: email, onChange: (v: string) => setEmail(v.replace(/@.*/, '').trim()), placeholder: 'username', Icon: Mail, suffix: undefined },
                                { label: 'Password', type: 'password', name: 'password', value: password, onChange: setPassword, placeholder: '••••••••', Icon: Key, suffix: undefined },
                            ].map(field => {
                                const isPassword = field.type === 'password';
                                const inputType = isPassword ? (showPassword ? 'text' : 'password') : field.type;

                                return (
                                    <div key={field.label}>
                                        <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>{field.label}</label>
                                        <div className="relative">
                                            <field.Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
                                            <input type={inputType} value={field.value} onChange={e => field.onChange(e.target.value)} required
                                                placeholder={field.placeholder}
                                                className={`w-full pl-11 ${isPassword ? 'pr-12' : field.name === 'email' ? 'pr-[180px] sm:pr-[240px]' : 'pr-4'} py-3.5 rounded-xl text-sm font-medium outline-none transition-all`}
                                                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e293b' }}
                                                onFocus={e => (e.target.style.borderColor = '#f59e0b')}
                                                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                                            />
                                            {field.name === 'email' && (
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
                                            )}
                                            {isPassword && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 focus:outline-none"
                                                    style={{ color: '#94a3b8' }}
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <button type="submit" disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                style={{ background: '#0a1628', color: '#fff' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#f59e0b'; e.currentTarget.style.color = '#0a1628'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#0a1628'; e.currentTarget.style.color = '#fff'; }}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
                            </button>
                            <div className="text-center">
                                <button type="button" onClick={() => router.push('/login')}
                                    className="text-sm font-medium transition-colors" style={{ color: '#94a3b8' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#f59e0b')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                                    Already have an account? <span className="font-bold">Sign In</span>
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-5" noValidate>
                            <div className="p-5 rounded-2xl text-center" style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}>
                                <p className="text-sm font-medium" style={{ color: '#92400e' }}>Check your inbox at</p>
                                <p className="font-black mt-1" style={{ color: '#0a1628' }}>{email}@{domain}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>6-Digit OTP</label>
                                <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    required placeholder="0  0  0  0  0  0" maxLength={6} autoFocus
                                    className="w-full py-4 rounded-xl text-2xl font-mono text-center tracking-widest outline-none transition-all"
                                    style={{ background: '#f8fafc', border: '1.5px solid #f59e0b', color: '#1e293b', letterSpacing: '0.5em' }}
                                />
                            </div>
                            <button type="submit" disabled={loading || otp.length < 6}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                style={{ background: '#f59e0b', color: '#0a1628' }}>
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Verify & Join</span><ArrowRight className="w-4 h-4" /></>}
                            </button>
                            <button type="button" onClick={() => setStep('info')}
                                className="w-full text-sm text-center transition-colors" style={{ color: '#94a3b8' }}>
                                ← Change details
                            </button>
                        </form>
                    )}

                    <p className="text-center text-xs mt-8" style={{ color: '#cbd5e1' }}>© 2026 CG Properties. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}

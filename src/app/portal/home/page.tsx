'use client';
import React, { useState, useEffect } from 'react';
import { Send, User, Bot, Building2, ArrowRight, Sparkles, Star, MapPin, Phone, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../../components/layout/AppLayout';
import { getAdmin } from '../../../lib/auth';

const heroImages = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1800&auto=format&fit=crop',
];

const buildingCards = [
  {
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800&auto=format&fit=crop',
    title: 'Sky Residences',
    location: 'Premium Tower Living',
    tag: 'New Launch',
  },
  {
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
    title: 'Heritage Villas',
    location: 'Gated Community',
    tag: 'Ready to Move',
  },
  {
    image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=800&auto=format&fit=crop',
    title: 'Green Meadows',
    location: 'Eco-Friendly Homes',
    tag: 'Trending',
  },
];

export default function ChatLandingPage() {
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const admin = getAdmin();

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([{
        role: 'bot',
        text: `Hello ${admin?.name || 'there'}! Welcome to Casagrand Properties. I'm your virtual assistant. How can I help you find your dream home today?`
      }]);
    }, 500);
    return () => clearTimeout(timer);
  }, [admin]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppLayout title="Premium Living" subtitle="Experience the future of property search">
      <div style={{ background: '#f8f9fc' }} className="pb-20">

        {/* Hero with rotating building images */}
        <div className="relative overflow-hidden mx-4 sm:mx-6 lg:mx-8 mt-6 rounded-[2rem]" style={{ minHeight: '70vh' }}>
          {heroImages.map((img, i) => (
            <div key={i} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: i === currentImage ? 1 : 0 }}>
              <img src={img} alt="Property" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ minHeight: '70vh' }} />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/90 via-[#0a1628]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/80 via-transparent to-transparent" />

          <div className="relative z-10 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-16" style={{ minHeight: '70vh' }}>
            <div className="max-w-2xl" style={{ animation: 'slideUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards' }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full text-xs font-bold uppercase tracking-widest" style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24' }}>
                <Star className="w-3 h-3" style={{ fill: '#fbbf24' }} />
                Exclusively Curated for You
              </div>
              <h1 className="font-display font-black text-white leading-tight mb-6" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
                Find a Space That<br />
                <span style={{ background: 'linear-gradient(to right, #fbbf24, #fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Inspires Your Life.
                </span>
              </h1>
              <p className="text-lg font-medium mb-10 leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Discover premium residences crafted for modern living — each property handpicked for quality, location, and lifestyle.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/portal/properties')}
                  className="flex items-center justify-center gap-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95"
                  style={{ padding: '1rem 2rem', background: '#f59e0b', color: '#0a1628', boxShadow: '0 20px 40px rgba(245,158,11,0.3)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fbbf24')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#f59e0b')}
                >
                  <Search className="w-5 h-5" /> Explore Properties
                </button>
                <button
                  className="flex items-center justify-center gap-3 rounded-2xl font-bold text-sm text-white transition-all"
                  style={{ padding: '1rem 2rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  <Phone className="w-5 h-5" /> Talk to Advisor
                </button>
              </div>
            </div>

            {/* Dots */}
            <div className="absolute bottom-8 left-6 sm:left-12 flex gap-2">
              {heroImages.map((_, i) => (
                <button key={i} onClick={() => setCurrentImage(i)}
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: i === currentImage ? '2rem' : '0.375rem', background: i === currentImage ? '#f59e0b' : 'rgba(255,255,255,0.4)' }}
                />
              ))}
            </div>

            {/* Stats */}
            <div className="absolute bottom-8 right-6 sm:right-12 hidden md:flex items-center gap-6 rounded-2xl px-6 py-4"
              style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              {[{ label: 'Projects', value: '50+' }, { label: 'Happy Families', value: '2K+' }, { label: 'Cities', value: '12+' }].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-black" style={{ color: '#f59e0b' }}>{s.value}</div>
                  <div className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Property Cards */}
        <div className="px-4 sm:px-6 lg:px-8 mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#d97706' }}>Handpicked For You</p>
              <h2 className="text-3xl font-display font-black" style={{ color: '#0f172a' }}>Featured Properties</h2>
            </div>
            <button onClick={() => router.push('/portal/properties')}
              className="flex items-center gap-2 text-sm font-bold transition-colors"
              style={{ color: '#64748b' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#d97706')}
              onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildingCards.map((card, i) => (
              <div key={i} onClick={() => router.push('/portal/properties')}
                className="group relative rounded-[1.5rem] overflow-hidden cursor-pointer transition-all duration-500"
                style={{ height: 300, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'; }}
              >
                <img src={card.image} alt={card.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0a1628 0%, rgba(10,22,40,0.3) 50%, transparent 100%)' }} />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ background: '#f59e0b', color: '#0a1628' }}>{card.tag}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-display font-black text-white mb-1">{card.title}</h3>
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{card.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="px-4 sm:px-6 lg:px-8 mt-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Building2, title: 'Elite Projects', desc: 'Exclusive access to premium launches before they hit the market.', bg: '#eff6ff', color: '#1d4ed8', hoverBg: '#1d4ed8' },
              { icon: MapPin, title: 'Prime Locations', desc: 'Curated neighborhoods matched to your ideal lifestyle.', bg: '#f0fdf4', color: '#15803d', hoverBg: '#15803d' },
              { icon: Sparkles, title: 'Smart Matching', desc: 'Properties selected to match your budget and preferences.', bg: '#fffbeb', color: '#b45309', hoverBg: '#d97706' },
            ].map((f, i) => (
              <div key={i} className="group p-8 rounded-[1.5rem] border transition-all duration-500 cursor-pointer"
                style={{ background: '#fff', borderColor: '#f1f5f9' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.transform = ''; }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500" style={{ background: f.bg, color: f.color }}>
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-display font-black mb-3" style={{ color: '#0f172a' }}>{f.title}</h3>
                <p className="font-medium leading-relaxed text-sm" style={{ color: '#64748b' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Assistant Section */}
        <div className="px-4 sm:px-6 lg:px-8 mt-16">
          <div className="relative overflow-hidden rounded-[2rem]" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2f4e 100%)' }}>
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(245,158,11,0.05)', transform: 'translate(50%, -50%)' }} />
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left */}
              <div className="p-8 sm:p-12">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#f59e0b' }}>
                    <Bot className="w-6 h-6" style={{ color: '#0a1628' }} />
                  </div>
                  <div>
                    <h4 className="font-black text-white">CG Assistant</h4>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#34d399' }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#34d399' }} />
                      Always Online
                    </div>
                  </div>
                </div>
                <h2 className="font-display font-black text-white leading-tight mb-4" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
                  Your Personal<br /><span style={{ color: '#f59e0b' }}>Property Guide</span>
                </h2>
                <p className="font-medium leading-relaxed mb-8 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Tell us what you're looking for — budget, location, lifestyle — and we'll find your perfect match.
                </p>
                <div className="space-y-3 mb-8">
                  {['Luxury Villas in Chennai', 'Budget Apartments 40L–60L', '3BHK Ready Possession'].map(t => (
                    <button key={t} onClick={() => router.push('/portal/properties')}
                      className="w-full text-left px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-between group"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
                    >
                      {t}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: 'rgba(255,255,255,0.4)' }} />
                    </button>
                  ))}
                </div>
                <button onClick={() => router.push('/portal/properties')}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95"
                  style={{ background: '#f59e0b', color: '#0a1628' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fbbf24')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#f59e0b')}
                >
                  <ArrowRight className="w-5 h-5" /> Browse All Properties
                </button>
              </div>

              {/* Right: Chat */}
              <div className="border-l hidden lg:flex flex-col p-8 sm:p-12" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="flex-1 space-y-6">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-3 max-w-[90%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: m.role === 'user' ? '#f59e0b' : 'rgba(255,255,255,0.2)', color: m.role === 'user' ? '#0a1628' : '#fff' }}>
                          {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className="px-5 py-4 rounded-2xl text-sm font-medium leading-relaxed"
                          style={m.role === 'user' ? { background: 'rgba(245,158,11,0.2)', color: '#fde68a', borderRadius: '1rem 0 1rem 1rem', border: '1px solid rgba(245,158,11,0.2)' } : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', borderRadius: '0 1rem 1rem 1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                          {m.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 relative">
                  <input type="text" placeholder="Tell me what you're looking for..." disabled
                    className="w-full pl-5 pr-14 py-4 rounded-2xl text-sm font-medium outline-none"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <button disabled className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Strip */}
        <div className="px-4 sm:px-6 lg:px-8 mt-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-6 text-center" style={{ color: '#94a3b8' }}>Our Portfolio</p>
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
            {[
              'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=600&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?q=80&w=600&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=600&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?q=80&w=600&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1605146769289-440113cc3d00?q=80&w=600&auto=format&fit=crop',
            ].map((img, i) => (
              <div key={i} onClick={() => router.push('/portal/properties')}
                className="flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
                style={{ width: 192, height: 128, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
              >
                <img src={img} alt="Property" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </div>

      </div>
      <style jsx global>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </AppLayout>
  );
}

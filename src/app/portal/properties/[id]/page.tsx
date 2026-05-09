'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Search, ArrowLeft, CheckCircle2, ChevronRight, FileText, LayoutGrid, Star, Share2, Bookmark, Sparkles, MapPin, Calendar, Phone } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '../../../../components/layout/AppLayout';
import api from '../../../../lib/api';
import { formatCurrency, formatDate, getDirectImageUrl } from '../../../../lib/utils';
import Badge from '../../../../components/ui/Badge';

// Format amount as Indian number system rupees
function formatPortalAmount(val: any): string {
  if (val === null || val === undefined || val === '') return '—';
  const num = parseFloat(String(val));
  if (isNaN(num)) return String(val);
  // If value looks like it's in Lakhs (< 1000), convert to rupees
  if (num < 10000) {
    const rupees = Math.round(num * 100000);
    return '₹' + rupees.toLocaleString('en-IN');
  }
  // Otherwise treat as direct rupee value
  return '₹' + Math.round(num).toLocaleString('en-IN');
}

// Format grand_total — may be raw rupees or lakhs label
function formatUnitAmount(val: any): string {
  if (val === null || val === undefined || val === '') return '—';
  const str = String(val).trim();
  // If it already contains comma/rupee, return as-is
  if (str.includes(',') || str.includes('₹')) return str;
  const num = parseFloat(str);
  if (isNaN(num)) return str;
  // grand_total from API is typically in Lakhs (e.g. 7.97 = 7,97,000)
  if (num < 10000) {
    const rupees = Math.round(num * 100000);
    return '₹' + rupees.toLocaleString('en-IN');
  }
  return '₹' + Math.round(num).toLocaleString('en-IN');
}

export default function PublicPropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/properties/${id}`),
      api.get(`/properties/${id}/details/stats`),
      api.get(`/properties/${id}/details`, { params: { limit: 100 } })
    ]).then(([pRes, sRes, uRes]) => {
      setProperty(pRes.data.data);
      setStats(sRes.data.data);
      setUnits(uRes.data.data);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const filteredUnits = units.filter(u =>
    u.unit_no.toLowerCase().includes(search.toLowerCase()) ||
    u.bhk.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <AppLayout title="Loading..." subtitle="Fetching property details">
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 rounded-full animate-spin" style={{ border: '4px solid #f1f5f9', borderTopColor: '#f59e0b' }} />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout title={property?.project_name} subtitle={`${property?.cityData?.name} · ${property?.locationData?.name}`}>
      <div className="pb-20" style={{ background: '#f8f9fc' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button onClick={() => router.back()}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
              style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#0a1628'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}

            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 text-white shadow-lg"
              style={{ background: '#f59e0b', boxShadow: '0 8px 20px rgba(245,158,11,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#d97706')}
              onMouseLeave={e => (e.currentTarget.style.background = '#f59e0b')}
            >
              <Phone className="w-4 h-4" /> <span className="hidden sm:inline">Request Viewing</span><span className="sm:hidden">Contact</span>
            </button>
          </div>

          {/* Hero */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Image */}
            <div className="lg:col-span-2 relative rounded-[2rem] overflow-hidden group" style={{ minHeight: 320, height: 'clamp(280px, 50vw, 500px)' }}>
              <img
                src={getDirectImageUrl(property?.image_url) || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200'}
                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
                alt={property?.project_name}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.95) 0%, rgba(10,22,40,0.2) 50%, transparent 100%)' }} />

              {/* Action buttons */}
              <div className="absolute top-5 right-5 flex flex-col gap-3">
                {[Bookmark, Share2].map((Icon, i) => (
                  <button key={i} className="p-3 rounded-2xl transition-all"
                    style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#0a1628'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                ))}
              </div>

              {/* Hero Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ background: '#f59e0b', color: '#0a1628' }}>
                    Signature Series
                  </span>
                  <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <MapPin className="w-4 h-4" style={{ color: '#f59e0b' }} />
                    <span className="font-bold tracking-widest uppercase text-[10px]">
                      {property?.locationData?.name}, {property?.cityData?.name}
                    </span>
                  </div>
                </div>
                <h1 className="font-display font-black text-white leading-tight mb-5" style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}>
                  {property?.project_name}
                </h1>
                <div className="flex flex-wrap gap-4 sm:gap-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  {[
                    { label: 'Investment From', value: formatPortalAmount(property?.min_price), highlight: true },
                    { label: 'Handover', value: formatDate(property?.handing_over_date) },
                    { label: 'BHK Types', value: property?.bhk },
                  ].map(item => (
                    <div key={item.label} className="space-y-1">
                      <span className="block text-[10px] uppercase font-black tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.label}</span>
                      <span className="font-black text-lg sm:text-xl" style={{ color: item.highlight ? '#f59e0b' : '#fff' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Stats Card */}
              <div className="rounded-[1.5rem] p-6 sm:p-8 border relative overflow-hidden" style={{ background: '#fff', borderColor: '#f1f5f9' }}>
                <h3 className="text-xl font-display font-black mb-6" style={{ color: '#0f172a' }}>Unit Statistics</h3>
                <div className="space-y-5">
                  {[
                    { icon: LayoutGrid, label: 'Total Units', value: stats?.total || 0, bg: '#f1f5f9', color: '#475569' },
                    { icon: CheckCircle2, label: 'Available', value: stats?.available, bg: '#f0fdf4', color: '#15803d' },
                    { icon: Star, label: 'BHK Types', value: Object.keys(stats?.bhkWise || {}).length, bg: '#fffbeb', color: '#b45309' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.bg, color: item.color }}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-xs uppercase tracking-widest" style={{ color: '#94a3b8' }}>{item.label}</span>
                      </div>
                      <span className="text-xl font-black" style={{ color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Card */}
              <div className="rounded-[1.5rem] p-6 sm:p-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%)' }}>
                <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full blur-3xl" style={{ background: 'rgba(245,158,11,0.1)', transform: 'translate(30%, 30%)' }} />
                <Sparkles className="w-10 h-10 mb-5" style={{ color: '#f59e0b' }} />
                <h4 className="text-lg font-display font-black text-white mb-3 leading-tight">Elite Advisor Integration</h4>
                <p className="text-sm font-medium mb-6 leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Let our concierge assist you in picking the perfect unit for your investment goals.
                </p>
                <button className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                  style={{ background: '#f59e0b', color: '#0a1628' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fbbf24')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#f59e0b')}>
                  Call Advisor Now
                </button>
              </div>

              {/* Building image accent */}
              <div className="rounded-[1.5rem] overflow-hidden" style={{ height: 160 }}>
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop"
                  alt="Building" className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          {/* Inventory / Units Section */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-black leading-tight" style={{ color: '#0f172a' }}>
                  Inventory <span style={{ color: '#94a3b8' }}>Masterlist</span>
                </h2>
                <p className="mt-2 font-medium text-sm" style={{ color: '#64748b' }}>
                  Detailed availability · {filteredUnits.length} units
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search unit or BHK..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-11 pr-5 py-3 rounded-2xl text-sm font-medium outline-none transition-all w-full sm:w-64"
                  style={{ background: '#fff', border: '1.5px solid #e2e8f0', color: '#1e293b' }}
                />
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-[1.5rem] border overflow-hidden shadow-sm" style={{ borderColor: '#e2e8f0' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%)' }}>
                      {['Unit No', 'BHK', 'Facing', 'Floor', 'Super BUA', 'Valuation', 'Action'].map(h => (
                        <th key={h} className={`px-6 py-5 font-bold uppercase tracking-widest text-[10px] ${h === 'Valuation' || h === 'Super BUA' ? 'text-right' : h === 'Action' ? 'text-center' : 'text-left'}`}
                          style={{ color: 'rgba(255,255,255,0.7)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnits.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-16 font-medium" style={{ color: '#94a3b8' }}>No results found</td></tr>
                    ) : filteredUnits.map((u) => (
                      <tr key={u.id} className="group border-b transition-colors"
                        style={{ borderColor: '#f1f5f9' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fffbeb')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <td className="px-6 py-5">
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm border transition-all"
                            style={{ background: '#f8fafc', color: '#1e293b', borderColor: '#e2e8f0' }}>
                            {u.unit_no}
                          </div>
                        </td>
                        <td className="px-6 py-5 font-black text-sm" style={{ color: '#1e293b' }}>{u.bhk}</td>
                        <td className="px-6 py-5 font-bold text-xs uppercase tracking-widest" style={{ color: '#94a3b8' }}>{u.facing}</td>
                        <td className="px-6 py-5 font-bold text-sm" style={{ color: '#475569' }}>Lvl {u.floor}</td>
                        <td className="px-6 py-5 text-right">
                          <div className="font-black text-sm" style={{ color: '#1e293b' }}>{u.super_builtup_area} sqft</div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="text-base font-black" style={{ color: '#0f172a' }}>{formatUnitAmount(u.grand_total)}</div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black uppercase tracking-wider text-[10px] transition-all shadow-sm active:scale-95"
                            style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}
                            onMouseEnter={e => { (e.currentTarget.style.background = '#f59e0b'); (e.currentTarget.style.color = '#0a1628'); }}
                            onMouseLeave={e => { (e.currentTarget.style.background = '#fffbeb'); (e.currentTarget.style.color = '#d97706'); }}
                          >
                            <FileText className="w-4 h-4" /> Price Sheet
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards for Units — PRICE SHEET responsive */}
            <div className="md:hidden space-y-3">
              {filteredUnits.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center" style={{ color: '#94a3b8' }}>No units found</div>
              ) : filteredUnits.map((u) => (
                <div key={u.id} className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: '#f1f5f9' }}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                        style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e293b' }}>
                        {u.unit_no}
                      </div>
                      <div>
                        <div className="font-black text-sm" style={{ color: '#1e293b' }}>{u.bhk}</div>
                        <div className="text-xs font-medium" style={{ color: '#94a3b8' }}>{u.facing} Facing · Lvl {u.floor}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black" style={{ color: '#0f172a' }}>{formatUnitAmount(u.grand_total)}</div>
                      <div className="text-xs font-medium" style={{ color: '#94a3b8' }}>Total Cost</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                    <div className="text-sm font-bold" style={{ color: '#64748b' }}>
                      {u.super_builtup_area} sqft
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95"
                      style={{ background: '#f59e0b', color: '#0a1628' }}>
                      <FileText className="w-4 h-4" /> Price Sheet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}

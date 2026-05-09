'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Activity, Eye, FileText, TrendingUp, Clock, RefreshCw, ChevronRight, UserPlus, LogIn, ChevronDown, Bell, Settings, Search, Thermometer, Wind, Cloud, Home, Zap, Power, Volume2, Lamp, Router, Plus, Users, Target, Mail, Download, Filter, Sparkles, Trophy } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface InsightData {
    stats: {
        logins: number;
        registrations: number;
        totalGlobalUsers: number;
        projectViews: number;
        unitViews: number;
        costSheetEmail: number;
        costSheetDownload: number;
    };
    topProjects: { name: string; count: number }[];
    recentActivity: {
        action: string;
        email: string;
        details: any;
        time: string;
    }[];
    pulseData: number[];
    pulseLabels: string[];
    timeRange: { startTime: string; endTime: string };
}

export default function LiveInsightsPage() {
    const [data, setData] = useState<InsightData | null>(null);
    const [filterOptions, setFilterOptions] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [range, setRange] = useState('today');
    const [filters, setFilters] = useState({
        projectId: '',
        city: '',
        unitType: '',
        bhk: ''
    });

    const [autoRefresh, setAutoRefresh] = useState(true);
    const refreshInterval = useRef<any>(null);
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    const fetchFilters = useCallback(async () => {
        try {
            const res = await api.get('/portal/distinct-filters');
            if (res.data.success) setFilterOptions(res.data.data);
        } catch (e) { console.error(e); }
    }, []);

    const fetchData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const queryParams = new URLSearchParams({ range, ...filters });
            const res = await api.get(`/reports/live-insights?${queryParams.toString()}`);
            if (res.data.success) {
                setData(res.data.data);
                updateChart(res.data.data);
            }
        } catch (e) {
            if (!isSilent) toast.error('Sync failed');
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [range, filters]);

    useEffect(() => { fetchFilters(); }, [fetchFilters]);
    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (autoRefresh) {
            refreshInterval.current = setInterval(() => fetchData(true), 20000);
        } else {
            if (refreshInterval.current) clearInterval(refreshInterval.current);
        }
        return () => { if (refreshInterval.current) clearInterval(refreshInterval.current); };
    }, [autoRefresh, fetchData]);

    const updateChart = (insight: any) => {
        if (!chartRef.current || !insight.pulseData) return;
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;
        if (chartInstance.current) chartInstance.current.destroy();

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: insight.pulseLabels,
                datasets: [{
                    label: 'Logins',
                    data: insight.pulseData,
                    borderColor: '#7c3aed',
                    backgroundColor: (ctx) => {
                        const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
                        g.addColorStop(0, 'rgba(124, 58, 237, 0.1)');
                        g.addColorStop(1, 'rgba(124, 58, 237, 0)');
                        return g;
                    },
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#7c3aed',
                    pointBorderWidth: 2,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        display: true,
                        grid: { display: false },
                        ticks: { font: { size: 9, weight: 'bold' }, color: '#94a3b8' }
                    },
                    y: { display: false, beginAtZero: true }
                }
            }
        });
    };

    return (
        <AppLayout title="Executive Overview" subtitle="Real-time Portal Analytics">
            <div className="min-h-screen bg-[#F0F2F5] -m-6 p-8 font-sans text-slate-800 selection:bg-indigo-100 selection:text-indigo-600">

                {/* 1. PREMIUM FILTER HEADER */}
                <div className="max-w-[1700px] mx-auto mb-10 flex flex-wrap items-center justify-between gap-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <FilterButton label="Project" value={filters.projectId} options={filterOptions?.projects?.map((p: any) => ({ id: p.id, name: p.name }))} onChange={(val: any) => setFilters(prev => ({ ...prev, projectId: val }))} />
                        <FilterButton label="City" value={filters.city} options={filterOptions?.cities?.map((c: any) => ({ id: c, name: c }))} onChange={(val: any) => setFilters(prev => ({ ...prev, city: val }))} />
                        <FilterButton label="Category" value={filters.unitType} options={[{ id: 'Apartment', name: 'Apartment' }, { id: 'Villa', name: 'Villa' }]} onChange={(val: any) => setFilters(prev => ({ ...prev, unitType: val }))} />
                        <FilterButton label="BHK" value={filters.bhk} options={filterOptions?.bhks?.map((b: any) => ({ id: b, name: b }))} onChange={(val: any) => setFilters(prev => ({ ...prev, bhk: val }))} />
                    </div>

                    <div className="flex items-center gap-4 bg-white/50 backdrop-blur-md p-1.5 rounded-[22px] border border-white/40 shadow-sm">
                        {['today', 'yesterday', 'week'].map(t => (
                            <button
                                key={t}
                                onClick={() => setRange(t)}
                                className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${range === t ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-white'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="max-w-[1700px] mx-auto space-y-10">

                    {/* 2. CORE KPI ROW */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                        <SmartCard label="Project Views" count={data?.stats?.projectViews || 0} icon={<TrendingUp />} gradient="from-indigo-600 to-indigo-800" shadow="shadow-indigo-200" active />
                        <SmartCard label="View Unit" count={data?.stats?.unitViews || 0} icon={<Eye />} gradient="from-blue-600 to-blue-800" shadow="shadow-blue-100" active />
                        <SmartCard label="Live Logins" count={data?.stats?.logins || 0} icon={<LogIn />} gradient="from-emerald-600 to-emerald-800" shadow="shadow-emerald-100" active />
                        <SmartCard label="PDF Downloads" count={data?.stats?.costSheetDownload || 0} icon={<Download />} gradient="from-orange-600 to-orange-800" shadow="shadow-orange-100" active />
                        <SmartCard label="Total Registered" count={data?.stats?.totalGlobalUsers || 0} icon={<UserPlus />} gradient="from-rose-600 to-rose-800" shadow="shadow-rose-100" active />
                    </div>

                    {/* 3. ANALYTICS & ACTIVITY ROW */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                        {/* RECENT ACTIVITY TABLE */}
                        <div className="xl:col-span-8 flex flex-col gap-8">
                            <div className="bg-white rounded-[40px] p-10 border border-white shadow-[0_25px_60px_rgba(0,0,0,0.03)] overflow-hidden min-h-[600px]">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                                        <Activity className="w-5 h-5 text-indigo-600" />
                                        Recent Activity
                                    </h3>
                                    <button onClick={() => fetchData()} className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-500 transition-all active:scale-95">
                                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-50">
                                                <th className="pb-5 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">User Profile</th>
                                                <th className="pb-5 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Action Type</th>
                                                <th className="pb-5 text-[9px] font-black text-slate-300 uppercase tracking-[0.15em]">Context Detail</th>
                                                <th className="pb-5 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] text-right">Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50/50">
                                            {data?.recentActivity.map((log: any, i: number) => (
                                                <tr key={i} className="group hover:bg-slate-50/50 transition-all">
                                                    <td className="py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-[11px] text-indigo-400 border border-white shadow-sm">
                                                                {log.email.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-slate-700 truncate max-w-[150px] leading-none mb-1">{log.email.split('@')[0]}</span>
                                                                <span className="text-[9px] font-bold text-slate-300 uppercase truncate max-w-[150px]">@{log.email.split('@')[1]}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-5">
                                                        <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider ${log.action.includes('REGISTER') ? 'bg-emerald-50 text-emerald-500' :
                                                                log.action.includes('VIEW') ? 'bg-blue-50 text-blue-500' :
                                                                    log.action.includes('REQUEST') ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-400'
                                                            }`}>
                                                            {log.action.replace(/_/g, ' ').replace('SUCCESS', '').trim()}
                                                        </span>
                                                    </td>
                                                    <td className="py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold text-slate-500 truncate max-w-[200px] leading-tight">
                                                                {log.details?.project_name || log.details?.project_id || 'Standard Portal Use'}
                                                            </span>
                                                            {log.details?.unit_no && <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Unit: {log.details.unit_no}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-5 text-right">
                                                        <span className="text-[10px] font-black text-slate-400 tabular-nums opacity-60">
                                                            {format(new Date(log.time), 'HH:mm:ss')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* INSIGHTS SIDEBAR */}
                        <div className="xl:col-span-4 flex flex-col gap-8">
                            <SecondaryMetric label="Email Price Sheets" count={data?.stats?.costSheetEmail || 0} icon={<Mail />} tag="Digital" color="indigo" />
                            <SecondaryMetric label="Direct PDF Downloads" count={data?.stats?.costSheetDownload || 0} icon={<Download />} tag="Saved" color="orange" />

                            <div className="bg-white rounded-[40px] p-8 border border-white shadow-[0_20px_50px_rgba(0,0,0,0.03)] space-y-8 flex flex-col flex-1 min-h-[400px]">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center shadow-sm"><Zap className="w-5 h-5 text-orange-500" /></div>
                                        Login History (5 Days)
                                    </h3>
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                </div>
                                <div className="flex-1 w-full min-h-[200px]">
                                    <canvas ref={chartRef}></canvas>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Total Users</span>
                                        <span className="text-2xl font-black text-slate-800 tabular-nums">{data?.stats?.totalGlobalUsers || 0}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Logins</span>
                                        <span className="text-2xl font-black text-indigo-500 tabular-nums">{data?.stats?.logins || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function FilterButton({ label, value, options, onChange }: any) {
    return (
        <div className="relative group">
            <select
                onChange={(e) => onChange(e.target.value)}
                value={value}
                className="appearance-none bg-white px-6 py-3.5 pr-12 rounded-[22px] border border-white shadow-[0_5px_15px_rgba(0,0,0,0.02)] text-[10px] font-black uppercase tracking-widest outline-none transition-all hover:border-indigo-100 hover:shadow-indigo-50/20 w-44 tabular-nums"
            >
                <option value="">{label}</option>
                {options?.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none group-hover:text-indigo-400 group-hover:translate-y-[-40%]" />
        </div>
    );
}

function SmartCard({ label, count, icon, gradient, shadow, active }: any) {
    return (
        <div className={`p-6 rounded-[36px] flex flex-col justify-start gap-5 h-44 transition-all duration-500 hover:translate-y-[-8px] group cursor-pointer relative overflow-hidden bg-white border border-white shadow-[0_10px_30px_rgba(0,0,0,0.02)]`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-100 transition-opacity duration-500`} />
            <div className="relative z-10 flex items-center">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${active ? 'bg-white/20 group-hover:scale-110 shadow-sm' : 'bg-slate-50'}`}>
                    {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6 transition-colors duration-500 text-white' })}
                </div>
            </div>
            <div className="relative z-10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-2 text-white/70 transition-colors">{label}</h4>
                <div className="text-5xl font-black tracking-tighter italic text-white transition-colors tabular-nums">{count}</div>
            </div>
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
        </div>
    );
}

function SecondaryMetric({ label, count, icon, tag, color }: any) {
    const colors: any = {
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100'
    };
    return (
        <div className="bg-white rounded-[36px] p-7 border border-white shadow-[0_20px_50px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:translate-x-3 transition-all cursor-pointer">
            <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl ${colors[color]} border flex items-center justify-center shadow-lg shadow-indigo-50/20 group-hover:scale-110 transition-transform`}>
                        {React.cloneElement(icon as React.ReactElement, { className: 'w-7 h-7' })}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">{label}</p>
                        <h4 className="text-3xl font-black text-slate-800 tabular-nums">{count}</h4>
                    </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${colors[color]} backdrop-blur-md opacity-40`}>{tag}</div>
            </div>
        </div>
    );
}

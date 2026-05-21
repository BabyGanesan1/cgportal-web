'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { BarChart2, Users, Layers, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FlsLayout from '../_components/FlsLayout';
import FlsFilter from '../_components/FlsFilter';
import FlsTable from '../_components/FlsTable';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { useFlsTheme } from '../_components/FlsThemeContext';

const PAGE_SIZE = 20;

export default function FlsBookingListPage() {
  const router = useRouter();
  const { isDark } = useFlsTheme();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [unitNo, setUnitNo] = useState('');
  const [flsAgent, setFlsAgent] = useState('');
  const [mgrAgent, setMgrAgent] = useState('');
  const [avpAgent, setAvpAgent] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const buildParams = useCallback((overridePage?: number) => {
    const params: any = {
      page: overridePage ?? page, limit: PAGE_SIZE,
      search, unit_no: unitNo, fls_agent: flsAgent,
      mgr_agent: mgrAgent, avp_agent: avpAgent,
      customer_name: customerName, date_field: 'createdAt',
    };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo)   params.date_to   = dateTo;
    return params;
  }, [page, search, unitNo, flsAgent, mgrAgent, avpAgent, customerName, dateFrom, dateTo]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/fls-booking', { params: buildParams() });
      setData(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch { toast.error('Failed to load booking data'); }
    finally { setLoading(false); }
  }, [buildParams]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const resetPage = () => setPage(1);

  const handleDelete = async (row: any) => {
    if (!window.confirm(`Delete booking for "${row.name || row.unit_no || 'this record'}"?`)) return;
    setDeleting(row.id);
    try {
      await api.delete(`/fls-booking/${row.id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(null); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = { ...buildParams(1), limit: 10000, type: 'booking' };
      const res = await api.get('/fls-booking/export', { params, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url;
      a.download = `fls_booking_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Exported successfully');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const uniqueFls = Array.from(new Set(data.map(r => r.fls_id).filter(Boolean))).length;
  const stats = [
    { label: 'Total Records', value: total,      icon: BarChart2, color: 'text-blue-400',    bg: 'bg-blue-500/10',  bar: 'bg-blue-500'   },
    { label: 'This Page',     value: data.length, icon: Layers,    color: 'text-gray-500',    bg: 'bg-gray-100',     bar: 'bg-gray-400'   },
    { label: 'Unique FLS',    value: uniqueFls,   icon: Users,     color: 'text-emerald-600', bg: 'bg-emerald-50',   bar: 'bg-emerald-500'},
    { label: 'Total Pages',   value: totalPages,  icon: FileText,  color: 'text-violet-600',  bg: 'bg-violet-50',    bar: 'bg-violet-500' },
  ];

  return (
    <FlsLayout title="FLS Booking" subtitle="Manage FLS booking details">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {stats.map((s, i) => (
          <div key={i} className="bg-white border border-brand-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow shadow-sm">
            <div className={`h-1 ${s.bar}`} />
            <div className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-[10px] text-brand-500 uppercase tracking-widest font-semibold">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color} leading-tight mt-0.5`}>{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <FlsFilter
        search={search}       onSearchChange={v => { setSearch(v); resetPage(); }}
        unitNo={unitNo}       onUnitNoChange={v => { setUnitNo(v); resetPage(); }}
        flsAgent={flsAgent}   onFlsAgentChange={v => { setFlsAgent(v); resetPage(); }}
        mgrAgent={mgrAgent}   onMgrAgentChange={v => { setMgrAgent(v); resetPage(); }}
        avpAgent={avpAgent}   onAvpAgentChange={v => { setAvpAgent(v); resetPage(); }}
        customerName={customerName} onCustomerNameChange={v => { setCustomerName(v); resetPage(); }}
        dateFrom={dateFrom}   onDateFromChange={v => { setDateFrom(v); resetPage(); }}
        dateTo={dateTo}       onDateToChange={v => { setDateTo(v); resetPage(); }}
        onExport={handleExport} exporting={exporting}
        onAddNew={() => router.push('/fls-booking-portal/booking/add')}
        theme="blue"
      />

      <FlsTable
        type="booking"
        data={data}
        loading={loading}
        page={page}
        total={total}
        totalPages={totalPages}
        isDark={isDark}
        deleting={deleting}
        onDelete={handleDelete}
        onPageChange={setPage}
      />
    </FlsLayout>
  );
}

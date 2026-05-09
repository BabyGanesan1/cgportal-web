'use client';
import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import DatePicker from '../../components/ui/DatePicker';
import Select from '../../components/ui/Select';
import api from '../../lib/api';
import {
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Loader2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Table2,
  User,
  Calendar,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BulkRecord {
  id: number;
  uploaded_by_id: number | null;
  uploaded_by_email: string | null;
  table_name: string;
  file_name: string | null;
  file_url: string | null;
  total_count: number;
  success_count: number;
  failed_count: number;
  success_rows: any[] | null;
  failed_rows: any[] | null;
  createdAt: string;
}

interface Stats {
  overall: {
    total_uploads: number;
    total_rows: number;
    total_success: number;
    total_failed: number;
  };
  by_table: {
    table_name: string;
    total_uploads: number;
    total_rows: number;
    total_success: number;
    total_failed: number;
  }[];
}

// ─── Table badge colors ───────────────────────────────────────────────────────
const TABLE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  City: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  Location: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
  BHKType: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', dot: 'bg-pink-500' },
  BHKDetail: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  ServingLocation: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  PossessionStatus: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  CarParkType: { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200', dot: 'bg-lime-500' },
  UnitStatus: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
  PropertyList: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' },
  PropertyDetail: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  Property: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  PaymentSchedule: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
};
const getTableColor = (name: string) =>
  TABLE_COLORS[name] ?? { bg: 'bg-brand-50', text: 'text-brand-700', border: 'border-brand-200', dot: 'bg-brand-500' };

// ─── TableBadge ───────────────────────────────────────────────────────────────
function TableBadge({ name }: { name: string }) {
  const c = getTableColor(name);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {name}
    </span>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, colorClass }: {
  label: string; value: number | string; icon: any; colorClass: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-brand-100 hover:shadow-md transition-shadow animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className={`${colorClass} p-3 rounded-xl`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold text-brand-900 font-display">
        {Number(value ?? 0).toLocaleString()}
      </div>
      <div className="text-sm text-brand-500 mt-1">{label}</div>
    </div>
  );
}

// ─── RowDetailModal ───────────────────────────────────────────────────────────
function RowDetailModal({ record, open, onClose }: { record: BulkRecord | null; open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'failed' | 'success'>('failed');

  useEffect(() => {
    if (record) {
      setTab(record.failed_count > 0 ? 'failed' : 'success');
    }
  }, [record]);

  if (!record) return null;

  const rows = tab === 'failed' ? (record.failed_rows || []) : (record.success_rows || []);
  const cols = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <Modal open={open} onClose={onClose} title="Upload Detail" size="2xl">
      <div className="space-y-4">

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="p-3 bg-brand-50 rounded-lg text-center">
            <div className="text-xs text-brand-400 uppercase font-bold mb-1">Table</div>
            <TableBadge name={record.table_name} />
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <div className="text-xs text-green-600 uppercase font-bold mb-1">Success</div>
            <div className="text-lg font-bold text-green-700">{record.success_count.toLocaleString()}</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-center">
            <div className="text-xs text-red-500 uppercase font-bold mb-1">Failed</div>
            <div className="text-lg font-bold text-red-600">{record.failed_count.toLocaleString()}</div>
          </div>
        </div>

        {/* File path */}
        {record.file_url && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs">
            <FileSpreadsheet className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="text-blue-600 font-semibold">Stored at:</span>
            <code className="text-blue-800 break-all">{record.file_url}</code>
          </div>
        )}

        {/* Uploader */}
        <div className="flex items-center gap-2 text-sm text-brand-600">
          <User className="w-4 h-4 text-brand-400" />
          <span>{record.uploaded_by_email || '—'}</span>
          <span className="text-brand-300">·</span>
          <Calendar className="w-4 h-4 text-brand-400" />
          <span>{record.createdAt ? format(new Date(record.createdAt), 'dd MMM yyyy, HH:mm') : '—'}</span>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-2 border-b border-brand-100 pb-0">
          {record.failed_count > 0 && (
            <button
              onClick={() => setTab('failed')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${tab === 'failed'
                ? 'border-red-500 text-red-600 bg-red-50'
                : 'border-transparent text-brand-400 hover:text-brand-600'
                }`}
            >
              <span className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> Failed Rows ({record.failed_count})
              </span>
            </button>
          )}
          {record.success_count > 0 && (
            <button
              onClick={() => setTab('success')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${tab === 'success'
                ? 'border-green-500 text-green-600 bg-green-50'
                : 'border-transparent text-brand-400 hover:text-brand-600'
                }`}
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Success Rows ({record.success_count})
              </span>
            </button>
          )}
        </div>

        {/* Rows table */}
        {rows.length > 0 ? (
          <div className="overflow-auto max-h-64 rounded-lg border border-brand-100">
            <table className="w-full text-xs data-table">
              <thead>
                <tr>
                  <th className="w-12">#</th>
                  {cols.map(c => <th key={c}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={tab === 'failed' ? 'bg-red-50/30' : ''}>
                    <td className="text-brand-400">{i + 1}</td>
                    {cols.map(c => (
                      <td key={c} className="max-w-[180px] truncate" title={String(row[c] ?? '')}>
                        {String(row[c] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-brand-400 text-sm py-6">No row data stored.</p>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABLE_NAMES = Object.keys(TABLE_COLORS);
const LIMIT = 15;

export default function BulkUploadHistoryPage() {
  const [records, setRecords] = useState<BulkRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<BulkRecord | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dlLoading, setDlLoading] = useState<number | null>(null);

  const [filters, setFilters] = useState({
    table_name: '',
    uploaded_by_email: '',
    from: '',
    to: '',
  });

  // ── Fetch stats (once) ──────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/bulk-upload-history/stats')
      .then(r => { if (r.data.success) setStats(r.data.data); })
      .catch(() => { });
  }, []);

  // ── Fetch list ──────────────────────────────────────────────────────────────
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: LIMIT.toString(),
        ...(filters.table_name ? { table_name: filters.table_name } : {}),
        ...(filters.uploaded_by_email ? { uploaded_by_email: filters.uploaded_by_email } : {}),
        ...(filters.from ? { from: filters.from } : {}),
        ...(filters.to ? { to: filters.to } : {}),
      });

      const res = await api.get(`/bulk-upload-history?${params}`);
      if (res.data.success) {
        setRecords(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch {
      toast.error('Failed to load bulk upload history');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // Reset page on filter change
  const handleFilterChange = (key: string, value: string) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ table_name: '', uploaded_by_email: '', from: '', to: '' });
    setPage(1);
  };

  // ── Download ────────────────────────────────────────────────────────────────
  const handleDownload = async (record: BulkRecord) => {
    if (!record.file_name) return toast.error('No file stored for this record');
    setDlLoading(record.id);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('cg_token') : '';
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://cgpropertyapi.digilogy.dev/api'}/bulk-upload-history/${record.id}/download`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = record.file_name || `bulk-upload-${record.id}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('File downloaded');
    } catch {
      toast.error('Failed to download file');
    } finally {
      setDlLoading(null);
    }
  };

  // ── Success % bar ───────────────────────────────────────────────────────────
  const pct = (r: BulkRecord) =>
    r.total_count > 0 ? Math.round((r.success_count / r.total_count) * 100) : 0;

  return (
    <AppLayout title="Bulk Upload History" subtitle="Track all bulk file uploads, success and failure counts">
      <div className="space-y-5">

        {/* ── Stat Cards ── */}
        {stats?.overall && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Uploads" value={stats.overall.total_uploads} icon={Upload} colorClass="bg-brand-800" />
            <StatCard label="Total Rows" value={stats.overall.total_rows} icon={Table2} colorClass="bg-blue-600" />
            <StatCard label="Rows Succeeded" value={stats.overall.total_success} icon={CheckCircle2} colorClass="bg-emerald-600" />
            <StatCard label="Rows Failed" value={stats.overall.total_failed} icon={XCircle} colorClass="bg-red-500" />
          </div>
        )}

        {/* ── By-table breakdown ── */}
        {stats?.by_table && stats.by_table.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-brand-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-brand-500" />
              <span className="text-sm font-semibold text-brand-700">Uploads by Table</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.by_table.map(row => (
                <div
                  key={row.table_name}
                  className="flex items-center gap-2 px-3 py-2 bg-brand-50 border border-brand-100 rounded-lg text-xs"
                >
                  <TableBadge name={row.table_name} />
                  <span className="text-brand-500">
                    <span className="font-bold text-brand-800">{Number(row.total_uploads).toLocaleString()}</span> uploads &nbsp;·&nbsp;
                    <span className="text-emerald-600 font-semibold">✓ {Number(row.total_success).toLocaleString()}</span>&nbsp;
                    <span className="text-red-500 font-semibold">✗ {Number(row.total_failed).toLocaleString()}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="flex gap-3 w-full sm:w-auto flex-wrap">
            {/* Table filter */}
            <div className="w-48">
              <Select
                value={filters.table_name}
                onChange={e => handleFilterChange('table_name', e.target.value)}
                placeholder="All Tables"
                options={TABLE_NAMES.map(t => ({ value: t, label: t }))}
              />
            </div>

            {/* Email search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
              <input
                type="text"
                placeholder="Search uploader email…"
                value={filters.uploaded_by_email}
                onChange={e => handleFilterChange('uploaded_by_email', e.target.value)}
                className="pl-9 pr-3 py-2 border border-brand-200 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* More filters toggle */}
            <button
              onClick={() => setShowFilters(o => !o)}
              className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-brand-200 text-brand-500 hover:bg-brand-50'}`}
              title="Date Filters"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
          <Button variant="secondary" size="sm" onClick={clearFilters}>Clear Filters</Button>
        </div>

        {/* Date range filters */}
        {showFilters && (
          <div className="relative z-20 p-4 bg-white border border-brand-100 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in overflow-visible">
            <DatePicker
              label="From Date"
              value={filters.from}
              onChange={(val) => handleFilterChange('from', val)}
            />
            <DatePicker
              label="To Date"
              value={filters.to}
              onChange={(val) => handleFilterChange('to', val)}
            />
          </div>
        )}

        {/* ── Table ── */}
        <div className="bg-white rounded-xl shadow-sm border border-brand-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="w-12">#</th>
                  <th>Table</th>
                  <th>Saved File Name</th>
                  <th>Uploaded By</th>
                  <th className="text-center">Total</th>
                  <th className="text-center">Success</th>
                  <th className="text-center">Failed</th>
                  <th>Progress</th>
                  <th>Date & Time</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
                        <span className="text-sm text-brand-500">Loading history...</span>
                      </div>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-20 text-brand-400 italic">
                      No bulk upload history found
                    </td>
                  </tr>
                ) : (
                  records.map((r, idx) => {
                    const successPct = pct(r);
                    return (
                      <tr key={r.id} className="animate-fade-in group">
                        {/* # */}
                        <td className="text-brand-400">{(page - 1) * LIMIT + idx + 1}</td>

                        {/* Table */}
                        <td><TableBadge name={r.table_name} /></td>

                        {/* File name */}
                        <td>
                          <div className="flex items-center gap-1.5 max-w-[220px]">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                            <span className="text-xs text-brand-700 truncate font-medium" title={r.file_name || ''}>
                              {r.file_name || '—'}
                            </span>
                          </div>
                          {r.file_url && (
                            <div className="text-[10px] text-brand-400 mt-0.5 truncate max-w-[220px]" title={r.file_url}>
                              {r.file_url}
                            </div>
                          )}
                        </td>

                        {/* Uploader */}
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">
                              {(r.uploaded_by_email || '?')[0].toUpperCase()}
                            </div>
                            <span className="text-sm text-brand-700 truncate max-w-[140px]" title={r.uploaded_by_email || ''}>
                              {r.uploaded_by_email || '—'}
                            </span>
                          </div>
                        </td>

                        {/* Total */}
                        <td className="text-center">
                          <span className="font-semibold text-brand-800">{r.total_count.toLocaleString()}</span>
                        </td>

                        {/* Success */}
                        <td className="text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            <CheckCircle2 className="w-3 h-3" /> {r.success_count.toLocaleString()}
                          </span>
                        </td>

                        {/* Failed */}
                        <td className="text-center">
                          {r.failed_count > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                              <XCircle className="w-3 h-3" /> {r.failed_count.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-brand-300 text-xs">—</span>
                          )}
                        </td>

                        {/* Progress bar */}
                        <td>
                          <div className="flex items-center gap-2 min-w-[80px]">
                            <div className="flex-1 h-2 bg-brand-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${r.failed_count > 0 ? 'bg-yellow-400' : 'bg-emerald-500'}`}
                                style={{ width: `${successPct}%` }}
                              />
                            </div>
                            <span className="text-xs text-brand-500 font-medium w-8 text-right">{successPct}%</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td>
                          <div className="font-medium text-brand-800 text-sm">
                            {r.createdAt ? format(new Date(r.createdAt), 'dd MMM yyyy') : 'N/A'}
                          </div>
                          <div className="text-xs text-brand-400 mt-0.5">
                            {r.createdAt ? format(new Date(r.createdAt), 'HH:mm:ss') : ''}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* View detail */}
                            <button
                              onClick={() => setSelected(r)}
                              className="p-1.5 rounded-lg text-brand-400 hover:text-brand-800 hover:bg-brand-50 transition-all"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Download */}
                            {r.file_name && (
                              <button
                                onClick={() => handleDownload(r)}
                                disabled={dlLoading === r.id}
                                className="p-1.5 rounded-lg text-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all disabled:opacity-50"
                                title="Download original file"
                              >
                                {dlLoading === r.id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <Download className="w-4 h-4" />
                                }
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={LIMIT}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* ── Detail Modal ── */}
      <RowDetailModal
        record={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </AppLayout>
  );
}
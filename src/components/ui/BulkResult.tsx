'use client';
import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface BulkResultProps {
  result: {
    success: boolean;
    message: string;
    data?: {
      succeeded?: any[];
      failed?: { row: number; unit_no?: string; reason: string }[];
      successCount?: number;
      failedCount?: number;
      totalCount?: number;
    };
  };
}

export default function BulkResult({ result }: BulkResultProps) {
  if (!result) return null;

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border overflow-hidden`}>
        <div className={`px-5 py-4 flex items-center gap-4 ${result.success ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-red-50 border-b border-red-100'}`}>
          {result.success
            ? <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            : <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />}
          <div className="flex-1">
            <p className={`font-display font-bold text-base ${result.success ? 'text-emerald-800' : 'text-red-700'}`}>
              {result.success ? 'Upload Processed' : 'Upload Failed'}
            </p>
            <p className="text-sm text-brand-500 mt-0.5">{result.message}</p>
          </div>
        </div>

        {result.data && (
          <div className="px-6 py-5 bg-white border-b border-brand-100">
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-brand-900 font-display">
                  {result.data.totalCount ?? ((result.data.successCount ?? 0) + (result.data.failedCount ?? 0))}
                </div>
                <div className="text-xs uppercase tracking-wider font-semibold text-brand-400 mt-1">Total Rows</div>
              </div>
              <div className="text-center border-x border-brand-50 px-4">
                <div className="text-3xl font-bold text-emerald-600 font-display">{result.data.successCount ?? 0}</div>
                <div className="text-xs uppercase tracking-wider font-semibold text-brand-400 mt-1">Succeeded</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500 font-display">{result.data.failedCount ?? 0}</div>
                <div className="text-xs uppercase tracking-wider font-semibold text-brand-400 mt-1">Failed</div>
              </div>
            </div>
          </div>
        )}

        {result.data?.failed && result.data.failed.length > 0 && (
          <div className="bg-red-50 p-5 border-t border-red-100">
            <p className="text-sm font-bold text-red-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> 
              Row-Level Details ({result.data.failed.length} errors)
            </p>
            <div className="max-h-[400px] overflow-y-auto rounded-lg border border-red-100">
              <table className="w-full text-left border-collapse text-xs bg-white">
                <thead className="sticky top-0 bg-red-100/80 backdrop-blur-sm z-10">
                  <tr>
                    <th className="py-2.5 px-4 font-bold text-red-700">Row</th>
                    <th className="py-2.5 px-4 font-bold text-red-700">Unit No</th>
                    <th className="py-2.5 px-4 font-bold text-red-700">Error Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-50">
                  {result.data.failed.map((f, i) => (
                    <tr key={i} className="hover:bg-red-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-red-800">#{f.row}</td>
                      <td className="py-3 px-4 font-semibold text-brand-800">{f.unit_no || '-'}</td>
                      <td className="py-3 px-4 text-red-600 leading-relaxed">{f.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-white/50 rounded-lg border border-red-100/50 text-[11px] text-red-500 italic">
              Please correct the highlighted rows in your Excel file and re-upload only those rows.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

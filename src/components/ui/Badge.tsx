import React from 'react';

const statusClasses: Record<string, string> = {
  'vacant': 'bg-emerald-100 text-emerald-700',
  'sold': 'bg-red-100 text-red-700',
  'hsbc-sold': 'bg-red-100 text-red-700',
  'blocked': 'bg-amber-100 text-amber-700',
  'investor': 'bg-blue-100 text-blue-700',
  'open': 'bg-indigo-100 text-indigo-700',
  'hsbc-vacant': 'bg-emerald-100 text-emerald-700',
};

export default function Badge({ status }: { status: string }) {
  const key = status?.toLowerCase().split(' ')[0] || '';
  const cls = statusClasses[key] || 'bg-gray-100 text-gray-600';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
}

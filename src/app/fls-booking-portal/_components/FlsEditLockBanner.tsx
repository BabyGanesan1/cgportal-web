'use client';
import React from 'react';
import { AlertTriangle, User } from 'lucide-react';
import type { FlsEditor } from './useFlsEditLock';

interface Props {
  editors: FlsEditor[];
}

export default function FlsEditLockBanner({ editors }: Props) {
  if (editors.length === 0) return null;

  const label = editors.length === 1
    ? 'another user'
    : `${editors.length} other users`;

  return (
    <div className="mb-4 flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800">
          This record is currently being edited by {label}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
          {editors.map(e => (
            <div key={e.id} className="flex items-center gap-1.5 text-xs text-amber-700">
              <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
                <User className="w-3 h-3 text-amber-600" />
              </div>
              <span className="font-medium">{e.name}</span>
              {e.email && (
                <span className="text-amber-500 truncate max-w-[180px]">({e.email})</span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-amber-600">
          Saving your changes may overwrite theirs. Please coordinate before saving.
        </p>
      </div>
    </div>
  );
}

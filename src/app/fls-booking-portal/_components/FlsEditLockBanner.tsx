'use client';
import React from 'react';
import { AlertTriangle, User } from 'lucide-react';
import type { FlsEditor } from './useFlsEditLock';

interface Props {
  editors: FlsEditor[];
}

export default function FlsEditLockBanner({ editors }: Props) {
  if (editors.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 w-72 bg-amber-50 border border-amber-300 rounded-xl shadow-lg overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 border-b border-amber-200">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <p className="text-xs font-semibold text-amber-800 leading-tight">
          Being edited by {editors.length === 1 ? 'another user' : `${editors.length} others`}
        </p>
      </div>

      {/* Editor list */}
      <div className="px-3 py-2 flex flex-col gap-1.5">
        {editors.map(e => (
          <div key={e.id} className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-amber-800 truncate">{e.name}</p>
              {e.email && (
                <p className="text-[10px] text-amber-500 truncate">{e.email}</p>
              )}
            </div>
          </div>
        ))}
        <p className="text-[10px] text-amber-600 mt-0.5 leading-tight">
          Saving may overwrite their changes.
        </p>
      </div>
    </div>
  );
}

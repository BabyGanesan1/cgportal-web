'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export type FlsFormType = 'booking' | 'checking' | 'source';

export interface FlsEditor {
  id: string;
  name: string;
  email: string;
}

export function useFlsEditLock(formType: FlsFormType, recordId: string | null) {
  const [editors, setEditors] = useState<FlsEditor[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!recordId) return;

    // Resolve current user from localStorage
    let currentUser: FlsEditor | null = null;
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('cg_admin') : null;
      if (raw) {
        const admin = JSON.parse(raw);
        currentUser = {
          id: String(admin.id || admin.adminId || admin.userId || ''),
          name: admin.name || admin.username || admin.email || 'Unknown',
          email: admin.email || '',
        };
      }
    } catch { /* ignore parse errors */ }

    if (!currentUser?.id) return;

    const user = currentUser;
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('fls_start_editing', { formType, recordId, user });
    });

    socket.on('fls_editing_updated', (data: {
      formType: string;
      recordId: string;
      editors: FlsEditor[];
    }) => {
      if (data.formType !== formType || data.recordId !== String(recordId)) return;
      // Filter out the current user — backend may include them in the full list
      setEditors(data.editors.filter(e => e.id !== user.id));
    });

    return () => {
      socket.emit('fls_stop_editing', { formType, recordId });
      socket.disconnect();
      setEditors([]);
    };
  }, [formType, recordId]);

  return { editors };
}

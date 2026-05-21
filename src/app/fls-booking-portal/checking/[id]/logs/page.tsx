'use client';
import { useParams } from 'next/navigation';
import FlsLogsPage from '../../../_components/FlsLogsPage';

export default function CheckingLogsPage() {
  const { id } = useParams<{ id: string }>();
  return <FlsLogsPage type="checking" id={id} />;
}

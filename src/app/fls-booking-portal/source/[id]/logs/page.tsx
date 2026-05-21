'use client';
import { useParams } from 'next/navigation';
import FlsLogsPage from '../../../_components/FlsLogsPage';

export default function SourceLogsPage() {
  const { id } = useParams<{ id: string }>();
  return <FlsLogsPage type="source" id={id} />;
}

'use client';
import { useParams, useSearchParams } from 'next/navigation';
import FlsLogsPage from '../../../_components/FlsLogsPage';

export default function BookingLogsPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialModule = searchParams.get('module') || '';
  const initialFieldNames = searchParams.get('fields') || '';
  const sectionLabel = searchParams.get('section') || '';
  const from = searchParams.get('from') || '';
  return <FlsLogsPage type="booking" id={id} initialModule={initialModule} initialFieldNames={initialFieldNames} sectionLabel={sectionLabel} from={from} />;
}

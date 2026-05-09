'use client';
import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle2, XCircle, Download, AlertCircle } from 'lucide-react';
import Button from './Button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface BulkUploadProps {
  endpoint: string;
  onComplete: (result: any) => void;
  sampleFileName?: string;
  sampleHeaders?: string[];
  sampleRows?: (string | number)[][];
  sampleUrl?: string;
}

export default function BulkUpload({ endpoint, onComplete, sampleFileName, sampleHeaders, sampleRows, sampleUrl }: BulkUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const resData = res.data;

      const succeeded = resData.data?.succeeded || resData.succeeded || [];
      const failed = resData.data?.failed || resData.failed || [];
      const successCount = resData.data?.successCount ?? resData.successCount ?? succeeded.length;
      const failedCount = resData.data?.failedCount ?? resData.failedCount ?? failed.length;
      const totalCount = resData.data?.totalCount ?? resData.totalCount ?? (successCount + failedCount);

      const result = {
        success: true,
        message: resData.message || 'Upload processed',
        data: { succeeded, failed, successCount, failedCount, totalCount },
      };

      if (failedCount === 0) {
        toast.success(`${successCount} records uploaded successfully!`);
      } else if (successCount > 0) {
        toast.success(`${successCount} uploaded, ${failedCount} failed`);
      } else {
        toast.error(`All ${failedCount} records failed`);
      }
      onComplete(result);
      setFile(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Upload failed';
      onComplete({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = async () => {
    if (sampleUrl) {
      // Download from backend
      try {
        const response = await api.get(sampleUrl, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', sampleFileName || 'sample.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        toast.error('Failed to download sample file');
      }
    } else if (sampleHeaders && sampleRows) {
      // Generate CSV locally
      const csvContent = [sampleHeaders, ...sampleRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = sampleFileName || 'sample.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-4">
      {(sampleUrl || (sampleHeaders && sampleRows)) && (
        <div className="flex items-center gap-2 p-3 bg-brand-50 rounded-lg border border-brand-100">
          <FileSpreadsheet className="w-4 h-4 text-brand-500 flex-shrink-0" />
          <span className="text-xs text-brand-600 flex-1">Download sample file to see the required column format</span>
          <button
            onClick={downloadSample}
            type="button"
            className="flex items-center gap-1.5 text-xs text-brand-700 font-medium hover:text-brand-900 underline underline-offset-2"
          >
            <Download className="w-3.5 h-3.5" />
            {sampleUrl ? 'Sample Excel' : 'Sample CSV'}
          </button>
        </div>
      )}

      <div className="border-2 border-dashed border-brand-200 rounded-xl p-6 bg-brand-50/50">
        <div className="text-center">
          <FileSpreadsheet className="w-10 h-10 text-brand-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-brand-700 mb-1">Upload Excel File</p>
          <p className="text-xs text-brand-400 mb-4">.xlsx or .xls files only</p>
          {file ? (
            <div className="flex items-center gap-2 justify-center bg-white rounded-lg px-4 py-2 border border-brand-200 mb-4 w-fit mx-auto">
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span className="text-sm text-brand-700">{file.name}</span>
              <button onClick={() => setFile(null)} className="text-brand-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => inputRef.current?.click()}>
              Choose File
            </Button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => { setFile(e.target.files?.[0] || null); }}
          />
          {file && (
            <Button loading={loading} onClick={handleUpload} className="mt-2">
              Upload & Process
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

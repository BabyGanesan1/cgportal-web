import api from './api';

export const getUnitStatuses = async (params: { page?: number; limit?: number; search?: string; project_id?: string }) => {
  const { data } = await api.get('/unit-status', { params });
  return data;
};

export const updateUnitStatus = async (id: number, status: string) => {
  const { data } = await api.put(`/unit-status/${id}`, { status });
  return data;
};

export const downloadUnitStatusSample = async () => {
  const response = await api.get('/unit-status/sample-download', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'unit_status_sample.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const bulkUploadUnitStatus = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/unit-status/bulk-upload', formData);
  return data;
};

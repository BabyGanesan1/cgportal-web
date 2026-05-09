import { useState, useCallback } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T = any>() {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: false, error: null });

  const execute = useCallback(async (
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    payload?: any,
    options?: { showSuccess?: string; formData?: boolean }
  ) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const config = options?.formData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
      const res = await (method === 'get' ? api.get(url, { params: payload }) :
        method === 'delete' ? api.delete(url) :
        method === 'put' ? api.put(url, payload, config) :
        api.post(url, payload, config));
      
      setState({ data: res.data, loading: false, error: null });
      if (options?.showSuccess) toast.success(options.showSuccess);
      return res.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Something went wrong';
      setState(s => ({ ...s, loading: false, error: message }));
      toast.error(message);
      throw err;
    }
  }, []);

  return { ...state, execute };
}

export function usePagination(initialLimit = 20) {
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const updatePagination = useCallback((paginationData: any) => {
    setTotal(paginationData.total);
    setTotalPages(paginationData.totalPages);
  }, []);

  return { page, setPage, limit, total, totalPages, updatePagination };
}

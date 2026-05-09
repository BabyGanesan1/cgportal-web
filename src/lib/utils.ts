export const formatCurrency = (value: number | string | null, suffix = '') => {
  if (value === null || value === undefined || value === '') return '-';
  const num = parseFloat(value as string);
  if (isNaN(num)) return '-';
  // value is in Lakhs — convert to rupees and format as Indian number system
  const rupees = Math.round(num * 100000);
  return '₹' + rupees.toLocaleString('en-IN');
};

export const formatDate = (date: string | null) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const getStatusClass = (status: string) => {
  if (!status) return '';
  const s = status.toLowerCase();
  if (s.includes('vacant')) return 'status-vacant';
  if (s.includes('sold')) return 'status-sold';
  if (s.includes('blocked')) return 'status-blocked';
  if (s.includes('investor')) return 'status-investor';
  if (s.includes('open') || s.includes('sale')) return 'status-open';
  return 'bg-gray-100 text-gray-600';
};

export const formatFloorBucket = (bucket: string) => bucket || '-';

export const formatArea = (value: number | string | null) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = parseFloat(value as string);
  if (isNaN(num)) return '-';
  return `${num.toFixed(2)} sqft`;
};

export const debounce = (fn: Function, delay: number) => {
  let timer: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const getDirectImageUrl = (url: string | null | undefined) => {
  if (!url) return '';
  if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://docs.google.com/uc?export=download&id=${idMatch[1]}`;
    }
  }
  return url;
};

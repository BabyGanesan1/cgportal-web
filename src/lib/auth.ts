export const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('cg_token') : null;
export const getAdmin = () => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('cg_admin');
  return data ? JSON.parse(data) : null;
};
export const setAuth = (token: string, admin: object) => {
  localStorage.setItem('cg_token', token);
  localStorage.setItem('cg_admin', JSON.stringify(admin));
};
export const clearAuth = () => {
  localStorage.removeItem('cg_token');
  localStorage.removeItem('cg_admin');
};
export const isAuthenticated = () => !!getToken();

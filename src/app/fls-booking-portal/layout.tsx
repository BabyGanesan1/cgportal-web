import './fls-global.css';
import { FlsThemeProvider } from './_components/FlsThemeContext';

export default function FlsBookingPortalLayout({ children }: { children: React.ReactNode }) {
  return <FlsThemeProvider>{children}</FlsThemeProvider>;
}

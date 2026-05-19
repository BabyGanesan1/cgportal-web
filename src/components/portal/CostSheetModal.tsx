import React, { useRef, useState, useEffect } from 'react';
import { X, Download, FileText, Loader2, Mail, Send, CheckCircle2, AlertCircle, ChevronLeft } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import api from '../../lib/api';

interface CostSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: any;
  property: any;
}

async function toBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch { return ''; }
}

export default function CostSheetModal({ isOpen, onClose, unit, property }: CostSheetModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [emailError, setEmailError] = useState('');

  const pdfContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isOpen && unit && property) {
      const alphabet = unit.unit_no ? unit.unit_no.charAt(0).toUpperCase() : '';
      api.get('/payment-schedules', { params: { property_id: property.id, unit_alphabet: alphabet, limit: 100 } })
        .then((res: any) => setSchedules(res.data.data || []))
        .catch((err: any) => console.error('Failed to load schedules', err));

      const firstChar = unit.unit_no ? unit.unit_no.charAt(0).toUpperCase() : '';
      const blockFromUnit = /^[A-Z]$/.test(firstChar) ? firstChar : null;
      const handoverParams: any = { project_id: property.id, limit: 1 };
      if (blockFromUnit) handoverParams.block = blockFromUnit;
      api.get('/handover-details', { params: handoverParams })
        .then((res: any) => {
          if (res.data.data && res.data.data.length > 0) {
            setBankDetails(res.data.data[0]);
          } else {
            setBankDetails(null);
          }
        })
        .catch((err: any) => console.error('Failed to load bank details', err));
    }
  }, [isOpen, unit, property]);

  useEffect(() => { toBase64('/assets/images/cg_logo_icon.png').then(setLogoBase64); }, []);

  useEffect(() => {
    if (!isOpen || !isMobile) return;
    window.history.pushState({ cgModal: 'costsheet' }, '');
    const onPop = () => { onClose(); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [isOpen, isMobile, onClose]);

  if (!isOpen || !unit) return null;

  const isDubai = property?.cityData?.name?.toLowerCase() === 'dubai';
  const dubaiGrandAED = isDubai ? Math.round((parseFloat(unit?.grand_total) || 0) * 1_000_000) : 0;

  const fmt = (val: number): string => {
    if (!val || isNaN(val)) return isDubai ? 'AED 0' : '₹0';
    const abs = Math.abs(Math.round(val));
    if (isDubai) {
      return 'AED ' + abs.toLocaleString('en-US');
    }
    const str = abs.toString();
    let result = '';
    const last3 = str.slice(-3);
    const rest = str.slice(0, -3);
    if (rest.length > 0) {
      result = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
    } else {
      result = last3;
    }
    return '₹' + result;
  };

  const fmtPdf = (val: number): string => {
    if (isDubai) return 'AED ' + Math.round(Math.abs(val)).toLocaleString('en-US');
    return fmt(val).replace(/[^0-9.,]/g, '');
  };

  const formatDateDMY = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = String(d.getFullYear());
    return `${day}-${month}-${year}`;
  };

  const roundArea = (val: any): string => {
    if (val === null || val === undefined || val === '') return '-';
    const n = parseFloat(val);
    return isNaN(n) ? String(val) : String(Math.round(n));
  };

  const L = 100000;
  const isVilla = (property?.product_type || '').toLowerCase() === 'villa';
  const basicRaw = (
    (parseFloat(unit.this_week_price) || 0) * (parseFloat(unit.super_builtup_area) || 0)
  ) + (
      ((parseFloat(unit.this_week_price) || 0) / 2) * (parseFloat(unit.private_terrace) || 0)
    ) + (
      (parseFloat(unit.car_park_charges) || 0) * L
    ) + (
      isVilla ? ((parseFloat(unit.land_rate_sqft) || 0) * (parseFloat(unit.land_area_sqft) || 0)) : 0
    );

  const plcRaw = (parseFloat(unit.plc_charges_per_sqft) || 0) * (parseFloat(unit.super_builtup_area) || 0);
  const frcRaw = (parseFloat(unit.frc_charges_per_sqft) || 0) * (parseFloat(unit.super_builtup_area) || 0);
  const infraRaw = (parseFloat(unit.infra_charges) || 0) * L;
  const otherRaw = (parseFloat(unit.other_charges) || 0) * L;
  const anyOtherRaw = (parseFloat(unit.any_other_charges) || 0) * L;
  const totalRaw = basicRaw + plcRaw + frcRaw + infraRaw + otherRaw;
  const gstRaw = (parseFloat(unit.gst) || 0) * L;
  const modificationRaw = (parseFloat(unit.modification) || 0) * L;
  const grandRaw = totalRaw + gstRaw + modificationRaw + anyOtherRaw;

  const handleClose = () => {
    if (isMobile) window.history.back();
    else onClose();
  };

  const handleDownloadPDF = async () => {
    if (!pdfContentRef.current) return;
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 200));
    try {
      const canvas = await html2canvas(pdfContentRef.current, { scale: 2, useCORS: true, allowTaint: true, logging: false, backgroundColor: '#ffffff' });
      let imgWidth = 210, pageHeight = 297;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      if (imgHeight > pageHeight) {
        const ratio = pageHeight / imgHeight; imgHeight = pageHeight; imgWidth = imgWidth * ratio;
        pdf.addImage(imgData, 'PNG', (210 - imgWidth) / 2, 0, imgWidth, imgHeight);
      } else { pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight); }
      pdf.save(`${property?.project_name}_${unit.unit_no}_Cost_Sheet.pdf`);

      api.post('/portal/log-cost-sheet-download', {
        project_name: property?.project_name,
        unit_no: unit.unit_no,
      }).catch(e => console.error('Failed to log download', e));

    } catch (err) { console.error(err); alert('Failed to generate PDF.'); }
    finally { setIsGenerating(false); }
  };

  const handleSendEmail = async () => {
    if (!emailInput.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      setEmailError('Please enter a valid email address.'); return;
    }
    setEmailError('');
    setEmailStatus('sending');
    try {
      if (!pdfContentRef.current) throw new Error('PDF content not ready');
      const canvas = await html2canvas(pdfContentRef.current, { scale: 2, useCORS: true, allowTaint: true, logging: false, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      let imgWidth = 210, pageHeight = 297;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      if (imgHeight > pageHeight) {
        const ratio = pageHeight / imgHeight;
        imgHeight = pageHeight; imgWidth = imgWidth * ratio;
        pdf.addImage(imgData, 'PNG', (210 - imgWidth) / 2, 0, imgWidth, imgHeight);
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      }
      const pdfArrayBuffer = pdf.output('arraybuffer');
      const pdfUint8 = new Uint8Array(pdfArrayBuffer);
      let binary = '';
      pdfUint8.forEach((b: number) => { binary += String.fromCharCode(b); });
      const pdfBase64 = btoa(binary);
      await api.post('/portal/send-cost-sheet', {
        email: emailInput.trim(),
        project_name: property?.project_name,
        unit_no: unit.unit_no,
        pdf_base64: pdfBase64,
      });
      setEmailStatus('success');
      setTimeout(() => { setShowEmailPopup(false); setEmailStatus('idle'); setEmailInput(''); }, 2500);
    } catch (err) {
      console.error(err);
      setEmailStatus('error');
      setEmailError('Failed to send email. Please try again.');
    }
  };

  const MRow = ({ label, value, bold, gold, dark }: { label: string; value: string; bold?: boolean; gold?: boolean; dark?: boolean }) => (
    dark ? (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#0a1628' }}>
        <span style={{ fontSize: 14, color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
        <span style={{ fontSize: 17, fontWeight: 900, color: '#f59e0b' }}>{value}</span>
      </div>
    ) : (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', borderBottom: '1px solid #f1f5f9', background: bold ? '#f8fafc' : '#fff' }}>
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500, flex: 1, paddingRight: 12 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: bold ? 800 : 600, color: gold ? '#d97706' : '#0f172a', textAlign: 'right' }}>{value}</span>
      </div>
    )
  );

  const MSectionHeader = ({ title, icon }: { title: string; icon?: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'linear-gradient(90deg, #0a1628, #1e3a5f)', borderTop: '3px solid #f59e0b' }}>
      {icon}
      <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: 2 }}>{title}</span>
    </div>
  );

  const MobileView = () => (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ margin: '16px 16px 8px', borderRadius: 16, background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%)', padding: '20px', boxShadow: '0 8px 24px rgba(10,22,40,0.2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(245,158,11,0.1)' }} />
        <div style={{ position: 'absolute', right: 20, bottom: -30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Unit Summary</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: 1 }}>{unit.unit_no}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{property?.project_name}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {[
            { label: unit.bhk, color: '#f59e0b' },
            { label: `Floor ${unit.floor || 'G'}`, color: 'rgba(255,255,255,0.7)' },
            { label: unit.facing, color: 'rgba(255,255,255,0.7)' },
            { label: unit.unit_type || 'ELITE', color: '#10b981' },
          ].filter(i => i.label).map(({ label, color }) => (
            <span key={label} style={{ fontSize: 11, fontWeight: 700, color, background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.15)' }}>{label}</span>
          ))}
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1 }}>Total Cost</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#f59e0b' }}>{fmt(grandRaw)}</span>
        </div>
      </div>

      <div style={{ margin: '8px 16px', borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <MSectionHeader title="Area Details" />
        <div style={{ background: '#fff', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {isDubai ? (
            <>
              {[
                { label: 'Unit Area', value: `${roundArea(unit.unit_area)} sqft` },
                { label: 'Balcony Area', value: `${roundArea(unit.balcony_area)} sqft` },
                { label: 'Total Area', value: `${roundArea(unit.total_area)} sqft` },
              ].map(({ label, value }, i, arr) => (
                <div key={label} style={{ padding: '14px 16px', borderRight: i % 2 === 0 ? '1px solid #f1f5f9' : 'none', borderBottom: i < arr.length - 2 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{value}</div>
                </div>
              ))}
            </>
          ) : (
            <>
              {[
                { label: 'Super BUA', value: `${unit.super_builtup_area || '-'} sft` },
                { label: 'Carpet Area', value: `${unit.carpet_area || '-'} sft` },
                { label: 'Car Parks', value: String(unit.no_of_car_park || '-') },
                { label: 'Car Park Type', value: unit.car_park_type || '-' },
              ].map(({ label, value }, i, arr) => (
                <div key={label} style={{ padding: '14px 16px', borderRight: i % 2 === 0 ? '1px solid #f1f5f9' : 'none', borderBottom: i < arr.length - 2 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{value}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div style={{ margin: '8px 16px', borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <MSectionHeader title="Cost Break Up" />
        {isDubai ? (
          <>
            <MRow label="Unit Rate in AED" value={fmt(dubaiGrandAED)} bold />
            <MRow label="Total Cost" value={fmt(dubaiGrandAED)} dark />
          </>
        ) : (
          <>
            <MRow label="Basic" value={fmt(basicRaw)} />
            <MRow label="PLC" value={fmt(plcRaw)} />
            <MRow label="FRC" value={fmt(frcRaw)} />
            <MRow label="Infra Charges" value={fmt(infraRaw)} />
            <MRow label="Other Charges" value={fmt(otherRaw)} />
            {anyOtherRaw > 0 && <MRow label={`${unit.any_other_charges_remarks ? `${unit.any_other_charges_remarks}` : ''}`} value={fmt(anyOtherRaw)} />}
            <MRow label="Total (Before GST)" value={fmt(totalRaw)} bold />
            <MRow label="GST - As Applicable" value={fmt(gstRaw)} />
            <MRow label="Total Cost" value={fmt(grandRaw)} dark />
          </>
        )}
      </div>

      <div style={{ margin: '8px 16px 16px', borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <MSectionHeader title="Payment Schedule" />
        {schedules.length > 0 ? schedules.map((item, idx) => {
          const pct = parseFloat(item.percentage) || 0;
          const val = (isDubai ? dubaiGrandAED : grandRaw) * pct / 100;
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '13px 20px', borderBottom: '1px solid #f1f5f9', background: '#fff', gap: 8 }}>
              <span style={{ flex: 1, fontSize: 13, color: '#334155' }}>{item.description}</span>
              <span style={{ fontSize: 11, color: '#94a3b8', background: '#f8fafc', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>{pct}%</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', minWidth: 90, textAlign: 'right' }}>{fmt(val)}</span>
            </div>
          );
        }) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13, fontStyle: 'italic', background: '#fff' }}>
            No payment schedules configured for this unit type.
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', background: '#f8fafc' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#0a1628', textTransform: 'uppercase', letterSpacing: 1 }}>Total Unit Cost</span>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#0a1628' }}>{fmt(isDubai ? dubaiGrandAED : grandRaw)}</span>
        </div>
      </div>
    </div>
  );

  const DesktopView = () => (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f9fafb' }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div className="overflow-x-auto rounded-xl border border-brand-200">
          <div className="bg-[#102a43] text-white text-center py-2 text-xs font-bold uppercase tracking-widest">UNIT DETAILS</div>
          <table className="w-full min-w-[520px] text-sm text-center">
            <thead className="bg-brand-50/50 text-[#102a43] text-[10px] font-base uppercase tracking-wider">
              <tr>{['Phase', 'Project', 'Unit No', 'BHK Type', 'Unit Type', 'Floor', 'Facing'].map(h => <th key={h} className="px-4 py-3 border-b border-r border-brand-100">{h}</th>)}</tr>
            </thead>
            <tbody className="text-[#102a43] font-medium bg-white">
              <tr>
                <td className="px-4 py-3 border-r border-brand-100 uppercase text-xs font-bold text-[#d97706] ">{unit.phase || 'I'}</td>
                <td className="px-4 py-3 border-r border-brand-100 uppercase text-xs">{property?.project_name || '-'}</td>
                <td className="px-4 py-3 border-r border-brand-100 font-bold uppercase text-xs">{unit.unit_no}</td>
                <td className="px-4 py-3 border-r border-brand-100 uppercase text-xs">{unit.bhk}</td>
                <td className="px-4 py-3 border-r border-brand-100 uppercase text-xs">{unit.unit_type || 'APARTMENT'}</td>
                <td className="px-4 py-3 border-r border-brand-100 uppercase text-xs">{unit.floor || 'G'}</td>
                <td className="px-4 py-3 uppercase text-xs">{unit.facing || 'SOUTH'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded-xl border border-brand-200">
          <div className="bg-[#102a43] text-white text-center py-2 text-xs font-bold uppercase tracking-widest">AREA DETAILS</div>
          {isDubai ? (
            <table className="w-full min-w-[520px] text-sm text-center">
              <thead className="bg-brand-50/50 text-[#102a43] text-[10px] font-bold uppercase tracking-wider">
                <tr>{['Unit Area (sqft)', 'Balcony Area (sqft)', 'Total Area (sqft)'].map(h => <th key={h} className="px-4 py-3 border-b border-r border-brand-100 last:border-r-0">{h}</th>)}</tr>
              </thead>
              <tbody className="text-[#102a43] font-medium bg-white">
                <tr>
                  <td className="px-4 py-3 border-r border-brand-100 text-xs">{roundArea(unit.unit_area)}</td>
                  <td className="px-4 py-3 border-r border-brand-100 text-xs">{roundArea(unit.balcony_area)}</td>
                  <td className="px-4 py-3 text-xs">{roundArea(unit.total_area)}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[520px] text-sm text-center">
              <thead className="bg-brand-50/50 text-[#102a43] text-[10px] font-bold uppercase tracking-wider">
                <tr>{['Super Build-Up Area (sft.)', 'Carpet Area (sft.)', 'No. of Car Parks', 'Car Park Type'].map(h => <th key={h} className="px-4 py-3 border-b border-r border-brand-100">{h}</th>)}</tr>
              </thead>
              <tbody className="text-[#102a43] font-medium bg-white">
                <tr>
                  <td className="px-4 py-3 border-r border-brand-100 text-xs">{unit.super_builtup_area || '-'}</td>
                  <td className="px-4 py-3 border-r border-brand-100 text-xs">{unit.carpet_area || '-'}</td>
                  <td className="px-4 py-3 border-r border-brand-100 text-xs">{unit.no_of_car_park || '-'}</td>
                  <td className="px-4 py-3 text-xs">{unit.car_park_type || '-'}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-brand-200">
          <div className="bg-[#102a43] text-white text-center py-2 text-xs font-bold uppercase tracking-widest">COST - BREAK UP</div>
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-brand-50/50 text-[#102a43] text-[10px] font-bold uppercase tracking-wider text-right">
              <tr>
                <th className="px-6 py-3 border-b border-r border-brand-100 text-left">Description</th>
                <th className="px-6 py-3 border-b border-brand-100">Amount</th>
              </tr>
            </thead>
            <tbody className="text-[#102a43] font-medium divide-y divide-brand-100 text-right bg-white">
              {isDubai ? (
                <>
                  <tr>
                    <td className="px-6 py-3 border-r border-brand-100 text-left text-xs font-bold">UNIT RATE IN AED</td>
                    <td className="px-6 py-3 font-semibold text-xs">{fmt(dubaiGrandAED)}</td>
                  </tr>
                  <tr className="bg-[#102a43] text-white font-bold">
                    <td className="px-6 py-4 border-r border-[#1e3e5f] text-left text-sm tracking-wider uppercase">TOTAL COST</td>
                    <td className="px-6 py-4 text-lg text-yellow-500 whitespace-nowrap">{fmt(dubaiGrandAED)}</td>
                  </tr>
                </>
              ) : (
                <>
                  <tr>
                    <td className="px-6 py-3 border-r border-brand-100 text-left text-xs">BASIC</td>
                    <td className="px-6 py-3 font-semibold text-xs">{fmt(basicRaw)}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 border-r border-brand-100 text-left text-xs">PLC</td>
                    <td className="px-6 py-3 font-semibold text-xs">{fmt(plcRaw)}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 border-r border-brand-100 text-left text-xs">FRC</td>
                    <td className="px-6 py-3 font-semibold text-xs">{fmt(frcRaw)}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 border-r border-brand-100 text-left text-xs">INFRA CHARGES</td>
                    <td className="px-6 py-3 font-semibold text-xs">{fmt(infraRaw)}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 border-r border-brand-100 text-left text-xs">OTHER CHARGES</td>
                    <td className="px-6 py-3 font-semibold text-xs">{fmt(otherRaw)}</td>
                  </tr>
                  {anyOtherRaw > 0 && (
                    <tr>
                      <td className="px-6 py-3 border-r border-brand-100 text-left text-xs">{unit.any_other_charges_remarks ? `${unit.any_other_charges_remarks}` : ''}</td>
                      <td className="px-6 py-3 font-semibold text-xs">{fmt(anyOtherRaw)}</td>
                    </tr>
                  )}
                  <tr className="bg-brand-50/30 font-bold">
                    <td className="px-6 py-4 border-r border-brand-100 text-left text-xs tracking-wider">TOTAL (Before GST)</td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">{fmt(totalRaw)}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 border-r border-brand-100 text-left text-xs font-bold">GST - AS APPLICABLE</td>
                    <td className="px-6 py-3 font-semibold text-sm whitespace-nowrap">{fmt(gstRaw)}</td>
                  </tr>
                  <tr className="bg-[#102a43] text-white font-bold">
                    <td className="px-6 py-4 border-r border-[#1e3e5f] text-left text-sm tracking-wider uppercase">TOTAL COST</td>
                    <td className="px-6 py-4 text-lg text-yellow-500 whitespace-nowrap">{fmt(grandRaw)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded-xl border border-brand-200">
          <div className="bg-[#102a43] text-white text-center py-2 text-xs font-bold uppercase tracking-widest">PAYMENT SCHEDULE</div>
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-[#f0f4f8] text-[#102a43] text-[10px] font-bold uppercase tracking-wider text-right">
              <tr>
                <th className="px-6 py-3 border-b border-r border-brand-100 text-left">DESCRIPTION</th>
                <th className="px-6 py-3 border-b border-r border-brand-100 text-center">% of Sale Value</th>
                <th className="px-6 py-3 border-b border-brand-100">Installment Amount</th>
              </tr>
            </thead>
            <tbody className="text-[#102a43] font-medium divide-y divide-brand-100 text-right bg-white">
              {schedules.length > 0 ? schedules.map((item, idx) => {
                const pct = parseFloat(item.percentage) || 0;
                const val = (isDubai ? dubaiGrandAED : grandRaw) * pct / 100;
                return (
                  <tr key={idx}>
                    <td className="px-6 py-3 border-r border-brand-100 text-left text-xs">{item.description}</td>
                    <td className="px-6 py-3 border-r border-brand-100 text-center text-xs">{pct}%</td>
                    <td className="px-6 py-3 font-semibold text-xs whitespace-nowrap">{fmt(val)}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={3} className="px-6 py-4 text-center text-brand-400 text-xs italic">No payment schedules found.</td></tr>
              )}
              <tr className="bg-[#f0f4f8] font-bold">
                <td colSpan={2} className="px-6 py-4 border-r border-brand-100 text-center uppercase tracking-widest text-xs">TOTAL UNIT COST</td>
                <td className="px-6 py-4 text-sm whitespace-nowrap">{fmt(isDubai ? dubaiGrandAED : grandRaw)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        onClick={e => { if (e.target === e.currentTarget && !showEmailPopup) handleClose(); }}
        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 24, paddingTop: isMobile ? 'env(safe-area-inset-top, 0px)' : 0, background: 'rgba(10,22,40,0.65)', backdropFilter: 'blur(6px)' }}
      >
        <div style={{
          background: '#f8fafc', width: '100%', maxWidth: isMobile ? '100%' : '900px',
          height: isMobile ? 'calc(95vh - env(safe-area-inset-top, 0px))' : 'auto', maxHeight: isMobile ? 'calc(95vh - env(safe-area-inset-top, 0px))' : '90vh',
          borderRadius: isMobile ? '20px 20px 0 0' : '20px',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 32px 64px rgba(0,0,0,0.3)'
        }}>
          <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%)', padding: isMobile ? '14px 16px' : '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            {isMobile && <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.25)', margin: '0 auto 12px' }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isMobile && (
                <button onClick={handleClose} style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <ChevronLeft size={18} />
                </button>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? 12 : 15, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>PRICE SHEET & PAYMENT SCHEDULE</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{property?.project_name} · Unit {unit.unit_no}</div>
              </div>
              {!isMobile && (
                <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <X size={17} />
                </button>
              )}
            </div>
          </div>

          {unit && (unit.status?.toLowerCase().includes('sold') || unit.status?.toLowerCase().includes('booked')) && (
            <div style={{ background: '#fef2f2', borderBottom: '1px solid #fee2e2', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#991b1b' }}>Unit Already Booked</div>
                <div style={{ fontSize: 11, color: '#b91c1c' }}>This unit was recently booked. You can still view the price sheet, but it is no longer available for new bookings.</div>
              </div>
            </div>
          )}

          {isMobile ? <MobileView /> : <DesktopView />}

          <div style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', background: '#fff', flexShrink: 0, display: 'flex', gap: 10 }}>
            <button
              onClick={() => { setShowEmailPopup(true); setEmailStatus('idle'); setEmailInput(''); setEmailError(''); }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#eff6ff', color: '#1d4ed8', border: '2px solid #bfdbfe', borderRadius: 14, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >
              <Mail size={17} /> Send via Email
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: isGenerating ? '#f87171' : '#ef4444', color: '#fff', border: 'none', borderRadius: 14, padding: '13px', fontWeight: 700, fontSize: 14, cursor: isGenerating ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }}
            >
              {isGenerating ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</> : <><Download size={17} /> Download PDF</>}
            </button>
          </div>
        </div>
      </div>

      {showEmailPopup && (
        <div
          onClick={e => { if (e.target === e.currentTarget) { setShowEmailPopup(false); setEmailStatus('idle'); } }}
          style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(10,22,40,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 24px 48px rgba(0,0,0,0.25)' }}>
            {emailStatus === 'success' ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <CheckCircle2 size={48} style={{ color: '#10b981', margin: '0 auto 14px' }} />
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0a1628', marginBottom: 6 }}>Email Sent!</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Price sheet sent to <strong>{emailInput}</strong></div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Mail size={20} style={{ color: '#1d4ed8' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0a1628' }}>Send Price Sheet</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>PDF will be sent as attachment</div>
                    </div>
                  </div>
                  <button onClick={() => setShowEmailPopup(false)} style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <X size={15} />
                  </button>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 14px', marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Project</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0a1628' }}>{property?.project_name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Unit No</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0a1628' }}>{unit.unit_no}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Total Cost</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>{fmt(grandRaw)}</span>
                  </div>
                </div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Recipient Email</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => { setEmailInput(e.target.value); setEmailError(''); }}
                  placeholder="customer@example.com"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `2px solid ${emailError ? '#fca5a5' : '#e2e8f0'}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: emailError ? '#fef2f2' : '#fff', color: '#0a1628' }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendEmail(); }}
                />
                {emailError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <AlertCircle size={13} style={{ color: '#ef4444' }} />
                    <span style={{ fontSize: 12, color: '#ef4444' }}>{emailError}</span>
                  </div>
                )}
                <button
                  onClick={handleSendEmail}
                  disabled={emailStatus === 'sending'}
                  style={{ width: '100%', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: emailStatus === 'sending' ? '#93c5fd' : '#1d4ed8', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: emailStatus === 'sending' ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}
                >
                  {emailStatus === 'sending' ? (
                    <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</>
                  ) : (
                    <><Send size={17} /> Send Price Sheet</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div ref={pdfContentRef} data-pdf-root="true" style={{ position: 'absolute', top: -9999, left: -9999, width: 1000, background: '#fff', color: '#000', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <style dangerouslySetInnerHTML={{ __html: `[data-pdf-root] td { height: 1px; } [data-pdf-root] td, [data-pdf-root] th { vertical-align: middle !important; }` }} />
        <div style={{ padding: '40px 50px' }}>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            {logoBase64 && (
              <div style={{ position: 'absolute', top: -35, right: -45 }}>
                <img src={logoBase64} alt="Logo" style={{ height: 90, width: 'auto', objectFit: 'contain' }} />
              </div>
            )}
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#000', textAlign: 'center', margin: 0 }}>Price Sheet &amp; Payment Schedule</h1>
            <div style={{ position: 'absolute', right: 0, bottom: -5, fontSize: 13, fontWeight: 800, color: '#000' }}>
              Date : {new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}
            </div>
          </div>

          <div style={{ border: '1px solid #9ca3af', borderRadius: 8, overflow: 'hidden', marginBottom: 16, marginTop: 24 }}>
            <div style={{ background: '#f8c471', textAlign: 'center', padding: '8px 0 14px 0', fontSize: 12, fontWeight: 700, color: '#000' }}>UNIT DETAILS</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: 11 }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr style={{ borderBottom: '1px solid #9ca3af', borderTop: '1px solid #9ca3af' }}>
                  {['PROJECT', 'PHASE', 'UNIT NO', 'BHK TYPE', 'UNIT TYPE', 'FLOOR', 'FACING'].map((h, i) => (
                    <th key={h} style={{ padding: '10px 4px', fontWeight: 600, borderRight: i !== 6 ? '1px solid #9ca3af' : 'none', verticalAlign: 'middle' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 0, borderRight: '1px solid #9ca3af' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', height: '100%' }}>{property?.project_name || '-'}</div></td>
                  <td style={{ padding: 0, borderRight: '1px solid #9ca3af' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', height: '100%' }}>{unit.phase || 'I'}</div></td>
                  <td style={{ padding: 0, borderRight: '1px solid #9ca3af', fontWeight: 700 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', height: '100%' }}>{unit.unit_no}</div></td>
                  <td style={{ padding: 0, borderRight: '1px solid #9ca3af' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', height: '100%' }}>{unit.bhk}</div></td>
                  <td style={{ padding: 0, borderRight: '1px solid #9ca3af' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', height: '100%' }}>{unit.unit_type || 'APARTMENT'}</div></td>
                  <td style={{ padding: 0, borderRight: '1px solid #9ca3af' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', height: '100%' }}>{unit.floor || 'G'}</div></td>
                  <td style={{ padding: 0 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', height: '100%' }}>{unit.facing || 'SOUTH'}</div></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ border: '1px solid #9ca3af', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ background: '#f8c471', textAlign: 'center', padding: '8px 0 14px 0', fontSize: 12, fontWeight: 700, color: '#000' }}>AREA DETAILS</div>
            {isDubai ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: 11 }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr style={{ borderBottom: '1px solid #9ca3af', borderTop: '1px solid #9ca3af' }}>
                    {['UNIT AREA (sqft)', 'BALCONY AREA (sqft)', 'TOTAL AREA (sqft)'].map((h, i) => (
                      <th key={h} style={{ padding: '10px 4px', fontWeight: 600, borderRight: i !== 2 ? '1px solid #9ca3af' : 'none', verticalAlign: 'middle' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: 0, borderRight: '1px solid #9ca3af' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', height: '100%' }}>{roundArea(unit.unit_area)}</div></td>
                    <td style={{ padding: 0, borderRight: '1px solid #9ca3af' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', height: '100%' }}>{roundArea(unit.balcony_area)}</div></td>
                    <td style={{ padding: 0 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', height: '100%' }}>{roundArea(unit.total_area)}</div></td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: 11 }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr style={{ borderBottom: '1px solid #9ca3af', borderTop: '1px solid #9ca3af' }}>
                    {['SUPER BUILT-UP AREA (in sft.)', 'CARPET AREA (in sft.)', 'NO. OF CAR PARK', 'CAR PARK TYPE', 'UDS (in sft.)'].map((h, i) => (
                      <th key={h} style={{ padding: '10px 4px', fontWeight: 600, borderRight: i !== 4 ? '1px solid #9ca3af' : 'none', verticalAlign: 'middle' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: 0, borderRight: '1px solid #9ca3af' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', height: '100%' }}>{roundArea(unit.super_builtup_area)}</div></td>
                    <td style={{ padding: 0, borderRight: '1px solid #9ca3af' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', height: '100%' }}>{roundArea(unit.carpet_area)}</div></td>
                    <td style={{ padding: 0, borderRight: '1px solid #9ca3af' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', height: '100%' }}>{unit.no_of_car_park || '-'}</div></td>
                    <td style={{ padding: 0, borderRight: '1px solid #9ca3af' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', height: '100%' }}>{unit.car_park_type || '-'}</div></td>
                    <td style={{ padding: 0 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', height: '100%' }}>{roundArea(unit.uds)}</div></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
            <div style={{ flex: '0 0 47%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ border: '1px solid #9ca3af', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ background: '#f8c471', textAlign: 'center', padding: '8px 0 14px 0', fontSize: 12, fontWeight: 700, color: '#000' }}>COST - BREAK UP</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #9ca3af', borderTop: '1px solid #9ca3af', background: '#f8fafc' }}>
                      <th style={{ padding: '8px', fontWeight: 800, borderRight: '1px solid #9ca3af', textAlign: 'center', verticalAlign: 'middle' }}>Description</th>
                      <th style={{ padding: '8px', fontWeight: 800, textAlign: 'center', width: 110, verticalAlign: 'middle' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isDubai ? (
                      <>
                        <tr style={{ borderBottom: '1px solid #9ca3af' }}>
                          <td style={{ padding: 0, borderRight: '1px solid #9ca3af', fontWeight: 800 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '8px', height: '100%' }}>UNIT RATE IN AED</div></td>
                          <td style={{ padding: 0 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px', height: '100%', whiteSpace: 'nowrap' }}>{fmtPdf(dubaiGrandAED)}</div></td>
                        </tr>
                        <tr style={{ fontWeight: 800, background: '#f3f4f6' }}>
                          <td style={{ padding: 0, borderRight: '1px solid #9ca3af' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '8px', height: '100%' }}>TOTAL COST</div></td>
                          <td style={{ padding: 0 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px', height: '100%', fontSize: 13, whiteSpace: 'nowrap' }}>{fmtPdf(dubaiGrandAED)}</div></td>
                        </tr>
                      </>
                    ) : (
                      <>
                        {[
                          { desc: 'Basic', raw: basicRaw },
                          { desc: 'Preferential Location Charges (PLC)', raw: plcRaw },
                          { desc: 'Floor Rise Charges (FRC)', raw: frcRaw },
                          { desc: 'Infra Charges', raw: infraRaw },
                          { desc: 'Other Charges', raw: otherRaw },
                          ...(anyOtherRaw > 0 ? [{ desc: `${unit.any_other_charges_remarks ? `${unit.any_other_charges_remarks}` : ''}`, raw: anyOtherRaw }] : []),
                        ].map((row) => (
                          <tr key={row.desc} style={{ borderBottom: '1px solid #9ca3af' }}>
                            <td style={{ padding: 0, borderRight: '1px solid #9ca3af' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '8px', height: '100%' }}>{row.desc}</div></td>
                            <td style={{ padding: 0 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px', height: '100%' }}>{row.raw === 0 ? '-' : fmt(row.raw).replace(/[^0-9.,]/g, '')}</div></td>
                          </tr>
                        ))}
                        <tr style={{ borderBottom: '1px solid #9ca3af', background: '#f3f4f6', fontWeight: 800 }}>
                          <td style={{ padding: 0, borderRight: '1px solid #9ca3af' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '8px', height: '100%' }}>TOTAL</div></td>
                          <td style={{ padding: 0 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px', height: '100%' }}>{fmt(totalRaw).replace(/[^0-9.,]/g, '')}</div></td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #9ca3af' }}>
                          <td style={{ padding: 0, borderRight: '1px solid #9ca3af' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '8px', height: '100%' }}>GST (As applicable)</div></td>
                          <td style={{ padding: 0 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px', height: '100%' }}>{fmt(gstRaw).replace(/[^0-9.,]/g, '')}</div></td>
                        </tr>
                        <tr style={{ fontWeight: 800, background: '#f3f4f6' }}>
                          <td style={{ padding: 0, borderRight: '1px solid #9ca3af' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '8px', height: '100%' }}>TOTAL COST</div></td>
                          <td style={{ padding: 0 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px', height: '100%', fontSize: 13 }}>{fmt(grandRaw).replace(/[^0-9.,]/g, '')}</div></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ border: '1px solid #9ca3af', borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 8, color: '#374151' }}>Spirit Date</div>
                    <div style={{ background: '#e5e7eb', padding: '10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                      {formatDateDMY(bankDetails?.final_spirit_date || property?.final_spirit_date)}
                    </div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 8, color: '#374151' }}>Handover Date</div>
                    <div style={{ background: '#e5e7eb', padding: '10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                      {formatDateDMY(bankDetails?.handing_over_date || property?.handing_over_date)}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 9.5, color: '#4b5563', lineHeight: 1.5, textAlign: 'justify' }}>
                  * The unit shall be handed over within the Handover Date and the same shall be considered for all the contractual purposes. However, Casagrand in its true sense and spirit, shall aspire and endeavor to hand over the unit by Spirit Date. Both Spirit and Handover Date are mentioned above.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800 }}>RERA No :</div>
                <div style={{ background: '#e5e7eb', padding: '10px 16px', borderRadius: 6, fontSize: 12, flex: 1, color: '#4b5563' }}>{property?.rera_registration_no || 'TN/35/Building/0053/2024'}</div>
              </div>
            </div>

            <div style={{ flex: '1', display: 'flex', alignSelf: 'flex-start' }}>
              <div style={{ border: '1px solid #9ca3af', borderRadius: 8, width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ background: '#f8c471', textAlign: 'center', padding: '8px 0 14px 0', fontSize: 12, fontWeight: 700, color: '#000', borderRadius: '8px 8px 0 0' }}>PAYMENT SCHEDULE</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #9ca3af', borderTop: '1px solid #9ca3af', background: '#f8fafc' }}>
                      <th style={{ padding: '8px', fontWeight: 800, borderRight: '1px solid #9ca3af', textAlign: 'center', verticalAlign: 'middle' }}>Description</th>
                      <th style={{ padding: '8px', fontWeight: 800, borderRight: '1px solid #9ca3af', textAlign: 'center', width: 60, verticalAlign: 'middle' }}>% of Sale Value</th>
                      <th style={{ padding: '8px', fontWeight: 800, textAlign: 'center', width: 90, verticalAlign: 'middle' }}>Stage Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((item, idx) => {
                      const pct = parseFloat(item.percentage) || 0;
                      const val = (isDubai ? dubaiGrandAED : grandRaw) * pct / 100;
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #9ca3af' }}>
                          <td style={{ padding: 0, borderRight: '1px solid #9ca3af' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '7px 8px', height: '100%' }}>{item.description}</div></td>
                          <td style={{ padding: 0, borderRight: '1px solid #9ca3af' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '7px 8px', height: '100%' }}>{pct}%</div></td>
                          <td style={{ padding: 0 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '7px 8px', height: '100%' }}>{fmtPdf(val)}</div></td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: '#f3f4f6', fontWeight: 800, borderTop: '1px solid #9ca3af' }}>
                      <td style={{ padding: 0, borderRight: '1px solid #9ca3af', textTransform: 'uppercase' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '8px', height: '100%' }}>TOTAL COST</div></td>
                      <td style={{ padding: 0, borderRight: '1px solid #9ca3af' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', height: '100%' }}>100%</div></td>
                      <td style={{ padding: 0 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px', height: '100%', fontSize: 13, whiteSpace: 'nowrap' }}>{fmtPdf(isDubai ? dubaiGrandAED : grandRaw)}</div></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ border: '1px solid #9ca3af', borderRadius: 8, overflow: 'hidden', marginTop: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead style={{ background: '#e5e7eb' }}>
                <tr>
                  <th style={{ padding: '8px 6px', borderRight: '1px solid #9ca3af', fontWeight: 800, textAlign: 'center', verticalAlign: 'middle' }}>Bank Name</th>
                  <th style={{ padding: '8px 6px', borderRight: '1px solid #9ca3af', fontWeight: 800, textAlign: 'center', verticalAlign: 'middle' }}>Account Number</th>
                  <th style={{ padding: '8px 6px', borderRight: '1px solid #9ca3af', fontWeight: 800, textAlign: 'center', verticalAlign: 'middle' }}>IFSC Code</th>
                  <th style={{ padding: '8px 6px', borderRight: '1px solid #9ca3af', fontWeight: 800, textAlign: 'center', verticalAlign: 'middle' }}>Our Cheque Favoring :</th>
                  <th style={{ padding: '8px 6px', fontWeight: 800, textAlign: 'center', verticalAlign: 'middle' }}>Branch</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 0, borderRight: '1px solid #9ca3af', color: '#333' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 6px', height: '100%' }}>{bankDetails?.bank_name || '-'}</div></td>
                  <td style={{ padding: 0, borderRight: '1px solid #9ca3af', color: '#333' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 6px', height: '100%' }}>{bankDetails?.account_no || '-'}</div></td>
                  <td style={{ padding: 0, borderRight: '1px solid #9ca3af', color: '#333' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 6px', height: '100%' }}>{bankDetails?.ifsc || '-'}</div></td>
                  <td style={{ padding: 0, borderRight: '1px solid #9ca3af', color: '#333' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 6px', height: '100%' }}>{bankDetails?.cheque_favoring || '-'}</div></td>
                  <td style={{ padding: 0, color: '#333' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 6px', height: '100%' }}>{bankDetails?.branch || '-'}</div></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8, textDecoration: 'underline' }}>Terms &amp; Conditions</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#374151', lineHeight: 1.7 }}>
              <li>Infrastructure and other charges referred above are limited to the infrastructure provided within the project and do not include panchayat/municipal/corporation water and sewage connection charges/ deposits.</li>
              <li>Customer(s) must deduct 1% TDS and share proof to Casagrand within 30 days of milestone payments.</li>
              <li>Corpus Fund of Rs.50,000/- will be payable at the time of handover, and Casagrand will maintain the property for the first 6 months from the date of project handover.</li>
              <li>Basic Cost is inclusive of 1CCP (1Covered Car Parking).</li>
              <li>This price sheet is valid solely on its date of issuance.</li>
              <li>All the above terms &amp; conditions are to be read in continuation of the booking form.</li>
              <li>I/We understand and accept the above Terms &amp; Conditions, price sheet and payment schedule for the unit selected.</li>
            </ul>
          </div>

          <div style={{ marginTop: 50, display: 'flex', justifyContent: 'space-between', padding: '0 60px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '2px dashed #000', width: 220, paddingTop: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800 }}>First applicant signature</span>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '2px dashed #000', width: 220, paddingTop: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800 }}>Second applicant signature</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
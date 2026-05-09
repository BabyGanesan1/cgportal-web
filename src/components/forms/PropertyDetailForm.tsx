'use client';
import React, { useEffect, useMemo, forwardRef } from 'react';
import { useForm } from 'react-hook-form';

// ─── Inline Input component with proper forwardRef ───────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-gray-600">{label}</label>
      )}
      <input
        ref={ref}
        className={`
          w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors
          bg-white text-gray-800 placeholder-gray-400
          ${error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
            : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50'
          }
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

// ─── Inline Select component with proper forwardRef ──────────────────────────
interface SelectOption { value: string; label: string; }
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-gray-600">{label}</label>
      )}
      <select
        ref={ref}
        className={`
          w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors
          bg-white text-gray-800
          ${error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
            : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50'
          }
          ${className}
        `}
        {...props}
      >
        <option value="">— Select —</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';

// ─── Inline Button ────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}
function Button({ loading, children, className = '', ...props }: ButtonProps) {
  return (
    <button
      disabled={loading}
      className={`
        px-5 py-2 rounded-lg text-sm font-semibold transition-all
        bg-blue-600 text-white hover:bg-blue-700 active:scale-95
        disabled:opacity-60 disabled:cursor-not-allowed
        flex items-center gap-2
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES = [
  'Vacant', 'Sold', 'HSBC-Sold', 'Blocked',
  'Open for Sale with 10%', 'HSBC-Open for sale with 10%',
  'HSBC-vacant', 'Investor',
];
const FACINGS = ['NORTH', 'SOUTH', 'EAST', 'WEST', 'NORTH-EAST', 'NORTH-WEST', 'SOUTH-EAST', 'SOUTH-WEST'];
const UNIT_TYPES = ['ELITE', 'PREMIUM', 'CLASSIC', 'LUXURY'];
const CAR_PARK_TYPES = ['1OCP', '2OCP', '1CCP', '2CCP', '1OCP+1CCP'];

// ─── Main Form ────────────────────────────────────────────────────────────────
interface PropertyDetailFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
  onClose?: () => void;
}

export default function PropertyDetailForm({
  initialData,
  onSubmit,
  loading,
  onClose,
}: PropertyDetailFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: initialData || {} });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  // Live calculation
  const watchedValues = watch([
    'this_week_price', 'next_week_price', 'car_park_charges', 'infra_charges', 'other_charges', 'any_other_charges', 'modification',
    'super_builtup_area', 'plc_charges_per_sqft', 'frc_charges_per_sqft', 'private_terrace',
    'land_rate_lakhs', 'land_area_sqyards', 'land_rate_sqyards', 'land_area_sqft', 'land_rate_sqft'
  ]);

  const [
    tPrice, nPrice, cpCharges, infra, other, anyOther, mod,
    sba, plc, frc, terrace,
    landRateLakhs, landAreaYards, landRateYards, landAreaFt, landRateFt
  ] = watchedValues.map(v => parseFloat(v as string) || 0);

  const calc = useMemo(() => {
    // 1. Calculate Land Value
    let landValue = 0;
    if (landRateLakhs > 0) {
      landValue = landRateLakhs;
    } else if (landAreaYards > 0 && landRateYards > 0) {
      landValue = (landAreaYards * landRateYards) / 100000;
    } else if (landAreaFt > 0 && landRateFt > 0) {
      landValue = (landAreaFt * landRateFt) / 100000;
    }

    // 2. Construction Value (SBA * Rate)
    const constValue = sba > 0 ? ((sba * (tPrice + plc + frc)) / 100000) : 0;
    const nConstValue = sba > 0 ? ((sba * (nPrice + plc + frc)) / 100000) : 0;

    // 3. Terrace Value (Terrace Sqft * Rate / 2)
    const terraceValue = terrace > 0 ? ((terrace * (tPrice / 2)) / 100000) : 0;
    const nTerraceValue = terrace > 0 ? ((terrace * (nPrice / 2)) / 100000) : 0;

    // 4. Base Price Including Car Park
    const inclCP = landValue + constValue + terraceValue + cpCharges;
    const nInclCP = landValue + nConstValue + nTerraceValue + cpCharges;

    const total = inclCP + infra + other + anyOther + mod;
    const gst = total * 0.05;
    const grand = total + gst;

    return {
      inclCP: inclCP.toFixed(2),
      nInclCP: nInclCP.toFixed(2),
      total: total.toFixed(2),
      gst: gst.toFixed(2),
      grand: grand.toFixed(2),
    };
  }, [tPrice, nPrice, cpCharges, infra, other, anyOther, mod]);

  const handleFormSubmit = handleSubmit(async (data) => {
    const cleaned = {
      ...data,
      floor: data.floor ? parseInt(data.floor) : null,
      carpet_area: data.carpet_area ? parseFloat(data.carpet_area) : null,
      super_builtup_area: data.super_builtup_area ? parseFloat(data.super_builtup_area) : null,
      land_area_sqft: data.land_area_sqft ? parseFloat(data.land_area_sqft) : null,
      land_rate_sqft: data.land_rate_sqft ? parseFloat(data.land_rate_sqft) : null,
      land_area_sqyards: data.land_area_sqyards ? parseFloat(data.land_area_sqyards) : null,
      land_rate_sqyards: data.land_rate_sqyards ? parseFloat(data.land_rate_sqyards) : null,
      land_rate_lakhs: data.land_rate_lakhs ? parseFloat(data.land_rate_lakhs) : null,
      this_week_price: data.this_week_price ? parseFloat(data.this_week_price) : null,
      next_week_price: data.next_week_price ? parseFloat(data.next_week_price) : null,
      plc_charges_per_sqft: data.plc_charges_per_sqft ? parseFloat(data.plc_charges_per_sqft) : null,
      frc_charges_per_sqft: data.frc_charges_per_sqft ? parseFloat(data.frc_charges_per_sqft) : null,
      private_terrace: data.private_terrace ? parseFloat(data.private_terrace) : 0,
      car_park_charges: data.car_park_charges ? parseFloat(data.car_park_charges) : 0,
      infra_charges: data.infra_charges ? parseFloat(data.infra_charges) : 0,
      other_charges: data.other_charges ? parseFloat(data.other_charges) : 0,
      any_other_charges: data.any_other_charges ? parseFloat(data.any_other_charges) : 0,
      modification: data.modification ? parseFloat(data.modification) : 0,
      uds: data.uds ? parseFloat(data.uds) : null,
      no_of_car_park: data.no_of_car_park ? parseInt(data.no_of_car_park) : null,
      unit_area: data.unit_area ? parseFloat(data.unit_area) : null,
      balcony_area: data.balcony_area ? parseFloat(data.balcony_area) : null,
      total_area: data.total_area ? parseFloat(data.total_area) : null,
      dld_charges: data.dld_charges ? parseFloat(data.dld_charges) : null,
      admin_fee: data.admin_fee ? parseFloat(data.admin_fee) : null,
    };
    await onSubmit(cleaned);
  });

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>

      {/* Basic Info */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-brand-900 border-b border-brand-100 pb-1">Basic Property Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Input label="Unit No *" placeholder="M402" error={errors.unit_no?.message as string} {...register('unit_no', { required: 'Unit No is required' })} />
          <Select label="Status" options={STATUSES.map(s => ({ value: s, label: s }))} {...register('status')} />
          <Input label="BHK" placeholder="2BHK" {...register('bhk')} />
          <Input label="Floor" type="number" {...register('floor')} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Select label="Facing" options={FACINGS.map(f => ({ value: f, label: f }))} {...register('facing')} />
          <Select label="Unit Type" options={UNIT_TYPES.map(t => ({ value: t, label: t }))} {...register('unit_type')} />
          <Input label="Block" placeholder="Block A" {...register('block')} />
          <Input label="Phase" placeholder="Phase 1" {...register('phase')} />
        </div>
      </section>

      {/* Land & Area Details */}
      <section className="space-y-3 bg-brand-50/50 p-4 rounded-xl border border-brand-100">
        <h3 className="text-sm font-bold text-brand-800">Area & Land Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input label="Carpet Area (sqft)" type="number" step="0.01" {...register('carpet_area')} />
          <Input label="SBA (sqft)" type="number" step="0.01" {...register('super_builtup_area')} />
          <Input label="Land Area (SQFT)" type="number" step="0.01" {...register('land_area_sqft')} />
          <Input label="Land Rate / SQFT" type="number" step="0.01" {...register('land_rate_sqft')} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input label="Land Area (SQ.YDS)" type="number" step="0.01" {...register('land_area_sqyards')} />
          <Input label="Land Rate / SQ.YDS" type="number" step="0.01" {...register('land_rate_sqyards')} />
          <Input label="Land Rate (Lakhs)" type="number" step="0.01" {...register('land_rate_lakhs')} />
          <Input label="UDS (sqft)" type="number" step="0.01" {...register('uds')} />
        </div>
      </section>

      {/* Dubai Area Fields */}
      <section className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
        <h3 className="text-sm font-bold text-amber-800">Dubai Area & Charges</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Input label="Unit Area (sqft)" type="number" step="0.01" {...register('unit_area')} />
          <Input label="Balcony Area (sqft)" type="number" step="0.01" {...register('balcony_area')} />
          <Input label="Total Area (sqft)" type="number" step="0.01" {...register('total_area')} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
          <Input label="DLD Charges (AED)" type="number" step="0.01" {...register('dld_charges')} />
          <Input label="Admin Fee (AED)" type="number" step="0.01" {...register('admin_fee')} />
        </div>
      </section>

      {/* Pricing Information */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-brand-900 border-b border-brand-100 pb-1">Pricing & Charges (In Lakhs)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input label="This Week Price (L)*" type="number" step="0.01" {...register('this_week_price')} />
          <Input label="Next Week Price (L)" type="number" step="0.01" {...register('next_week_price')} />
          <Input label="Car Park Charges (L)" type="number" step="0.01" {...register('car_park_charges')} />
          <Input label="No of Car Parks" type="number" {...register('no_of_car_park')} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Select label="Car Park Type" options={CAR_PARK_TYPES.map(c => ({ value: c, label: c }))} {...register('car_park_type')} />
          <Input label="PLC Charges/sqft" type="number" step="0.01" {...register('plc_charges_per_sqft')} />
          <Input label="FRC Charges/sqft" type="number" step="0.01" {...register('frc_charges_per_sqft')} />
          <Input label="Terrace Area (sqft)" type="number" step="0.01" {...register('private_terrace')} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input label="Infra Charges (L)" type="number" step="0.01" {...register('infra_charges')} />
          <Input label="Other Charges (L)" type="number" step="0.01" {...register('other_charges')} />
          <Input label="Any Other Charges (L)" type="number" step="0.01" {...register('any_other_charges')} />
          <Input label="Modification (L)" type="number" step="0.01" {...register('modification')} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Any Other Charges (Remarks)" placeholder="e.g. Corpus Fund, Special Charges..." {...register('any_other_charges_remarks')} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input label="PLC Reason" placeholder="Corner Unit" {...register('plc_reason')} />
          <Input label="OTP" placeholder="One Time Payment" {...register('otp')} />
          <Input label="Blocking Status" {...register('blocking_status')} />
          <Input label="Image URL" className="col-span-2" {...register('image_url')} />
        </div>
      </section>

      {/* Live Calculation Preview */}
      {(tPrice > 0) && (
        <div className="bg-brand-900 rounded-xl p-4 text-white shadow-lg border border-brand-700">
          <h4 className="text-[10px] font-black text-brand-300 uppercase tracking-widest mb-3 text-center">
            Automatic Price Calculation Preview
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            {[
              {
                label: 'THIS WEEK PRICE INCL CAR PARK', value: calc.inclCP
              },
              { label: 'Next WEEK PRICE INCL CAR PARK', value: calc.nInclCP },
              { label: 'Total Value', value: calc.total },
              { label: 'GST (5%)', value: calc.gst },
              { label: 'Grand Total', value: calc.grand },
              // { label: 'NW Grand', value: (parseFloat(calc.nInclCP) + parseFloat(calc.total) - parseFloat(calc.inclCP) + (parseFloat(calc.nInclCP) + parseFloat(calc.total) - parseFloat(calc.inclCP)) * 0.05).toFixed(2) },
            ].map(item => (
              <div key={item.label} className="bg-white/5 rounded-lg p-2 border border-white/5">
                <div className="text-[10px] text-white/50 mb-0.5 uppercase">{item.label}</div>
                <div className="font-display font-bold text-yellow-400 text-sm">₹{item.value}L</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-white/30 mt-3 text-center italic">Pricing auto-calculated based on provided lakhs values</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-brand-100">
        {onClose && (
          <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg border border-brand-200 text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors">
            Cancel
          </button>
        )}
        <Button type="submit" loading={loading} className="px-8 shadow-md">
          {initialData ? 'Update Unit Details' : 'Add Property Unit'}
        </Button>
      </div>
    </form>
  );
}
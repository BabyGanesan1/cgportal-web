'use client';
import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import MultiSelect from '../ui/MultiSelect';
import api from '../../lib/api';

interface PropertyFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
  onClose?: () => void;
}

const emptyVariant = () => ({ bhk: '', bhk_detail: '', min_price: '', max_price: '' });

export default function PropertyForm({ initialData, onSubmit, loading, onClose }: PropertyFormProps) {
  const [cities, setCities] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [bhkTypes, setBhkTypes] = useState<any[]>([]);
  const [bhkDetails, setBhkDetails] = useState<any[]>([]);
  const [servingLocationOptions, setServingLocationOptions] = useState<any[]>([]);
  const [possessionStatuses, setPossessionStatuses] = useState<any[]>([]);
  const [locationsLoaded, setLocationsLoaded] = useState(false);

  const isEdit = !!initialData;

  const { register, handleSubmit, watch, setValue, reset, control, formState: { errors } } = useForm({
    defaultValues: {
      city_id: '', location_id: '', project_name: '',
      handing_over_date: '', possession_status: '',
      rera_registration_no: '', serving_locations: [] as string[], image_url: '',
      bhk_variants: [emptyVariant()],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'bhk_variants' });
  const cityId = watch('city_id');

  // Load master data
  useEffect(() => {
    api.get('/masters/cities?active=true&limit=200').then(r => setCities(r.data.data || [])).catch(() => { });
    api.get('/masters/bhk-types?active=true&limit=200').then(r => setBhkTypes(r.data.data || [])).catch(() => { });
    api.get('/masters/bhk-details?active=true&limit=200').then(r => setBhkDetails(r.data.data || [])).catch(() => { });
    api.get('/masters/serving-locations?active=true&limit=500').then(r => setServingLocationOptions(r.data.data || [])).catch(() => { });
    api.get('/masters/possession-statuses?active=true&limit=200').then(r => setPossessionStatuses(r.data.data || [])).catch(() => { });
  }, []);

  // Load locations when city changes
  useEffect(() => {
    if (!cityId) { setLocations([]); setLocationsLoaded(false); return; }
    api.get(`/masters/locations?active=true&city_id=${cityId}&limit=200`)
      .then(r => { setLocations(r.data.data || []); setLocationsLoaded(true); })
      .catch(() => { setLocations([]); setLocationsLoaded(true); });
  }, [cityId]);

  // Restore city_id after cities loaded (edit mode)
  useEffect(() => {
    if (isEdit && cities.length > 0 && initialData?.city_id) {
      setValue('city_id', initialData.city_id.toString());
    }
  }, [cities, isEdit, initialData, setValue]);

  // Restore possession_status after options loaded (edit mode)
  useEffect(() => {
    if (isEdit && possessionStatuses.length > 0 && initialData?.possession_status) {
      setValue('possession_status', initialData.possession_status);
    }
  }, [possessionStatuses, isEdit, initialData, setValue]);

  // Restore BHK variants after bhkTypes loaded (edit mode)
  useEffect(() => {
    if (isEdit && bhkTypes.length > 0 && initialData?.bhk_variants?.length > 0) {
      setValue('bhk_variants', initialData.bhk_variants.map((v: any) => ({
        bhk: v.bhk || '',
        bhk_detail: v.bhk_detail || '',
        min_price: v.min_price || '',
        max_price: v.max_price || '',
      })));
    }
  }, [bhkTypes, isEdit, initialData, setValue]);

  // Restore location_id after locations loaded (edit mode)
  useEffect(() => {
    if (isEdit && locationsLoaded && initialData?.location_id) {
      setValue('location_id', initialData.location_id.toString());
    }
  }, [locationsLoaded, isEdit, initialData, setValue]);

  // Populate form on edit
  useEffect(() => {
    if (!initialData) return;
    const servingArr = initialData.serving_locations
      ? initialData.serving_locations.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
    // Map existing bhk_variants or empty slot
    const variants = (initialData.bhk_variants && initialData.bhk_variants.length > 0)
      ? initialData.bhk_variants.map((v: any) => ({
        bhk: v.bhk || '',
        bhk_detail: v.bhk_detail || '',
        min_price: v.min_price || '',
        max_price: v.max_price || '',
      }))
      : [emptyVariant()];

    reset({
      city_id: initialData.city_id?.toString() || '',
      location_id: '',
      project_name: initialData.project_name || '',
      handing_over_date: initialData.handing_over_date?.substring(0, 10) || '',
      possession_status: initialData.possession_status || '',
      rera_registration_no: initialData.rera_registration_no || '',
      serving_locations: servingArr,
      image_url: initialData.image_url || '',
      bhk_variants: variants,
    });
  }, [initialData, reset]);

  const bhkOptions = bhkTypes.length > 0 ? bhkTypes.map(b => b.name)
    : ['STUDIO', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '5 BHK', 'PENTHOUSE'];

  const bhkDetailOptions = bhkDetails.length > 0 ? bhkDetails.map(b => b.name)
    : ['1BHK+1T', '2BHK+2T', '2BHK+2T+STUDY', '3BHK+3T', '3BHK+3T+STUDY', '4BHK+4T'];

  const possessionOptions = possessionStatuses.length > 0 ? possessionStatuses.map(p => p.name)
    : ['Ready to Move', '0 to 6 Months', '6 to 12 Months', '12 to 18 Months',
      '18 to 24 Months', '24 to 30 Months', '24 to 36 Months'];

  const inp = (err?: boolean) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${err ? 'border-red-400' : 'border-brand-200'}`;

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit({
      city_id: data.city_id ? parseInt(data.city_id) : null,
      location_id: data.location_id ? parseInt(data.location_id) : null,
      project_name: data.project_name,
      handing_over_date: data.handing_over_date || null,
      possession_status: data.possession_status || null,
      rera_registration_no: data.rera_registration_no || null,
      serving_locations: Array.isArray(data.serving_locations) ? data.serving_locations.join(', ') : (data.serving_locations || null),
      image_url: data.image_url || null,
      bhk_variants: (data.bhk_variants || []).filter((v: any) => v.bhk),
    });
  });

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>

      {/* City & Location */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">City *</label>
          <select className={inp(!!errors.city_id)}
            {...register('city_id', {
              required: 'City is required',
              onChange: () => { setValue('location_id', ''); setLocationsLoaded(false); }
            })}>
            <option value="">Select City</option>
            {cities.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
          </select>
          {errors.city_id && <p className="text-red-500 text-xs mt-1">{errors.city_id.message as string}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">Location *</label>
          <select className={inp(!!errors.location_id)} {...register('location_id', { required: 'Location is required' })}>
            <option value="">Select Location</option>
            {locations.map(l => <option key={l.id} value={l.id.toString()}>{l.name}</option>)}
          </select>
          {errors.location_id && <p className="text-red-500 text-xs mt-1">{errors.location_id.message as string}</p>}
          {cityId && !locationsLoaded && <p className="text-xs text-brand-400 mt-1">Loading locations...</p>}
        </div>
      </div>

      {/* Project Name */}
      <div>
        <label className="block text-sm font-medium text-brand-700 mb-1">Project Name *</label>
        <input className={inp(!!errors.project_name)} placeholder="e.g. CASAMIA"
          {...register('project_name', { required: 'Project name is required' })} />
        {errors.project_name && <p className="text-red-500 text-xs mt-1">{errors.project_name.message as string}</p>}
      </div>

      {/* BHK Variants */}
      <div className="rounded-xl border border-brand-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-brand-50 border-b border-brand-200">
          <span className="text-sm font-semibold text-brand-700">BHK Variants</span>
          <button type="button" onClick={() => append(emptyVariant())}
            className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 px-2.5 py-1.5 rounded-lg hover:bg-white border border-brand-200 transition-colors bg-white">
            <Plus className="w-3.5 h-3.5" /> Add BHK
          </button>
        </div>
        <div className="divide-y divide-brand-100">
          {fields.map((field, idx) => (
            <div key={field.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Variant {idx + 1}</span>
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(idx)}
                    className="p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-brand-600 mb-1">BHK *</label>
                  <select className={inp()} {...register(`bhk_variants.${idx}.bhk`, { required: true })}>
                    <option value="">Select BHK</option>
                    {bhkOptions.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-600 mb-1">BHK Detail</label>
                  <select className={inp()} {...register(`bhk_variants.${idx}.bhk_detail`)}>
                    <option value="">Select Detail</option>
                    {bhkDetailOptions.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-600 mb-1">Min Price (Lakhs)</label>
                  <input type="number" step="0.01" min="0" placeholder="e.g. 46.92" className={inp()}
                    {...register(`bhk_variants.${idx}.min_price`)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-600 mb-1">Max Price (Lakhs)</label>
                  <input type="number" step="0.01" min="0" placeholder="e.g. 86.84" className={inp()}
                    {...register(`bhk_variants.${idx}.max_price`)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Handing Over & Possession */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">Handing Over Date</label>
          <input type="date" className={inp()} {...register('handing_over_date')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">Possession Status</label>
          <select className={inp()} {...register('possession_status')}>
            <option value="">Select Status</option>
            {possessionOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* RERA */}
      <div>
        <label className="block text-sm font-medium text-brand-700 mb-1">RERA Registration No</label>
        <input placeholder="e.g. TN/01/Building/0123/2024" className={inp()} {...register('rera_registration_no')} />
      </div>

      {/* Serving Locations */}
      <div>
        <MultiSelect label="Serving Locations" placeholder="Select serving locations..."
          options={servingLocationOptions.map(s => ({ value: s.name, label: s.name }))}
          value={watch('serving_locations') || []}
          onChange={val => setValue('serving_locations', val as string[], { shouldDirty: true })}
          error={errors.serving_locations?.message as string} />
      </div>

      {/* Image URL */}
      <div>
        <label className="block text-sm font-medium text-brand-700 mb-1">Image URL</label>
        <input placeholder="https://drive.google.com/..." className={inp()} {...register('image_url')} />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-2 border-t border-brand-100">
        {onClose && (
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg border border-brand-200 text-sm text-brand-600 hover:bg-brand-50 transition-colors">
            Cancel
          </button>
        )}
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Project' : 'Create Project'}
        </Button>
        

      </div>
    </form>
  );
}
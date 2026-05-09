'use client';
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface MasterFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
  fields?: { 
    name: string; 
    label: string; 
    type?: string; 
    required?: boolean; 
    options?: { value: string | number, label: string }[];
    placeholder?: string;
    span?: number; // Tailwind col-span, default is 1
    pattern?: { value: RegExp, message: string };
  }[];
  onClose?: () => void;
}

const defaultFields = [{ name: 'name', label: 'Name', type: 'text', required: true }];

export default function MasterForm({ initialData, onSubmit, loading, fields = defaultFields, onClose }: MasterFormProps) {
  const { register, handleSubmit, reset, control, formState: { errors }, getValues } = useForm({ defaultValues: initialData || {} });

  useEffect(() => {
    reset(initialData || {});
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {fields.map(field => {
          const gridClass = field.span === 2 ? 'md:col-span-2' : 'md:col-span-1';
          const validation = {
            required: field.required ? `${field.label} is required` : false,
            pattern: field.pattern
          };

          return (
            <div key={field.name} className={gridClass}>
              {field.type === 'select' ? (
                <Controller
                  name={field.name}
                  control={control}
                  rules={validation}
                  defaultValue={initialData?.[field.name] ?? ''}
                  render={({ field: controllerField }) => (
                    <Select
                      label={field.label}
                      options={field.options || []}
                      placeholder={field.placeholder}
                      error={errors[field.name]?.message as string}
                      value={controllerField.value ?? initialData?.[field.name] ?? ''}
                      onChange={(val: any) => controllerField.onChange(val)}
                    />
                  )}
                />
              ) : (
                <Input
                  label={field.label}
                  type={field.type || 'text'}
                  error={errors[field.name]?.message as string}
                  {...register(field.name, validation)}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-3 pt-6 border-t border-brand-100">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-brand-200 text-sm text-brand-600 hover:bg-brand-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <Button type="submit" loading={loading}>
          {initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

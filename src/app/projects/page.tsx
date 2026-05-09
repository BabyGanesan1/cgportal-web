'use client';
import MasterPageTemplate from '../../components/tables/MasterPageTemplate';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProjectsPage() {
  return (
    <MasterPageTemplate
      title="Projects"
      subtitle="Manage projects & unit details"
      endpoint="/projects"
      columns={[
        { key: 'name', label: 'Project Name' },
        {
          key: 'product_type',
          label: 'Product Type',
          render: (row, onRefresh) => (
            <div className="flex items-center gap-1 bg-brand-50 p-1 rounded-xl border border-brand-100 w-fit">
              {['Apartment', 'Villa'].map(type => (
                <button
                  key={type}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (row.product_type === type) return;
                    try {
                      await api.patch(`/projects/${row.id}/product-type`, { product_type: type });
                      toast.success(`${type} selected`);
                      if (onRefresh) onRefresh();
                    } catch (err) {
                      toast.error('Failed to update');
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${row.product_type === type
                    ? (type === 'Villa' ? 'bg-purple-600 text-white shadow-sm' : 'bg-blue-600 text-white shadow-sm')
                    : 'text-brand-400 hover:text-brand-600'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )
        }
      ]}
      exportColumns={[
        { key: 'name', label: 'Project Name' },
        { key: 'product_type', label: 'Product Type' },
      ]}
      formFields={[
        { name: 'name', label: 'Project Name', required: true, span: 2 },
        {
          name: 'product_type',
          label: 'Product Type',
          type: 'select',
          options: [
            { value: 'Apartment', label: 'Apartment' },
            { value: 'Villa', label: 'Villa' }
          ],
          required: true
        }
      ]}
      sampleHeaders={['PROJECT NAME', 'PRODUCT TYPE']}
      sampleRows={[
        ['CASAMIA', 'Apartment'],
        ['ALPINE', 'Villa'],
        ['ELITE', 'Apartment']
      ]}
      showExport
    />
  );
}
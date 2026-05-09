import MasterPageTemplate from '../../../components/tables/MasterPageTemplate';
export default function BhkTypesPage() {
  return (
    <MasterPageTemplate
      title="BHK Types" subtitle="Manage BHK type master data"
      endpoint="/masters/bhk-types"
      columns={[{ key: 'name', label: 'BHK Type' }]}
      formFields={[{ name: 'name', label: 'BHK Type', required: true }]}
      sampleHeaders={['name']}
      sampleRows={[['STUDIO'], ['1 BHK'], ['2 BHK'], ['3 BHK'], ['4 BHK'], ['PENTHOUSE']]}
    />
  );
}

import MasterPageTemplate from '../../../components/tables/MasterPageTemplate';
export default function CitiesPage() {
  return (
    <MasterPageTemplate
      title="Cities" subtitle="Manage city master data"
      endpoint="/masters/cities"
      columns={[{ key: 'name', label: 'City Name' }]}
      formFields={[{ name: 'name', label: 'City Name', required: true }]}
      sampleHeaders={['name']}
      sampleRows={[['Chennai'], ['Bangalore'], ['Hyderabad'], ['Mumbai']]}
    />
  );
}

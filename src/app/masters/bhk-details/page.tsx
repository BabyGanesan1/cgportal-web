import MasterPageTemplate from '../../../components/tables/MasterPageTemplate';
export default function BhkDetailsPage() {
  return (
    <MasterPageTemplate
      title="BHK Details" subtitle="Manage BHK detail master data"
      endpoint="/masters/bhk-details"
      columns={[{ key: 'name', label: 'BHK Detail' }]}
      formFields={[{ name: 'name', label: 'BHK Detail', required: true }]}
      sampleHeaders={['name']}
      sampleRows={[['1BHK+1T'], ['2BHK+2T'], ['2BHK+2T+STUDY'], ['3BHK+3T'], ['3BHK+3T+STUDY']]}
    />
  );
}

import MasterPageTemplate from '../../../components/tables/MasterPageTemplate';
export default function UnitStatusesPage() {
  return (
    <MasterPageTemplate
      title="Unit Statuses" subtitle="Manage unit status master data"
      endpoint="/masters/unit-statuses"
      columns={[{ key: 'name', label: 'Unit Status' }]}
      formFields={[{ name: 'name', label: 'Unit Status', required: true }]}
      sampleHeaders={['name']}
      sampleRows={[['Vacant'], ['Sold'], ['Blocked'], ['Investor'], ['HSBC-Sold']]}
    />
  );
}

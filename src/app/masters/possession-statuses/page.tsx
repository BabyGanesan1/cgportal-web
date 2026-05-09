import MasterPageTemplate from '../../../components/tables/MasterPageTemplate';
export default function PossessionStatusesPage() {
  return (
    <MasterPageTemplate
      title="Possession Statuses" subtitle="Manage possession status master data"
      endpoint="/masters/possession-statuses"
      columns={[{ key: 'name', label: 'Possession Status' }]}
      sampleHeaders={['name']}
      sampleRows={[['Ready to Move'], ['0 to 6 Months'], ['6 to 12 Months'], ['12 to 18 Months'], ['24 to 36 Months']]}
    />
  );
}

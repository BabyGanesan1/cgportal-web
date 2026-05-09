import MasterPageTemplate from '../../../components/tables/MasterPageTemplate';
export default function FacingPage() {
  return (
    <MasterPageTemplate
      title="Facing" subtitle="Manage facing direction master data"
      endpoint="/masters/facing"
      columns={[{ key: 'name', label: 'Facing Direction' }]}
      sampleHeaders={['name']}
      sampleRows={[['NORTH'], ['SOUTH'], ['EAST'], ['WEST'], ['NORTH-EAST'], ['NORTH-WEST'], ['SOUTH-EAST'], ['SOUTH-WEST']]}
    />
  );
}

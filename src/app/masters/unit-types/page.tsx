import MasterPageTemplate from '../../../components/tables/MasterPageTemplate';
export default function UnitTypesPage() {
  return (
    <MasterPageTemplate
      title="Unit Types" subtitle="Manage unit type master data"
      endpoint="/masters/unit-types"
      columns={[{ key: 'name', label: 'Unit Type' }]}
      sampleHeaders={['name']}
      sampleRows={[['ELITE'], ['PREMIUM'], ['CLASSIC'], ['LUXURY']]}
    />
  );
}

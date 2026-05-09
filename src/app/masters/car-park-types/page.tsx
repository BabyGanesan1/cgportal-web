import MasterPageTemplate from '../../../components/tables/MasterPageTemplate';
export default function CarParkTypesPage() {
  return (
    <MasterPageTemplate
      title="Car Park Types" subtitle="Manage car park type master data"
      endpoint="/masters/car-park-types"
      columns={[{ key: 'name', label: 'Car Park Type' }]}
      formFields={[{ name: 'name', label: 'Car Park Type', required: true }]}
      sampleHeaders={['name']}
      sampleRows={[['1OCP'], ['2OCP'], ['1CCP'], ['2CCP'], ['1OCP+1CCP']]}
    />
  );
}

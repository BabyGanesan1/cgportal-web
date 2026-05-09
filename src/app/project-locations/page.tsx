'use client';
import MasterPageTemplate from '../../components/tables/MasterPageTemplate';

export default function ProjectLocationsPage() {
  return (
    <MasterPageTemplate
      title="Project Locations"
      subtitle="Manage project wise location updates"
      endpoint="/project-locations"
      columns={[
        { key: 'project_name', label: 'Project' },
        { key: 'city', label: 'City' },
        { key: 'location', label: 'Location' },
        { key: 'serving_locations', label: 'Serving Locations' }
      ]}
      showProjectFilter
      formFields={[
        { name: 'project_id', label: 'Select Project', type: 'select', required: true, span: 2 },
        { name: 'city', label: 'City', required: true, span: 1 },
        { name: 'location', label: 'Location', required: true, span: 1 },
        { name: 'serving_locations', label: 'Serving Locations', span: 2 },
        { name: 'image_url', label: 'Image URL', span: 2 }
      ]}
      sampleHeaders={['project_name', 'city', 'location', 'serving_locations', 'image_url']}
      sampleRows={[['CASAMIA', 'CHENNAI', 'Pallavaram', 'Guindy, Velachery', '']]}
      showExport
    />
  );
}
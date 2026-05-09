'use client';
import MasterPageTemplate from '../../components/tables/MasterPageTemplate';

export default function HandoverDetailsPage() {
  return (
    <MasterPageTemplate
      title="Handover Details"
      subtitle="Manage project wise handover dates & bank info"
      endpoint="/handover-details"
      columns={[
        { key: 'project_name', label: 'Project' },
        { key: 'block', label: 'Block' },
        { key: 'rera_expired_date', label: 'RERA Expired', render: (row) => row.rera_expired_date ? new Date(row.rera_expired_date).toLocaleDateString() : '-' },
        { key: 'final_spirit_date', label: 'Final Spirit', render: (row) => row.final_spirit_date ? new Date(row.final_spirit_date).toLocaleDateString() : '-' },
        { key: 'possession_status', label: 'Possession Status' }
      ]}
      showProjectFilter
      exportColumns={[
        { key: 'project_name', label: 'Project' },
        { key: 'block', label: 'Block' },
        { key: 'rera_no', label: 'RERA No' },
        { key: 'handing_over_date', label: 'Handing Over Date', formatDate: true },
        { key: 'rera_expired_date', label: 'RERA Expired Date', formatDate: true },
        { key: 'final_spirit_date', label: 'Final Spirit Date', formatDate: true },
        { key: 'possession_status', label: 'Possession Status' },
        { key: 'bank_name', label: 'Bank Name' },
        { key: 'account_no', label: 'Account No' },
        { key: 'ifsc', label: 'IFSC' },
        { key: 'cheque_favoring', label: 'Cheque Favoring' },
        { key: 'branch', label: 'Branch' },
      ]}
      formFields={[
        { name: 'project_id', label: 'Select Project', type: 'select', required: true, span: 2 },
        { name: 'block', label: 'Block', span: 1 },
        { name: 'rera_no', label: 'RERA No', span: 1 },
        { name: 'handing_over_date', label: 'Handing Over Date', type: 'date', span: 1 },
        { name: 'rera_expired_date', label: 'RERA Expired Date', type: 'date', span: 1 },
        { name: 'final_spirit_date', label: 'Final Spirit Date', type: 'date', span: 1 },
        { name: 'bank_name', label: 'Bank Name', required: true, span: 1 },
        { name: 'account_no', label: 'Account No', required: true, span: 2 },
        { name: 'ifsc', label: 'IFSC', required: true, span: 1 },
        { name: 'cheque_favoring', label: 'Cheque Favoring', span: 1 },
        { name: 'branch', label: 'Branch', span: 2 }
      ]}
      sampleHeaders={['project_name', 'block', 'rera_no', 'rera_expired_date', 'final_spirit_date', 'bank_name', 'account_no', 'ifsc']}
      sampleRows={[['CASAMIA', 'Block A', 'TN/01/123', '2027-12-29', '2027-12-29', 'HDFC', '501001', 'HDFC0001']]}
      modalSize="2xl"
      showExport
    />
  );
}
const STATUS_STYLES = {
  // Item statuses
  active: 'bg-blue-100 text-blue-700',
  claimed: 'bg-yellow-100 text-yellow-700',
  returned: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
  // Item types
  lost: 'bg-red-100 text-red-700',
  found: 'bg-green-100 text-green-700',
  // Claim statuses
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  active: 'Active',
  claimed: 'Claimed',
  returned: 'Returned',
  closed: 'Closed',
  lost: 'Lost',
  found: 'Found',
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

const StatusBadge = ({ status, className = '' }) => {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
  const label = STATUS_LABELS[status] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${style} ${className}`}>
      {label}
    </span>
  );
};

export default StatusBadge;

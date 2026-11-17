import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { getUserClaims, getReceivedClaims, updateClaim, updateItem, createNotification, getItem } from '../firebase/firestoreService';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, formatRelativeTime } from '../utils/formatters';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'submitted', label: 'Claims I Submitted' },
  { key: 'received', label: 'Claims on My Items' },
];

const Claims = () => {
  const { currentUser, userProfile } = useAuth();
  const [tab, setTab] = useState('submitted');
  const [submittedClaims, setSubmittedClaims] = useState([]);
  const [receivedClaims, setReceivedClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [submitted, received] = await Promise.all([
        getUserClaims(currentUser.uid),
        getReceivedClaims(currentUser.uid),
      ]);
      setSubmittedClaims(submitted);
      setReceivedClaims(received);
    } catch {
      toast.error('Failed to load claims.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [currentUser]);

  const handleClaimAction = async (claim, newStatus) => {
    setActionLoading(claim.id);
    try {
      await updateClaim(claim.id, { status: newStatus });

      // If accepted, mark item as claimed
      if (newStatus === 'accepted') {
        await updateItem(claim.itemId, { status: 'claimed' });
        // Notify claimant
        await createNotification(claim.claimantId, {
          title: 'Claim Accepted!',
          message: `Your claim has been accepted. Please coordinate with the reporter to retrieve your item.`,
          type: 'claim',
        });
      } else if (newStatus === 'rejected') {
        await createNotification(claim.claimantId, {
          title: 'Claim Rejected',
          message: `Your claim was not verified. If you believe this is your item, contact campus admin.`,
          type: 'claim',
        });
      }

      setReceivedClaims(prev => prev.map(c => c.id === claim.id ? { ...c, status: newStatus } : c));
      toast.success(`Claim ${newStatus}!`);
    } catch {
      toast.error('Failed to update claim status.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingSpinner fullPage text="Loading claims..." />;

  const claims = tab === 'submitted' ? submittedClaims : receivedClaims;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Claims</h1>
        <p className="page-subtitle">Manage ownership claims for items</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-gray-400">
              ({(t.key === 'submitted' ? submittedClaims : receivedClaims).length})
            </span>
          </button>
        ))}
      </div>

      {claims.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={tab === 'submitted' ? "No claims submitted" : "No claims received"}
          description={tab === 'submitted'
            ? "Browse items and submit a claim if you find your lost belonging."
            : "When someone claims ownership of your reported items, they will appear here."
          }
          action={tab === 'submitted' && <Link to="/search" className="btn-primary text-sm">Browse Items</Link>}
        />
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div key={claim.id} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={claim.status} />
                    <span className="text-xs text-gray-400">{formatRelativeTime(claim.createdAt)}</span>
                  </div>

                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Item ID: <Link to={`/item/${claim.itemId}`} className="text-blue-600 hover:underline">{claim.itemId}</Link>
                  </p>

                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Claim Message:</p>
                    <p className="text-sm text-gray-700">{claim.message}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link to={`/item/${claim.itemId}`} className="btn-secondary text-xs">
                    <Eye className="w-3.5 h-3.5" /> View Item
                  </Link>

                  {/* Received tab actions */}
                  {tab === 'received' && claim.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleClaimAction(claim, 'accepted')}
                        disabled={actionLoading === claim.id}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {actionLoading === claim.id ? 'Processing...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleClaimAction(claim, 'rejected')}
                        disabled={actionLoading === claim.id}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {actionLoading === claim.id ? 'Processing...' : 'Reject'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Claims;

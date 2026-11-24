import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Calendar, Tag, Package, Info, ArrowLeft,
  User, MessageSquare, CheckCircle, AlertCircle, Loader
} from 'lucide-react';
import { getItem, createClaim, getItemClaims, createNotification } from '../firebase/firestoreService';
import { useAuth } from '../context/AuthContext';
import { findPotentialMatches } from '../services/matchingService';
import { getAllItems } from '../firebase/firestoreService';
import StatusBadge from '../components/StatusBadge';
import ItemCard from '../components/ItemCard';
import ItemImage from '../components/ItemImage';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, formatRelativeTime } from '../utils/formatters';
import { validateClaimForm } from '../utils/validators';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22500%22 viewBox=%220 0 800 500%22%3E%3Crect width=%22800%22 height=%22500%22 fill=%22%23f3f4f6%22/%3E%3Ctext x=%22400%22 y=%22260%22 font-family=%22sans-serif%22 font-size=%2224%22 fill=%22%239ca3af%22 text-anchor=%22middle%22%3ENo Image Available%3C/text%3E%3C/svg%3E';

// ✅ FIX: DetailRow defined outside component to prevent remounting
const DetailRow = ({ icon: Icon, label, value }) => (
  value ? (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm text-gray-800 font-medium">{value}</p>
      </div>
    </div>
  ) : null
);

const ItemDetails = () => {
  const { id } = useParams();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [existingClaim, setExistingClaim] = useState(null);
  const [claimModal, setClaimModal] = useState(false);
  const [claimMsg, setClaimMsg] = useState('');
  const [claimError, setClaimError] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getItem(id);
        if (!data) { navigate('/not-found'); return; }
        setItem(data);

        const [allItems, claims] = await Promise.all([
          getAllItems(),
          currentUser ? getItemClaims(id) : Promise.resolve([]),
        ]);

        setMatches(findPotentialMatches(data, allItems));

        if (currentUser) {
          const mine = claims.find(c => c.claimantId === currentUser.uid);
          setExistingClaim(mine || null);
        }
      } catch (e) {
        console.error('ItemDetails load error:', e);
        toast.error('Failed to load item details.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, currentUser, navigate]);

  const handleClaim = async () => {
    const err = validateClaimForm(claimMsg);
    if (err) { setClaimError(err); return; }
    const ownerId = item.userId || item.ownerId || item.uid;
    if (!ownerId) {
      toast.error('Cannot identify item owner. Please try again.');
      return;
    }
    setClaimLoading(true);
    try {
      await createClaim({
        itemId: id,
        itemTitle: item.title,
        claimantId: currentUser.uid,
        claimantName: userProfile?.name || 'Someone',
        ownerId: ownerId,
        message: claimMsg.trim(),
      });

      // ✅ Notify the item owner with itemId & itemTitle for linking
      // Guard: don't notify yourself
      if (ownerId && ownerId !== currentUser.uid) {
        await createNotification(ownerId, {
          title: 'New Claim on Your Item',
          message: `${userProfile?.name || 'Someone'} has submitted a claim on your item: "${item.title}". Review it in your Claims section.`,
          type: 'claim',
          itemId: id,
          reportId: id,
          itemTitle: item.title,
          senderName: userProfile?.name || 'A user',
          senderId: currentUser.uid,
        });
      }

      toast.success('Claim submitted successfully! The reporter has been notified.');
      setClaimModal(false);
      setClaimMsg('');
      setExistingClaim({ status: 'pending' });
    } catch (err) {
      console.error('Claim submit error:', err);
      toast.error('Failed to submit claim. Please try again.');
    } finally {
      setClaimLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage text="Loading item details..." />;
  if (!item) return null;

  const isOwner = currentUser?.uid === (item.userId || item.ownerId || item.uid);
  const canClaim = currentUser && !isOwner && item.status === 'active';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Image + Quick Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
            <ItemImage
              src={item.imageUrl || item.image}
              alt={item.title}
              className="w-full h-72 sm:h-80"
              imgClassName="p-2"
              fit="contain"
            />
          </div>

          <div className="card p-4 space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={item.type} />
              <StatusBadge status={item.status} />
            </div>
            <DetailRow icon={MapPin} label="Location" value={item.location} />
            <DetailRow icon={Calendar} label="Date" value={formatDate(item.date)} />
            <DetailRow icon={Tag} label="Category" value={item.category} />
            <DetailRow icon={Package} label="Brand" value={item.brand} />
            <DetailRow icon={Info} label="Color" value={item.color} />
          </div>

          {/* Claim / Owner Actions */}
          <div className="card p-4">
            {isOwner ? (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
                <CheckCircle className="w-4 h-4" /> This is your report.
                <Link to="/my-reports" className="underline ml-auto">Manage</Link>
              </div>
            ) : existingClaim ? (
              <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-yellow-50 text-yellow-700">
                <AlertCircle className="w-4 h-4" />
                Claim submitted — Status: <strong>{existingClaim.status}</strong>
              </div>
            ) : canClaim ? (
              <button
                onClick={() => setClaimModal(true)}
                className="btn-primary w-full"
              >
                <MessageSquare className="w-4 h-4" /> I'm the Owner / Submit Claim
              </button>
            ) : !currentUser ? (
              <Link to="/login" className="btn-primary w-full justify-center">
                Login to Claim This Item
              </Link>
            ) : (
              <p className="text-sm text-gray-400 text-center">This item is {item.status}.</p>
            )}
          </div>
        </div>

        {/* Right: Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">{item.category}</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h1>
            <p className="text-xs text-gray-400 mb-4">Reported {formatRelativeTime(item.createdAt)}</p>

            <h2 className="font-semibold text-gray-700 mb-2">Description</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{item.description}</p>

            {item.additionalInfo && (
              <>
                <h2 className="font-semibold text-gray-700 mt-4 mb-2">Additional Information</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{item.additionalInfo}</p>
              </>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span>Reported by a campus community member</span>
              </div>
              <p className="text-xs text-gray-400 mt-1 ml-9">
                Contact information is kept private for safety.
              </p>
            </div>
          </div>

          {/* Potential Matches */}
          {matches.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <h2 className="font-semibold text-gray-900">Potential Matches</h2>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                  Rule-based suggestions
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                These items may be related based on category, location, and date. Not guaranteed matches.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {matches.map(m => <ItemCard key={m.id} item={m} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Claim Modal */}
      <Modal isOpen={claimModal} onClose={() => { setClaimModal(false); setClaimMsg(''); setClaimError(''); }} title="Submit a Claim">
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Important:</strong> Please describe why you believe this is your item. Include identifying details (colour, brand, contents, etc.) to help the reporter verify your claim.
          </p>
        </div>
        <div className="form-group">
          <label htmlFor="claim-msg" className="form-label">Your Message <span className="text-red-500">*</span></label>
          <textarea
            id="claim-msg"
            rows={5}
            placeholder="e.g. This is my blue wallet. It contains my student ID card (No. 2021BCA045), two bank cards, and ₹500 cash..."
            value={claimMsg}
            onChange={e => { setClaimMsg(e.target.value); setClaimError(''); }}
            className={`input-field resize-none ${claimError ? 'input-error' : ''}`}
            maxLength={500}
          />
          {claimError && <p className="form-error">{claimError}</p>}
          <p className="form-hint">{claimMsg.length}/500 characters</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setClaimModal(false); setClaimMsg(''); setClaimError(''); }} className="btn-secondary flex-1" disabled={claimLoading}>Cancel</button>
          <button onClick={handleClaim} className="btn-primary flex-1" disabled={claimLoading}>
            {claimLoading ? <><Loader className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Claim'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ItemDetails;

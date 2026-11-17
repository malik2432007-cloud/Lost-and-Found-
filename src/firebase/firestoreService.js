import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  onSnapshot,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from './config';

// ─── USER PROFILES ───────────────────────────────────────────────────────────
export const createUserProfile = async (uid, data) => {
  await setDoc(doc(db, 'users', uid), {
    uid,
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    role: 'user',
    createdAt: serverTimestamp(),
  });
};

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateUserProfile = async (uid, data) => {
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() });
};

export const getAllUsers = async () => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const setUserRole = async (uid, role) => {
  await updateDoc(doc(db, 'users', uid), { role });
};

// ─── ITEMS ───────────────────────────────────────────────────────────────────
export const createItem = async (data) => {
  const ref = await addDoc(collection(db, 'items'), {
    ...data,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getItem = async (itemId) => {
  const snap = await getDoc(doc(db, 'items', itemId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateItem = async (itemId, data) => {
  await updateDoc(doc(db, 'items', itemId), { ...data, updatedAt: serverTimestamp() });
};

export const deleteItem = async (itemId) => {
  await deleteDoc(doc(db, 'items', itemId));
};

export const getAllItems = async (filters = {}) => {
  let q = collection(db, 'items');
  const constraints = [];
  if (filters.type) constraints.push(where('type', '==', filters.type));
  if (filters.category) constraints.push(where('category', '==', filters.category));
  if (filters.status) constraints.push(where('status', '==', filters.status));
  constraints.push(orderBy('createdAt', 'desc'));
  q = query(q, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getUserItems = async (userId) => {
  const q = query(
    collection(db, 'items'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getRecentItems = async (n = 6) => {
  const q = query(
    collection(db, 'items'),
    orderBy('createdAt', 'desc'),
    limit(n)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ─── CLAIMS ──────────────────────────────────────────────────────────────────
export const createClaim = async (data) => {
  const ref = await addDoc(collection(db, 'claims'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getItemClaims = async (itemId) => {
  const q = query(
    collection(db, 'claims'),
    where('itemId', '==', itemId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getUserClaims = async (userId) => {
  const q = query(
    collection(db, 'claims'),
    where('claimantId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getReceivedClaims = async (ownerId) => {
  const q = query(
    collection(db, 'claims'),
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getAllClaims = async () => {
  const q = query(collection(db, 'claims'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateClaim = async (claimId, data) => {
  await updateDoc(doc(db, 'claims', claimId), { ...data, updatedAt: serverTimestamp() });
};

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export const createNotification = async (userId, { title, message, type = 'info' }) => {
  await addDoc(collection(db, 'notifications'), {
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: serverTimestamp(),
  });
};

export const subscribeToNotifications = (userId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const markNotificationRead = async (notifId) => {
  await updateDoc(doc(db, 'notifications', notifId), { read: true });
};

export const markAllNotificationsRead = async (userId) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  const snap = await getDocs(q);
  const updates = snap.docs.map(d => updateDoc(d.ref, { read: true }));
  await Promise.all(updates);
};

// ─── STATS (Admin) ───────────────────────────────────────────────────────────
export const getStats = async () => {
  const [usersSnap, lostSnap, foundSnap, activeSnap, claimedSnap, returnedSnap] = await Promise.all([
    getCountFromServer(collection(db, 'users')),
    getCountFromServer(query(collection(db, 'items'), where('type', '==', 'lost'))),
    getCountFromServer(query(collection(db, 'items'), where('type', '==', 'found'))),
    getCountFromServer(query(collection(db, 'items'), where('status', '==', 'active'))),
    getCountFromServer(query(collection(db, 'items'), where('status', '==', 'claimed'))),
    getCountFromServer(query(collection(db, 'items'), where('status', '==', 'returned'))),
  ]);
  return {
    totalUsers: usersSnap.data().count,
    totalLost: lostSnap.data().count,
    totalFound: foundSnap.data().count,
    activeItems: activeSnap.data().count,
    claimedItems: claimedSnap.data().count,
    returnedItems: returnedSnap.data().count,
  };
};

export const getUserStats = async (userId) => {
  const [allSnap, lostSnap, foundSnap, returnedSnap] = await Promise.all([
    getCountFromServer(query(collection(db, 'items'), where('userId', '==', userId))),
    getCountFromServer(query(collection(db, 'items'), where('userId', '==', userId), where('type', '==', 'lost'))),
    getCountFromServer(query(collection(db, 'items'), where('userId', '==', userId), where('type', '==', 'found'))),
    getCountFromServer(query(collection(db, 'items'), where('userId', '==', userId), where('status', '==', 'returned'))),
  ]);
  return {
    total: allSnap.data().count,
    lost: lostSnap.data().count,
    found: foundSnap.data().count,
    returned: returnedSnap.data().count,
  };
};

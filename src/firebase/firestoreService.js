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
  getDocs,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './config.js';

// ─── HELPER: Timestamp extraction for safe in-memory sorting ─────────────────
const getMillis = (item) => {
  if (!item) return 0;
  if (item.createdAt?.toMillis) return item.createdAt.toMillis();
  if (item.createdAt?.seconds) return item.createdAt.seconds * 1000;
  if (item.date) {
    const d = new Date(item.date).getTime();
    if (!isNaN(d)) return d;
  }
  return 0;
};

// ─── USER PROFILES ───────────────────────────────────────────────────────────
export const createUserProfile = async (uid, data) => {
  await setDoc(doc(db, 'users', uid), {
    uid,
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    role: 'user',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getUserProfile = async (uid) => {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateUserProfile = async (uid, data) => {
  if (!uid) throw new Error('User UID is required');
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      role: 'user',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...data,
    });
  } else {
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  }
};

export const getAllUsers = async () => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const setUserRole = async (uid, role) => {
  await updateDoc(doc(db, 'users', uid), { role, updatedAt: serverTimestamp() });
};

// ─── ITEMS ───────────────────────────────────────────────────────────────────
export const createItem = async (data) => {
  const ref = await addDoc(collection(db, 'items'), {
    ...data,
    status: data.status || 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getItem = async (itemId) => {
  if (!itemId) return null;
  const snap = await getDoc(doc(db, 'items', itemId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateItem = async (itemId, data) => {
  if (!itemId) throw new Error('Item ID is required');
  await updateDoc(doc(db, 'items', itemId), { ...data, updatedAt: serverTimestamp() });
};

export const deleteItem = async (itemId) => {
  if (!itemId) throw new Error('Item ID is required');
  await deleteDoc(doc(db, 'items', itemId));
};

/**
 * Fetch all items with optional filters.
 * Sorted in-memory by createdAt descending to avoid requiring composite indexes.
 */
export const getAllItems = async (filters = {}) => {
  try {
    let q = collection(db, 'items');
    const constraints = [];
    if (filters.type) constraints.push(where('type', '==', filters.type));
    if (filters.category) constraints.push(where('category', '==', filters.category));
    if (filters.status) constraints.push(where('status', '==', filters.status));

    // Notice: Do NOT combine where() with orderBy() in the Firestore query!
    // That requires manual composite indexes. Sorting in memory works 100% reliably.
    if (constraints.length > 0) {
      q = query(q, ...constraints);
    }
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => getMillis(b) - getMillis(a));
    return items;
  } catch (err) {
    console.error('getAllItems error:', err);
    return [];
  }
};

/**
 * Retrieve reports belonging to the specified user.
 * Supports backward-compatible ownership fields (userId, uid, ownerId).
 * Sorted in-memory so NO composite index is needed.
 */
export const getUserItems = async (userId) => {
  if (!userId) return [];
  try {
    const map = new Map();

    // Query 1: standard userId field
    try {
      const q1 = query(collection(db, 'items'), where('userId', '==', userId));
      const snap1 = await getDocs(q1);
      snap1.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
    } catch (e1) {
      console.warn('Query by userId error:', e1);
    }

    // Query 2: legacy uid field
    try {
      const q2 = query(collection(db, 'items'), where('uid', '==', userId));
      const snap2 = await getDocs(q2);
      snap2.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
    } catch {}

    // Query 3: legacy ownerId field
    try {
      const q3 = query(collection(db, 'items'), where('ownerId', '==', userId));
      const snap3 = await getDocs(q3);
      snap3.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
    } catch {}

    const items = Array.from(map.values());
    items.sort((a, b) => getMillis(b) - getMillis(a));
    return items;
  } catch (err) {
    console.error('getUserItems error:', err);
    return [];
  }
};

/**
 * Retrieve latest reports across the entire system.
 */
export const getRecentItems = async (n = 6) => {
  try {
    const snap = await getDocs(collection(db, 'items'));
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => getMillis(b) - getMillis(a));
    return items.slice(0, n);
  } catch (err) {
    console.error('getRecentItems error:', err);
    return [];
  }
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
  if (!itemId) return [];
  try {
    const q = query(collection(db, 'claims'), where('itemId', '==', itemId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => getMillis(b) - getMillis(a));
    return list;
  } catch (err) {
    console.error('getItemClaims error:', err);
    return [];
  }
};

export const getUserClaims = async (userId) => {
  if (!userId) return [];
  try {
    const q = query(collection(db, 'claims'), where('claimantId', '==', userId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => getMillis(b) - getMillis(a));
    return list;
  } catch (err) {
    console.error('getUserClaims error:', err);
    return [];
  }
};

export const getReceivedClaims = async (ownerId) => {
  if (!ownerId) return [];
  try {
    const q = query(collection(db, 'claims'), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => getMillis(b) - getMillis(a));
    return list;
  } catch (err) {
    console.error('getReceivedClaims error:', err);
    return [];
  }
};

export const getAllClaims = async () => {
  try {
    const snap = await getDocs(collection(db, 'claims'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => getMillis(b) - getMillis(a));
    return list;
  } catch (err) {
    console.error('getAllClaims error:', err);
    return [];
  }
};

export const updateClaim = async (claimId, data) => {
  if (!claimId) throw new Error('Claim ID is required');
  await updateDoc(doc(db, 'claims', claimId), { ...data, updatedAt: serverTimestamp() });
};

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
/**
 * Create a notification for a user.
 * Stores recipient UID, sender UID, report ID, item title, message, and read status.
 * Guards against notifying the sender about their own actions.
 */
export const createNotification = async (recipientUserId, {
  title,
  message,
  type = 'info',
  itemId = null,
  itemTitle = null,
  senderId = null,
  senderName = null,
}) => {
  if (!recipientUserId) return;
  // Do not notify the sender about their own message/action
  if (senderId && senderId === recipientUserId) return;

  await addDoc(collection(db, 'notifications'), {
    userId: recipientUserId,
    recipientId: recipientUserId,
    senderId: senderId || '',
    senderName: senderName || 'A user',
    itemId: itemId || '',
    reportId: itemId || '',
    itemTitle: itemTitle || '',
    title,
    message,
    type,
    read: false,
    createdAt: serverTimestamp(),
  });
};

/**
 * Real-time notification subscription.
 * Queries by userId and sorts in-memory so NO composite index is needed.
 */
export const subscribeToNotifications = (userId, callback) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => getMillis(b) - getMillis(a));
      callback(list);
    },
    (err) => {
      console.error('Notification subscription error:', err);
      // Fallback one-time fetch
      getDocs(q).then(snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => getMillis(b) - getMillis(a));
        callback(list);
      }).catch(() => callback([]));
    }
  );
};

export const markNotificationRead = async (notifId) => {
  if (!notifId) return;
  await updateDoc(doc(db, 'notifications', notifId), { read: true, updatedAt: serverTimestamp() });
};

export const markAllNotificationsRead = async (userId) => {
  if (!userId) return;
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snap = await getDocs(q);
    const updates = snap.docs.map(d => updateDoc(d.ref, { read: true, updatedAt: serverTimestamp() }));
    await Promise.all(updates);
  } catch (err) {
    console.error('markAllNotificationsRead error:', err);
  }
};

// ─── STATS ───────────────────────────────────────────────────────────────────
export const getStats = async () => {
  try {
    const [usersSnap, itemsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'items')),
    ]);
    const items = itemsSnap.docs.map(d => d.data());
    return {
      totalUsers: usersSnap.size,
      totalLost: items.filter(i => i.type === 'lost').length,
      totalFound: items.filter(i => i.type === 'found').length,
      activeItems: items.filter(i => i.status === 'active').length,
      claimedItems: items.filter(i => i.status === 'claimed').length,
      returnedItems: items.filter(i => i.status === 'returned').length,
    };
  } catch (err) {
    console.error('getStats error:', err);
    return {
      totalUsers: 0,
      totalLost: 0,
      totalFound: 0,
      activeItems: 0,
      claimedItems: 0,
      returnedItems: 0,
    };
  }
};

export const getUserStats = async (userId) => {
  const items = await getUserItems(userId);
  return {
    total: items.length,
    lost: items.filter(i => i.type === 'lost').length,
    found: items.filter(i => i.type === 'found').length,
    active: items.filter(i => i.status === 'active').length,
    claimed: items.filter(i => i.status === 'claimed').length,
    returned: items.filter(i => i.status === 'returned').length,
    closed: items.filter(i => i.status === 'closed').length,
  };
};

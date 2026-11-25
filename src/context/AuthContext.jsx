import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserProfile } from '../firebase/firestoreService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          // If the user's account is marked as blocked, force sign out immediately
          if (profile?.blocked === true) {
            await signOut(auth);
            setCurrentUser(null);
            setUserProfile(null);
            setLoading(false);
            return;
          }
          setCurrentUser(user);
          setUserProfile(profile);
        } catch (e) {
          setCurrentUser(user);
          setUserProfile(null);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = userProfile?.role === 'admin';

  const refreshProfile = async () => {
    if (currentUser) {
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, isAdmin, loading, refreshProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

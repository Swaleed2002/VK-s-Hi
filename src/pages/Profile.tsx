import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
import { Edit2, LogOut, ArrowLeft } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { AvatarPicker } from '../components/ui/AvatarPicker';
import { Avatar } from '../components/ui/Avatar';
import { useNavigate, useParams } from 'react-router-dom';

export function Profile() {
  const { id } = useParams();
  const { profile, setProfile } = useAuthStore();
  
  const isSelf = !id || id === profile?.id;
  const navigate = useNavigate();
  
  const [targetUser, setTargetUser] = useState<any>(isSelf ? profile : null);
  const [loadingUser, setLoadingUser] = useState(!isSelf);

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSelf && profile) {
      setTargetUser(profile);
      setDisplayName(profile.displayName);
      setBio(profile.bio || '');
    }
  }, [isSelf, profile]);

  useEffect(() => {
    if (!isSelf && id) {
      const fetchUser = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'users', id));
          if (docSnap.exists()) {
            setTargetUser({ id: docSnap.id, ...docSnap.data() });
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingUser(false);
        }
      };
      fetchUser();
    }
  }, [isSelf, id]);

  const handleSave = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', profile.id), {
        displayName,
        bio
      });
      setProfile({ ...profile, displayName, bio });
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  if (loadingUser) return <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-gray-950">Loading...</div>;
  if (!targetUser) return <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-gray-950">User not found</div>;

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-gray-950 overflow-y-auto pb-24">
      <div className="sticky top-0 z-10 flex h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] shrink-0 items-center justify-between border-b border-gray-200 bg-white/90 backdrop-blur-md px-4 dark:border-gray-800 dark:bg-gray-950/90">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">{isSelf ? 'Profile' : 'Contact Info'}</h1>
        </div>
        {isSelf && (
          <Button variant="ghost" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium">
            <LogOut size={18} className="mr-2" /> Logout
          </Button>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex flex-col items-center">
          <div className="mb-4">
            {isSelf ? (
               <AvatarPicker currentUrl={targetUser.avatarUrl} fallback={targetUser.displayName} />
            ) : (
               <Avatar src={targetUser.avatarUrl} fallback={targetUser.displayName} size="xl" className="w-24 h-24 shadow-md" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">@{targetUser.username}</h2>
          <p className="text-gray-500 font-medium">{targetUser.email}</p>
        </div>
        
        <div className="mt-8 space-y-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{isSelf ? 'About You' : 'About'}</h3>
            {isSelf && !editing && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-500 dark:hover:bg-emerald-900/20">
                <Edit2 size={16} className="mr-2" /> Edit
              </Button>
            )}
          </div>
          
          {isSelf && editing ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Display Name</label>
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Bio</label>
                <Input value={bio} onChange={e => setBio(e.target.value)} placeholder="Available" className="rounded-xl" />
              </div>
              <div className="flex space-x-3 pt-2">
                <Button className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium" onClick={handleSave} disabled={loading}>Save</Button>
                <Button variant="outline" className="flex-1 rounded-xl font-medium" onClick={() => {
                  setEditing(false);
                  setDisplayName(profile.displayName);
                  setBio(profile.bio || '');
                }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Display Name</p>
                <p className="text-gray-900 dark:text-gray-100 font-medium">{targetUser.displayName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Bio</p>
                <p className="text-gray-900 dark:text-gray-100 font-medium">{targetUser.bio || 'Available'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

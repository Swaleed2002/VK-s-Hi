import React, { useState } from 'react';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, UserPlus, MessageSquare, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Contacts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      let q = query(
        collection(db, 'users'),
        where('username', '==', searchQuery.toLowerCase().trim())
      );
      let snapshot = await getDocs(q);
      
      let users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      users = users.filter(u => u.id !== user?.uid);
      
      if (users.length === 0) {
         setError('No users found with that username.');
      }
      setResults(users);
    } catch (err: any) {
      setError('Error searching users.');
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (targetUser: any) => {
    if (!user || !profile) return;
    
    const convId = [user.uid, targetUser.id].sort().join('_');
    const convRef = doc(db, 'conversations', convId);
    const convSnap = await getDoc(convRef);
    
    if (!convSnap.exists()) {
      await setDoc(convRef, {
        type: 'direct',
        participantIds: [user.uid, targetUser.id],
        participants: {
          [user.uid]: { displayName: profile.displayName, avatarUrl: profile.avatarUrl || null },
          [targetUser.id]: { displayName: targetUser.displayName, avatarUrl: targetUser.avatarUrl || null }
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    
    navigate(`/chats/${convId}`);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-950 overflow-y-auto pb-20">
      <div className="sticky top-0 z-10 flex h-[calc(4.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] shrink-0 items-center border-b border-gray-100 bg-white/95 backdrop-blur-md px-2 dark:border-gray-800 dark:bg-gray-950/95">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold ml-2">Find People</h1>
      </div>
      
      <div className="p-4 border-b border-gray-100 dark:border-gray-800/50 bg-white dark:bg-gray-950">
        <form onSubmit={handleSearch} className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search by exact @username" 
              className="pl-10 rounded-xl h-11 bg-gray-50 dark:bg-gray-900 border-transparent focus:bg-white dark:focus:bg-gray-950"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit" className="rounded-xl h-11 px-5 bg-emerald-600 hover:bg-emerald-700 font-medium shadow-sm" disabled={loading}>
            {loading ? '...' : 'Search'}
          </Button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600 font-medium px-1">{error}</p>}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {results.map(u => (
          <div key={u.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center space-x-4">
              <Avatar src={u.avatarUrl} fallback={u.displayName} size="lg" className="w-14 h-14" />
              <div>
                <p className="font-bold text-[17px] text-gray-900 dark:text-gray-100">{u.displayName}</p>
                <p className="text-sm font-medium text-gray-500">@{u.username}</p>
              </div>
            </div>
            <button 
              className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800/40 transition-colors"
              onClick={() => startChat(u)}
            >
              <MessageSquare size={20} />
            </button>
          </div>
        ))}
        {results.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center p-12 mt-10 text-center text-gray-400">
            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
              <UserPlus size={40} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Find your friends</h3>
            <p className="text-sm">Search for their exact username to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}

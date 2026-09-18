import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { useCallStore } from '../store/useCallStore';
import { Avatar } from '../components/ui/Avatar';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneCall } from 'lucide-react';
import { formatTime, cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export function Calls() {
  const { user } = useAuthStore();
  const { startCall } = useCallStore();
  const navigate = useNavigate();
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersCache, setUsersCache] = useState<{ [uid: string]: any }>({});

  useEffect(() => {
    if (!user) return;
    
    const q1 = query(collection(db, 'calls'), where('callerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const q2 = query(collection(db, 'calls'), where('receiverId', '==', user.uid), orderBy('createdAt', 'desc'));
    
    const callsMap = new Map();
    const updateCalls = async () => {
      const merged = Array.from(callsMap.values()).sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setCalls(merged);
      setLoading(false);

      // Fetch user profiles for participants not in cache
      const neededIds = new Set<string>();
      merged.forEach(c => {
        const otherId = c.callerId === user.uid ? c.receiverId : c.callerId;
        if (otherId && !usersCache[otherId]) {
          neededIds.add(otherId);
        }
      });

      if (neededIds.size > 0) {
        const newProfiles: { [uid: string]: any } = {};
        for (const uid of neededIds) {
          try {
            const userSnap = await getDoc(doc(db, 'users', uid));
            if (userSnap.exists()) {
              newProfiles[uid] = userSnap.data();
            }
          } catch (e) {
            console.warn("Could not fetch call user:", e);
          }
        }
        setUsersCache(prev => ({ ...prev, ...newProfiles }));
      }
    };

    const unsub1 = onSnapshot(q1, (snap) => {
      snap.docs.forEach(d => callsMap.set(d.id, { id: d.id, ...d.data() }));
      updateCalls();
    });
    const unsub2 = onSnapshot(q2, (snap) => {
      snap.docs.forEach(d => callsMap.set(d.id, { id: d.id, ...d.data() }));
      updateCalls();
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  const handleCall = (targetId: string, isVideo: boolean) => {
    startCall(targetId, isVideo);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-950 overflow-y-auto pb-20">
      <div className="sticky top-0 z-10 flex h-[calc(4.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] shrink-0 items-center justify-between px-4 bg-white/95 backdrop-blur-md dark:bg-gray-950/95 border-b border-gray-100 dark:border-gray-800">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Calls</h1>
        <button 
          className="p-2.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm" 
          onClick={() => navigate('/contacts')}
          aria-label="New call"
        >
          <PhoneCall size={20} />
        </button>
      </div>
      
      <div className="flex-1 p-2">
        {loading ? (
          <div className="space-y-4 p-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex animate-pulse items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>
            ))}
          </div>
        ) : calls.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center mt-20">
            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
              <Phone size={40} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No recent calls</h3>
            <p className="text-gray-500 mb-8 max-w-[250px]">Your recent voice and video calls will appear here.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {calls.map(call => {
              const isOutgoing = call.callerId === user?.uid;
              const otherId = isOutgoing ? call.receiverId : call.callerId;
              const otherUserData = usersCache[otherId];
              const isMissed = !isOutgoing && (call.status === 'missed' || call.status === 'declined' || call.status === 'cancelled');
              const name = otherUserData?.displayName || otherUserData?.username || 'User';
              const avatar = otherUserData?.avatarUrl;
              
              return (
                <div key={call.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center space-x-4 min-w-0">
                    <Avatar src={avatar} fallback={name} size="lg" className="w-12 h-12 shrink-0" />
                    <div className="min-w-0">
                      <p className={cn("font-bold text-[16px] truncate", isMissed ? "text-red-500 dark:text-red-400" : "text-gray-900 dark:text-gray-100")}>
                        {name}
                      </p>
                      <div className="flex items-center text-[13px] text-gray-500 mt-0.5 font-medium">
                        {isOutgoing ? (
                          <PhoneOutgoing size={14} className="mr-1.5 text-emerald-500 shrink-0" />
                        ) : isMissed ? (
                          <PhoneMissed size={14} className="mr-1.5 text-red-500 shrink-0" />
                        ) : (
                          <PhoneIncoming size={14} className="mr-1.5 text-emerald-500 shrink-0" />
                        )}
                        <span>{call.createdAt ? formatTime(call.createdAt.toDate()) : ''}</span>
                        {call.type && (
                          <span className="ml-2 px-1.5 py-0.2 rounded text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 capitalize">
                            {call.type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1 shrink-0">
                    <button 
                      className="p-2.5 bg-gray-50 text-emerald-600 dark:bg-gray-900 dark:text-emerald-500 rounded-full hover:bg-emerald-50 dark:hover:bg-gray-800 transition-colors" 
                      onClick={() => handleCall(otherId, false)}
                      aria-label="Voice call"
                    >
                      <Phone size={18} />
                    </button>
                    <button 
                      className="p-2.5 bg-gray-50 text-emerald-600 dark:bg-gray-900 dark:text-emerald-500 rounded-full hover:bg-emerald-50 dark:hover:bg-gray-800 transition-colors" 
                      onClick={() => handleCall(otherId, true)}
                      aria-label="Video call"
                    >
                      <Video size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

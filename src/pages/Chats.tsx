import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Avatar } from '../components/ui/Avatar';
import { formatTime, cn } from '../lib/utils';
import { Edit, Camera } from 'lucide-react';
import { APP_CONFIG } from '../config';

export function Chats() {
  const { id: activeChatId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const showList = !activeChatId;
  const showDetail = !!activeChatId;

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (showDetail) {
    return (
      <div className="w-full h-full relative z-30">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-950 overflow-y-auto pb-20">
      <div className="sticky top-0 z-10 flex h-[calc(4.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] shrink-0 items-center justify-between px-4 bg-white/95 backdrop-blur-md dark:bg-gray-950/95 border-b border-gray-100 dark:border-gray-800">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Chats</h1>
        <div className="flex space-x-2">
          <button className="p-2.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 transition-colors">
            <Camera size={20} />
          </button>
          <button className="p-2.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm" onClick={() => navigate('/contacts')}>
            <Edit size={20} className="ml-0.5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-2">
        {loading ? (
          <div className="space-y-4 p-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex animate-pulse items-center space-x-4">
                <div className="h-14 w-14 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center mt-20">
            <img 
              src={APP_CONFIG.logoUrl} 
              alt={APP_CONFIG.name}
              className="w-24 h-24 mb-6 opacity-30 grayscale"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No chats yet</h3>
            <p className="text-gray-500 mb-8 max-w-[250px]">Start messaging your friends by tapping the edit button.</p>
            <button className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md transition-all active:scale-95" onClick={() => navigate('/contacts')}>
              Start a new chat
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {chats.map(chat => {
              const isGroup = chat.type === 'group';
              const otherUserId = chat.participantIds.find((id: string) => id !== user?.uid);
              const participantData = chat.participants?.[otherUserId];
              const displayName = isGroup ? chat.name : (participantData?.displayName || 'User');
              const avatarSrc = isGroup ? chat.avatarUrl : participantData?.avatarUrl;
              
              return (
                <button
                  key={chat.id}
                  onClick={() => navigate(`/chats/${chat.id}`)}
                  className="flex w-full items-center p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl active:bg-gray-100 dark:active:bg-gray-800"
                >
                  <Avatar src={avatarSrc} fallback={displayName || 'U'} size="lg" className="mr-4 w-14 h-14" />
                  <div className="flex-1 min-w-0 py-1 border-b border-gray-100 dark:border-gray-800/50 h-full flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-[17px] truncate text-gray-900 dark:text-gray-100">{displayName}</h3>
                      {chat.lastMessageTime && (
                        <span className="text-xs font-medium text-gray-500 whitespace-nowrap ml-2">
                          {formatTime(chat.lastMessageTime.toDate())}
                        </span>
                      )}
                    </div>
                    <p className="text-[15px] text-gray-500 truncate dark:text-gray-400">
                      {chat.lastMessagePreview || 'No messages yet'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

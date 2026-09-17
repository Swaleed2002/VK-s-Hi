import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { ArrowLeft, Phone, Video, Send, Paperclip, Smile, File, Mic, Play, Pause, MoreVertical, Copy, Trash2, Reply, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { useCallStore } from '../store/useCallStore';
import { VoiceRecorder } from '../components/ui/VoiceRecorder';

export function Chat() {
  const { id: chatId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const startCall = useCallStore(state => state.startCall);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState(false);
  
  // Action sheet state
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!chatId || !user) return;
    
    // Fetch conversation details
    const fetchConv = async () => {
      const docSnap = await getDoc(doc(db, 'conversations', chatId));
      if (docSnap.exists()) {
        setConversation({ id: docSnap.id, ...docSnap.data() });
      } else {
        navigate('/chats');
      }
    };
    fetchConv();

    const q = query(
      collection(db, `conversations/${chatId}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    });

    return () => unsubscribe();
  }, [chatId, user, navigate]);

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !chatId) return;

    const content = text.trim();
    setText('');

    await addDoc(collection(db, `conversations/${chatId}/messages`), {
      senderId: user.uid,
      type: 'text',
      content,
      createdAt: serverTimestamp(),
      status: { [user.uid]: 'sent' }
    });
    
    await updateDoc(doc(db, 'conversations', chatId), {
      updatedAt: serverTimestamp(),
      lastMessagePreview: content.substring(0, 50),
      lastMessageTime: serverTimestamp(),
      lastMessageSenderId: user.uid
    });
  };

  const handleSendVoice = async (audioBlob: Blob, durationMs: number) => {
    setRecordingVoice(false);
    if (!user || !chatId) return;
    
    setUploading(true);
    const storageRef = ref(storage, `conversations/${chatId}/${Date.now()}_voice.webm`);
    const uploadTask = uploadBytesResumable(storageRef, audioBlob);
    
    uploadTask.on('state_changed', 
      null,
      (error) => {
        console.error("Upload failed", error);
        setUploading(false);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        await addDoc(collection(db, `conversations/${chatId}/messages`), {
          senderId: user.uid,
          type: 'audio',
          content: downloadURL,
          durationMs,
          createdAt: serverTimestamp(),
          status: { [user.uid]: 'sent' }
        });
        
        await updateDoc(doc(db, 'conversations', chatId), {
          updatedAt: serverTimestamp(),
          lastMessagePreview: '🎤 Voice message',
          lastMessageTime: serverTimestamp(),
          lastMessageSenderId: user.uid
        });
        
        setUploading(false);
      }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !chatId) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum size is 10MB.");
      return;
    }

    setUploading(true);
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const type = isImage ? 'image' : isVideo ? 'video' : 'file';
    
    const storageRef = ref(storage, `conversations/${chatId}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      null, 
      (error) => {
        console.error("Upload failed", error);
        setUploading(false);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        await addDoc(collection(db, `conversations/${chatId}/messages`), {
          senderId: user.uid,
          type,
          content: downloadURL,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          createdAt: serverTimestamp(),
          status: { [user.uid]: 'sent' }
        });
        
        await updateDoc(doc(db, 'conversations', chatId), {
          updatedAt: serverTimestamp(),
          lastMessagePreview: isImage ? '📷 Image' : isVideo ? '🎥 Video' : '📎 File',
          lastMessageTime: serverTimestamp(),
          lastMessageSenderId: user.uid
        });
        
        setUploading(false);
      }
    );
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!chatId) return;
    setSelectedMessage(null);
    try {
      await deleteDoc(doc(db, `conversations/${chatId}/messages`, msgId));
    } catch (e) {
      console.error(e);
      alert("Cannot delete this message");
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setSelectedMessage(null);
  };

  const renderMessageContent = (msg: any) => {
    if (msg.type === 'text') {
      return <p className="whitespace-pre-wrap break-words">{msg.content}</p>;
    }
    if (msg.type === 'image') {
      return <img src={msg.content} alt="Upload" className="max-w-full rounded-lg" />;
    }
    if (msg.type === 'video') {
      return <video src={msg.content} controls className="max-w-full rounded-lg" />;
    }
    if (msg.type === 'audio') {
      return (
        <div className="flex items-center gap-2 min-w-[200px]">
          <div className="p-3 bg-white/20 rounded-full">
            <Mic size={20} className={msg.senderId === user?.uid ? "text-white" : "text-gray-600 dark:text-gray-300"} />
          </div>
          <audio src={msg.content} controls className="h-8 max-w-[150px] custom-audio" />
        </div>
      );
    }
    if (msg.type === 'file') {
      return (
        <a href={msg.content} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-inherit hover:underline">
          <div className="p-3 bg-white/20 rounded-xl">
             <File size={24} />
          </div>
          <span className="truncate max-w-[180px] font-medium">{msg.fileName || 'Download File'}</span>
        </a>
      );
    }
    return <p>{msg.content}</p>;
  };

  if (!conversation) return <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-gray-950">Loading...</div>;

  const isGroup = conversation.type === 'group';
  const otherUserId = conversation.participantIds.find((id: string) => id !== user?.uid);
  const participantData = conversation.participants?.[otherUserId];
  const displayName = isGroup ? conversation.name : (participantData?.displayName || 'User');
  const avatarSrc = isGroup ? conversation.avatarUrl : participantData?.avatarUrl;

  const handleCall = (video: boolean) => {
    if (isGroup) {
      alert("Group calling not supported yet.");
      return;
    }
    if (otherUserId) {
      startCall(otherUserId, video);
    }
  };

  const formatMessageTime = (date: Date) => format(date, 'h:mm a');
  
  // Group messages by date
  const groupedMessages: { [key: string]: any[] } = {};
  messages.forEach(msg => {
    if (!msg.createdAt) return;
    const dateStr = format(msg.createdAt.toDate(), 'MMMM d, yyyy');
    if (!groupedMessages[dateStr]) groupedMessages[dateStr] = [];
    groupedMessages[dateStr].push(msg);
  });

  return (
    <div className="flex flex-col h-full w-full bg-[#E5DDD5] dark:bg-[#0b141a] absolute inset-0 z-10 md:relative md:z-0">
      
      {/* Header */}
      <div className="flex h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] shrink-0 items-center justify-between px-2 bg-white dark:bg-gray-900 shadow-sm z-20">
        <div className="flex items-center">
          <button className="p-2 mr-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate(isGroup ? '#' : `/profile/${otherUserId}`)}>
            <Avatar src={avatarSrc} fallback={displayName || 'U'} size="sm" className="w-10 h-10" />
            <div>
              <h2 className="font-bold text-gray-900 dark:text-gray-100 text-[17px] leading-tight">{displayName}</h2>
              {!isGroup && <p className="text-xs text-gray-500 font-medium">Tap here for contact info</p>}
            </div>
          </div>
        </div>
        <div className="flex space-x-1">
          <button className="p-3 text-emerald-600 dark:text-emerald-500 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/20" onClick={() => handleCall(true)}>
            <Video size={22} />
          </button>
          <button className="p-3 text-emerald-600 dark:text-emerald-500 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/20" onClick={() => handleCall(false)}>
            <Phone size={22} />
          </button>
          <button className="p-3 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <MoreVertical size={22} />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 relative" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/always-grey.png")' }}>
        {Object.keys(groupedMessages).map(dateStr => (
          <React.Fragment key={dateStr}>
            <div className="flex justify-center my-4">
              <span className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-600 dark:text-gray-300 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                {dateStr}
              </span>
            </div>
            {groupedMessages[dateStr].map((msg, index, array) => {
              const isMine = msg.senderId === user?.uid;
              const showAvatar = !isMine && isGroup && (index === 0 || array[index - 1].senderId !== msg.senderId);
              
              return (
                <div 
                  key={msg.id} 
                  className={cn("flex w-full group", isMine ? "justify-end" : "justify-start")}
                >
                  <div 
                    onContextMenu={(e) => { e.preventDefault(); setSelectedMessage(msg); }}
                    className={cn(
                      "max-w-[85%] md:max-w-[75%] rounded-2xl px-3 py-2 shadow-sm relative transition-transform active:scale-95 cursor-pointer",
                      isMine 
                        ? "bg-emerald-600 text-white rounded-br-none" 
                        : "bg-white text-gray-900 border border-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-bl-none"
                    )}
                    onClick={() => setSelectedMessage(msg)}
                  >
                    {showAvatar && (
                      <p className="text-xs text-emerald-500 dark:text-emerald-400 mb-1 font-bold">{conversation.participants[msg.senderId]?.displayName}</p>
                    )}
                    
                    <div className="text-[15px] leading-relaxed">
                      {renderMessageContent(msg)}
                    </div>
                    
                    <div className={cn(
                      "flex items-center justify-end space-x-1 mt-1 text-[11px] font-medium float-right ml-4 -mb-1",
                      isMine ? "text-emerald-100" : "text-gray-400"
                    )}>
                      <span>{msg.createdAt ? formatMessageTime(msg.createdAt.toDate()) : '...'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
        {uploading && (
          <div className="flex justify-end">
            <div className="bg-emerald-600/60 text-white rounded-2xl rounded-br-none px-4 py-2 text-sm font-medium animate-pulse">
              Sending media...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Composer */}
      <div className="bg-[#f0f0f0] dark:bg-[#202c33] pb-[env(safe-area-inset-bottom)] p-2">
        <div className="flex items-end gap-2">
          
          {recordingVoice ? (
            <VoiceRecorder onSend={handleSendVoice} onCancel={() => setRecordingVoice(false)} />
          ) : (
            <>
              <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-3xl flex items-end min-h-[44px]">
                <button type="button" className="p-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 shrink-0">
                  <Smile size={24} />
                </button>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Message"
                  className="flex-1 max-h-32 bg-transparent resize-none outline-none py-3 text-[17px] dark:text-white overflow-y-auto"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendText(e);
                    }
                  }}
                />
                <button type="button" className="p-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 shrink-0" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip size={24} className="rotate-45" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
              </div>

              {text.trim() ? (
                <button onClick={handleSendText} className="shrink-0 h-[44px] w-[44px] rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors">
                  <Send size={20} className="ml-1 -mt-0.5" />
                </button>
              ) : (
                <button onPointerDown={(e) => { e.preventDefault(); setRecordingVoice(true); }} className="shrink-0 h-[44px] w-[44px] rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors active:scale-95">
                  <Mic size={22} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Message Action Sheet */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedMessage(null)}>
          <div 
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl pb-[calc(2rem+env(safe-area-inset-bottom))] p-2 animate-in slide-in-from-bottom-full duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto my-3" />
            <div className="space-y-1">
              <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-gray-900 dark:text-gray-100" onClick={() => setSelectedMessage(null)}>
                <Reply size={22} /> <span className="font-semibold text-[17px]">Reply</span>
              </button>
              
              {selectedMessage.type === 'text' && (
                <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-gray-900 dark:text-gray-100" onClick={() => handleCopy(selectedMessage.content)}>
                  <Copy size={22} /> <span className="font-semibold text-[17px]">Copy</span>
                </button>
              )}
              
              <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-gray-900 dark:text-gray-100" onClick={() => setSelectedMessage(null)}>
                <Info size={22} /> <span className="font-semibold text-[17px]">Info</span>
              </button>

              {selectedMessage.senderId === user?.uid && (
                <button className="w-full flex items-center gap-4 p-4 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl text-red-600 dark:text-red-400 mt-2" onClick={() => handleDeleteMessage(selectedMessage.id)}>
                  <Trash2 size={22} /> <span className="font-semibold text-[17px]">Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

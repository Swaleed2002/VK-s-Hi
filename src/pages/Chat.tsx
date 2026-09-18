import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  getDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Avatar } from '../components/ui/Avatar';
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  Send, 
  Paperclip, 
  Smile, 
  FileText, 
  Mic, 
  MoreVertical, 
  Copy, 
  Trash2, 
  Reply, 
  Info,
  Download,
  Check,
  CheckCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { useCallStore } from '../store/useCallStore';
import { VoiceRecorder } from '../components/ui/VoiceRecorder';
import { VoiceMessagePlayer } from '../components/chat/VoiceMessagePlayer';
import { EmojiStickerPicker } from '../components/chat/EmojiStickerPicker';
import { AttachmentMenu } from '../components/chat/AttachmentMenu';
import { MediaPreviewModal } from '../components/chat/MediaPreviewModal';
import { MediaViewerModal } from '../components/chat/MediaViewerModal';
import { Sticker } from '../components/chat/stickers';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export function Chat() {
  const { id: chatId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const startCall = useCallStore(state => state.startCall);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [text, setText] = useState('');
  const [recordingVoice, setRecordingVoice] = useState(false);
  
  // UI Panels
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  // File preview & upload
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Full-screen media viewer
  const [viewingMedia, setViewingMedia] = useState<{ url: string; type: 'image' | 'video'; name?: string } | null>(null);

  // Message action sheet
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!chatId || !user) return;
    
    // Fetch conversation details
    const fetchConv = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'conversations', chatId));
        if (docSnap.exists()) {
          setConversation({ id: docSnap.id, ...docSnap.data() });
        } else {
          navigate('/chats');
        }
      } catch (e) {
        console.warn("Could not load conversation:", e);
      }
    };
    fetchConv();

    const q = query(
      collection(db, `conversations/${chatId}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [chatId, user, navigate]);

  // Send plain text message
  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || !user || !chatId) return;

    const content = text.trim();
    setText('');
    setShowEmojiPicker(false);

    try {
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
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Insert emoji at cursor position in textarea
  const handleSelectEmoji = (emoji: string) => {
    if (!textareaRef.current) {
      setText(prev => prev + emoji);
      return;
    }
    const start = textareaRef.current.selectionStart || 0;
    const end = textareaRef.current.selectionEnd || 0;
    const newText = text.substring(0, start) + emoji + text.substring(end);
    setText(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + emoji.length, start + emoji.length);
      }
    }, 10);
  };

  // Send sticker message
  const handleSelectSticker = async (sticker: Sticker) => {
    if (!user || !chatId) return;
    setShowEmojiPicker(false);

    try {
      await addDoc(collection(db, `conversations/${chatId}/messages`), {
        senderId: user.uid,
        type: 'sticker',
        content: sticker.svg,
        stickerName: sticker.name,
        createdAt: serverTimestamp(),
        status: { [user.uid]: 'sent' }
      });

      await updateDoc(doc(db, 'conversations', chatId), {
        updatedAt: serverTimestamp(),
        lastMessagePreview: `✨ Sticker: ${sticker.name}`,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: user.uid
      });
    } catch (err) {
      console.error("Failed to send sticker:", err);
    }
  };

  // Send voice note message
  const handleSendVoice = async (audioBlob: Blob, durationSec: number) => {
    setRecordingVoice(false);
    if (!user || !chatId) return;
    
    try {
      const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const storageRef = ref(storage, `conversations/${chatId}/${Date.now()}_voice.${ext}`);
      const participantsList = conversation?.participantIds ? conversation.participantIds.join(',') : user.uid;
      const metadata = {
        contentType: audioBlob.type || 'audio/webm',
        customMetadata: {
          uploaderUid: user.uid,
          conversationId: chatId,
          participants: participantsList
        }
      };
      const uploadTask = uploadBytesResumable(storageRef, audioBlob, metadata);
      
      uploadTask.on('state_changed', 
        null,
        (error) => {
          console.error("Voice upload failed", error);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          await addDoc(collection(db, `conversations/${chatId}/messages`), {
            senderId: user.uid,
            type: 'audio',
            content: downloadURL,
            durationSec,
            createdAt: serverTimestamp(),
            status: { [user.uid]: 'sent' }
          });
          
          await updateDoc(doc(db, 'conversations', chatId), {
            updatedAt: serverTimestamp(),
            lastMessagePreview: '🎤 Voice message',
            lastMessageTime: serverTimestamp(),
            lastMessageSenderId: user.uid
          });
        }
      );
    } catch (e) {
      console.error("Could not upload voice note:", e);
    }
  };

  // Handle camera trigger (Capacitor native or web fallback)
  const handlePickCamera = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera
        });

        if (photo.webPath) {
          const res = await fetch(photo.webPath);
          const blob = await res.blob();
          const file = new File([blob], `camera_${Date.now()}.${photo.format || 'jpg'}`, { type: `image/${photo.format || 'jpeg'}` });
          setPendingFile(file);
          setShowMediaPreview(true);
        }
      } catch (err) {
        console.warn("Native camera cancelled or failed:", err);
      }
    } else {
      cameraInputRef.current?.click();
    }
  };

  // Handle selected file input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so the same file can be re-selected if needed
    e.target.value = '';

    if (file.size > 25 * 1024 * 1024) {
      alert("File is too large. Maximum size is 25MB.");
      return;
    }

    setPendingFile(file);
    setShowMediaPreview(true);
    setUploadError(null);
    setUploadProgress(null);
  };

  // Upload file from preview modal
  const handleUploadPendingFile = async (caption: string) => {
    if (!pendingFile || !user || !chatId) return;

    setUploadProgress(0);
    setUploadError(null);

    const isImage = pendingFile.type.startsWith('image/');
    const isVideo = pendingFile.type.startsWith('video/');
    const messageType = isImage ? 'image' : isVideo ? 'video' : 'file';

    const safeName = pendingFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageRef = ref(storage, `conversations/${chatId}/${Date.now()}_${safeName}`);
    const participantsList = conversation?.participantIds ? conversation.participantIds.join(',') : user.uid;
    const metadata = {
      contentType: pendingFile.type || 'application/octet-stream',
      customMetadata: {
        uploaderUid: user.uid,
        conversationId: chatId,
        participants: participantsList
      }
    };
    const uploadTask = uploadBytesResumable(storageRef, pendingFile, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Media upload error:", error);
        setUploadError(error.message || "Failed to upload file. Please check connection and try again.");
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          await addDoc(collection(db, `conversations/${chatId}/messages`), {
            senderId: user.uid,
            type: messageType,
            content: downloadURL,
            caption: caption.trim() || null,
            fileName: pendingFile.name,
            fileSize: pendingFile.size,
            fileType: pendingFile.type,
            createdAt: serverTimestamp(),
            status: { [user.uid]: 'sent' }
          });

          const previewText = caption.trim() 
            ? caption.trim() 
            : isImage ? '📷 Photo' : isVideo ? '🎥 Video' : `📎 ${pendingFile.name}`;

          await updateDoc(doc(db, 'conversations', chatId), {
            updatedAt: serverTimestamp(),
            lastMessagePreview: previewText,
            lastMessageTime: serverTimestamp(),
            lastMessageSenderId: user.uid
          });

          // Reset modal
          setShowMediaPreview(false);
          setPendingFile(null);
          setUploadProgress(null);
        } catch (err: any) {
          console.error("Firestore write after upload failed:", err);
          setUploadError("Could not save message details. Please retry.");
        }
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
      alert("Cannot delete this message.");
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setSelectedMessage(null);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Render individual message content
  const renderMessageContent = (msg: any, isMine: boolean) => {
    if (msg.type === 'text') {
      return <p className="whitespace-pre-wrap break-words">{msg.content}</p>;
    }

    if (msg.type === 'image') {
      return (
        <div className="space-y-1.5">
          <div 
            className="overflow-hidden rounded-xl cursor-pointer bg-black/5 dark:bg-black/20"
            onClick={() => setViewingMedia({ url: msg.content, type: 'image', name: msg.fileName })}
          >
            <img 
              src={msg.content} 
              alt={msg.fileName || "Photo"} 
              loading="lazy"
              className="max-h-72 w-full object-cover rounded-xl hover:opacity-95 transition-opacity" 
            />
          </div>
          {msg.caption && (
            <p className="text-sm px-1 font-normal whitespace-pre-wrap break-words">{msg.caption}</p>
          )}
        </div>
      );
    }

    if (msg.type === 'video') {
      return (
        <div className="space-y-1.5">
          <div 
            className="overflow-hidden rounded-xl cursor-pointer bg-black/10 relative group"
            onClick={() => setViewingMedia({ url: msg.content, type: 'video', name: msg.fileName })}
          >
            <video 
              src={msg.content} 
              controls 
              playsInline
              preload="metadata"
              className="max-h-72 w-full object-cover rounded-xl" 
            />
          </div>
          {msg.caption && (
            <p className="text-sm px-1 font-normal whitespace-pre-wrap break-words">{msg.caption}</p>
          )}
        </div>
      );
    }

    if (msg.type === 'audio') {
      return (
        <VoiceMessagePlayer 
          audioUrl={msg.content} 
          durationSec={msg.durationSec || 0} 
          isSender={isMine} 
        />
      );
    }

    if (msg.type === 'sticker') {
      return (
        <div className="p-1">
          <img 
            src={msg.content} 
            alt={msg.stickerName || 'Sticker'} 
            className="w-36 h-36 object-contain drop-shadow-md select-none" 
          />
        </div>
      );
    }

    if (msg.type === 'file') {
      return (
        <div className="flex flex-col space-y-1">
          <a 
            href={msg.content} 
            download={msg.fileName || 'file'}
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center space-x-3 p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
              <FileText size={22} />
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <p className="font-semibold text-sm truncate">{msg.fileName || 'Document'}</p>
              <p className="text-xs opacity-70 font-mono">{formatFileSize(msg.fileSize)}</p>
            </div>
            <div className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-inherit shrink-0">
              <Download size={18} />
            </div>
          </a>
          {msg.caption && (
            <p className="text-sm px-1 font-normal whitespace-pre-wrap break-words">{msg.caption}</p>
          )}
        </div>
      );
    }

    return <p>{msg.content}</p>;
  };

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const isGroup = conversation.type === 'group';
  const otherUserId = conversation.participantIds.find((id: string) => id !== user?.uid);
  const participantData = conversation.participants?.[otherUserId];
  const displayName = isGroup ? conversation.name : (participantData?.displayName || 'User');
  const avatarSrc = isGroup ? conversation.avatarUrl : participantData?.avatarUrl;

  const handleCall = (video: boolean) => {
    if (isGroup) {
      alert("Group calling is not supported.");
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
    <div className="flex flex-col h-full w-full bg-[#EFEAE2] dark:bg-[#0b141a] absolute inset-0 z-10 md:relative md:z-0">
      
      {/* Hidden File Inputs for Attachment Types */}
      <input 
        type="file" 
        ref={galleryInputRef} 
        onChange={handleFileInputChange} 
        className="hidden" 
        accept="image/*,video/*"
      />
      <input 
        type="file" 
        ref={cameraInputRef} 
        onChange={handleFileInputChange} 
        className="hidden" 
        accept="image/*,video/*"
        capture="environment"
      />
      <input 
        type="file" 
        ref={documentInputRef} 
        onChange={handleFileInputChange} 
        className="hidden" 
        accept="application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.csv"
      />

      {/* Header */}
      <div className="flex h-[calc(4.25rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] shrink-0 items-center justify-between px-2 bg-white dark:bg-[#202c33] border-b border-gray-200 dark:border-gray-800 shadow-xs z-20">
        <div className="flex items-center min-w-0">
          <button 
            className="p-2 mr-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={22} className="text-gray-700 dark:text-gray-300" />
          </button>
          <div 
            className="flex items-center space-x-3 cursor-pointer min-w-0" 
            onClick={() => navigate(isGroup ? '#' : `/profile/${otherUserId}`)}
          >
            <Avatar src={avatarSrc} fallback={displayName || 'U'} size="sm" className="w-10 h-10 shrink-0" />
            <div className="truncate">
              <h2 className="font-bold text-gray-900 dark:text-gray-100 text-[16px] leading-tight truncate">
                {displayName}
              </h2>
              {!isGroup && (
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                  Tap for info
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-0.5 shrink-0">
          <button 
            className="p-2.5 text-emerald-600 dark:text-emerald-500 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:scale-95 transition-all" 
            onClick={() => handleCall(true)}
            aria-label="Video Call"
          >
            <Video size={22} />
          </button>
          <button 
            className="p-2.5 text-emerald-600 dark:text-emerald-500 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:scale-95 transition-all" 
            onClick={() => handleCall(false)}
            aria-label="Voice Call"
          >
            <Phone size={21} />
          </button>
          <button 
            className="p-2.5 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="More"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div 
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-2 relative" 
        onClick={() => {
          if (showEmojiPicker) setShowEmojiPicker(false);
          if (showAttachmentMenu) setShowAttachmentMenu(false);
        }}
      >
        {Object.keys(groupedMessages).map(dateStr => (
          <React.Fragment key={dateStr}>
            <div className="flex justify-center my-3">
              <span className="bg-white/85 dark:bg-gray-800/85 backdrop-blur-xs text-gray-600 dark:text-gray-300 text-[11px] font-semibold px-3 py-1 rounded-full shadow-xs">
                {dateStr}
              </span>
            </div>

            {groupedMessages[dateStr].map((msg, index, array) => {
              const isMine = msg.senderId === user?.uid;
              const showAvatar = !isMine && isGroup && (index === 0 || array[index - 1].senderId !== msg.senderId);
              const isSticker = msg.type === 'sticker';

              return (
                <div 
                  key={msg.id} 
                  className={cn("flex w-full group", isMine ? "justify-end" : "justify-start")}
                >
                  <div 
                    onContextMenu={(e) => { e.preventDefault(); setSelectedMessage(msg); }}
                    className={cn(
                      "relative max-w-[85%] sm:max-w-[75%]",
                      isSticker 
                        ? "bg-transparent p-0 shadow-none cursor-pointer"
                        : cn(
                            "rounded-2xl px-3 py-2 shadow-xs transition-transform active:scale-[0.99] cursor-pointer",
                            isMine 
                              ? "bg-emerald-600 text-white rounded-br-none" 
                              : "bg-white text-gray-900 border border-gray-100 dark:bg-[#202c33] dark:border-gray-800 dark:text-gray-100 rounded-bl-none"
                          )
                    )}
                    onClick={() => {
                      if (!isSticker && msg.type !== 'image' && msg.type !== 'video') {
                        setSelectedMessage(msg);
                      }
                    }}
                  >
                    {showAvatar && (
                      <p className="text-xs text-emerald-500 dark:text-emerald-400 mb-1 font-bold">
                        {conversation.participants[msg.senderId]?.displayName}
                      </p>
                    )}
                    
                    <div className="text-[15px] leading-relaxed">
                      {renderMessageContent(msg, isMine)}
                    </div>
                    
                    {!isSticker && (
                      <div className={cn(
                        "flex items-center justify-end space-x-1 mt-1 text-[10px] font-medium float-right ml-4 -mb-0.5",
                        isMine ? "text-emerald-100/90" : "text-gray-400"
                      )}>
                        <span>{msg.createdAt ? formatMessageTime(msg.createdAt.toDate()) : '...'}</span>
                        {isMine && <CheckCheck size={14} className="text-emerald-200" />}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Composer Input Area */}
      <div className="bg-[#f0f2f5] dark:bg-[#1f2c34] pb-[env(safe-area-inset-bottom)] p-2 border-t border-gray-200 dark:border-gray-800 z-20">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          
          {recordingVoice ? (
            <VoiceRecorder 
              onSend={handleSendVoice} 
              onCancel={() => setRecordingVoice(false)} 
            />
          ) : (
            <>
              <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-3xl flex items-end min-h-[44px] shadow-xs border border-gray-200/50 dark:border-gray-700/50">
                
                {/* Emoji / Sticker button */}
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAttachmentMenu(false);
                    setShowEmojiPicker(prev => !prev);
                  }}
                  className="p-2.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 shrink-0 transition-colors"
                  aria-label="Emojis and stickers"
                >
                  <Smile size={24} className={showEmojiPicker ? 'text-emerald-600 dark:text-emerald-400' : ''} />
                </button>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onFocus={() => {
                    setShowEmojiPicker(false);
                    setShowAttachmentMenu(false);
                  }}
                  placeholder="Message"
                  className="flex-1 max-h-32 bg-transparent resize-none outline-none py-2.5 text-[16px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 overflow-y-auto"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendText();
                    }
                  }}
                />

                {/* Attachment Menu button */}
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEmojiPicker(false);
                    setShowAttachmentMenu(prev => !prev);
                  }}
                  className="p-2.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 shrink-0 transition-colors"
                  aria-label="Attachments"
                >
                  <Paperclip size={22} className="rotate-45" />
                </button>
              </div>

              {/* Send or Voice Record button */}
              {text.trim() ? (
                <button 
                  onClick={() => handleSendText()} 
                  aria-label="Send message"
                  className="shrink-0 h-[44px] w-[44px] rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 transition-transform active:scale-90"
                >
                  <Send size={19} className="ml-0.5" />
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={() => setRecordingVoice(true)} 
                  aria-label="Record voice note"
                  className="shrink-0 h-[44px] w-[44px] rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 transition-transform active:scale-90"
                >
                  <Mic size={22} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Emoji & Sticker Picker Bottom Tray */}
      {showEmojiPicker && (
        <EmojiStickerPicker 
          onSelectEmoji={handleSelectEmoji}
          onSelectSticker={handleSelectSticker}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      {/* Attachment Tray Menu */}
      {showAttachmentMenu && (
        <AttachmentMenu 
          onPickGallery={() => galleryInputRef.current?.click()}
          onPickCamera={handlePickCamera}
          onPickDocument={() => documentInputRef.current?.click()}
          onClose={() => setShowAttachmentMenu(false)}
        />
      )}

      {/* Media Preview Modal before sending */}
      <MediaPreviewModal 
        file={pendingFile}
        isOpen={showMediaPreview}
        uploadProgress={uploadProgress}
        uploadError={uploadError}
        onSend={handleUploadPendingFile}
        onCancel={() => {
          setShowMediaPreview(false);
          setPendingFile(null);
          setUploadProgress(null);
          setUploadError(null);
        }}
        onRetry={() => {
          if (pendingFile) handleUploadPendingFile('');
        }}
      />

      {/* Full-Screen Media Lightbox Viewer */}
      {viewingMedia && (
        <MediaViewerModal 
          mediaUrl={viewingMedia.url}
          mediaType={viewingMedia.type}
          fileName={viewingMedia.name}
          onClose={() => setViewingMedia(null)}
        />
      )}

      {/* Message Action Sheet */}
      {selectedMessage && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs" 
          onClick={() => setSelectedMessage(null)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl pb-[calc(2rem+env(safe-area-inset-bottom))] p-3 animate-in slide-in-from-bottom-full duration-200 border-t border-gray-200 dark:border-gray-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto my-2" />
            <div className="space-y-1">
              <button 
                className="w-full flex items-center gap-4 p-3.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-gray-900 dark:text-gray-100 transition-colors" 
                onClick={() => setSelectedMessage(null)}
              >
                <Reply size={20} /> <span className="font-semibold text-[16px]">Reply</span>
              </button>
              
              {selectedMessage.type === 'text' && (
                <button 
                  className="w-full flex items-center gap-4 p-3.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-gray-900 dark:text-gray-100 transition-colors" 
                  onClick={() => handleCopy(selectedMessage.content)}
                >
                  <Copy size={20} /> <span className="font-semibold text-[16px]">Copy</span>
                </button>
              )}
              
              <button 
                className="w-full flex items-center gap-4 p-3.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-gray-900 dark:text-gray-100 transition-colors" 
                onClick={() => setSelectedMessage(null)}
              >
                <Info size={20} /> <span className="font-semibold text-[16px]">Info</span>
              </button>

              {selectedMessage.senderId === user?.uid && (
                <button 
                  className="w-full flex items-center gap-4 p-3.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-2xl text-red-600 dark:text-red-400 mt-1 transition-colors" 
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                >
                  <Trash2 size={20} /> <span className="font-semibold text-[16px]">Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

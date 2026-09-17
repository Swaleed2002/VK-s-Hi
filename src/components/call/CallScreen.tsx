import { useEffect, useRef, useState } from 'react';
import { useCallStore } from '../../store/useCallStore';
import { Avatar } from '../ui/Avatar';
import { PhoneOff, Phone, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { APP_CONFIG } from '../../config';

export function CallScreen() {
  const { 
    callStatus, 
    incomingCall, 
    activeCallId, 
    localStream, 
    remoteStream, 
    acceptCall, 
    declineCall, 
    endCall,
    toggleMute,
    toggleVideo,
    isMuted,
    isVideoOff
  } = useCallStore();
  
  const { user } = useAuthStore();
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [otherUser, setOtherUser] = useState<any>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Fetch info about the other person in the call
  useEffect(() => {
    const fetchOtherUser = async () => {
      const targetCall = incomingCall?.id || activeCallId;
      if (!targetCall) return;
      
      const callDoc = await getDoc(doc(db, 'calls', targetCall));
      const data = callDoc.data();
      if (!data) return;
      
      const otherId = data.callerId === user?.uid ? data.receiverId : data.callerId;
      const otherDoc = await getDoc(doc(db, 'users', otherId));
      if (otherDoc.exists()) {
        setOtherUser(otherDoc.data());
      }
    };
    
    fetchOtherUser();
  }, [incomingCall, activeCallId, user]);

  if (callStatus === 'idle') return null;

  // Incoming call state
  if (callStatus === 'ringing' && incomingCall) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-gray-900/95 backdrop-blur-xl animate-in slide-in-from-top-full duration-300">
        <div className="flex-1 flex flex-col items-center justify-start pt-24 text-center">
          <Avatar src={otherUser?.avatarUrl} fallback={otherUser?.displayName || 'U'} size="xl" className="h-32 w-32 mb-8 shadow-2xl ring-4 ring-emerald-500/30" />
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">{otherUser?.displayName || 'Incoming Call'}</h2>
          <p className="text-gray-400 text-lg">{APP_CONFIG.name} {incomingCall.type === 'video' ? 'Video' : 'Voice'} Call</p>
        </div>
        
        <div className="pb-16 flex w-full justify-around px-12">
          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={declineCall} 
              className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg flex items-center justify-center transition-transform active:scale-90"
            >
              <PhoneOff size={28} className="text-white" />
            </button>
            <span className="text-white font-medium">Decline</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={acceptCall} 
              className="h-16 w-16 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center animate-bounce transition-transform active:scale-90"
            >
              <Phone size={28} className="text-white" />
            </button>
            <span className="text-white font-medium">Accept</span>
          </div>
        </div>
      </div>
    );
  }

  // Active call state
  const isVideoCall = localStream?.getVideoTracks().length > 0 || remoteStream?.getVideoTracks().length > 0 || incomingCall?.type === 'video' || true;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col animate-in fade-in duration-300">
      
      {/* Remote Video (Full Screen) or Avatar if voice only */}
      <div className="relative flex-1 bg-[#1a1f24] flex items-center justify-center overflow-hidden">
        {remoteStream && remoteStream.getVideoTracks().length > 0 ? (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center text-white">
            <Avatar src={otherUser?.avatarUrl} fallback={otherUser?.displayName || 'U'} size="xl" className="h-40 w-40 mb-8 shadow-2xl" />
            <h2 className="text-3xl font-bold tracking-tight">{otherUser?.displayName || 'Calling...'}</h2>
            <p className="text-emerald-400 mt-3 capitalize font-medium text-lg">{callStatus}...</p>
          </div>
        )}

        {/* Local Video Picture-in-Picture */}
        {localStream && localStream.getVideoTracks().length > 0 && !isVideoOff && (
          <div className="absolute top-[env(safe-area-inset-top)] right-4 mt-4 w-28 h-44 sm:w-32 sm:h-48 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-700/50 z-10">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="bg-[#1a1f24] pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6 flex flex-col items-center">
        <div className="flex items-center justify-center space-x-6 px-8 w-full max-w-md bg-[#242b31] py-4 rounded-[2.5rem]">
          <button 
            onClick={toggleMute}
            className={`h-14 w-14 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-700/50 text-white hover:bg-gray-600'}`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          {isVideoCall && (
            <button 
              onClick={toggleVideo}
              className={`h-14 w-14 rounded-full flex items-center justify-center transition-colors ${isVideoOff ? 'bg-white text-gray-900' : 'bg-gray-700/50 text-white hover:bg-gray-600'}`}
            >
              {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
          )}

          <button 
            onClick={endCall}
            className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg flex items-center justify-center ml-2 transition-transform active:scale-90"
          >
            <PhoneOff size={28} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

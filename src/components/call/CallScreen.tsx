import React, { useEffect, useRef, useState } from 'react';
import { useCallStore } from '../../store/useCallStore';
import { Avatar } from '../ui/Avatar';
import { 
  PhoneOff, 
  Phone, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  SwitchCamera, 
  AlertCircle 
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { APP_CONFIG } from '../../config';

export function CallScreen() {
  const { 
    callStatus, 
    incomingCall, 
    activeCallId, 
    callType,
    localStream, 
    remoteStream, 
    acceptCall, 
    declineCall, 
    endCall, 
    toggleMute, 
    toggleVideo, 
    switchCamera,
    isMuted, 
    isVideoOff,
    callDuration,
    errorMessage,
    clearError
  } = useCallStore();
  
  const { user } = useAuthStore();
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  
  const [otherUser, setOtherUser] = useState<any>(null);

  // Sync local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOff]);

  // Sync remote video and audio streams
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  // Fetch info about the other participant in the call
  useEffect(() => {
    let isMounted = true;
    const fetchOtherUser = async () => {
      const targetCall = incomingCall?.id || activeCallId;
      if (!targetCall) return;
      
      try {
        const callDoc = await getDoc(doc(db, 'calls', targetCall));
        const data = callDoc.data();
        if (!data || !isMounted) return;
        
        const otherId = data.callerId === user?.uid ? data.receiverId : data.callerId;
        if (!otherId) return;

        const otherDoc = await getDoc(doc(db, 'users', otherId));
        if (otherDoc.exists() && isMounted) {
          setOtherUser(otherDoc.data());
        }
      } catch (err) {
        console.warn("Could not fetch user details for call:", err);
      }
    };
    
    fetchOtherUser();
    return () => { isMounted = false; };
  }, [incomingCall, activeCallId, user]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (callStatus === 'idle' && !errorMessage) return null;

  // Render error banner if any
  if (callStatus === 'idle' && errorMessage) {
    return (
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] max-w-sm w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="bg-red-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between text-sm font-medium">
          <div className="flex items-center space-x-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={clearError} className="ml-2 text-white/80 hover:text-white text-xs underline">
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // Incoming call modal
  if (callStatus === 'ringing' && incomingCall) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-gray-950/95 backdrop-blur-xl animate-in slide-in-from-top-full duration-300">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <Avatar 
              src={otherUser?.avatarUrl} 
              fallback={otherUser?.displayName || 'U'} 
              size="xl" 
              className="h-32 w-32 shadow-2xl ring-4 ring-emerald-500/50 relative z-10" 
            />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {otherUser?.displayName || 'Incoming Call'}
          </h2>
          {otherUser?.username && (
            <p className="text-gray-400 text-sm mb-3">@{otherUser.username}</p>
          )}
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium text-sm">
            Incoming {incomingCall.type === 'video' ? 'Video' : 'Voice'} Call
          </span>
        </div>
        
        {/* Call Actions */}
        <div className="pb-16 flex w-full justify-around px-8 max-w-sm mx-auto">
          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={declineCall} 
              aria-label="Decline Call"
              className="h-18 w-18 rounded-full bg-red-600 hover:bg-red-700 shadow-xl flex items-center justify-center transition-transform active:scale-90"
            >
              <PhoneOff size={30} className="text-white" />
            </button>
            <span className="text-white font-medium text-sm">Decline</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={acceptCall} 
              aria-label="Accept Call"
              className="h-18 w-18 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/40 flex items-center justify-center animate-bounce transition-transform active:scale-90"
            >
              <Phone size={30} className="text-white" />
            </button>
            <span className="text-white font-medium text-sm">Accept</span>
          </div>
        </div>
      </div>
    );
  }

  // Active / Outgoing call UI
  const isVideo = callType === 'video';
  const isConnected = callStatus === 'connected';

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col animate-in fade-in duration-300">
      
      {/* Hidden audio element to ensure remote audio playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Main Call Viewport */}
      <div className="relative flex-1 bg-[#12181f] flex items-center justify-center overflow-hidden">
        
        {/* Error notification banner in call */}
        {errorMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-sm w-full px-4">
            <div className="bg-red-600 text-white px-4 py-2 rounded-xl shadow-lg text-center text-sm font-medium">
              {errorMessage}
            </div>
          </div>
        )}

        {/* Remote Video Stream if active and video enabled */}
        {isVideo && isConnected && remoteStream && remoteStream.getVideoTracks().length > 0 ? (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        ) : (
          /* Voice call or before remote video connects */
          <div className="flex flex-col items-center text-white px-6 text-center z-10">
            <Avatar 
              src={otherUser?.avatarUrl} 
              fallback={otherUser?.displayName || 'U'} 
              size="xl" 
              className="h-36 w-36 mb-6 shadow-2xl ring-4 ring-white/10" 
            />
            <h2 className="text-3xl font-bold tracking-tight mb-1">
              {otherUser?.displayName || 'Connecting...'}
            </h2>
            {otherUser?.username && (
              <p className="text-gray-400 text-sm mb-4">@{otherUser.username}</p>
            )}
            
            <div className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-emerald-400 font-mono text-sm tracking-wide">
              {isConnected ? (
                <span>Connected • {formatDuration(callDuration)}</span>
              ) : callStatus === 'initiating' ? (
                <span className="animate-pulse">Calling...</span>
              ) : (
                <span className="animate-pulse capitalize">{callStatus}...</span>
              )}
            </div>
          </div>
        )}

        {/* Local Video Picture-in-Picture */}
        {isVideo && localStream && !isVideoOff && (
          <div className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-4 w-28 h-40 sm:w-36 sm:h-52 bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-20">
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

      {/* In-Call Controls Bar */}
      <div className="bg-[#12181f] pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4 px-6 flex flex-col items-center border-t border-white/5">
        <div className="flex items-center justify-center space-x-4 sm:space-x-6 px-6 py-3 w-full max-w-sm bg-white/10 backdrop-blur-lg rounded-[2.5rem]">
          
          {/* Mute Microphone */}
          <button 
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            className={`h-13 w-13 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              isMuted 
                ? 'bg-red-500 text-white shadow-lg' 
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          
          {/* Video Toggle (Only for video calls) */}
          {isVideo && (
            <>
              <button 
                onClick={toggleVideo}
                aria-label={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                className={`h-13 w-13 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                  isVideoOff 
                    ? 'bg-red-500 text-white shadow-lg' 
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
              </button>

              {/* Flip Camera */}
              <button 
                onClick={switchCamera}
                aria-label="Switch Camera"
                className="h-13 w-13 rounded-full bg-white/15 text-white hover:bg-white/25 flex items-center justify-center transition-all active:scale-95"
              >
                <SwitchCamera size={22} />
              </button>
            </>
          )}

          {/* End Call Button */}
          <button 
            onClick={endCall}
            aria-label="End Call"
            className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 shadow-xl shadow-red-600/40 flex items-center justify-center ml-2 transition-transform active:scale-90"
          >
            <PhoneOff size={26} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

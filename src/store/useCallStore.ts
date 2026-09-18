import { create } from 'zustand';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  query, 
  where,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuthStore';
import { callSounds } from '../lib/callSounds';

export type CallStatus = 'idle' | 'initiating' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'declined' | 'busy' | 'missed';

interface CallState {
  activeCallId: string | null;
  incomingCall: any | null;
  callType: 'voice' | 'video';
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  callStatus: CallStatus;
  isMuted: boolean;
  isVideoOff: boolean;
  isFacingUser: boolean;
  callDuration: number;
  errorMessage: string | null;

  initializeListener: () => void;
  startCall: (receiverId: string, isVideo: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  switchCamera: () => Promise<void>;
  clearError: () => void;
}

const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
};

let incomingCallUnsub: Unsubscribe | null = null;
let activeCallDocUnsub: Unsubscribe | null = null;
let candidatesUnsub: Unsubscribe | null = null;
let callTimer: any = null;
let durationInterval: any = null;
let candidateQueue: RTCIceCandidateInit[] = [];

export const useCallStore = create<CallState>((set, get) => ({
  activeCallId: null,
  incomingCall: null,
  callType: 'voice',
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  callStatus: 'idle',
  isMuted: false,
  isVideoOff: false,
  isFacingUser: true,
  callDuration: 0,
  errorMessage: null,

  clearError: () => set({ errorMessage: null }),

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // inverted: if currently muted, enable it
      });
      set({ isMuted: !isMuted });
    }
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff; // inverted
      });
      set({ isVideoOff: !isVideoOff });
    }
  },

  switchCamera: async () => {
    const { localStream, isFacingUser, peerConnection, callType } = get();
    if (callType !== 'video' || !localStream) return;

    try {
      const nextFacing = !isFacingUser;
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: { facingMode: nextFacing ? 'user' : 'environment' }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newVideoTrack = newStream.getVideoTracks()[0];

      if (peerConnection && newVideoTrack) {
        const senders = peerConnection.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        }
      }

      // Stop old video track
      localStream.getVideoTracks().forEach(t => t.stop());
      localStream.removeTrack(localStream.getVideoTracks()[0]);
      localStream.addTrack(newVideoTrack);

      set({ isFacingUser: nextFacing, localStream: new MediaStream(localStream.getTracks()) });
    } catch (e: any) {
      console.warn("Could not switch camera:", e);
    }
  },

  initializeListener: () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    // Prevent duplicate listeners
    if (incomingCallUnsub) {
      incomingCallUnsub();
      incomingCallUnsub = null;
    }

    const q = query(
      collection(db, 'calls'),
      where('receiverId', '==', user.uid),
      where('status', '==', 'initiating')
    );

    incomingCallUnsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const callData = change.doc.data();
          const currentStatus = get().callStatus;

          if (currentStatus === 'idle') {
            // New incoming call
            callSounds.playIncoming();
            set({ 
              incomingCall: { id: change.doc.id, ...callData }, 
              callStatus: 'ringing',
              callType: callData.type === 'video' ? 'video' : 'voice'
            });

            // Listen to this specific call document for caller cancellation
            const singleCallUnsub = onSnapshot(doc(db, 'calls', change.doc.id), (docSnap) => {
              const data = docSnap.data();
              if (data && (data.status === 'cancelled' || data.status === 'ended' || data.status === 'missed')) {
                callSounds.stop();
                singleCallUnsub();
                set({ incomingCall: null, callStatus: 'idle' });
              }
            });
          } else if (get().activeCallId !== change.doc.id) {
            // Already busy on another call
            updateDoc(doc(db, 'calls', change.doc.id), { status: 'busy' }).catch(() => {});
          }
        }
      });
    });
  },

  startCall: async (receiverId: string, isVideo: boolean) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    // Reset previous state
    candidateQueue = [];
    callSounds.playOutgoing();
    set({ 
      callStatus: 'initiating', 
      callType: isVideo ? 'video' : 'voice', 
      errorMessage: null,
      callDuration: 0,
      isMuted: false,
      isVideoOff: false
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: isVideo ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false 
      });
      set({ localStream: stream });

      const pc = new RTCPeerConnection(rtcConfig);
      set({ peerConnection: pc });

      // Add local tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote tracks
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          set({ remoteStream: event.streams[0] });
        }
      };

      // Connection state monitoring
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          callSounds.stop();
          set({ callStatus: 'connected' });
          if (!durationInterval) {
            durationInterval = setInterval(() => {
              set(s => ({ callDuration: s.callDuration + 1 }));
            }, 1000);
          }
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          get().endCall();
        }
      };

      // Create Firestore call document
      const callDocRef = await addDoc(collection(db, 'calls'), {
        callerId: user.uid,
        receiverId,
        type: isVideo ? 'video' : 'voice',
        status: 'initiating',
        createdAt: serverTimestamp()
      });

      set({ activeCallId: callDocRef.id });

      // Set timeout for unanswered call (45 seconds)
      if (callTimer) clearTimeout(callTimer);
      callTimer = setTimeout(async () => {
        if (get().callStatus === 'initiating') {
          callSounds.stop();
          await updateDoc(callDocRef, { status: 'missed' }).catch(() => {});
          set({ errorMessage: 'Call timed out (no answer).' });
          setTimeout(() => get().endCall(), 2000);
        }
      }, 45000);

      // Local ICE candidates -> Firestore
      const callerCandidatesCol = collection(db, `calls/${callDocRef.id}/callerCandidates`);
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(callerCandidatesCol, event.candidate.toJSON()).catch(console.warn);
        }
      };

      // Create offer
      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      await updateDoc(callDocRef, {
        offer: {
          sdp: offerDescription.sdp,
          type: offerDescription.type
        }
      });

      // Listen for remote answer and status changes
      activeCallDocUnsub = onSnapshot(callDocRef, async (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        if (data.status === 'declined') {
          callSounds.stop();
          set({ errorMessage: 'Call was declined.' });
          setTimeout(() => get().endCall(), 2000);
          return;
        }

        if (data.status === 'busy') {
          callSounds.stop();
          set({ errorMessage: 'User is busy on another call.' });
          setTimeout(() => get().endCall(), 2500);
          return;
        }

        if (data.status === 'ended') {
          callSounds.stop();
          get().endCall();
          return;
        }

        if (data.answer && !pc.currentRemoteDescription) {
          if (callTimer) {
            clearTimeout(callTimer);
            callTimer = null;
          }
          callSounds.stop();
          const answerDescription = new RTCSessionDescription(data.answer);
          await pc.setRemoteDescription(answerDescription);

          // Drain queued candidates
          while (candidateQueue.length > 0) {
            const cand = candidateQueue.shift();
            if (cand) {
              await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.warn);
            }
          }

          set({ callStatus: 'connected' });
        }
      });

      // Listen for receiver candidates
      const receiverCandidatesCol = collection(db, `calls/${callDocRef.id}/receiverCandidates`);
      candidatesUnsub = onSnapshot(receiverCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const candidateData = change.doc.data();
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(candidateData)).catch(console.warn);
            } else {
              candidateQueue.push(candidateData);
            }
          }
        });
      });

    } catch (e: any) {
      callSounds.stop();
      console.error('Failed to start call:', e);
      let msg = 'Failed to access camera/microphone.';
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        msg = 'Camera or microphone permission denied. Please allow device access.';
      } else if (e.name === 'NotFoundError') {
        msg = 'No microphone or camera detected on this device.';
      }
      set({ errorMessage: msg });
      setTimeout(() => get().endCall(), 3000);
    }
  },

  acceptCall: async () => {
    const { incomingCall } = get();
    const user = useAuthStore.getState().user;
    if (!incomingCall || !user) return;

    callSounds.stop();
    candidateQueue = [];
    const isVideo = incomingCall.type === 'video';

    set({ 
      callStatus: 'connecting', 
      activeCallId: incomingCall.id, 
      callType: isVideo ? 'video' : 'voice',
      incomingCall: null,
      errorMessage: null,
      callDuration: 0,
      isMuted: false,
      isVideoOff: false
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false
      });
      set({ localStream: stream });

      const pc = new RTCPeerConnection(rtcConfig);
      set({ peerConnection: pc });

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          set({ remoteStream: event.streams[0] });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          set({ callStatus: 'connected' });
          if (!durationInterval) {
            durationInterval = setInterval(() => {
              set(s => ({ callDuration: s.callDuration + 1 }));
            }, 1000);
          }
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          get().endCall();
        }
      };

      const callDocRef = doc(db, 'calls', incomingCall.id);

      // Local ICE candidates -> Firestore
      const receiverCandidatesCol = collection(db, `calls/${incomingCall.id}/receiverCandidates`);
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(receiverCandidatesCol, event.candidate.toJSON()).catch(console.warn);
        }
      };

      // Read offer and create answer
      const callData = (await getDoc(callDocRef)).data();
      if (callData?.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

        // Drain queued caller candidates
        while (candidateQueue.length > 0) {
          const cand = candidateQueue.shift();
          if (cand) {
            await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.warn);
          }
        }

        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        await updateDoc(callDocRef, {
          answer: {
            type: answerDescription.type,
            sdp: answerDescription.sdp
          },
          status: 'connected',
          answeredAt: serverTimestamp()
        });

        set({ callStatus: 'connected' });
      }

      // Listen for caller candidates
      const callerCandidatesCol = collection(db, `calls/${incomingCall.id}/callerCandidates`);
      candidatesUnsub = onSnapshot(callerCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const candidateData = change.doc.data();
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(candidateData)).catch(console.warn);
            } else {
              candidateQueue.push(candidateData);
            }
          }
        });
      });

      // Listen for call termination
      activeCallDocUnsub = onSnapshot(callDocRef, (snapshot) => {
        const data = snapshot.data();
        if (data?.status === 'ended' || data?.status === 'cancelled') {
          get().endCall();
        }
      });

    } catch (e: any) {
      callSounds.stop();
      console.error('Failed to accept call:', e);
      let msg = 'Failed to access camera/microphone.';
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        msg = 'Camera or microphone permission denied. Please allow device access.';
      }
      set({ errorMessage: msg });
      setTimeout(() => get().endCall(), 3000);
    }
  },

  declineCall: async () => {
    callSounds.stop();
    const { incomingCall } = get();
    if (incomingCall) {
      try {
        await updateDoc(doc(db, 'calls', incomingCall.id), { 
          status: 'declined',
          endedAt: serverTimestamp()
        });
      } catch (e) {
        console.warn('Decline error:', e);
      }
      set({ incomingCall: null, callStatus: 'idle' });
    }
  },

  endCall: async () => {
    callSounds.stop();
    if (callTimer) {
      clearTimeout(callTimer);
      callTimer = null;
    }
    if (durationInterval) {
      clearInterval(durationInterval);
      durationInterval = null;
    }

    if (activeCallDocUnsub) {
      activeCallDocUnsub();
      activeCallDocUnsub = null;
    }
    if (candidatesUnsub) {
      candidatesUnsub();
      candidatesUnsub = null;
    }

    const { activeCallId, peerConnection, localStream, remoteStream, callDuration } = get();

    if (activeCallId) {
      updateDoc(doc(db, 'calls', activeCallId), {
        status: 'ended',
        endedAt: serverTimestamp(),
        durationSec: callDuration
      }).catch(() => {});
    }

    if (peerConnection) {
      try {
        peerConnection.close();
      } catch (e) {}
    }

    if (localStream) {
      localStream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
    }

    candidateQueue = [];

    set({
      activeCallId: null,
      incomingCall: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      callStatus: 'idle',
      isMuted: false,
      isVideoOff: false,
      callDuration: 0
    });
  }
}));

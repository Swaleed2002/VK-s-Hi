import { create } from 'zustand';
import { collection, doc, onSnapshot, setDoc, getDoc, updateDoc, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuthStore';

// We need a global store to listen for incoming calls and manage the current active call.

interface CallState {
  activeCallId: string | null;
  incomingCall: any | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  callStatus: 'idle' | 'initiating' | 'ringing' | 'connecting' | 'connected' | 'ended';
  isMuted: boolean;
  isVideoOff: boolean;
  
  initializeListener: () => void;
  startCall: (receiverId: string, isVideo: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
}

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export const useCallStore = create<CallState>((set, get) => ({
  activeCallId: null,
  incomingCall: null,
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  callStatus: 'idle',
  isMuted: false,
  isVideoOff: false,

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      set({ isMuted: !isMuted });
    }
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
      set({ isVideoOff: !isVideoOff });
    }
  },

  initializeListener: () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    // Listen for incoming calls where receiverId == user.uid and status == 'initiating'
    const q = query(
      collection(db, 'calls'),
      where('receiverId', '==', user.uid),
      where('status', '==', 'initiating')
    );

    onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const callData = change.doc.data();
          // We got an incoming call!
          if (get().callStatus === 'idle') {
            set({ incomingCall: { id: change.doc.id, ...callData }, callStatus: 'ringing' });
          } else {
            // Already in a call, mark this as busy/missed
            updateDoc(doc(db, 'calls', change.doc.id), { status: 'busy' });
          }
        }
      });
    });
  },

  startCall: async (receiverId: string, isVideo: boolean) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    set({ callStatus: 'initiating' });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideo });
      set({ localStream: stream });

      const pc = new RTCPeerConnection(configuration);
      set({ peerConnection: pc });

      // Add local tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Listen for remote tracks
      pc.ontrack = (event) => {
        set({ remoteStream: event.streams[0] });
      };

      // Create call document
      const callDoc = await addDoc(collection(db, 'calls'), {
        callerId: user.uid,
        receiverId,
        type: isVideo ? 'video' : 'voice',
        status: 'initiating',
        createdAt: serverTimestamp(),
      });
      
      set({ activeCallId: callDoc.id });

      // Listen for ICE candidates from local and send to DB
      const callerCandidatesCol = collection(db, `calls/${callDoc.id}/callerCandidates`);
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(callerCandidatesCol, event.candidate.toJSON());
        }
      };

      // Create offer
      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };

      await updateDoc(callDoc, { offer });

      // Listen for answer and receiver ICE candidates
      onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (!pc.currentRemoteDescription && data?.answer) {
          const answerDescription = new RTCSessionDescription(data.answer);
          pc.setRemoteDescription(answerDescription);
          set({ callStatus: 'connected' });
        }
        
        if (data?.status === 'ended' || data?.status === 'declined' || data?.status === 'cancelled') {
           get().endCall();
        }
      });

      const receiverCandidatesCol = collection(db, `calls/${callDoc.id}/receiverCandidates`);
      onSnapshot(receiverCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.addIceCandidate(candidate);
          }
        });
      });

    } catch (e) {
      console.error('Failed to start call', e);
      get().endCall();
    }
  },

  acceptCall: async () => {
    const { incomingCall } = get();
    const user = useAuthStore.getState().user;
    if (!incomingCall || !user) return;

    set({ callStatus: 'connecting', activeCallId: incomingCall.id });
    
    try {
      const isVideo = incomingCall.type === 'video';
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideo });
      set({ localStream: stream });

      const pc = new RTCPeerConnection(configuration);
      set({ peerConnection: pc });

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        set({ remoteStream: event.streams[0] });
      };

      const callDoc = doc(db, 'calls', incomingCall.id);
      
      const receiverCandidatesCol = collection(db, `calls/${incomingCall.id}/receiverCandidates`);
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(receiverCandidatesCol, event.candidate.toJSON());
        }
      };

      const callData = (await getDoc(callDoc)).data();
      if (callData?.offer) {
        const offerDescription = new RTCSessionDescription(callData.offer);
        await pc.setRemoteDescription(offerDescription);

        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        const answer = {
          type: answerDescription.type,
          sdp: answerDescription.sdp,
        };

        await updateDoc(callDoc, { answer, status: 'connected' });
        set({ callStatus: 'connected', incomingCall: null });
      }

      const callerCandidatesCol = collection(db, `calls/${incomingCall.id}/callerCandidates`);
      onSnapshot(callerCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.addIceCandidate(candidate);
          }
        });
      });
      
      // Listen for call ending
      onSnapshot(callDoc, (snapshot) => {
         if (snapshot.data()?.status === 'ended') {
            get().endCall();
         }
      });

    } catch (e) {
      console.error('Failed to accept call', e);
      get().endCall();
    }
  },

  declineCall: async () => {
    const { incomingCall } = get();
    if (incomingCall) {
      await updateDoc(doc(db, 'calls', incomingCall.id), { status: 'declined' });
      set({ incomingCall: null, callStatus: 'idle' });
    }
  },

  endCall: async () => {
    const { activeCallId, peerConnection, localStream, remoteStream } = get();
    
    if (activeCallId) {
       // Best effort update
       updateDoc(doc(db, 'calls', activeCallId), { 
         status: 'ended', 
         endedAt: serverTimestamp() 
       }).catch(console.error);
    }

    if (peerConnection) {
      peerConnection.close();
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }

    set({
      activeCallId: null,
      incomingCall: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      callStatus: 'idle',
      isMuted: false,
      isVideoOff: false,
    });
  }
}));

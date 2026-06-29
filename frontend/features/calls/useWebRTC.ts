import { useRef, useCallback, useEffect } from 'react';
import { getSocket } from '@/services/socket';
import { logger } from '@/services/api';
import { useCallStore } from './callStore';
import { endCall as endCallApi } from './callsApi';

// Lazy imports for WebRTC to reduce bundle size
let WebRTC: any = null;
const getWebRTC = () => {
  if (!WebRTC) {
    WebRTC = require('react-native-webrtc');
  }
  return WebRTC;
};

type RTCPeerConnection = any;
type RTCIceCandidate = any;
type RTCSessionDescription = any;
type MediaStream = any;
type MediaStreamConstraints = any;
type MediaStreamTrack = any;
type RTCPeerConnectionIceEvent = any;
type RTCTrackEvent = any;

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

const PC_CONFIG = {
  iceServers: ICE_SERVERS,
  iceTransportPolicy: 'all' as const,
};

export function useWebRTC() {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceCandidateBufferRef = useRef<RTCIceCandidate[]>([]);

  const state = useCallStore((s) => s.state);
  const type = useCallStore((s) => s.type);
  const role = useCallStore((s) => s.role);
  const callId = useCallStore((s) => s.callId);
  const recipientId = useCallStore((s) => s.recipientId);
  const recipientName = useCallStore((s) => s.recipientName);
  const conversationId = useCallStore((s) => s.conversationId);
  const muted = useCallStore((s) => s.muted);
  const videoEnabled = useCallStore((s) => s.videoEnabled);
  const speakerEnabled = useCallStore((s) => s.speakerEnabled);
  const setCallState = useCallStore((s) => s.setCallState);
  const setLocalStream = useCallStore((s) => s.setLocalStream);
  const setRemoteStream = useCallStore((s) => s.setRemoteStream);
  const setMuted = useCallStore((s) => s.setMuted);
  const setVideoEnabled = useCallStore((s) => s.setVideoEnabled);
  const setSpeakerEnabled = useCallStore((s) => s.setSpeakerEnabled);
  const setStartedAt = useCallStore((s) => s.setStartedAt);
  const reset = useCallStore((s) => s.reset);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current && typeof pcRef.current.close === 'function') {
      try {
        pcRef.current.close();
      } catch (err) {
        logger.error('[WebRTC] Error closing peer connection:', err);
      }
      pcRef.current = null;
    }
    iceCandidateBufferRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
  }, [setLocalStream, setRemoteStream]);

  const getLocalStream = useCallback(async (isVideo: boolean): Promise<MediaStream> => {
    const webrtc = getWebRTC();
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: isVideo
        ? {
            facingMode: 'user',
            width: { min: 320, ideal: 640 },
            height: { min: 240, ideal: 480 },
          }
        : false,
    };

    const stream = await webrtc.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, [setLocalStream]);

  const createPeerConnection = useCallback((): RTCPeerConnection => {
    const webrtc = getWebRTC();
    const pc = new webrtc.RTCPeerConnection(PC_CONFIG);

    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        const socket = getSocket();
        if (socket) {
          socket.emit('call:ice-candidate', {
            recipientId,
            candidate: event.candidate.toJSON(),
          });
        }
      }
    };

    pc.ontrack = (event: RTCTrackEvent) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      const connState = pc.connectionState;
      if (connState === 'connected') {
        setCallState('connected');
        setStartedAt(Date.now());
      } else if (connState === 'disconnected' || connState === 'failed') {
        setCallState('ended');
      }
    };

    return pc;
  }, [recipientId, setRemoteStream, setCallState, setStartedAt]);

  const startOutgoingCall = useCallback(async () => {
    try {
      const stream = await getLocalStream(type === 'video');
      const pc = createPeerConnection();

      stream.getTracks().forEach((track: MediaStreamTrack) => {
        pc.addTrack(track, stream);
      });

      pcRef.current = pc;

      const offer = await pc.createOffer();
      const webrtc = getWebRTC();
      await pc.setLocalDescription(new webrtc.RTCSessionDescription(offer));

      const socket = getSocket();
      if (socket && callId) {
        socket.emit('call:offer', {
          callId,
          recipientId,
          sdp: offer,
        });
      }
    } catch (err) {
      logger.error('[WebRTC] startOutgoingCall error:', err);
      setCallState('ended');
    }
  }, [type, callId, recipientId, getLocalStream, createPeerConnection, setCallState]);

  const acceptIncomingCall = useCallback(async () => {
    try {
      const stream = await getLocalStream(type === 'video');
      const pc = createPeerConnection();

      stream.getTracks().forEach((track: MediaStreamTrack) => {
        pc.addTrack(track, stream);
      });

      pcRef.current = pc;
      setCallState('connecting');

      const socket = getSocket();
      if (socket) {
        socket.emit('call:answer', {
          callId,
          callerId: recipientId,
          sdp: null,
        });
      }
    } catch (err) {
      logger.error('[WebRTC] acceptIncomingCall error:', err);
      setCallState('ended');
    }
  }, [type, callId, recipientId, getLocalStream, createPeerConnection, setCallState]);

  const handleRemoteOffer = useCallback(async (sdp: RTCSessionDescriptionInit) => {
    if (!pcRef.current) {
      const stream = await getLocalStream(type === 'video');
      const pc = createPeerConnection();
      stream.getTracks().forEach((track: MediaStreamTrack) => {
        pc.addTrack(track, stream);
      });
      pcRef.current = pc;
    }

    const pc = pcRef.current;
    const webrtc = getWebRTC();
    await pc.setRemoteDescription(new webrtc.RTCSessionDescription(sdp));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(new webrtc.RTCSessionDescription(answer));

    const socket = getSocket();
    if (socket) {
      socket.emit('call:answer', {
        callId,
        callerId: recipientId,
        sdp: answer,
      });
    }

    iceCandidateBufferRef.current.forEach((candidate) => {
      pc.addIceCandidate(candidate).catch(() => {});
    });
    iceCandidateBufferRef.current = [];
  }, [type, callId, recipientId, getLocalStream, createPeerConnection]);

  const handleRemoteAnswer = useCallback(async (sdp: RTCSessionDescriptionInit) => {
    if (!pcRef.current) return;
    const webrtc = getWebRTC();
    await pcRef.current.setRemoteDescription(new webrtc.RTCSessionDescription(sdp));
  }, []);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const webrtc = getWebRTC();
    const iceCandidate = new webrtc.RTCIceCandidate(candidate);
    if (pcRef.current && pcRef.current.remoteDescription) {
      await pcRef.current.addIceCandidate(iceCandidate);
    } else {
      iceCandidateBufferRef.current.push(iceCandidate);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    const newMuted = !muted;
    audioTracks.forEach((track: MediaStreamTrack) => {
      track.enabled = !newMuted;
    });
    setMuted(newMuted);
  }, [muted, setMuted]);

  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    const newEnabled = !videoEnabled;
    videoTracks.forEach((track: MediaStreamTrack) => {
      track.enabled = newEnabled;
    });
    setVideoEnabled(newEnabled);
  }, [videoEnabled, setVideoEnabled]);

  const toggleSpeaker = useCallback(() => {
    setSpeakerEnabled(!speakerEnabled);
  }, [speakerEnabled, setSpeakerEnabled]);

  const endCall = useCallback(async () => {
    const socket = getSocket();
    if (socket && callId && recipientId) {
      socket.emit('call:end', { callId, recipientId });
    }
    if (callId) {
      const duration = useCallStore.getState().startedAt
        ? Math.floor((Date.now() - useCallStore.getState().startedAt!) / 1000)
        : undefined;
      try {
        await endCallApi(callId, 'ended', duration);
      } catch {
        // silent
      }
    }
    cleanup();
    setCallState('ended');
    setTimeout(() => reset(), 500);
  }, [callId, recipientId, cleanup, setCallState, reset]);

  const rejectCall = useCallback(async () => {
    const socket = getSocket();
    if (socket && callId && recipientId) {
      socket.emit('call:reject', { callId, callerId: recipientId });
    }
    if (callId) {
      try {
        await endCallApi(callId, 'rejected');
      } catch {
        // silent
      }
    }
    cleanup();
    setCallState('ended');
    setTimeout(() => reset(), 500);
  }, [callId, recipientId, cleanup, setCallState, reset]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    state,
    type,
    role,
    callId,
    recipientId,
    recipientName,
    conversationId,
    muted,
    videoEnabled,
    speakerEnabled,
    localStream: localStreamRef.current,
    startOutgoingCall,
    acceptIncomingCall,
    handleRemoteOffer,
    handleRemoteAnswer,
    handleIceCandidate,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    endCall,
    rejectCall,
    cleanup,
  };
}

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import createAgoraRtcEngine, {
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RtcConnection,
  UserOfflineReasonType,
  requestCallPermissions,
} from '../services/agoraService';

import {
  subscribeToCallSession,
  updateCallSession,
  CallSession,
  executeCallTransfer,
  recordCallRecord,
  updateCreatorRating
} from '../services/firebaseService';
import { useAuth } from './AuthContext';

interface CallContextType {
  activeCall: CallSession | null;
  isMinimized: boolean;
  seconds: number;
  remoteUid: number | null;
  isMuted: boolean;
  isSpeaker: boolean;
  isCameraOn: boolean;
  showRatingModal: boolean;
  userRating: number;
  engine: IRtcEngine | null;
  isEngineReady: boolean;
  startCall: (sessionId: string, role: 'caller' | 'receiver', type: 'audio' | 'video') => Promise<void>;
  endCall: () => Promise<void>;
  minimizeCall: () => void;
  restoreCall: () => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  toggleCamera: () => void;
  setUserRating: (rating: number) => void;
  submitRating: (rating: number, reason?: string) => Promise<boolean>;
  skipRating: () => void;
  isSubmittingRating: boolean;
  lastCallData: { id: string; receiverId: string; type: string; receiverName?: string; receiverAvatar?: string | null; role?: string } | null;
  lastSignal: { type: string; data: any; timestamp: number } | null;
  sendCallSignal: (type: string, data: any) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || '';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const fetchAgoraToken = async (channelName: string, uid: number = 0) => {
  if (!BACKEND_URL) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch(`${BACKEND_URL}/api/agora/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelName, uid, role: 'publisher' }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await response.json();
    return data.token;
  } catch (err) {
    console.error('[Agora Context] Failed to fetch token:', err);
    return null;
  }
};



export const CallProvider = ({ children }: { children?: React.ReactNode }) => {
  const router = useRouter();
  const { appUser } = useAuth();

  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [callRole, setCallRole] = useState<'caller' | 'receiver' | null>(null);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [lastCallData, setLastCallData] = useState<{ id: string; receiverId: string; type: string; receiverName?: string; receiverAvatar?: string | null; role?: string } | null>(null);
  const [lastSignal, setLastSignal] = useState<{ type: string; data: any; timestamp: number } | null>(null);

  const engine = useRef<IRtcEngine | null>(null);
  const dataStreamId = useRef<number>(-1);
  const billingCountRef = React.useRef(0);
  const lastBilledSecondRef = React.useRef(-1);
  const hasCallStartedRef = useRef(false);
  const wasAcceptedRef = useRef(false);
  const sessionUnsubscribe = useRef<(() => void) | null>(null);
  const pendingSessionId = useRef<string | null>(null);

  // Helper: Cleanup call resources
  const cleanupCall = React.useCallback(() => {
    engine.current?.leaveChannel();
    engine.current?.release();
    engine.current = null;
    setActiveCall(null);
    setIsMinimized(false);
    setSeconds(0);
    setRemoteUid(null);
    setIsEngineReady(false);
    setIsTimerRunning(false);
    pendingSessionId.current = null;

    if (sessionUnsubscribe.current) {
      sessionUnsubscribe.current();
      sessionUnsubscribe.current = null;
    }
    dataStreamId.current = -1;
    setLastSignal(null);
  }, []);

  // Timer logic - start only when both connected and signaled
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      hasCallStartedRef.current = true;
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Caller (Master) starts the timer when connected - using "Pulse Start" for reliability
  useEffect(() => {
    let pulseInterval: any;
    if (callRole === 'caller' && remoteUid !== null && !isTimerRunning) {
      console.log('[Agora Context] Unified Start: Pulsing TIMER_START signal...');
      setIsTimerRunning(true);
      wasAcceptedRef.current = true;
      
      let count = 0;
      pulseInterval = setInterval(() => {
        sendCallSignal('TIMER_START', { timestamp: Date.now() });
        count++;
        if (count >= 5) {
          clearInterval(pulseInterval);
        }
      }, 1000);
    }
    return () => {
      if (pulseInterval) clearInterval(pulseInterval);
    };
  }, [callRole, activeCall?.status, remoteUid, isTimerRunning]);

  // Receiver (Slave) Fail-safe: start timer after 5s of connection if master signal missed
  useEffect(() => {
    let failSafeTimeout: any;
    if (callRole === 'receiver' && remoteUid !== null && !isTimerRunning) {
      failSafeTimeout = setTimeout(() => {
        if (!isTimerRunning) {
          console.warn('[Agora Context] Master signal missed; starting timer immediately.');
          setIsTimerRunning(true);
        }
      }, 0);
    }
    return () => {
      if (failSafeTimeout) clearTimeout(failSafeTimeout);
    };
  }, [callRole, remoteUid, isTimerRunning]);


  const handleCallTermination = React.useCallback(async (session: CallSession | null, role: 'caller' | 'receiver') => {
    if (!activeCall && !session) return;
    
    // Store data needed for rating screen
    const dataToStore = session || activeCall;
    let targetDetails = null;

    if (dataToStore) {
      targetDetails = { 
        id: dataToStore.id, 
        receiverId: role === 'caller' ? dataToStore.receiverId : dataToStore.callerId, 
        type: dataToStore.type,
        receiverName: role === 'caller' ? dataToStore.receiverName : dataToStore.callerName,
        receiverAvatar: (role === 'caller' ? dataToStore.receiverAvatar : dataToStore.callerAvatar) || null,
        role: role
      };
      setLastCallData(targetDetails);
    }

    const hasStarted = hasCallStartedRef.current;
    const wasAccepted = wasAcceptedRef.current || (dataToStore?.status === 'accepted');
    
    console.log(`[Termination] Role: ${role}, hasStarted: ${hasStarted}, wasAccepted: ${wasAccepted}, activeStatus: ${dataToStore?.status}`);
    
    cleanupCall();

    if ((hasStarted || wasAccepted) && targetDetails) {
      console.log(`[Rating] Redirecting ${role} to rating screen for participant ${targetDetails.receiverId}`);
      router.replace({
        pathname: '/call/rate',
        params: targetDetails
      });
    } else {
      console.log(`[Rating] Skipping rating for ${role}. Reason: Not started/accepted. Redirecting to dashboard.`);
      router.replace(role === 'caller' ? '/(men)' : '/(women)');
    }
  }, [activeCall, cleanupCall, router]);

  const endCall = React.useCallback(async () => {
    if (activeCall) {
      const sessionId = activeCall.id;
      const type = activeCall.type;
      const durationSecs = seconds;
      const billingMins = billingCountRef.current;
      const role = callRole;
      const hasStarted = hasCallStartedRef.current;

      await updateCallSession(sessionId, 'ended');

      if (role === 'caller' && hasStarted) {
        const amount = type === 'audio' ? 10 : 60;
        // Use either the actual billed minutes, or at least 1 minute if the call connected
        const finalTalkMinutes = Math.max(1, billingMins);
        
        console.log(`[Agora Context] Finalizing stats for ${role}: Talk Time: ${finalTalkMinutes}m, Total Calls: +1`);
        
        await recordCallRecord({
          callerId: activeCall.callerId,
          callerName: activeCall.callerName,
          callerAvatar: activeCall.callerAvatar,
          receiverId: activeCall.receiverId,
          receiverName: activeCall.receiverName,
          receiverAvatar: activeCall.receiverAvatar,
          duration: (Math.floor(durationSecs / 60)).toString().padStart(2, '0') + ":" + (durationSecs % 60).toString().padStart(2, '0'),
          durationInMinutes: finalTalkMinutes,
          cost: billingMins * amount, // User only pays for billed minutes
          type: type as 'audio' | 'video',
          timestamp: null
        });
      }
      
      handleCallTermination(activeCall, role as 'caller' | 'receiver');
    } else {
      cleanupCall();
      if (router.canGoBack()) router.back();
      else router.replace('/(men)');
    }
  }, [activeCall, seconds, callRole, router, cleanupCall, handleCallTermination]);
  
  // Billing Logic (Recurring with grace periods)
  useEffect(() => {
    if (callRole === 'caller' && activeCall?.status === 'accepted' && remoteUid !== null) {
      const isVideo = activeCall.type === 'video';
      const amount = isVideo ? 60 : 10;
      
      let shouldBill = false;
      const currentMinute = Math.floor(seconds / 60);
      
      if (isVideo) {
        // Video: Bill at the 60s mark of every minute (60, 120, 180...)
        if (seconds > 0 && seconds % 60 === 0 && currentMinute > billingCountRef.current) {
          shouldBill = true;
        }
      } else {
        // Audio: Bill at the 10s mark of every minute (10, 70, 130...)
        if (seconds % 60 === 10 && currentMinute >= billingCountRef.current) {
          shouldBill = true;
        }
      }

      // Check if we already processed this specific second to prevent double-billing due to state updates
      if (shouldBill && lastBilledSecondRef.current !== seconds) {
        if (appUser && appUser.coins < amount) {
          Alert.alert('Insufficient Balance', 'Your call ended due to insufficient gold.');
          endCall();
          return;
        }
        
        lastBilledSecondRef.current = seconds; // Lock this second immediately

        const performDeduction = async () => {
          console.log(`[Billing] Starting deduction for ${activeCall.type} at ${seconds}s (billing count: ${billingCountRef.current})`);
          const success = await executeCallTransfer(activeCall.callerId, activeCall.receiverId, amount, activeCall.type as 'audio' | 'video');
          if (success) {
            billingCountRef.current += 1;
            console.log(`[Agora Context] [Billing] Deducted ${amount} coins for ${activeCall.type} minute ${billingCountRef.current}`);
          } else {
            console.error(`[Agora Context] [Billing] FAILED for ${activeCall.type}`);
            Alert.alert('Error', 'Billing failed. Ending call.');
            endCall();
          }
        };
        performDeduction();
      }
    }
  }, [seconds, activeCall, callRole, appUser?.coins, endCall, remoteUid]);


  const startCall = React.useCallback(async (sessionId: string, role: 'caller' | 'receiver', type: 'audio' | 'video') => {
    console.log('[Agora Context] startCall initiated for session:', sessionId);
    if (pendingSessionId.current === sessionId) return;

    pendingSessionId.current = sessionId;
    setCallRole(role);
    setSeconds(0);
    billingCountRef.current = 0;
    lastBilledSecondRef.current = -1;
    hasCallStartedRef.current = false;
    wasAcceptedRef.current = false;
    setIsMinimized(false);
    setRemoteUid(null);
    setIsMuted(false);
    setIsSpeaker(true);
    setIsCameraOn(true);

    // [Optimization] Subscribe to the session IMMEDIATELY so the UI gets participant info 
    // while we wait for permissions and tokens.
    if (sessionUnsubscribe.current) sessionUnsubscribe.current();
    sessionUnsubscribe.current = subscribeToCallSession(sessionId, (updatedSession) => {
      setActiveCall(updatedSession);
      if (updatedSession?.status === 'accepted') {
        wasAcceptedRef.current = true;
      }
      if (!updatedSession || updatedSession.status === 'ended' || updatedSession.status === 'rejected') {
        handleCallTermination(updatedSession, role);
      }
    });

    if (AGORA_APP_ID === '') {
      console.error('[Agora Context] AGORA_APP_ID is missing in .env');
      Alert.alert('Configuration Error', 'Agora App ID is missing. Please check your .env file.');
      return;
    }

    // Request Permissions first
    const permissionsGranted = await requestCallPermissions();
    if (!permissionsGranted) {
      Alert.alert('Permission Required', 'Camera and Microphone permissions are needed to start a call.');
      pendingSessionId.current = null;
      return;
    }

    // Initialize Agora Engine
    if (!engine.current) {
      try {
        engine.current = createAgoraRtcEngine();
        const initCode = engine.current.initialize({
          appId: AGORA_APP_ID,
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
        });

        if (initCode !== 0) {
          console.error('[Agora Context] Engine initialization failed with code:', initCode);
          Alert.alert('Calling Error', 'Could not initialize the calling engine. Please restart the app.');
          return;
        }

        engine.current.registerEventHandler({
          onJoinChannelSuccess: (connection: RtcConnection, elapsed: number) => {
            console.log('[Agora Context] Local user joined channel:', connection.channelId, 'uid:', connection.localUid);
            // Create data stream for high-frequency signaling (Hearts, Gift Pings)
            if (engine.current) {
              const streamId = engine.current.createDataStream({ syncWithAudio: false, ordered: false });
              console.log('[Agora Context] Created data stream with ID:', streamId);
              dataStreamId.current = streamId;
            }
          },
          onStreamMessage: (connection: RtcConnection, remoteUid: number, streamId: number, data: Uint8Array, len: number) => {
            try {
              const payload = String.fromCharCode.apply(null, Array.from(data));
              const signal = JSON.parse(payload);
              console.log('[Agora Context] Received signal:', signal.type, 'from:', remoteUid);
              
              if (signal.type === 'TIMER_START') {
                setIsTimerRunning(true);
              }
              
              setLastSignal(signal);
            } catch (err) {
              console.error('[Agora Context] Failed to parse stream message:', err);
            }
          },
          onUserJoined: (connection: RtcConnection, uid: number, elapsed: number) => {
            console.log('[Agora Context] Remote user joined channel:', uid);
            setRemoteUid(uid);
          },
          onUserOffline: (connection: RtcConnection, uid: number, reason: UserOfflineReasonType) => {
            console.log('[Agora Context] Remote user offline:', uid, 'reason:', reason);
            setRemoteUid(null);
            endCall();
          },
          onError: (err: any, msg: string) => {
            if (err === 110) {
              console.error('[Agora Context] Agora Error 110: ERR_TOKEN_EXPIRED. Your EXPO_PUBLIC_AGORA_TOKEN is invalid or expired.');
              Alert.alert('Calling Problem', 'The security token has expired. Please refresh the App Token in your Agora Console and update your .env file.');
            } else {
              console.error('[Agora Context] Agora Error:', err, msg);
            }
          },
        });

        engine.current.enableAudio();
        // Set default speakerphone state
        const initialSpeaker = type === 'video';
        setIsSpeaker(initialSpeaker);
        engine.current.setEnableSpeakerphone(initialSpeaker);

        setIsEngineReady(true);
        console.log('[Agora Context] Engine initialized successfully');
      } catch (err) {
        console.error('[Agora Context] Fatal Error during initialization:', err);
        Alert.alert('Calling Error', 'A fatal error occurred while starting the call.');
        return;
      }
    }

    // Ensure video/audio is correctly enabled for the current call type
    if (type === 'video') {
      engine.current?.enableVideo();
      engine.current?.startPreview();
    } else {
      engine.current?.disableVideo();
    }


    // Fetch a fresh token from the backend for production-ready security
    const token = await fetchAgoraToken(sessionId);
    
    // Check if the engine is still available (handling race conditions where call might have ended)
    if (!engine.current) {
      console.warn('[Agora Context] Engine cleaned up before joinChannel; aborting.');
      return;
    }

    console.log(`[Agora Context] Attempting to join channel: ${sessionId} as ${role} with token: ${token ? 'Valid' : 'MISSING'}`);
    const joinCode = engine.current.joinChannel(token, sessionId, 0, {
      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
    });
    
    if (joinCode !== 0) {
      console.error('[Agora Context] joinChannel failed with code:', joinCode);
    }



    // Note: Navigation is handled by the calling component (e.g. Profile or Layout)
    // to avoid redundant pushes when already on the call screen.
  }, [endCall, handleCallTermination]);

  const minimizeCall = React.useCallback(() => {
    setIsMinimized(true);
    router.back();
  }, [router]);

  const restoreCall = React.useCallback(() => {
    if (activeCall && callRole) {
      setIsMinimized(false);
      router.push({
        pathname: '/call/[id]',
        params: {
          id: activeCall.id,
          role: callRole,
          type: activeCall.type
        }
      });
    }
  }, [activeCall, callRole, router]);

  const toggleMute = React.useCallback(() => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    engine.current?.muteLocalAudioStream(nextMute);
  }, [isMuted]);

  const toggleSpeaker = React.useCallback(() => {
    const nextSpeaker = !isSpeaker;
    setIsSpeaker(nextSpeaker);
    engine.current?.setEnableSpeakerphone(nextSpeaker);
  }, [isSpeaker]);

  const toggleCamera = React.useCallback(() => {
    const nextCamera = !isCameraOn;
    setIsCameraOn(nextCamera);
    if (nextCamera) {
      engine.current?.enableVideo();
      engine.current?.startPreview();
    } else {
      engine.current?.stopPreview();
      engine.current?.disableVideo();
    }
  }, [isCameraOn]);

  const submitRating = React.useCallback(async (rating: number, reason?: string) => {
    if (!lastCallData || rating === 0) return false;
    
    setIsSubmittingRating(true);
    try {
      // For now, reasoning is logged but central rating still uses updateCreatorRating
      // In the future, we can add the reason to a sub-collection
      console.log(`[Rating] Submitting ${rating} stars for ${lastCallData.receiverId}. Reason: ${reason || 'None'}`);
      await updateCreatorRating(lastCallData.receiverId, rating);
      return true;
    } catch (err) {
      console.error('Failed to submit rating:', err);
      return false;
    } finally {
      setIsSubmittingRating(false);
      setLastCallData(null);
    }
  }, [lastCallData]);

  const skipRating = React.useCallback(() => {
    setLastCallData(null);
  }, []);

  const sendCallSignal = React.useCallback((type: string, data: any) => {
    if (engine.current && dataStreamId.current !== -1) {
      try {
        const payload = JSON.stringify({ type, data, timestamp: Date.now() });
        const bytes = new Uint8Array(payload.length);
        for (let i = 0; i < payload.length; i++) {
          bytes[i] = payload.charCodeAt(i);
        }
        engine.current.sendStreamMessage(dataStreamId.current, bytes);
        console.log('[Agora Context] Sent signal:', type);
      } catch (err) {
        console.error('[Agora Context] Failed to send signal:', err);
      }
    } else {
      console.warn('[Agora Context] Cannot send signal: engine or dataStream not ready');
    }
  }, []);


  const formatHistoryDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return mins > 0 ? `${mins}m ${s}s` : `${s}s`;
  };

  return (
    <CallContext.Provider value={{
      activeCall, isMinimized, seconds, remoteUid, isMuted, isSpeaker, isCameraOn,
      userRating: 0, engine: engine.current, showRatingModal: false,
      startCall, endCall, minimizeCall, restoreCall, toggleMute, toggleSpeaker, toggleCamera,
      setUserRating: () => {}, submitRating, skipRating, isEngineReady, lastCallData, isSubmittingRating,
      lastSignal, sendCallSignal
    }}>
      {children}
    </CallContext.Provider>
  );
};


export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within CallProvider');
  return context;
};

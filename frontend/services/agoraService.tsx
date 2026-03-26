import { View, Text, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import Constants, { AppOwnership } from 'expo-constants';


export const requestCallPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      return (
        granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  }
  return true;
};


// Types and Enums from react-native-agora (Mocked if not available)
export enum ChannelProfileType {
  ChannelProfileCommunication = 0,
  ChannelProfileLiveBroadcasting = 1,
  ChannelProfileGame = 2,
  ChannelProfileCloudGaming = 3,
  ChannelProfileCommunicationId = 4,
}

export enum ClientRoleType {
  ClientRoleBroadcaster = 1,
  ClientRoleAudience = 2,
}

export enum UserOfflineReasonType {
  UserOfflineQuit = 0,
  UserOfflineDropped = 1,
  UserOfflineBecomeAudience = 2,
}

export enum RenderModeType {
  RenderModeHidden = 1,
  RenderModeFit = 2,
  RenderModeAdaptive = 3,
}

export interface RtcConnection {
  channelId: string;
  localUid: number;
}

export interface RtcStats {
  duration?: number;
  txBytes?: number;
  rxBytes?: number;
  // Add other stats as needed
}

export interface IRtcEngine {
  initialize(config: any): number;
  registerEventHandler(handler: any): void;
  enableAudio(): number;
  enableVideo(): number;
  disableVideo(): number;
  startPreview(): number;
  stopPreview(): number;
  joinChannel(token: string | null, channelId: string, uid: number, options: any): number;

  leaveChannel(): number;
  release(): void;
  muteLocalAudioStream(mute: boolean): number;
  setEnableSpeakerphone(enabled: boolean): number;
}

let AgoraRTC: any = null;
let isExpoGo = Constants.appOwnership === AppOwnership.Expo;

try {
  if (!isExpoGo) {
    // Only try to require the native module if NOT in Expo Go
    AgoraRTC = require('react-native-agora');
  }
} catch (e) {
  console.warn('Agora native module not found. Using mock implementation.');
  isExpoGo = true;
}


// Exported Components
export const RtcSurfaceView = (props: any) => {
  if (!isExpoGo && AgoraRTC?.RtcSurfaceView) {
    const NativeView = AgoraRTC.RtcSurfaceView;
    return <NativeView {...props} />;
  }

  // Mock for Expo Go
  return (
    <View style={[{ backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }, props.style]}>
      <Text style={{ color: '#666', fontSize: 12 }}>
        {props.canvas?.uid === 0 ? 'Local Video Feed' : `Remote Video (${props.canvas?.uid})`}
      </Text>
      <Text style={{ color: '#444', fontSize: 10 }}>[Agora Mock View]</Text>
    </View>
  );
};

export const createAgoraRtcEngine = (): IRtcEngine => {
  if (AgoraRTC && AgoraRTC.default && !isExpoGo) {
    try {
        return AgoraRTC.default();
    } catch (err) {
        console.warn('Failed to initialize native Agora engine, falling back to mock.', err);
    }
  }

  // Mock implementation for Expo Go
  return {
    initialize: (config: any) => {
      console.log('[Agora Mock] Initialize', config);
      return 0;
    },
    registerEventHandler: (handler: any) => {
      console.log('[Agora Mock] Register Event Handler');
      // Simulate events for testing if needed
      if (handler.onJoinChannelSuccess) {
          setTimeout(() => {
              handler.onJoinChannelSuccess({ channelId: 'mock-channel', localUid: 1 }, 0);
          }, 1000);
      }
    },
    enableAudio: () => {
      console.log('[Agora Mock] Enable Audio');
      return 0;
    },
    enableVideo: () => {
      console.log('[Agora Mock] Enable Video');
      return 0;
    },
    disableVideo: () => {
      console.log('[Agora Mock] Disable Video');
      return 0;
    },

    startPreview: () => {
      console.log('[Agora Mock] Start Preview');
      return 0;
    },
    stopPreview: () => {
      console.log('[Agora Mock] Stop Preview');
      return 0;
    },

    joinChannel: (token, channelId, uid, options) => {
      console.log('[Agora Mock] Join Channel', { channelId, uid });
      return 0;
    },
    leaveChannel: () => {
      console.log('[Agora Mock] Leave Channel');
      return 0;
    },
    release: () => {
      console.log('[Agora Mock] Release');
    },
    muteLocalAudioStream: (mute) => {
      console.log('[Agora Mock] Mute local audio:', mute);
      return 0;
    },
    setEnableSpeakerphone: (enabled) => {
      console.log('[Agora Mock] Set speakerphone:', enabled);
      return 0;
    }
  };
};

export default createAgoraRtcEngine;

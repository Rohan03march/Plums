import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, Text, ActivityIndicator, Platform } from 'react-native';

import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';


export interface FirebaseRecaptchaProps {
  firebaseConfig: any;
  onVerify: (token: string) => void;
  onLoad?: () => void;
  onError?: (error: any) => void;
  onClose?: () => void;
  visible?: boolean;
}

const FirebaseRecaptcha = forwardRef((props: FirebaseRecaptchaProps, ref) => {
  const { firebaseConfig, onVerify, onLoad, onError, onClose, visible: externalVisible } = props;
  const [internalVisible, setInternalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const visible = externalVisible ?? internalVisible;

  useImperativeHandle(ref, () => ({
    verify: async () => {
      setInternalVisible(true);
      setLoading(true);
    },
    reset: () => {
      webViewRef.current?.reload();
    }
  }));

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js"></script>
        <script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-auth-compat.js"></script>
        <style>
          body, html { margin: 0; padding: 0; height: 100%; display: flex; justify-content: center; align-items: center; background: transparent; }
          #recaptcha-container { width: 100%; display: flex; justify-content: center; align-items: center; padding-top: 100px; }
        </style>
        <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
        <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
      </head>
      <body>
        <div id="recaptcha-container"></div>
        <script>
          const firebaseConfig = ${JSON.stringify(firebaseConfig)};
          firebase.initializeApp(firebaseConfig);
          
          window.onLoadCallback = function() {
            window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
              'size': 'normal',

              'callback': (response) => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'verify', token: response }));
              },
              'expired-callback': () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'expire' }));
              }
            });
            window.recaptchaVerifier.render().then(() => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'load' }));
            });
          };


        </script>
        <script src="https://www.google.com/recaptcha/api.js?onload=onLoadCallback&render=explicit" async defer></script>
      </body>
    </html>
  `;

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case 'load':
          setLoading(false);
          onLoad?.();
          break;
        case 'verify':
          setInternalVisible(false);
          onVerify(data.token);
          break;
        case 'expired':
          webViewRef.current?.reload();
          break;
        case 'error':
          onError?.(data.error);
          break;
      }
    } catch (e) {
      console.error('Recaptcha Message Error:', e);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {
        setInternalVisible(false);
        onClose?.();
      }}
    >
      <View style={styles.fullScreenContainer}>
        <BlurView intensity={80} tint="light" style={styles.browserHeader}>
          <TouchableOpacity 
            onPress={() => { setInternalVisible(false); onClose?.(); }}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.browserUrl} numberOfLines={1}>
              Security Verification
            </Text>
            <Text style={styles.browserSecurity}>
              <Ionicons name="lock-closed" size={10} color="#10B981" /> Encrypted Session
            </Text>
          </View>

          <TouchableOpacity 
            onPress={() => webViewRef.current?.reload()}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh" size={22} color="#666" />
          </TouchableOpacity>
        </BlurView>

        <View style={styles.webViewContainer}>
          {loading && (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#FF4D67" />
              <Text style={styles.loaderText}>Verifying your session...</Text>
            </View>
          )}
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html, baseUrl: `https://${firebaseConfig.authDomain}` }}
            onMessage={onMessage}
            style={[styles.webView, { opacity: loading ? 0 : 1 }]}
            javaScriptEnabled
            domStorageEnabled
          />
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  browserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 35,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#f8f9fa',
  },
  closeButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  browserUrl: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  browserSecurity: {
    fontSize: 10,
    color: '#10B981',
    marginTop: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  refreshButton: {
    padding: 8,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webView: {
    flex: 1,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  loaderText: {
    marginTop: 15,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});


export default FirebaseRecaptcha;

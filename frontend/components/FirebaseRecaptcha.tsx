import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

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
          #recaptcha-container { scale: 1.1; }
        </style>
      </head>
      <body>
        <div id="recaptcha-container"></div>
        <script>
          firebase.initializeApp(${JSON.stringify(firebaseConfig)});
          const auth = firebase.auth();
          
          window.onLoadCallback = function() {
            window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
              'size': 'invisible',

              'callback': (response) => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'verify', token: response }));
              },
              'expired-callback': () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'expired' }));
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
      transparent
      animationType="fade"
      onRequestClose={() => {
        setInternalVisible(false);
        onClose?.();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Security Verification</Text>
            <TouchableOpacity onPress={() => { setInternalVisible(false); onClose?.(); }}>
              <Text style={styles.closeBtn}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.webViewContainer}>
            {loading && (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color="#FF4D67" />
              </View>
            )}
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html, baseUrl: `https://${firebaseConfig.authDomain}` }}
              onMessage={onMessage}
              style={[styles.webView, { opacity: loading ? 0 : 1 }]}
              javaScriptEnabled
            />
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    height: 450,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  closeBtn: {
    color: '#FF4D67',
    fontWeight: '600',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 1,
  },
});

export default FirebaseRecaptcha;

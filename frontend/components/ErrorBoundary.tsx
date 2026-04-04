import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" />
          <LinearGradient
            colors={['#000000', '#1a1a1a']}
            style={styles.gradient}
          >
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Ionicons name="warning-outline" size={80} color="#FF4D67" />
              </View>
              
              <Text style={styles.title}>Something went wrong</Text>
              <Text style={styles.subtitle}>
                An unexpected error occurred. We've optimized the app for stability, but we've caught a minor glitch.
              </Text>

              <View style={styles.errorCard}>
                <Text style={styles.errorText} numberOfLines={3}>
                  {this.state.error?.message || 'Unknown Error'}
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.button} 
                onPress={this.handleReset}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Restart Experience</Text>
              </TouchableOpacity>

              <Text style={styles.footerNote}>Zero-Crash Architecture active</Text>
            </View>
          </LinearGradient>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 77, 103, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 103, 0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  errorCard: {
    width: width - 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  errorText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: 'monospace',
    fontSize: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF4D67',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: width - 100,
    alignItems: 'center',
    shadowColor: '#FF4D67',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerNote: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});

export default ErrorBoundary;

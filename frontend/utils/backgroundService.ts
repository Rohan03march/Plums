import notifee, { AndroidImportance, AndroidVisibility, AndroidForegroundServiceType } from '@notifee/react-native';

export const startCallForegroundService = async (userName: string, callType: 'audio' | 'video') => {
  try {
    // 1. Create a notification channel (required for Android)
    const channelId = await notifee.createChannel({
      id: 'active_calls',
      name: 'Active Calls',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
    });

    // 2. Display the notification as a Foreground Service
    await notifee.displayNotification({
      id: 'ongoing_call', // Standard ID to allow updating/canceling
      title: `Ongoing ${callType === 'video' ? 'Video' : 'Audio'} Call`,
      body: `Talking with ${userName}`,
      android: {
        channelId,
        asForegroundService: true,
        color: '#FF4D67', // Match the app's primary pink/red
        pressAction: {
          id: 'default',
        },
        ongoing: true, // Prevent user from swiping it away
        autoCancel: false,
        foregroundServiceTypes: [
          AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE,
          AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_CAMERA,
          AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_PHONE_CALL,
        ],
      },
    });
    console.log('[Background Service] Foreground service started.');
  } catch (error) {
    console.error('[Background Service] Failed to start foreground service:', error);
  }
};

export const stopCallForegroundService = async () => {
  try {
    await notifee.stopForegroundService();
    // Also cancel the notification explicitly to be sure
    await notifee.cancelNotification('ongoing_call');
    console.log('[Background Service] Foreground service stopped.');
  } catch (error) {
    console.warn('[Background Service] Error stopping service:', error);
  }
};

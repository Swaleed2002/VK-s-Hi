import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export async function setupPushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications not available on web');
    return;
  }

  let permStatus = await PushNotifications.checkPermissions();
  
  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== 'granted') {
    console.log('User denied push notification permission');
    return;
  }

  await PushNotifications.register();

  PushNotifications.addListener('registration', async (token) => {
    console.log('Push registration success, token: ' + token.value);
    
    // Store token in Firestore for the current user
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          fcmToken: token.value
        });
      } catch (e) {
        console.error("Failed to save FCM token", e);
      }
    }
  });

  PushNotifications.addListener('registrationError', (error: any) => {
    console.error('Error on registration: ' + JSON.stringify(error));
  });

  PushNotifications.addListener(
    'pushNotificationReceived',
    (notification) => {
      console.log('Push received: ' + JSON.stringify(notification));
      // Handle foreground notification, e.g., show a toast
    }
  );

  PushNotifications.addListener(
    'pushNotificationActionPerformed',
    (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
      // Handle background notification tap, e.g., navigate to a specific chat
      const data = notification.notification.data;
      if (data && data.chatId) {
        // We'd typically use a global event bus or router reference to navigate here
        window.dispatchEvent(new CustomEvent('pushNavigate', { detail: `/chats/${data.chatId}` }));
      }
    }
  );
}

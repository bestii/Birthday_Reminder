import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const NOTIFICATION_CHANNEL_ID = 'birthday-reminders';

export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: 'Birthday reminders',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

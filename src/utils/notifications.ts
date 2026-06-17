import { Platform } from 'react-native';
import Constants from 'expo-constants';

let Notifications: any = null;

// Standard Expo Go app on Android crashes immediately on load if expo-notifications is imported.
// We check if it is running in Android Expo Go and skip loading it entirely.
const isAndroidExpoGo = Platform.OS === 'android' && Constants.appOwnership === 'expo';

if (!isAndroidExpoGo) {
  try {
    Notifications = require('expo-notifications');
  } catch (e) {
    console.warn("expo-notifications is not supported or available in this environment. Notification reminders will be disabled.");
  }
} else {
  console.warn("expo-notifications disabled on Android Expo Go to prevent application crash. Reminders will be disabled.");
}

// Set up the default handler
if (Platform.OS !== 'web' && Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async (notification: any) => {
        try {
          const userStr = await AsyncStorage.getItem('@invonest_current_user');
          if (userStr) {
            const currentUser = JSON.parse(userStr);
            const notifUid = notification.request.content.data?.uid;
            // If the notification data has a uid and it doesn't match the logged-in user, suppress it
            if (notifUid && currentUser?.uid && notifUid !== currentUser.uid) {
              return {
                shouldShowAlert: false,
                shouldPlaySound: false,
                shouldSetBadge: false,
                shouldShowBanner: false,
                shouldShowList: false,
              };
            }
          }
        } catch (e) {
          console.warn('Error inside notification handler:', e);
        }
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });
  } catch (err) {
    console.warn('Failed to set notification handler:', err);
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';

export async function requestNotificationPermissions() {
  if (Platform.OS === 'web' || !Notifications) return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

export async function cancelInvoiceReminders(invoiceId: string) {
  if (Platform.OS === 'web' || !Notifications) return;
  try {
    const list = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of list) {
      if (item.content.data?.invoiceId === invoiceId) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }
  } catch (error) {
    console.error('Error canceling invoice reminders:', error);
  }
}

export async function scheduleInvoiceReminder(
  invoiceId: string,
  invoiceNumber: string,
  clientName: string,
  dueDate: Date,
  reminderDaysBefore: number,
  uid?: string
) {
  if (Platform.OS === 'web' || !Notifications) return null;
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    // First cancel any existing reminder for this invoice
    await cancelInvoiceReminders(invoiceId);

    // Calculate trigger time
    const triggerTime = new Date(dueDate.getTime());
    triggerTime.setDate(triggerTime.getDate() - reminderDaysBefore);
    // Set to morning (e.g. 9 AM)
    triggerTime.setHours(9, 0, 0, 0);

    // If trigger time is in the past, don't schedule
    if (triggerTime.getTime() <= Date.now()) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Invoice Due Soon: ${invoiceNumber}`,
        body: `Invoice for ${clientName} is due in ${reminderDaysBefore} day(s) on ${dueDate.toLocaleDateString()}.`,
        data: { invoiceId, type: 'reminder', uid },
      },
      trigger: triggerTime as any,
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling invoice reminder:', error);
    return null;
  }
}

// Wrapper for notifications index view to fetch all scheduled reminders safely
export async function getAllScheduledReminders() {
  if (Platform.OS === 'web' || !Notifications) return [];
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (err) {
    console.warn('Failed to retrieve scheduled notifications:', err);
    return [];
  }
}

// Wrapper for notifications index view to cancel a scheduled reminder safely
export async function cancelScheduledReminder(id: string) {
  if (Platform.OS === 'web' || !Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (err) {
    console.warn('Failed to cancel scheduled notification:', err);
  }
}
import { Platform } from 'react-native';
import * as ExpoSpeech from 'expo-speech';

// Wrap all calls so that any failure (e.g. unsupported environment) is silently caught
const Speech = ExpoSpeech;

/**
 * Speak a given text using the device's text-to-speech engine.
 * Returns true if speech was successfully initiated, false otherwise.
 */
export async function speakText(
  text: string,
  options?: {
    language?: string;
    pitch?: number;
    rate?: number;
  }
): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const speaking = await Speech.isSpeakingAsync();
    if (speaking) {
      Speech.stop();
    }

    Speech.speak(text, {
      language: options?.language ?? 'en-US',
      pitch: options?.pitch ?? 1.0,
      rate: options?.rate ?? 0.9,
    });

    return true;
  } catch (error) {
    console.error('Error using text-to-speech:', error);
    return false;
  }
}

/**
 * Stop any currently playing speech.
 */
export async function stopSpeech(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    Speech.stop();
  } catch (error) {
    console.error('Error stopping speech:', error);
  }
}

/**
 * Check whether a voice reminder is currently playing.
 */
export async function isSpeaking(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}

/**
 * Announce an invoice reminder aloud via TTS.
 */
export async function announceInvoiceReminder(
  invoiceNumber: string,
  clientName: string,
  dueDate: Date,
  daysBefore: number
): Promise<boolean> {
  const formattedDate = dueDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const message =
    daysBefore === 0
      ? `Attention! Invoice ${invoiceNumber} for ${clientName} is due today!`
      : `Reminder: Invoice ${invoiceNumber} for ${clientName} is due in ${daysBefore} day${daysBefore === 1 ? '' : 's'}, on ${formattedDate}.`;

  return speakText(message);
}

/**
 * Preview voice reminder feature with a sample phrase (used in settings).
 */
export async function previewVoiceReminder(): Promise<boolean> {
  const message =
    'Voice reminders are now enabled. You will hear spoken alerts for upcoming invoice due dates.';
  return speakText(message);
}

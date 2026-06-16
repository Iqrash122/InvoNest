import * as LocalAuthentication from 'expo-local-authentication';

export async function checkBiometricsSupport() {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    return {
      hasHardware,
      isEnrolled,
      supportedTypes,
    };
  } catch (error) {
    console.error('Error checking biometric support:', error);
    return {
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
    };
  }
}

export async function authenticateWithBiometrics(reason: string = 'Access your InvoNest dashboard') {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use Password',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });
    
    return result.success;
  } catch (error) {
    console.error('Error authenticating with biometrics:', error);
    return false;
  }
}

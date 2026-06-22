import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useResponsive } from '@/hooks/use-responsive';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, LogIn, Mail, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Login() {
  const router = useRouter();
  const { login, signup } = useAuth();
  const { moderateScale, isSmallDevice } = useResponsive();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);

    try {
      if (isLoginMode) {
        const success = await login(email, password);
        if (success) {
          router.replace('/');
        } else {
          Alert.alert('Authentication Failed', 'Invalid email or password. You can use any password to auto-register your first local demo account!');
        }
      } else {
        const success = await signup(email, password);
        if (success) {
          router.replace('/');
        } else {
          Alert.alert('Registration Failed', 'A user with this email already exists locally or in the cloud.');
        }
      }
    } catch (error) {
      Alert.alert('Authentication Error', 'An error occurred during submission.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    const success = await login('demo@invonest.com', 'password123');
    if (success) {
      router.replace('/');
    } else {
      Alert.alert('Demo Error', 'Failed to launch demo account.');
    }
    setIsLoading(false);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/logo/Logo.png')}
            style={[styles.logoImage, { width: moderateScale(220), height: moderateScale(88) }]}
            resizeMode="contain"
          />
          <ThemedText themeColor="textSecondary" style={[styles.subtitle, { fontSize: moderateScale(14) }]}>
            {isLoginMode ? 'Sign in to manage invoices and payments' : 'Create an account to start billing clients'}
          </ThemedText>
        </View>

        <Card style={styles.formCard}>
          <Input
            label="Email Address"
            placeholder="name@business.com"
            value={email}
            onChangeText={setEmail}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Mail size={18} color="#60646C" />}
            disabled={isLoading}
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            secureTextEntry={!isPasswordVisible}
            autoCapitalize="none"
            icon={<Lock size={18} color="#60646C" />}
            rightIcon={isPasswordVisible ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
            onRightIconPress={() => setIsPasswordVisible(!isPasswordVisible)}
            disabled={isLoading}
          />

          <Button
            title={isLoginMode ? 'Log In' : 'Sign Up'}
            onPress={handleSubmit}
            loading={isLoading}
            style={styles.submitButton}
            icon={isLoginMode ? <LogIn size={18} color="#FFF" /> : <UserPlus size={18} color="#FFF" />}
          />

          {/* <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View> */}

          {/* <Button
            title="Access Demo Mode (Offline)"
            onPress={handleDemoLogin}
            variant="outline"
            disabled={isLoading}
            style={styles.demoButton}
          /> */}
        </Card>

        <View style={styles.toggleRow}>
          <ThemedText themeColor="textSecondary">
            {isLoginMode ? "Don't have an account? " : 'Already have an account? '}
          </ThemedText>
          <TouchableOpacity onPress={() => setIsLoginMode(!isLoginMode)} disabled={isLoading}>
            <Text style={styles.toggleText}>
              {isLoginMode ? 'Sign Up' : 'Log In'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.four,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  logoImage: {
    width: 250,
    height: 100,
    marginBottom: Spacing.two,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
  },
  formCard: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  submitButton: {
    marginTop: Spacing.two,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.three,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: Spacing.two,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  demoButton: {
    alignSelf: 'stretch',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  toggleText: {
    color: '#208AEF',
    fontWeight: '700',
  },
});

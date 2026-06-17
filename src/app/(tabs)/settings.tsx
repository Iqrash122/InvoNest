import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useTheme } from '@/hooks/use-theme';
import { previewVoiceReminder, stopSpeech } from '@/utils/voiceReminder';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  BellRing,
  Building2,
  ChevronRight,
  Laptop,
  LogOut,
  Moon,
  PackageCheck,
  Palette,
  Settings as SettingsIcon,
  Sun
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const TEMPLATES: { id: 'classic' | 'modern' | 'minimal'; label: string }[] = [
  { id: 'classic', label: 'Classic Layout' },
  { id: 'modern', label: 'Modern Colorbar' },
  { id: 'minimal', label: 'Minimalist Line' },
];

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { logout, isBiometricEnabled, toggleBiometrics } = useAuth();
  const { businessProfile, saveBusinessProfile, themeMode, saveThemeMode } = useData();

  const [biometricsOn, setBiometricsOn] = useState(isBiometricEnabled);
  const [remindDaysBefore, setRemindDaysBefore] = useState(String(businessProfile?.reminderDaysBefore || '3'));
  const [repeatOnOverdue, setRepeatOnOverdue] = useState(businessProfile?.reminderRepeatOnOverdue !== undefined ? businessProfile.reminderRepeatOnOverdue : true);
  const [voiceRemindersOn, setVoiceRemindersOn] = useState(false);
  const [isVoicePreviewing, setIsVoicePreviewing] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  // Sync voice reminder toggle when businessProfile loads asynchronously from storage
  useEffect(() => {
    if (businessProfile) {
      setVoiceRemindersOn(businessProfile.voiceRemindersEnabled ?? false);
    }
  }, [businessProfile?.voiceRemindersEnabled]);

  const handleBiometricToggle = async (val: boolean) => {
    setBiometricsOn(val);
    const success = await toggleBiometrics(val);
    if (!success) {
      setBiometricsOn(!val);
      Alert.alert('Configuration Error', 'Unable to update biometric locking settings on this device.');
    }
  };

  const handleUpdateReminderTiming = async (days: string) => {
    setRemindDaysBefore(days);
    if (businessProfile) {
      await saveBusinessProfile({
        ...businessProfile,
        reminderDaysBefore: parseInt(days, 10) || 0
      });
    }
  };

  const handleUpdateOverdueRepeat = async (val: boolean) => {
    setRepeatOnOverdue(val);
    if (businessProfile) {
      await saveBusinessProfile({
        ...businessProfile,
        reminderRepeatOnOverdue: val
      });
    }
  };

  const handleVoiceReminderToggle = async (val: boolean) => {
    setVoiceRemindersOn(val);
    if (!val) {
      await stopSpeech();
    }
    if (businessProfile) {
      await saveBusinessProfile({
        ...businessProfile,
        voiceRemindersEnabled: val
      });
    }
  };

  const handlePreviewVoice = async () => {
    if (isVoicePreviewing) return;
    setIsVoicePreviewing(true);
    try {
      await previewVoiceReminder();
    } finally {
      setTimeout(() => setIsVoicePreviewing(false), 3500);
    }
  };

  const confirmLogout = async () => {
    setIsLogoutModalVisible(false);
    await logout();
    router.replace('/');
  };


  const paddingTop = Platform.select({
    android: Math.max(insets.top + Spacing.two, 45),
    ios: Math.max(insets.top, 40),
    default: Spacing.four,
  });

  return (
    <ThemedView style={styles.container}>
      {/* Top Header - Placed outside ScrollView so it pins to top and padding works */}
      <LinearGradient
        colors={['#0F172A', '#1E3A8A', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerRow, { paddingTop, paddingBottom: Spacing.four, paddingHorizontal: Spacing.four, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, zIndex: 10 }]}
      >
        <SettingsIcon size={24} color="#FFFFFF" style={{ marginRight: Spacing.two }} />
        <View>
          <ThemedText style={[styles.title, { color: '#FFFFFF' }]}>System Settings</ThemedText>
          <Text style={[styles.subtitle, { color: 'rgba(255, 255, 255, 0.8)' }]}>Configure preferences and profiles</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Business Settings Quick Link */}
        <Card title="Business Info" style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.clickableSettingRow}
            onPress={() => router.push('/business-setup')}
          >
            <View style={styles.rowLeft}>
              <Building2 size={20} color="#208AEF" style={styles.iconMargin} />
              <View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>{businessProfile?.name || 'Company Profile'}</Text>
                <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                  Currency: {businessProfile?.currency || 'USD'} • Tax rate: {businessProfile?.defaultTaxRate || '0'}%
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Catalog and Templates Quick Links */}
        <Card title="Catalog & Invoicing Preferences" style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.clickableSettingRow}
            onPress={() => router.push('/product')}
          >
            <View style={styles.rowLeft}>
              <PackageCheck size={20} color="#10B981" style={styles.iconMargin} />
              <View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Products & Services Catalog</Text>
                <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>Manage item defaults, prices, and units</Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.settingSeparator, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.clickableSettingRow}
            onPress={() => router.push('/templates')}
          >
            <View style={styles.rowLeft}>
              <Palette size={20} color="#8B5CF6" style={styles.iconMargin} />
              <View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>PDF Templates Gallery</Text>
                <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>Preview and select from the 3 layout templates</Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Appearance Settings */}
        <Card title="Appearance" style={styles.sectionCard}>
          <View style={{ flex: 1, justifyContent: "space-around" }} >
            <View style={styles.rowLeft}>
              <View style={{ flex: 1, marginRight: Spacing.two }}>
                <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                </Text>
              </View>
            </View>
            <View style={styles.themePills}>
              {(['light', 'dark', 'system'] as const).map((mode) => {
                const isActive = themeMode === mode;
                const IconComponent = mode === 'light' ? Sun : mode === 'dark' ? Moon : Laptop;
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => saveThemeMode(mode)}
                    style={[
                      styles.themePill,
                      isActive
                        ? { backgroundColor: '#208AEF' }
                        : { backgroundColor: theme.backgroundSelected }
                    ]}
                  >
                    <IconComponent size={14} color={isActive ? '#FFF' : theme.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={{ color: isActive ? '#FFF' : theme.text, fontWeight: 'bold', fontSize: 11 }}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Card>

        {/* Reminders & Notifications settings */}
        <Card title="Invoice Reminders" style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <BellRing size={20} color="#F59E0B" style={styles.iconMargin} />
              <View style={{ flex: 1, marginRight: Spacing.two }}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Remind days before due date</Text>
                <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>Schedule local alert notification</Text>
              </View>
            </View>
            <View style={styles.timingPills}>
              {['1', '3', '5'].map((d) => {
                const isActive = remindDaysBefore === d;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => handleUpdateReminderTiming(d)}
                    style={[
                      styles.timingPill,
                      { backgroundColor: isActive ? '#208AEF' : theme.backgroundSelected }
                    ]}
                  >
                    <Text style={{ color: isActive ? '#FFF' : theme.textSecondary, fontWeight: 'bold', fontSize: 12 }}>{d}d</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.settingSeparator, { backgroundColor: theme.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <BellRing size={20} color="#EF4444" style={styles.iconMargin} />
              <View style={{ flex: 1, marginRight: Spacing.two }}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Daily overdue notifications</Text>
                <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>Repeat reminder alerts on unpaid invoices</Text>
              </View>
            </View>
            <Switch
              value={repeatOnOverdue}
              onValueChange={handleUpdateOverdueRepeat}
              trackColor={{ true: '#208AEF', false: '#D1D5DB' }}
            />
          </View>

          {/* <View style={[styles.settingSeparator, { backgroundColor: theme.border }]} /> */}

          {/* <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              {voiceRemindersOn
                ? <Volume2 size={20} color="#8B5CF6" style={styles.iconMargin} />
                : <VolumeX size={20} color={theme.textSecondary} style={styles.iconMargin} />
              }
              <View style={{ flex: 1, marginRight: Spacing.two }}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Voice Reminders</Text>
                <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                  {voiceRemindersOn ? 'Audible TTS alerts are active' : 'Receive audible text-to-speech alerts'}
                </Text>
              </View>
            </View>
            <Switch
              value={voiceRemindersOn}
              onValueChange={handleVoiceReminderToggle}
              trackColor={{ true: '#8B5CF6', false: '#D1D5DB' }}
              thumbColor={voiceRemindersOn ? '#FFFFFF' : '#F4F4F4'}
            />
          </View> */}

          {/* {voiceRemindersOn && (
            <>
              <View style={[styles.settingSeparator, { backgroundColor: theme.border }]} />
              <View style={[styles.settingRow, { paddingVertical: Spacing.two }]}>
                <View style={styles.rowLeft}>
                  <View style={{ flex: 1, marginLeft: 36 }}>
                    <Text style={[styles.settingDesc, { color: theme.textSecondary, fontSize: 11 }]}>
                      Tap to hear a sample voice alert
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handlePreviewVoice}
                  disabled={isVoicePreviewing}
                  style={[
                    styles.previewVoiceBtn,
                    { backgroundColor: isVoicePreviewing ? '#6D28D9' : '#8B5CF6', opacity: isVoicePreviewing ? 0.75 : 1 }
                  ]}
                >
                  <Volume2 size={13} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.previewVoiceBtnText}>
                    {isVoicePreviewing ? 'Speaking…' : 'Test Voice'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )} */}
        </Card>

        {/* Logout Button */}
        <Button
          title="Sign Out"
          onPress={() => setIsLogoutModalVisible(true)}
          variant="danger"
          style={styles.logoutBtn}
          icon={<LogOut size={18} color="#FFF" style={{ marginRight: 6 }} />}
        />

        <Text style={[styles.versionText, { color: theme.textSecondary }]}>InvoNest Mobile App v1.0.0 • Offline Mode Enabled</Text>

      </ScrollView>

      {/* Premium Sign Out Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isLogoutModalVisible}
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {/* Warning Icon with Red Gradient */}
            <LinearGradient
              colors={['#FEE2E2', '#FCA5A5']}
              style={styles.modalIconWrap}
            >
              <LogOut size={28} color="#EF4444" />
            </LinearGradient>

            <Text style={[styles.modalTitle, { color: theme.text }]}>Sign Out</Text>
            <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>
              Are you sure you want to sign out of InvoNest? Your offline changes will sync automatically next time you log in.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsLogoutModalVisible(false)}
                style={[styles.modalBtn, styles.modalCancelBtn, { borderColor: theme.border }]}
              >
                <Text style={[styles.modalCancelText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmLogout}
                style={[styles.modalBtn, styles.modalConfirmBtn]}
              >
                <Text style={styles.modalConfirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 110,
    paddingTop: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  sectionCard: {
    marginBottom: Spacing.three,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  clickableSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconMargin: {
    marginRight: Spacing.three,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  settingSeparator: {
    height: 1,
  },
  timingPills: {
    flexDirection: 'row',
    gap: 6,
  },
  timingPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themePills: {
    flexDirection: 'row',
    gap: 6,
  },
  themePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  previewVoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  previewVoiceBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    marginTop: Spacing.four,
    alignSelf: 'stretch',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: Spacing.five,
    fontWeight: '500',
  },
  // Custom Premium Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing.five,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  modalMessage: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.five,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    borderWidth: 1,
  },
  modalCancelText: {
    fontWeight: '700',
    fontSize: 14,
  },
  modalConfirmBtn: {
    backgroundColor: '#EF4444',
  },
  modalConfirmText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

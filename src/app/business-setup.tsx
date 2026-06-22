import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, TouchableOpacity, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useData, BusinessProfile } from '@/context/DataContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { Building2, Save, ArrowLeft, Camera, Trash2, FileText } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/use-theme';
import { useResponsive } from '@/hooks/use-responsive';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY', 'PKR'];
const TEMPLATES: { id: 'classic' | 'modern' | 'minimal'; label: string }[] = [
  { id: 'classic', label: 'Classic Layout' },
  { id: 'modern', label: 'Modern Colorbar' },
  { id: 'minimal', label: 'Minimalist Line' },
];

export default function BusinessSetup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { saveBusinessProfile, businessProfile } = useData();
  const theme = useTheme();
  const { moderateScale, isSmallDevice } = useResponsive();

  const [name, setName] = useState(businessProfile?.name && businessProfile.name !== 'My Business' ? businessProfile.name : '');
  const [email, setEmail] = useState(businessProfile?.email || user?.email || '');
  const [phone, setPhone] = useState(businessProfile?.phone || '');
  const [address, setAddress] = useState(businessProfile?.address || '');
  const [taxId, setTaxId] = useState(businessProfile?.taxId || '');
  const [currency, setCurrency] = useState(businessProfile?.currency || 'USD');
  const [defaultTaxRate, setDefaultTaxRate] = useState(String(businessProfile?.defaultTaxRate || '0'));
  const [defaultTemplate, setDefaultTemplate] = useState<'classic' | 'modern' | 'minimal'>(businessProfile?.defaultTemplate || 'classic');
  const [logoUri, setLogoUri] = useState<string | undefined>(businessProfile?.logoUrl);
  const [isLoading, setIsLoading] = useState(false);

  const handlePickLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a logo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Use base64 so it embeds correctly in the PDF HTML
        if (asset.base64) {
          const mimeType = asset.mimeType || 'image/jpeg';
          setLogoUri(`data:${mimeType};base64,${asset.base64}`);
        } else {
          setLogoUri(asset.uri);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handleSave = async () => {
    if (!name) {
      Alert.alert('Validation Error', 'Business Name is required.');
      return;
    }
    
    setIsLoading(true);
    try {
      const profile: BusinessProfile = {
        name,
        email,
        phone,
        address,
        taxId,
        currency,
        logoUrl: logoUri,
        defaultTaxRate: parseFloat(defaultTaxRate) || 0,
        defaultTemplate,
        reminderDaysBefore: businessProfile?.reminderDaysBefore || 3,
        reminderRepeatOnOverdue: businessProfile?.reminderRepeatOnOverdue !== undefined ? businessProfile.reminderRepeatOnOverdue : true
      };
      
      await saveBusinessProfile(profile);
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      Alert.alert('Error', 'Failed to save business profile settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const paddingTop = Platform.select({
    android: Math.max(insets.top + Spacing.two, 45),
    ios: Math.max(insets.top, 40),
    default: Spacing.four,
  });

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={['#1E3A8A', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.appHeader, { paddingTop, paddingBottom: Spacing.four, paddingHorizontal: Spacing.four, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }]}
      >
        {router.canGoBack() && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <Building2 size={moderateScale(28)} color="#FFFFFF" style={[styles.headerIcon, !router.canGoBack() && { alignSelf: 'center' }]} />
        <View style={{ flex: 1 }}>
          <ThemedText style={[styles.appTitle, { color: '#FFFFFF', fontSize: moderateScale(20) }]}>Business Setup</ThemedText>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: moderateScale(12), marginTop: 2 }}>
            Company details and default settings
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Card 1: Business Identity */}
        <Card title="Business Identity">
          <View style={styles.logoAndNameRow}>
            <View style={styles.logoContainer}>
              <TouchableOpacity
                onPress={handlePickLogo}
                style={[
                  styles.logoPickerBtn,
                  {
                    backgroundColor: theme.backgroundSelected,
                    borderColor: logoUri ? 'transparent' : '#208AEF',
                    borderStyle: logoUri ? 'solid' : 'dashed'
                  }
                ]}
                activeOpacity={0.8}
              >
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={styles.logoPreview} resizeMode="cover" />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Camera size={20} color="#208AEF" />
                    <Text style={styles.logoPlaceholderText}>Upload</Text>
                  </View>
                )}
              </TouchableOpacity>
              {logoUri && (
                <TouchableOpacity
                  onPress={() => setLogoUri(undefined)}
                  style={styles.removeLogoBadge}
                  activeOpacity={0.8}
                >
                  <Trash2 size={12} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.businessNameWrapper}>
              <Input
                label="Business Name *"
                placeholder="Acme Corp"
                value={name}
                onChangeText={setName}
                disabled={isLoading}
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
          </View>
          
          <View style={{ height: Spacing.four }} />
          
          <Input
            label="Tax Registration ID / VAT Number"
            placeholder="Tax-9988-AA"
            value={taxId}
            onChangeText={setTaxId}
            disabled={isLoading}
            containerStyle={{ marginBottom: 0 }}
          />
        </Card>

        {/* Card 2: Contact Information */}
        <Card title="Contact Info">
          <Input
            label="Contact Email"
            placeholder="billing@acme.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={isLoading}
          />

          <Input
            label="Contact Phone"
            placeholder="+1 (555) 019-2834"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            disabled={isLoading}
          />

          <Input
            label="Business Address"
            placeholder="123 Financial Way, Suite 100"
            value={address}
            onChangeText={setAddress}
            multiline
            style={styles.textArea}
            disabled={isLoading}
            containerStyle={{ marginBottom: 0 }}
          />
        </Card>

        {/* Card 3: Financial Settings & PDF Design */}
        <Card title="Defaults & Preferences">
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Default Currency</Text>
          <View style={styles.pillContainer}>
            {CURRENCIES.map((cur) => {
              const isSelected = currency === cur;
              return (
                <TouchableOpacity
                  key={cur}
                  onPress={() => setCurrency(cur)}
                  style={[
                    styles.pill,
                    { 
                      backgroundColor: isSelected ? '#208AEF' : theme.backgroundSelected,
                      borderColor: isSelected ? '#208AEF' : theme.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text 
                    style={[
                      styles.pillText, 
                      { 
                        color: isSelected ? '#FFFFFF' : theme.text,
                        fontWeight: isSelected ? '700' : '600'
                      }
                    ]}
                  >
                    {cur}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Input
            label="Default Tax Rate (%)"
            placeholder="15"
            value={defaultTaxRate}
            onChangeText={setDefaultTaxRate}
            keyboardType="numeric"
            disabled={isLoading}
          />

          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Default PDF Design Layout</Text>
          <View style={styles.templateContainer}>
            {TEMPLATES.map((tpl) => {
              const isSelected = defaultTemplate === tpl.id;
              return (
                <TouchableOpacity
                  key={tpl.id}
                  onPress={() => setDefaultTemplate(tpl.id)}
                  style={[
                    styles.templateOption,
                    { 
                      backgroundColor: isSelected 
                        ? (theme.text === '#ffffff' ? '#1E293B' : '#E6F4FE') 
                        : theme.backgroundSelected,
                      borderColor: isSelected ? '#208AEF' : theme.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={styles.templateOptionContent}>
                    <View style={[styles.templateIconContainer, { backgroundColor: isSelected ? '#208AEF' : theme.border }]}>
                      <FileText size={16} color={isSelected ? '#FFFFFF' : theme.textSecondary} />
                    </View>
                    <Text style={[styles.templateLabel, { color: theme.text }]}>{tpl.label}</Text>
                  </View>
                  <View style={[
                    styles.radioOutline,
                    { borderColor: isSelected ? '#208AEF' : theme.textSecondary }
                  ]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Button
          title="Save Business Settings"
          onPress={handleSave}
          loading={isLoading}
          style={styles.saveButton}
          icon={<Save size={18} color="#FFF" />}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  headerIcon: {
    marginRight: Spacing.two,
  },
  backBtn: {
    marginRight: Spacing.three,
  },
  appTitle: {
    fontWeight: '800',
    fontSize: 22,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: Spacing.two,
    marginTop: Spacing.one,
  },
  // Logo & Profile Name Row
  logoAndNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    alignSelf: 'stretch',
  },
  logoContainer: {
    position: 'relative',
    width: 72,
    height: 72,
  },
  logoPickerBtn: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPreview: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  logoPlaceholderText: {
    fontSize: 9,
    color: '#208AEF',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  removeLogoBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3,
  },
  businessNameWrapper: {
    flex: 1,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.three,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillText: {
    fontSize: 13,
  },
  templateContainer: {
    gap: 10,
    marginBottom: Spacing.two,
  },
  templateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  templateOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  templateIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  radioOutline: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#208AEF',
  },
  saveButton: {
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
});


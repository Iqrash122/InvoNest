import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useData, Client } from '@/context/DataContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Save, Plus, X, User, Tag, Mail, Phone, MapPin, FileText, UserPlus } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

const PRESET_TAGS = ['VIP', 'Often Late', 'Weekly Client', 'Contractor', 'Corporate'];

function getInitials(nameStr: string) {
  if (!nameStr.trim()) return '';
  const parts = nameStr.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function CreateClient() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const editId = params.id as string;
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const { clients, saveClient } = useData();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editId) {
      const cli = clients.find((c) => c.id === editId);
      if (cli) {
        /* eslint-disable react-hooks/set-state-in-effect -- Populate client values when loading edit details */
        setName(cli.name);
        setEmail(cli.email || '');
        setPhone(cli.phone || '');
        setAddress(cli.address || '');
        setNotes(cli.notes || '');
        setTags(cli.tags || []);
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    }
  }, [editId, clients]);

  const handleAddTag = (tag: string) => {
    const cleanTag = tag.trim();
    if (!cleanTag) return;
    if (tags.includes(cleanTag)) return;
    setTags([...tags, cleanTag]);
    setCustomTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Client Name is required.');
      return;
    }

    setIsLoading(true);
    try {
      const clientData: Omit<Client, 'id'> = {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined
      };

      await saveClient({ ...clientData, id: editId });
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to save client details.');
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
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Premium Hero Header */}
      <LinearGradient
        colors={['#0F172A', '#1E3A8A', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.appHeader, { paddingTop }]}
      >
        {/* Nav row */}
        <View style={styles.heroNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.heroBack}>
            <ArrowLeft size={20} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.heroNavTitle}>{editId ? 'Edit Profile' : 'Add Profile'}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveHeaderBtn} disabled={isLoading}>
            <Text style={styles.saveHeaderText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Avatar Container */}
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#10B981', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarBorder}
          >
            <View style={[styles.avatarInner, { backgroundColor: theme.backgroundElement }]}>
              {name.trim() ? (
                <Text style={[styles.avatarText, { color: theme.text }]}>{getInitials(name)}</Text>
              ) : (
                <UserPlus size={32} color="#208AEF" />
              )}
            </View>
          </LinearGradient>
          <Text style={styles.heroNameText} numberOfLines={1}>
            {name.trim() || (editId ? 'Client Name' : 'New Client')}
          </Text>
          <Text style={styles.heroSubText}>
            {editId ? 'Update details for this client' : 'Enter billing & contact details'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Contact Details Card */}
        <View style={[styles.inputsCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconWrap}>
                <User size={14} color="#208AEF" />
              </View>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Contact Details</Text>
            </View>
          </View>
          
          <View style={styles.cardContent}>
            <Input
              label="Client Name *"
              placeholder="John Doe"
              value={name}
              onChangeText={setName}
              disabled={isLoading}
              icon={<User size={18} color={theme.textSecondary} />}
            />

            <Input
              label="Email Address"
              placeholder="client@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              disabled={isLoading}
              icon={<Mail size={18} color={theme.textSecondary} />}
            />

            <Input
              label="Phone Number"
              placeholder="+1 (555) 123-4567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              disabled={isLoading}
              icon={<Phone size={18} color={theme.textSecondary} />}
            />
          </View>
        </View>

        {/* Billing & Notes Card */}
        <View style={[styles.inputsCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconWrap}>
                <MapPin size={13} color="#208AEF" />
              </View>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Billing & Notes</Text>
            </View>
          </View>
          
          <View style={styles.cardContent}>
            <Input
              label="Billing Address"
              placeholder="456 Commerce St, Apt 2B"
              value={address}
              onChangeText={setAddress}
              multiline
              style={styles.textArea}
              disabled={isLoading}
              icon={<MapPin size={18} color={theme.textSecondary} />}
            />

            <Input
              label="Internal Notes"
              placeholder="Important billing details..."
              value={notes}
              onChangeText={setNotes}
              multiline
              style={styles.textArea}
              disabled={isLoading}
              icon={<FileText size={18} color={theme.textSecondary} />}
            />
          </View>
        </View>

        {/* Tags management */}
        <View style={[styles.inputsCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconWrap}>
                <Tag size={13} color="#208AEF" />
              </View>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Client Group Tags</Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag) => (
                  <View key={tag} style={[styles.tagPill, { backgroundColor: 'rgba(32, 138, 239, 0.1)', borderColor: 'rgba(32, 138, 239, 0.2)' }]}>
                    <Text style={styles.tagPillText}>{tag}</Text>
                    <TouchableOpacity onPress={() => handleRemoveTag(tag)} style={styles.tagPillRemove}>
                      <X size={10} color="#208AEF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.customTagRow}>
              <Input
                placeholder="Custom tag..."
                value={customTagInput}
                onChangeText={setCustomTagInput}
                containerStyle={{ flex: 1, marginBottom: 0 }}
              />
              <Button
                title="Add"
                onPress={() => handleAddTag(customTagInput)}
                size="small"
                style={styles.customTagAddBtn}
              />
            </View>

            <Text style={[styles.presetsLabel, { color: theme.textSecondary }]}>Common presets:</Text>
            <View style={styles.presetsContainer}>
              {PRESET_TAGS.filter((t) => !tags.includes(t)).map((preset) => (
                <TouchableOpacity
                  key={preset}
                  onPress={() => handleAddTag(preset)}
                  style={[styles.presetTag, { backgroundColor: theme.backgroundSelected }]}
                >
                  <Text style={[styles.presetTagText, { color: theme.textSecondary }]}>+ {preset}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Button
          title="Save Client Profile"
          onPress={handleSave}
          loading={isLoading}
          style={styles.saveBtn}
          icon={<Save size={18} color="#FFF" style={{ marginRight: 6 }} />}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appHeader: {
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.four,
    marginBottom: 10,
  },
  heroBack: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNavTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  avatarBorder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  avatarInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
    paddingHorizontal: Spacing.four,
    textAlign: 'center',
  },
  heroSubText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 3,
    fontWeight: '600',
  },
  saveHeaderBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  saveHeaderText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  inputsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(32, 138, 239, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.three,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#208AEF',
  },
  tagPillRemove: {
    marginLeft: 6,
    padding: 2,
  },
  customTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.three,
  },
  customTagAddBtn: {
    height: 48,
    borderRadius: 12,
  },
  presetsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: Spacing.two,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetTag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  presetTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  saveBtn: {
    marginTop: Spacing.two,
    marginBottom: 30,
  },
});

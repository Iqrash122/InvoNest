import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '@/context/DataContext';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/use-theme';
import { Search, Plus, Users, Mail, Phone, MapPin, ChevronRight, Tag } from 'lucide-react-native';

// ── Avatar with initials ─────────────────────────────────────────
const AVATAR_COLORS: [string, string][] = [
  ['#1D4ED8', '#3B82F6'],
  ['#059669', '#10B981'],
  ['#7C3AED', '#8B5CF6'],
  ['#B45309', '#F59E0B'],
  ['#DC2626', '#EF4444'],
  ['#0369A1', '#0EA5E9'],
  ['#6D28D9', '#A78BFA'],
  ['#065F46', '#34D399'],
];

function getAvatarColors(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function Clients() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { clients, invoices, themeMode } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  const paddingTop = Platform.select({
    android: Math.max(insets.top + Spacing.two, 45),
    ios: Math.max(insets.top, 40),
    default: Spacing.four,
  });

  return (
    <ThemedView style={styles.container}>
      {/* ─── HEADER ───────────────────────────────────────────── */}
      <LinearGradient
        colors={['#0F172A', '#1E3A8A', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerEyebrow}>DIRECTORY</Text>
            <Text style={styles.headerTitle}>Clients</Text>
          </View>
          <View style={styles.headerCountBadge}>
            <Text style={styles.headerCountNum}>{clients.length}</Text>
            <Text style={styles.headerCountLabel}>total</Text>
          </View>
        </View>

        {/* Search bar inside header */}
        <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement }]}>
          <Search size={16} color={theme.textSecondary} />
          <TextInput
            placeholder="Search name, email or tag…"
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={[styles.searchClear, { color: theme.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* ─── LIST ─────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredClients.length === 0 ? (
          <View style={styles.emptyWrap}>
            <LinearGradient colors={themeMode === 'dark' ? ['#1E293B', '#0F172A'] : ['#EFF6FF', '#DBEAFE']} style={styles.emptyIconCircle}>
              <Users size={40} color={themeMode === 'dark' ? '#60A5FA' : '#3B82F6'} />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {searchQuery ? 'No results found' : 'No Clients Yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {searchQuery
                ? 'Try a different search term.'
                : 'Add your first client to start creating invoices.'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/client/create')}>
                <Plus size={15} color="#FFF" />
                <Text style={styles.emptyBtnText}>Add Client</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredClients.map((client, idx) => {
            const [gradA, gradB] = getAvatarColors(client.name);
            const initials = getInitials(client.name);
            const clientInvoiceCount = invoices.filter(i => i.clientId === client.id).length;

            return (
              <Pressable
                key={client.id}
                onPress={() => router.push(`/client/${client.id}`)}
                style={({ pressed }) => [styles.cardWrap, pressed && { opacity: 0.92 }]}
              >
                <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                  {/* Avatar */}
                  <LinearGradient colors={[gradA, gradB]} style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </LinearGradient>

                  {/* Details */}
                  <View style={styles.cardBody}>
                    <View style={styles.cardTopRow}>
                      <Text style={[styles.clientName, { color: theme.text }]} numberOfLines={1}>{client.name}</Text>
                      {clientInvoiceCount > 0 && (
                        <View style={[styles.invCountBadge, { backgroundColor: theme.backgroundSelected }]}>
                          <Text style={[styles.invCountText, { color: theme.text }]}>{clientInvoiceCount} inv</Text>
                        </View>
                      )}
                    </View>

                    {client.email && (
                      <View style={styles.metaRow}>
                        <Mail size={11} color={theme.textSecondary} />
                        <Text style={[styles.metaText, { color: theme.textSecondary }]} numberOfLines={1}>{client.email}</Text>
                      </View>
                    )}
                    {client.phone && (
                      <View style={styles.metaRow}>
                        <Phone size={11} color={theme.textSecondary} />
                        <Text style={[styles.metaText, { color: theme.textSecondary }]}>{client.phone}</Text>
                      </View>
                    )}
                    {client.address && !client.email && !client.phone && (
                      <View style={styles.metaRow}>
                        <MapPin size={11} color={theme.textSecondary} />
                        <Text style={[styles.metaText, { color: theme.textSecondary }]} numberOfLines={1}>{client.address}</Text>
                      </View>
                    )}

                    {client.tags && client.tags.length > 0 && (
                      <View style={styles.tagsRow}>
                        {client.tags.slice(0, 3).map((tag) => (
                          <View key={tag} style={[styles.tagPill, { backgroundColor: theme.backgroundSelected }]}>
                            <Text style={[styles.tagText, { color: theme.textSecondary }]}>{tag}</Text>
                          </View>
                        ))}
                        {client.tags.length > 3 && (
                          <Text style={[styles.tagMore, { color: theme.textSecondary }]}>+{client.tags.length - 3}</Text>
                        )}
                      </View>
                    )}
                  </View>

                  <ChevronRight size={16} color={theme.textSecondary} />
                </View>
              </Pressable>
            );
          })
        )}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ─── FAB ──────────────────────────────────────────────── */}
      <TouchableOpacity
        onPress={() => router.push('/client/create')}
        style={styles.fabWrap}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#1D4ED8', '#3B82F6']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Plus size={24} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 10,
    marginBottom: 14,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerEyebrow: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 2, marginBottom: 2 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  headerCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center',
  },
  headerCountNum: { fontSize: 22, fontWeight: '900', color: '#FFF' },
  headerCountLabel: { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase' },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14,
    paddingHorizontal: 14, height: 46,
  },
  searchInput: { flex: 1, fontSize: 14 },
  searchClear: { fontSize: 14, fontWeight: '700' },

  // List
  listContent: { paddingHorizontal: Spacing.four, paddingTop: 4 },

  // Card
  cardWrap: { marginBottom: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: 18, fontWeight: '900', color: '#FFF' },

  cardBody: { flex: 1, gap: 3 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  clientName: { fontSize: 15, fontWeight: '800', flex: 1 },
  invCountBadge: {
    borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  invCountText: { fontSize: 10, fontWeight: '700' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, fontWeight: '500', flex: 1 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 4 },
  tagPill: { borderRadius: 8, paddingVertical: 2, paddingHorizontal: 7 },
  tagText: { fontSize: 10, fontWeight: '700' },
  tagMore: { fontSize: 10, fontWeight: '600', alignSelf: 'center' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIconCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptySubtitle: { fontSize: 13, textAlign: 'center', paddingHorizontal: 24, lineHeight: 18 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6,
    backgroundColor: '#3B82F6', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 20,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // FAB
  fabWrap: {
    position: 'absolute', 
    bottom: Platform.OS === 'ios' ? 104 : 94, 
    right: Spacing.four,
    shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  fab: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});

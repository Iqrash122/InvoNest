import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal as RNModal, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ visible, onClose, title, children }: ModalProps) {
  const theme = useTheme();

  return (
    <RNModal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContainer, { backgroundColor: theme.backgroundElement }]}>
              {/* Header */}
              <LinearGradient
                colors={['#1E3A8A', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { borderBottomColor: theme.border }]}
              >
                <Text style={[styles.title, { color: '#FFFFFF' }]}>{title || 'Select'}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>

              {/* Content */}
              <ScrollView 
                style={styles.scrollWrapper} 
                contentContainerStyle={styles.scrollContent}
                bounces={false}
              >
                {children}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three + 2,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: Spacing.one,
  },
  scrollWrapper: {
    flexShrink: 1,
  },
  scrollContent: {
    padding: Spacing.four,
  },
});
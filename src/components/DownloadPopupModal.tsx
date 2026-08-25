import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { X, Download, User as UserIcon, Phone } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { apiClient, ENDPOINTS } from '../service/api.service';

interface DownloadPopupModalProps {
  visible: boolean;
  onClose: () => void;
  targetUrl: string;
  resourceTitle: string;
  resourceType: string;
}

export const DownloadPopupModal: React.FC<DownloadPopupModalProps> = ({
  visible,
  onClose,
  targetUrl,
  resourceTitle,
  resourceType,
}) => {
  const { user } = useAuth();

  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setLeadName(user.name || '');
      setLeadPhone(user.phone || user.phn || '');
    }
  }, [visible, user]);

  const handleDownloadConfirm = async () => {
    if (!leadName || !leadPhone) {
      alert('Please fill in your details to continue.');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient(ENDPOINTS.SUBMIT_FREE_RESOURCE, {
        method: 'POST',
        data: {
          name: leadName,
          phone: leadPhone,
          resource_type: resourceType,
          resource_title: resourceTitle,
        },
      });

      onClose();
      Linking.openURL(targetUrl);
    } catch (error) {
      console.error('Lead submission error:', error);
      // Fallback: still let them download if the tracking fails
      onClose();
      Linking.openURL(targetUrl);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Free Resource Access</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <X color="#64748B" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ alignItems: 'center' }} style={{ width: '100%' }}>
            <View style={styles.iconCircle}>
              <Download color="#6366F6" size={32} />
            </View>
            <Text style={styles.modalSubtitleWeb}>
              Please enter your details to continue downloading{' '}
              <Text style={{ fontWeight: '800', color: '#0F172A' }}>{resourceTitle}</Text>
            </Text>

            <View style={styles.leadForm}>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputBox}>
                  <UserIcon color="#94A3B8" size={18} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your name"
                    value={leadName}
                    onChangeText={setLeadName}
                  />
                </View>
              </View>

              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.inputBox}>
                  <Phone color="#94A3B8" size={18} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 9876543210"
                    keyboardType="phone-pad"
                    maxLength={15}
                    value={leadPhone}
                    onChangeText={setLeadPhone}
                  />
                </View>
              </View>
            </View>

            <Text style={styles.secureText}>Your information is secure and will never be shared.</Text>

            <TouchableOpacity
              style={[styles.confirmBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleDownloadConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Download color="#FFFFFF" size={18} style={{ marginRight: 8 }} />
                  <Text style={styles.confirmBtnText}>Continue to Download</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeIcon: {
    padding: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalSubtitleWeb: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  leadForm: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  inputWrap: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  secureText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmBtn: {
    flexDirection: 'row',
    backgroundColor: '#6366F6',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

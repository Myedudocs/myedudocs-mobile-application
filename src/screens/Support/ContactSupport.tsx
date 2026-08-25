import React, { useState } from 'react';
import { View as RNView, Text as RNText, StyleSheet as RNStyleSheet, ScrollView as RNScrollView, TextInput as RNTextInput, TouchableOpacity as RNTouchableOpacity, ActivityIndicator as RNActivityIndicator, Modal as RNModal, Alert } from 'react-native';
import { Phone, Mail, MapPin, Clock, CheckCircle, GraduationCap, CreditCard, Settings, ChevronDown, Send } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from '../../service/api.service';
import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';

const ContactSupport = () => {
  const navigation = useNavigation<any>();
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });

  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const subjects = ['General Inquiry', 'Course Help', 'Billing & Payment', 'Technical Support'];

  const contactData = {
    phone: "+91 080760 03728",
    email: "contact@myedudocs.in",
    office: "Building no 1, 3rd floor, opp. Sapna cinema, above Bikanervala Community centre, D Block, East of Kailash, New Delhi, Delhi 110065"
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone || !form.message) {
      Alert.alert("Required Fields", "Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/admin/contactus/contact/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmissionId(data.data?.reference || `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
        setSubmitted(true);
        setForm({ ...form, name: '', email: '', phone: '', message: '' });
      } else {
        Alert.alert("Error", data.message || "Submission failed");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer
      header={{ title: 'Contact Support', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      scroll={false}
    >
      <RNScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.contentContainer}>

        {/* Intro */}
        <RNView style={styles.introSection}>
          <RNText style={[styles.introText, { color: theme.colors.textMuted }]}>
            Have questions about our educational resources? We're here to help you find the right documents for your studies.
          </RNText>
          <RNView style={styles.responsePill}>
            <Clock size={16} color="#0284C7" />
            <RNText style={styles.responsePillText}>We usually respond within 12 hours.</RNText>
          </RNView>
        </RNView>

        {/* Contact Info Cards */}
        <RNScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.infoCardsScroll} contentContainerStyle={{ paddingBottom: 16 }}>
          <RNView style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
            <RNView style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Phone size={24} color="#3B82F6" />
            </RNView>
            <RNText style={[styles.infoCardTitle, { color: theme.colors.textMain }]}>Call Us</RNText>
            <RNText style={[styles.infoCardValue, { color: theme.colors.textMain }]}>{contactData.phone}</RNText>
            <RNText style={[styles.infoCardSub, { color: theme.colors.textLight }]}>Mon-Fri, 9am - 6pm IST</RNText>
          </RNView>

          <RNView style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
            <RNView style={[styles.iconBox, { backgroundColor: '#FAF5FF' }]}>
              <Mail size={24} color="#A855F7" />
            </RNView>
            <RNText style={[styles.infoCardTitle, { color: theme.colors.textMain }]}>Email Us</RNText>
            <RNText style={[styles.infoCardValue, { color: theme.colors.textMain }]}>{contactData.email}</RNText>
            <RNText style={[styles.infoCardSub, { color: theme.colors.textLight }]}>Online Support</RNText>
          </RNView>

          <RNView style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
            <RNView style={[styles.iconBox, { backgroundColor: '#ECFEFF' }]}>
              <MapPin size={24} color="#06B6D4" />
            </RNView>
            <RNText style={[styles.infoCardTitle, { color: theme.colors.textMain }]}>Visit Our Office</RNText>
            <RNText style={[styles.infoCardValue, { color: theme.colors.textMain }]} numberOfLines={3}>{contactData.office}</RNText>
          </RNView>
        </RNScrollView>

        {/* Contact Form */}
        <RNView style={[styles.formContainer, { backgroundColor: theme.colors.surface }]}>
          <RNText style={[styles.formTitle, { color: theme.colors.textMain }]}>Send Us a Message</RNText>

          <RNView style={styles.inputGroup}>
            <RNText style={[styles.inputLabel, { color: theme.colors.textMain }]}>Full Name</RNText>
            <RNTextInput
              style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textMain }]}
              placeholder="John Doe"
              placeholderTextColor={theme.colors.textLight}
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
            />
          </RNView>

          <RNView style={styles.inputGroup}>
            <RNText style={[styles.inputLabel, { color: theme.colors.textMain }]}>Email Address</RNText>
            <RNTextInput
              style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textMain }]}
              placeholder="john@example.com"
              placeholderTextColor={theme.colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(t) => setForm({ ...form, email: t })}
            />
          </RNView>

          <RNView style={styles.inputGroup}>
            <RNText style={[styles.inputLabel, { color: theme.colors.textMain }]}>Phone Number</RNText>
            <RNTextInput
              style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textMain }]}
              placeholder="+91 00000 00000"
              placeholderTextColor={theme.colors.textLight}
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(t) => setForm({ ...form, phone: t })}
            />
          </RNView>

          <RNView style={styles.inputGroup}>
            <RNText style={[styles.inputLabel, { color: theme.colors.textMain }]}>Subject</RNText>
            <RNTouchableOpacity style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]} onPress={() => setShowSubjectPicker(!showSubjectPicker)}>
              <RNText style={{ color: form.subject ? theme.colors.textMain : theme.colors.textLight }}>
                {form.subject || "Select a Subject"}
              </RNText>
              <ChevronDown size={20} color={theme.colors.textMuted} />
            </RNTouchableOpacity>
            {showSubjectPicker && (
              <RNView style={[styles.dropdown, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                {subjects.map((sub, i) => (
                  <RNTouchableOpacity
                    key={i}
                    style={[styles.dropdownItem, { borderBottomColor: theme.colors.border }]}
                    onPress={() => { setForm({ ...form, subject: sub }); setShowSubjectPicker(false); }}
                  >
                    <RNText style={[styles.dropdownText, { color: theme.colors.textMain }]}>{sub}</RNText>
                  </RNTouchableOpacity>
                ))}
              </RNView>
            )}
          </RNView>

          <RNView style={styles.inputGroup}>
            <RNText style={[styles.inputLabel, { color: theme.colors.textMain }]}>Your Message</RNText>
            <RNTextInput
              style={[styles.input, styles.textArea, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textMain }]}
              placeholder="How can we help you?"
              placeholderTextColor={theme.colors.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={form.message}
              onChangeText={(t) => setForm({ ...form, message: t })}
            />
          </RNView>

          <RNTouchableOpacity
            style={[styles.submitBtn, { backgroundColor: '#3B82F6' }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <RNActivityIndicator color="#FFF" /> : (
              <>
                <Send size={18} color="#FFF" />
                <RNText style={styles.submitBtnText}>Send Message</RNText>
              </>
            )}
          </RNTouchableOpacity>
        </RNView>

        {/* Why Contact Us */}
        <RNView style={styles.whySection}>
          <RNText style={[styles.whyTitle, { color: theme.colors.textMain }]}>Why Contact MyEduDocs?</RNText>

          <RNView style={styles.featureItem}>
            <RNView style={styles.featureIcon}><GraduationCap size={24} color="#3B82F6" /></RNView>
            <RNView style={styles.featureContent}>
              <RNText style={[styles.featureTitle, { color: theme.colors.textMain }]}>Course Recommendations</RNText>
              <RNText style={[styles.featureDesc, { color: theme.colors.textMuted }]}>Our educators can recommend the perfect documents for your specific curriculum.</RNText>
            </RNView>
          </RNView>

          <RNView style={styles.featureItem}>
            <RNView style={styles.featureIcon}><CreditCard size={24} color="#A855F7" /></RNView>
            <RNView style={styles.featureContent}>
              <RNText style={[styles.featureTitle, { color: theme.colors.textMain }]}>Payment & Billing</RNText>
              <RNText style={[styles.featureDesc, { color: theme.colors.textMuted }]}>Fast and secure resolution for any subscription or billing queries.</RNText>
            </RNView>
          </RNView>

          <RNView style={styles.featureItem}>
            <RNView style={styles.featureIcon}><Settings size={24} color="#06B6D4" /></RNView>
            <RNView style={styles.featureContent}>
              <RNText style={[styles.featureTitle, { color: theme.colors.textMain }]}>Technical Guidance</RNText>
              <RNText style={[styles.featureDesc, { color: theme.colors.textMuted }]}>Encountered a bug or need help? Our tech support team is ready to assist.</RNText>
            </RNView>
          </RNView>
        </RNView>

      </RNScrollView>

      {/* Success Modal */}
      <RNModal visible={submitted} transparent animationType="fade">
        <RNView style={styles.modalOverlay}>
          <RNView style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <CheckCircle size={60} color="#10B981" />
            <RNText style={[styles.modalTitle, { color: theme.colors.textMain }]}>Message Sent!</RNText>
            <RNText style={[styles.modalDesc, { color: theme.colors.textMuted }]}>We have received your message and will get back to you shortly.</RNText>
            <RNView style={[styles.refBox, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <RNText style={[styles.refLabel, { color: theme.colors.textMuted }]}>Reference ID:</RNText>
              <RNText style={[styles.refId, { color: theme.colors.textMain }]}>{submissionId}</RNText>
            </RNView>
            <RNTouchableOpacity style={styles.modalBtn} onPress={() => setSubmitted(false)}>
              <RNText style={styles.modalBtnText}>OK</RNText>
            </RNTouchableOpacity>
          </RNView>
        </RNView>
      </RNModal>

    </ScreenContainer>
  );
};

const styles = RNStyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingBottom: 40 },
  introSection: { padding: 24, alignItems: 'center' },
  introText: { fontSize: 15, textAlign: 'center', marginBottom: 16, lineHeight: 22 },
  responsePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  responsePillText: { marginLeft: 6, fontSize: 13, color: '#0369A1' },
  infoCardsScroll: { marginBottom: 8 },
  infoCard: { padding: 20, borderRadius: 16, marginRight: 16, width: 220, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  infoCardTitle: { fontSize: 16, marginBottom: 4 },
  infoCardValue: { fontSize: 14, marginBottom: 4, lineHeight: 20 },
  infoCardSub: { fontSize: 13 },
  formContainer: { margin: 16, borderRadius: 16, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  formTitle: { fontSize: 18, marginBottom: 20 },
  inputGroup: { marginBottom: 16, position: 'relative' },
  inputLabel: { fontSize: 14, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, height: 48, fontSize: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textArea: { height: 120, paddingTop: 12 },
  dropdown: { position: 'absolute', top: 78, left: 0, right: 0, borderWidth: 1, borderRadius: 8, zIndex: 10, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  dropdownText: { fontSize: 15 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 12, marginTop: 12 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, marginLeft: 8 },
  whySection: { padding: 24, paddingBottom: 40 },
  whyTitle: { fontSize: 20, marginBottom: 24, textAlign: 'center' },
  featureItem: { flexDirection: 'row', marginBottom: 24 },
  featureIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  featureContent: { flex: 1, marginLeft: 16 },
  featureTitle: { fontSize: 16, marginBottom: 4 },
  featureDesc: { fontSize: 14, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 20, padding: 32, alignItems: 'center' },
  modalTitle: { fontSize: 22, marginTop: 20, marginBottom: 8 },
  modalDesc: { fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  refBox: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderStyle: 'dashed' },
  refLabel: { fontSize: 13, marginBottom: 4 },
  refId: { fontSize: 18, letterSpacing: 1 },
  modalBtn: { backgroundColor: '#10B981', width: '100%', height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { color: '#FFFFFF', fontSize: 16 }
});

export { ContactSupport };
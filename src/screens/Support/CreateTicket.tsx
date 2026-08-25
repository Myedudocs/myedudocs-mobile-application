import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { apiClient, ENDPOINTS, BASE_URL, clearApiCache } from '../../service/api.service';
import { Send, HelpCircle } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';

const CATEGORIES = [
  'Technical',
  'Billing',
  'Course Content',
  'Exam Issue',
  'Other',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export const CreateTicket = () => {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!user?.token) {
      Alert.alert('Login Required', 'Please login to submit a support ticket.');
      return;
    }
    if (!subject.trim() || !category || !message.trim()) {
      Alert.alert('Required Fields', 'Please fill in subject, category, and message.');
      return;
    }

    try {
      setLoading(true);
      
      // Send as FormData (multer backend expectation matching Web SupportCreateV2)
      const formData = new FormData();
      formData.append('subject', subject.trim());
      formData.append('category', category);
      formData.append('priority', priority || 'Medium');
      formData.append('message', message.trim());

      const res = await fetch(`${BASE_URL}/support/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      let result: any;
      try {
        result = await res.json();
      } catch (e) {
        // Fallback to JSON if server did not accept multipart
        const jsonRes = await fetch(`${BASE_URL}/support/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            subject: subject.trim(),
            category,
            priority: priority || 'Medium',
            message: message.trim(),
          }),
        });
        result = await jsonRes.json();
      }

      if (result && (result.success || res.ok)) {
        clearApiCache();
        Alert.alert('Success 🎉', 'Support ticket raised successfully! Our team will respond shortly.', [
          { text: 'View Tickets', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', result?.message || 'Failed to create ticket. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create ticket. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer
      header={{ title: 'Create Ticket', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      scroll={false}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textMain }]}>Issue Subject</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.textMain, borderColor: theme.colors.border }]}
              placeholder="What's the problem?"
              placeholderTextColor={theme.colors.textLight}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textMain }]}>Category</Text>
            <View style={styles.categoryContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    category === cat && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    styles.categoryText,
                    { color: theme.colors.textMuted },
                    category === cat && { color: '#FFF' }
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textMain }]}>Priority</Text>
            <View style={styles.categoryContainer}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    priority === p && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[
                    styles.categoryText,
                    { color: theme.colors.textMuted },
                    priority === p && { color: '#FFF' }
                  ]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textMain }]}>Describe your issue</Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: theme.colors.surface, color: theme.colors.textMain, borderColor: theme.colors.border }
              ]}
              placeholder="Provide as much detail as possible..."
              placeholderTextColor={theme.colors.textLight}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.submitText}>Submit Ticket</Text>
                <Send size={18} color="#FFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={[styles.infoBox, { backgroundColor: theme.colors.primaryLight }]}>
            <HelpCircle size={20} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.textMuted }]}>
              Our support team usually responds within 24-48 business hours.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    height: 55,
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    fontSize: 15,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textArea: {
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 150,
  },
  submitBtn: {
    height: 55,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 10,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    marginLeft: 10,
    lineHeight: 18,
  },
});
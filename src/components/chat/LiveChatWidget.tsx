import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Linking,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import {
  MessageSquare,
  X,
  Search,
  PhoneCall,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  LifeBuoy,
  Send,
  Sparkles,
  BookOpen,
  CreditCard,
  GraduationCap,
  FileQuestion,
  ExternalLink,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { ENDPOINTS, apiService } from '../../service/api.service';
import { useAuth } from '../../context/AuthContext';

import { navigationRef } from '../../navigation/navigationRef';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const WHATSAPP_NUMBER = '918076003728';

const HIDDEN_SCREENS = new Set([
  'TestInterface',
  'TestResults',
  'PdfViewer',
  'CourseLearning',
  'TicketChat',
  'CreateTicket',
]);

interface FAQItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  priority?: number;
}

interface LiveChatWidgetProps {
  navigation?: any;
}

export const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'faqs' | 'callback'>('faqs');
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [currentRoute, setCurrentRoute] = useState<string>('');

  useEffect(() => {
    const updateRoute = () => {
      try {
        if (navigationRef.isReady()) {
          const route = navigationRef.getCurrentRoute();
          if (route?.name) {
            setCurrentRoute(route.name);
          }
        }
      } catch (e) {
        // Safe fallback
      }
    };

    updateRoute();
    const unsubscribe = navigationRef.addListener('state', updateRoute);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Callback form state
  const [callbackName, setCallbackName] = useState(user?.name || '');
  const [callbackPhone, setCallbackPhone] = useState((user as any)?.phone || (user as any)?.phn || '');
  const [callbackNotes, setCallbackNotes] = useState('');
  const [submittingCallback, setSubmittingCallback] = useState(false);
  const [callbackSuccess, setCallbackSuccess] = useState(false);

  // Scale animation for FAB
  const fabScale = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    if (isOpen && faqs.length === 0) {
      fetchFaqs();
    }
    if (user?.name && !callbackName) setCallbackName(user.name);
    const phone = (user as any)?.phone || (user as any)?.phn;
    if (phone && !callbackPhone) setCallbackPhone(phone);
  }, [isOpen, user]);

  const fetchFaqs = async () => {
    setLoadingFaqs(true);
    try {
      const res: any = await apiService.get(ENDPOINTS.GET_CHATBOT_PUBLIC, {
        cacheTTL: 10 * 60 * 1000,
      });
      if (res && Array.isArray(res.data)) {
        setFaqs(res.data);
      } else if (Array.isArray(res)) {
        setFaqs(res);
      } else {
        // Fallback default FAQs if backend is offline
        setFaqs(DEFAULT_FAQS);
      }
    } catch (e) {
      setFaqs(DEFAULT_FAQS);
    } finally {
      setLoadingFaqs(false);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    faqs.forEach(f => {
      if (f.category) set.add(f.category);
    });
    return ['All', ...Array.from(set)];
  }, [faqs]);

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesCategory =
        selectedCategory === 'All' ||
        faq.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [faqs, selectedCategory, searchQuery]);

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi MyEduDocs Support, I need help regarding my student account (${user?.name || 'Student'}).`
    );
    const url = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${text}`;
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${text}`);
        }
      })
      .catch(() => {
        Linking.openURL(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${text}`);
      });
  };

  const handleCallbackSubmit = async () => {
    if (!callbackName.trim() || !callbackPhone.trim()) {
      Alert.alert('Incomplete Form', 'Please enter your name and phone number.');
      return;
    }
    setSubmittingCallback(true);
    try {
      await apiService.post(ENDPOINTS.REQUEST_CHATBOT_CALLBACK, {
        name: callbackName,
        phone: callbackPhone,
        notes: callbackNotes,
        userId: user?.id || (user as any)?._id,
      });
      setCallbackSuccess(true);
    } catch (e) {
      // Even if offline, show pleasant acknowledgement
      setCallbackSuccess(true);
    } finally {
      setSubmittingCallback(false);
    }
  };

  const handleCreateTicket = () => {
    setIsOpen(false);
    if (navigation) {
      navigation.navigate('CreateTicket');
    }
  };

  if (HIDDEN_SCREENS.has(currentRoute)) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setIsOpen(true)}
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.primary,
          },
        ]}
      >
        <MessageSquare size={24} color="#FFF" />
        <View style={styles.onlineBadge} />
      </TouchableOpacity>

      {/* Interactive Chat Modal Sheet */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {/* Grab Handle */}
            <View style={styles.grabHandleWrap}>
              <View style={[styles.grabHandle, { backgroundColor: isDarkMode ? '#475569' : '#CBD5E1' }]} />
            </View>

            {/* Header */}
            <View
              style={[
                styles.modalHeader,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#4338CA',
                },
              ]}
            >
              <View style={styles.headerInfo}>
                <View style={styles.botAvatar}>
                  <Sparkles size={20} color="#FFF" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>EduDocs Assistant</Text>
                  <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Live Support & FAQs</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={styles.closeBtn}
              >
                <X size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Tab Selector */}
            <View
              style={[
                styles.tabSelector,
                {
                  backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9',
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  setActiveTab('faqs');
                  setCallbackSuccess(false);
                }}
                style={[
                  styles.tabButton,
                  activeTab === 'faqs' && {
                    backgroundColor: theme.colors.surface,
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  },
                ]}
              >
                <HelpCircle
                  size={16}
                  color={
                    activeTab === 'faqs'
                      ? theme.colors.primary
                      : theme.colors.textMuted
                  }
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    {
                      color:
                        activeTab === 'faqs'
                          ? theme.colors.primary
                          : theme.colors.textMuted,
                      fontWeight: activeTab === 'faqs' ? '700' : '500',
                    },
                  ]}
                >
                  Instant Help (FAQs)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('callback')}
                style={[
                  styles.tabButton,
                  activeTab === 'callback' && {
                    backgroundColor: theme.colors.surface,
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  },
                ]}
              >
                <PhoneCall
                  size={16}
                  color={
                    activeTab === 'callback'
                      ? theme.colors.primary
                      : theme.colors.textMuted
                  }
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    {
                      color:
                        activeTab === 'callback'
                          ? theme.colors.primary
                          : theme.colors.textMuted,
                      fontWeight: activeTab === 'callback' ? '700' : '500',
                    },
                  ]}
                >
                  Request Callback
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB CONTENT: FAQs */}
            {activeTab === 'faqs' ? (
              <View style={styles.tabContent}>
                {/* Search Box */}
                <View
                  style={[
                    styles.searchBox,
                    {
                      backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Search size={18} color={theme.colors.textMuted} />
                  <TextInput
                    placeholder="Search courses, test series, refunds..."
                    placeholderTextColor={theme.colors.textLight}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={[styles.searchInput, { color: theme.colors.textMain }]}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <X size={16} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Category Pills */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoriesScrollView}
                  contentContainerStyle={styles.categoriesContainer}
                >
                  {categories.map(cat => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setSelectedCategory(cat)}
                        style={[
                          styles.categoryPill,
                          {
                            backgroundColor: isSelected
                              ? theme.colors.primary
                              : isDarkMode
                              ? '#1E293B'
                              : '#F1F5F9',
                            borderColor: isSelected
                              ? theme.colors.primary
                              : theme.colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryPillText,
                            {
                              color: isSelected ? '#FFF' : theme.colors.textMain,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* FAQs Accordion List */}
                {loadingFaqs ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text
                      style={[
                        styles.loadingText,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      Loading answers...
                    </Text>
                  </View>
                ) : filteredFaqs.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <FileQuestion size={40} color={theme.colors.textMuted} />
                    <Text
                      style={[
                        styles.emptyTitle,
                        { color: theme.colors.textMain },
                      ]}
                    >
                      No matching questions found
                    </Text>
                    <Text
                      style={[
                        styles.emptySubtitle,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      Need custom assistance? Connect directly on WhatsApp or raise a ticket.
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    style={styles.faqList}
                    showsVerticalScrollIndicator={false}
                  >
                    {filteredFaqs.map(faq => {
                      const isExpanded = expandedFaqId === faq._id;
                      return (
                        <View
                          key={faq._id}
                          style={[
                            styles.faqCard,
                            {
                              backgroundColor: isDarkMode
                                ? '#0F172A'
                                : '#F8FAFC',
                              borderColor: theme.colors.border,
                            },
                          ]}
                        >
                          <TouchableOpacity
                            onPress={() =>
                              setExpandedFaqId(isExpanded ? null : faq._id)
                            }
                            style={styles.faqQuestionRow}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.faqQuestion,
                                { color: theme.colors.textMain },
                              ]}
                            >
                              {faq.question}
                            </Text>
                            {isExpanded ? (
                              <ChevronUp size={18} color={theme.colors.primary} />
                            ) : (
                              <ChevronDown
                                size={18}
                                color={theme.colors.textMuted}
                              />
                            )}
                          </TouchableOpacity>

                          {isExpanded && (
                            <View style={styles.faqAnswerContainer}>
                              <Text
                                style={[
                                  styles.faqAnswer,
                                  { color: theme.colors.textMuted },
                                ]}
                              >
                                {faq.answer}
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </ScrollView>
                )}

                {/* Bottom Direct Connect Actions */}
                <View
                  style={[
                    styles.bottomActions,
                    {
                      borderTopColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={handleOpenWhatsApp}
                    style={styles.whatsappBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.whatsappBtnText}>💬 Chat on WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleCreateTicket}
                    style={[
                      styles.ticketBtn,
                      {
                        borderColor: theme.colors.primary,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <LifeBuoy size={16} color={theme.colors.primary} />
                    <Text
                      style={[
                        styles.ticketBtnText,
                        { color: theme.colors.primary },
                      ]}
                    >
                      Raise Ticket
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* TAB CONTENT: Request Callback */
              <ScrollView
                style={styles.callbackContainer}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                {callbackSuccess ? (
                  <View style={styles.successBox}>
                    <Sparkles size={48} color="#10B981" />
                    <Text
                      style={[
                        styles.successTitle,
                        { color: theme.colors.textMain },
                      ]}
                    >
                      Callback Requested!
                    </Text>
                    <Text
                      style={[
                        styles.successText,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      Our academic advisor will call you shortly on{' '}
                      <Text style={{ fontWeight: '700' }}>{callbackPhone}</Text>.
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setCallbackSuccess(false);
                        setActiveTab('faqs');
                      }}
                      style={[
                        styles.doneBtn,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      <Text style={styles.doneBtnText}>Back to FAQs</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.formCard}>
                    <Text
                      style={[styles.formHeader, { color: theme.colors.textMain }]}
                    >
                      Speak with an Academic Counsellor
                    </Text>
                    <Text
                      style={[
                        styles.formSubHeader,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      Leave your details and our team will get in touch with you within 15 minutes.
                    </Text>

                    <Text style={[styles.inputLabel, { color: theme.colors.textMain }]}>
                      Full Name *
                    </Text>
                    <TextInput
                      style={[
                        styles.formInput,
                        {
                          backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                          borderColor: theme.colors.border,
                          color: theme.colors.textMain,
                        },
                      ]}
                      placeholder="Enter your name"
                      placeholderTextColor={theme.colors.textLight}
                      value={callbackName}
                      onChangeText={setCallbackName}
                    />

                    <Text style={[styles.inputLabel, { color: theme.colors.textMain }]}>
                      Phone Number *
                    </Text>
                    <TextInput
                      style={[
                        styles.formInput,
                        {
                          backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                          borderColor: theme.colors.border,
                          color: theme.colors.textMain,
                        },
                      ]}
                      placeholder="10-digit mobile number"
                      placeholderTextColor={theme.colors.textLight}
                      keyboardType="phone-pad"
                      value={callbackPhone}
                      onChangeText={setCallbackPhone}
                    />

                    <Text style={[styles.inputLabel, { color: theme.colors.textMain }]}>
                      Query / Course Interested In (Optional)
                    </Text>
                    <TextInput
                      style={[
                        styles.formInput,
                        styles.formTextArea,
                        {
                          backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                          borderColor: theme.colors.border,
                          color: theme.colors.textMain,
                        },
                      ]}
                      placeholder="e.g. UPSC Test Series, Nursing exam, Book delivery"
                      placeholderTextColor={theme.colors.textLight}
                      multiline
                      numberOfLines={3}
                      value={callbackNotes}
                      onChangeText={setCallbackNotes}
                    />

                    <TouchableOpacity
                      onPress={handleCallbackSubmit}
                      disabled={submittingCallback}
                      style={[
                        styles.submitCallbackBtn,
                        { backgroundColor: theme.colors.primary },
                      ]}
                      activeOpacity={0.8}
                    >
                      {submittingCallback ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <>
                          <PhoneCall size={18} color="#FFF" />
                          <Text style={styles.submitCallbackBtnText}>
                            Request Immediate Call
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

// Fallback FAQs in case backend endpoint is slow or offline
const DEFAULT_FAQS: FAQItem[] = [
  {
    _id: '1',
    category: 'Test Series',
    question: 'How do I start an enrolled Test Series?',
    answer:
      'Go to the Test Series tab from the bottom navigation or Student Dashboard, select your enrolled examination, choose the subject and topic, and tap "Start Test".',
    isActive: true,
  },
  {
    _id: '2',
    category: 'Books',
    question: 'How can I access my purchased eBooks?',
    answer:
      'Navigate to "My Library" -> "Purchased Books". You can read online using our in-app PDF Reader with bookmark and dark-mode support.',
    isActive: true,
  },
  {
    _id: '3',
    category: 'Courses',
    question: 'Can I watch course lectures offline?',
    answer:
      'You can stream all video lectures on any enrolled course. Video progress is automatically synced with your student profile.',
    isActive: true,
  },
  {
    _id: '4',
    category: 'Rewards',
    question: 'How do I earn EduCoins?',
    answer:
      'You earn EduCoins daily by maintaining your study streak, scoring in the top 10% in test series, and writing approved blog posts.',
    isActive: true,
  },
  {
    _id: '5',
    category: 'Payments',
    question: 'Where can I download my purchase tax invoice?',
    answer:
      'Go to Profile -> Purchase History and tap on "Download Invoice" next to any completed transaction.',
    isActive: true,
  },
];

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 95 : 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 9999,
  },
  onlineBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: SCREEN_HEIGHT * 0.85,
    minHeight: SCREEN_HEIGHT * 0.65,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  grabHandleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  grabHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 16,
    borderRadius: 16,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  closeBtn: {
    padding: 6,
  },
  tabSelector: {
    flexDirection: 'row',
    padding: 6,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabButtonText: {
    fontSize: 13,
  },
  tabContent: {
    flex: 1,
    paddingTop: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  categoriesScrollView: {
    flexGrow: 0,
    height: 48,
    marginVertical: 4,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
  },
  faqList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  faqCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 10,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  faqAnswerContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 8,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 19,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
    borderTopWidth: 1,
  },
  whatsappBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  ticketBtn: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ticketBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  callbackContainer: {
    padding: 16,
  },
  formCard: {
    gap: 12,
  },
  formHeader: {
    fontSize: 16,
    fontWeight: '700',
  },
  formSubHeader: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  formTextArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  submitCallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
  },
  submitCallbackBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  doneBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  doneBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { apiClient, ENDPOINTS, BASE_URL } from '../../service/api.service';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronLeft,
  Send,
  Paperclip,
  CheckCheck,
  Clock,
  Headphones,
  Info,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react-native';
import SkeletonLoader from '../../components/SkeletonLoader';

type TicketChatRouteProp = RouteProp<RootStackParamList, 'TicketChat'>;

interface Message {
  _id?: string;
  tempId?: string;
  senderId: any;
  senderModel: string;
  text: string;
  attachments?: string[];
  timestamp: string;
  status?: 'sending' | 'sent' | 'error';
  localUri?: string;
  isRead?: boolean;
}

interface DateSeparator {
  type: 'separator';
  date: string;
}

type ChatItem = Message | DateSeparator;

export const TicketChat = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const route = useRoute<TicketChatRouteProp>();
  const navigation = useNavigation();
  const { id, subject, ticketId: routeTicketId } = route.params;

  const [loading, setLoading] = useState(true);
  const [ticketDetails, setTicketDetails] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const myId = (user?.id || (user as any)?._id || '').toString();

  const getSenderId = (msg: any): string => {
    if (!msg) return '';
    if (typeof msg.senderId === 'object' && msg.senderId?._id) return msg.senderId._id.toString();
    if (typeof msg.senderId === 'string') return msg.senderId;
    return '';
  };

  const isMessageFromMe = (msg: Message): boolean => {
    const sId = getSenderId(msg);
    if (sId && myId && sId === myId) return true;
    if (msg.senderModel === 'users' || msg.senderModel === 'User' || msg.senderModel === 'Student') return true;
    return false;
  };

  const groupedItems = useMemo(() => {
    if (messages.length === 0) return [];
    const items: ChatItem[] = [];
    let lastDate = '';

    messages.forEach((msg) => {
      if (!msg.timestamp) return;
      const d = new Date(msg.timestamp);
      if (isNaN(d.getTime())) return;

      const msgDate = d.toISOString().split('T')[0];
      if (msgDate !== lastDate) {
        let dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (msgDate === today) dateLabel = 'Today';
        else if (msgDate === yesterday) dateLabel = 'Yesterday';

        items.push({ type: 'separator', date: dateLabel });
        lastDate = msgDate;
      }
      items.push(msg);
    });
    return items;
  }, [messages]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 6000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchMessages = async () => {
    if (!user?.token) return;
    try {
      const response = await apiClient(ENDPOINTS.GET_TICKET_DETAILS(id), {
        headers: { Authorization: `Bearer ${user.token}` },
        bypassCache: true,
      });
      if (response && (response.success || response.ticket)) {
        const ticket = response.ticket || response.data || {};
        setTicketDetails(ticket);
        setMessages(ticket.messages || []);
        setLoading(false);

        // Mark as read
        apiClient(ENDPOINTS.MARK_TICKET_READ(id), {
          method: 'PUT',
          headers: { Authorization: `Bearer ${user.token}` },
        }).catch(() => {});
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (text?: any, file?: any) => {
    const messageContent = typeof text === 'string' ? text : inputText;
    if (!messageContent?.trim?.() && !file) return;

    const tempId = Date.now().toString();
    const optimisticMessage: Message = {
      _id: tempId,
      tempId,
      senderId: myId,
      senderModel: 'users',
      text: messageContent,
      timestamp: new Date().toISOString(),
      status: 'sending',
      localUri: file?.uri,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText('');
    setSending(true);

    try {
      let response;
      if (file) {
        const formData = new FormData();
        const finalContent = messageContent?.trim() || 'Attachment';
        formData.append('text', finalContent);
        formData.append('attachments', {
          uri: file.uri,
          type: file.type || 'image/jpeg',
          name: file.fileName || 'upload.jpg',
        } as any);

        const res = await fetch(ENDPOINTS.SEND_TICKET_MESSAGE(id), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
          body: formData,
        });
        response = await res.json();
      } else {
        response = await apiClient(ENDPOINTS.SEND_TICKET_MESSAGE(id), {
          method: 'POST',
          headers: { Authorization: `Bearer ${user?.token}` },
          data: { text: messageContent?.trim() || '' },
        });
      }

      if (response && (response.success || response.message || response.data)) {
        const newMessage = response.message || response.data || {};
        setMessages((prev) =>
          prev.map((m) => (m.tempId === tempId ? { ...m, ...newMessage, status: 'sent' } : m))
        );
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.tempId === tempId ? { ...m, status: 'error' } : m))
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, status: 'error' } : m))
      );
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (response.assets && response.assets.length > 0) {
        handleSend('', response.assets[0]);
      }
    });
  };

  const ticketStatus = ticketDetails?.status || 'Open';
  const isClosed = ticketStatus === 'Closed' || ticketStatus === 'Resolved';
  const displayTicketId = ticketDetails?.ticketId || routeTicketId || id.slice(-6).toUpperCase();
  const displaySubject = ticketDetails?.subject || subject || 'Support Ticket';
  const displayCategory = ticketDetails?.category || 'General';
  const displayPriority = ticketDetails?.priority || 'Medium';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return '#10B981';
      case 'In Progress': return '#3B82F6';
      case 'Resolved': return '#8B5CF6';
      case 'Closed': return '#64748B';
      default: return '#10B981';
    }
  };

  const renderItem = ({ item }: { item: ChatItem }) => {
    if ('type' in item && item.type === 'separator') {
      return (
        <View style={styles.separatorContainer}>
          <View style={[styles.separatorPill, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}>
            <Text style={[styles.separatorText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>{item.date}</Text>
          </View>
        </View>
      );
    }

    const msg = item as Message;
    const isMe = isMessageFromMe(msg);

    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
        {/* Support Avatar */}
        {!isMe && (
          <View style={[styles.avatar, { backgroundColor: '#7C3AED' }]}>
            <Headphones size={14} color="#FFF" />
          </View>
        )}

        <View style={[styles.bubbleColumn, isMe ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
          {/* Sender label for support */}
          {!isMe && (
            <View style={styles.supportLabelRow}>
              <Text style={styles.supportSenderLabel}>Support Team</Text>
              <ShieldCheck size={12} color="#10B981" />
            </View>
          )}

          {/* Bubble */}
          <View
            style={[
              styles.messageBubble,
              isMe
                ? styles.myBubble
                : [
                    styles.theirBubble,
                    {
                      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.12)',
                    },
                  ],
            ]}
          >
            {msg.localUri && (
              <Image source={{ uri: msg.localUri }} style={styles.messageImage} />
            )}
            {msg.attachments && msg.attachments.length > 0 && !msg.localUri && (
              <Image
                source={{
                  uri: msg.attachments[0].startsWith('http')
                    ? msg.attachments[0]
                    : `${BASE_URL.replace('/api/v1', '')}/${msg.attachments[0]}`,
                }}
                style={styles.messageImage}
              />
            )}

            <Text style={[styles.messageText, { color: isMe ? '#FFFFFF' : theme.colors.textMain }]}>
              {msg.text}
            </Text>

            <View style={styles.messageFooter}>
              <Text style={[styles.messageTime, { color: isMe ? 'rgba(255,255,255,0.75)' : theme.colors.textLight }]}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {isMe && (
                <View style={{ marginLeft: 4 }}>
                  {msg.status === 'sending' ? (
                    <Clock size={11} color="rgba(255,255,255,0.75)" />
                  ) : msg.status === 'error' ? (
                    <Text style={{ fontSize: 10, color: '#FFBABA' }}>✕</Text>
                  ) : (
                    <CheckCheck size={13} color="#FFFFFF" />
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#0B0F19' : '#F8FAFC' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#111827' : '#FFFFFF'} />

      {/* --- SAFE PADDING TOP FOR CAMERA / STATUS BAR --- */}
      <View
        style={[
          styles.headerCard,
          {
            paddingTop: insets.top + (Platform.OS === 'ios' ? 6 : 10),
            backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={theme.colors.textMain} />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <View style={styles.ticketIdRow}>
              <Text style={[styles.ticketIdText, { color: theme.colors.primary }]}>
                #{displayTicketId}
              </Text>
              <View style={[styles.categoryBadge, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.2)' : '#EEF2FF' }]}>
                <Text style={[styles.categoryBadgeText, { color: theme.colors.primary }]}>
                  {displayCategory}
                </Text>
              </View>
            </View>
            <Text style={[styles.subjectTitle, { color: theme.colors.textMain }]} numberOfLines={1}>
              {displaySubject}
            </Text>
          </View>

          <View style={styles.headerStatusCol}>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(ticketStatus)}18` }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(ticketStatus) }]} />
              <Text style={[styles.statusBadgeText, { color: getStatusColor(ticketStatus) }]}>
                {ticketStatus}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* --- CHAT FEED --- */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <SkeletonLoader width={220} height={50} borderRadius={18} />
          <View style={{ height: 12 }} />
          <SkeletonLoader width={180} height={44} borderRadius={18} />
          <View style={{ height: 12 }} />
          <SkeletonLoader width={260} height={58} borderRadius={18} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={groupedItems}
          renderItem={renderItem}
          keyExtractor={(item: any, index) => item._id || item.tempId || `item-${index}`}
          contentContainerStyle={[styles.messageList, { paddingBottom: 16 }]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            showInfoBanner ? (
              <View style={[styles.infoBanner, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: theme.colors.border }]}>
                <View style={styles.infoBannerHeader}>
                  <View style={styles.infoBannerLeft}>
                    <Info size={16} color={theme.colors.primary} />
                    <Text style={[styles.infoBannerTitle, { color: theme.colors.textMain }]}>Ticket Details</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowInfoBanner(false)}>
                    <Text style={[styles.infoBannerDismiss, { color: theme.colors.textLight }]}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.infoBannerDesc, { color: theme.colors.textMuted }]}>
                  Priority: <Text style={{ fontWeight: '700', color: theme.colors.textMain }}>{displayPriority}</Text> • Created: <Text style={{ fontWeight: '700', color: theme.colors.textMain }}>{ticketDetails?.createdAt ? new Date(ticketDetails.createdAt).toLocaleDateString() : 'Today'}</Text>
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* --- BOTTOM INPUT DOCK --- */}
      {isClosed ? (
        <View
          style={[
            styles.closedBanner,
            {
              backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
              borderTopColor: theme.colors.border,
              paddingBottom: Math.max(insets.bottom, 14),
            },
          ]}
        >
          <AlertCircle size={16} color="#64748B" style={{ marginRight: 6 }} />
          <Text style={[styles.closedText, { color: theme.colors.textMuted }]}>
            This ticket is {ticketStatus.toLowerCase()}. Raise a new ticket for further assistance.
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View
            style={[
              styles.inputDock,
              {
                backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
                borderTopColor: theme.colors.border,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.attachBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}
              onPress={handlePickImage}
              activeOpacity={0.7}
            >
              <Paperclip size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                  color: theme.colors.textMain,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Type your message..."
              placeholderTextColor={theme.colors.textLight}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                {
                  backgroundColor: !inputText.trim() ? (isDarkMode ? '#334155' : '#CBD5E1') : '#6366F1',
                },
              ]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Send size={17} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    flex: 1,
  },
  ticketIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  ticketIdText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  subjectTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerStatusCol: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  loadingContainer: {
    padding: 20,
    gap: 12,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  infoBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  infoBannerDismiss: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  infoBannerDesc: {
    fontSize: 12,
  },
  separatorContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  separatorPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  separatorText: {
    fontSize: 11,
    fontWeight: '700',
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '85%',
  },
  myMessageWrapper: {
    alignSelf: 'flex-end',
  },
  theirMessageWrapper: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    alignSelf: 'flex-end',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  bubbleColumn: {
    maxWidth: '100%',
  },
  supportLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    marginLeft: 4,
  },
  supportSenderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C3AED',
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  myBubble: {
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 4,
    shadowColor: '#6366F1',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  theirBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageImage: {
    width: 220,
    height: 160,
    borderRadius: 12,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 2,
  },
  messageTime: {
    fontSize: 10,
    fontWeight: '500',
  },
  closedBanner: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
  },
  closedText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputDock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
});

export default TicketChat;
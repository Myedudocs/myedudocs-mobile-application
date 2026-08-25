import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Star, X, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { submitReview, checkCanReview } from '../service/ratings.service';
import { useTheme } from '../context/ThemeContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  itemId: string;
  itemType: 'book' | 'course' | 'test_series';
  itemName: string;
  token: string;
  onSuccess?: () => void;
}

const ReviewModal: React.FC<Props> = ({
  visible,
  onClose,
  itemId,
  itemType,
  itemName,
  token,
  onSuccess,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [canReview, setCanReview] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (visible) {
      checkEligibility();
    } else {
      // Reset state when modal closed
      setSuccess(false);
      setError(null);
      setComment('');
      setTitle('');
      setRating(5);
    }
  }, [visible, itemId]);

  const checkEligibility = async () => {
    setChecking(true);
    try {
      const res = await checkCanReview(itemType, itemId, token);
      setCanReview(res.canReview);
      if (res.hasReviewed && res.existingReview) {
        setRating(res.existingReview.rating || 5);
        setTitle(res.existingReview.title || '');
        setComment(res.existingReview.review || res.existingReview.comment || '');
      }
    } catch (err) {
      console.error('Check eligibility failed', err);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setError('Please provide a comment');
      return;
    }
    if (comment.length < 10) {
      setError('Comment must be at least 10 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await submitReview(itemType, itemId, { rating, title, comment }, token);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setRating(s)}
            activeOpacity={0.7}
            style={styles.starTouch}
          >
            <Star
              size={32}
              color={s <= rating ? '#F59E0B' : '#E2E8F0'}
              fill={s <= rating ? '#F59E0B' : 'transparent'}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContainer}
            >
              <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                  <Text style={[styles.headerTitle, { color: theme.colors.textMain }]} numberOfLines={1}>
                    {success ? 'Thank You!' : `Review ${itemType === 'book' ? 'Book' : itemType === 'course' ? 'Course' : 'Tests'}`}
                  </Text>
                  <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.colors.background }]}>
                    <X size={20} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {checking ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={theme.colors.primary} size="large" />
                    <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Checking eligibility...</Text>
                  </View>
                ) : !canReview ? (
                  <View style={styles.lockedContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? 'rgba(245,158,11,0.15)' : '#FFFBEB' }]}>
                      <AlertCircle size={32} color="#F59E0B" />
                    </View>
                    <Text style={[styles.lockedTitle, { color: theme.colors.textMain }]}>Review Locked</Text>
                    <Text style={[styles.lockedText, { color: theme.colors.textMuted }]}>
                      You must purchase this {itemType.replace('_', ' ')} to leave a review.
                    </Text>
                    <TouchableOpacity style={[styles.okBtn, { backgroundColor: theme.colors.primary }]} onPress={onClose}>
                      <Text style={styles.okBtnText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                ) : success ? (
                  <View style={styles.successContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.15)' : '#ECFDF5' }]}>
                      <CheckCircle2 size={40} color="#10B981" />
                    </View>
                    <Text style={[styles.successTitle, { color: theme.colors.textMain }]}>Review Submitted</Text>
                    <Text style={[styles.successText, { color: theme.colors.textMuted }]}>
                      Your feedback helps other students learn better!
                    </Text>
                  </View>
                ) : (
                  <View style={styles.body}>
                    <View style={[styles.itemNameWrap, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.12)' : '#EEF2FF', borderColor: isDarkMode ? 'rgba(99,102,241,0.25)' : '#E0E7FF' }]}>
                      <Text style={[styles.itemName, { color: theme.colors.primary }]} numberOfLines={2}>
                        {itemName}
                      </Text>
                    </View>

                    <Text style={[styles.label, { color: theme.colors.textMain }]}>Your Rating</Text>
                    {renderStars()}

                    <Text style={[styles.label, { color: theme.colors.textMain }]}>Review Title (Optional)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textMain }]}
                      placeholder="Summarize your experience..."
                      value={title}
                      onChangeText={setTitle}
                      placeholderTextColor={theme.colors.textLight}
                    />

                    <Text style={[styles.label, { color: theme.colors.textMain }]}>Your Feedback</Text>
                    <TextInput
                      style={[styles.input, styles.textArea, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textMain }]}
                      placeholder="What did you think? Was it helpful?"
                      value={comment}
                      onChangeText={setComment}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      placeholderTextColor={theme.colors.textLight}
                    />

                    {error && (
                      <View style={styles.errorBox}>
                        <AlertCircle size={14} color="#EF4444" />
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.submitBtn, { backgroundColor: theme.colors.primary }, loading && styles.submitBtnDisabled]}
                      onPress={handleSubmit}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.submitBtnText}>Submit Review</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: 20,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },
  lockedContainer: {
    padding: 40,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  okBtn: {
    backgroundColor: '#6366F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  okBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  successContainer: {
    padding: 60,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  itemNameWrap: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F6',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  starTouch: {
    marginRight: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#6366F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6366F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default ReviewModal;

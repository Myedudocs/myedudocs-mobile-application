import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import {
  ChevronLeft,
  Share2,
  Heart,
  Globe,
  FileText,
  BookOpen,
  HelpCircle,
  Timer,
  CheckSquare,
  LineChart,
  TrendingUp,
  BarChart,
  List,
  CheckCircle2,
  MonitorSmartphone,
  RotateCw,
  Lock,
  Clock,
  X,
  XCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Coins,
  Tag,
  Star,
} from 'lucide-react-native';
import ReviewModal from '../../components/ReviewModal';
import RatingBadge from '../../components/RatingBadge';

import { ENDPOINTS, apiClient, BASE_URL } from '../../service/api.service';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import DetailsSkeleton from '../../components/skeletons/DetailsSkeleton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { CouponInput, AppliedCouponData } from '../../components/common/CouponInput';

// ─── Constants ───────────────────────────────────────────────────────────────

const GST_RATE = 0.18;
const COIN_VALUE = 0.10;
const MIN_COINS = 100;
const RAZORPAY_KEY = 'rzp_live_SMJIYo75cfQOFp';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface TestSeries {
  _id: string;
  title: string;
  seriesNumber?: number;
  testType?: string;
  difficulty?: string;
  duration: number;
  totalQuestions?: number;
  totalMarks?: number;
}

interface Topic {
  _id: string;
  name: string;
  code: string;
  description?: string;
  difficulty?: string;
  estimatedStudyTime?: number;
  topicsCovered?: string[];
  testSeriesCount?: number;
  subject: {
    _id: string;
    name: string;
    code: string;
    isPaid?: boolean;
    price?: number;
    originalPrice?: number;
    discount?: number;
  };
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  isPaid?: boolean;
  price?: number;
  originalPrice?: number;
  discount?: number;
  hasPurchased?: boolean;
}

interface ExamData {
  _id: string;
  name: string;
  code: string;
  year: number;
  description?: string;
  isPaid?: boolean;
  price?: number;
  originalPrice?: number;
  discount?: number;
  hasPurchased?: boolean;
}

// ─── Alert config ─────────────────────────────────────────────────────────────

type AlertType = 'success' | 'error' | 'warning' | 'info';
interface CustomAlertConfig {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

// ─── Static data ─────────────────────────────────────────────────────────────

const WHAT_YOU_GET = [
  { id: '1', icon: Timer,            title: 'Real exam feel' },
  { id: '2', icon: CheckSquare,      title: 'Detailed solutions' },
  { id: '3', icon: LineChart,        title: 'Comprehensive\nanalysis' },
  { id: '4', icon: TrendingUp,       title: 'Performance\nanalysis' },
  { id: '5', icon: BarChart,         title: 'Track progress' },
  { id: '6', icon: List,             title: 'Full-length tests' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  `₹${Number(amount || 0).toLocaleString('en-IN')}`;

// ─── Component ────────────────────────────────────────────────────────────────

export const TestSeriesDetails = () => {
  const navigation = useNavigation<any>();
  const route     = useRoute<any>();
  const { id, testId } = route.params || {};
  const targetId = id || testId;
  const { user }  = useAuth();
  const { theme, isDarkMode } = useTheme();

  // ── UI state ──
  const [loading,         setLoading]         = useState(true);
  const [paymentModal,    setPaymentModal]     = useState(false);
  const [paymentLoading,  setPaymentLoading]   = useState(false);
  const [expandedTopics,  setExpandedTopics]   = useState<Record<string, boolean>>({});
  const [wishlistIds,     setWishlistIds]      = useState<Set<string>>(new Set());
  const [wishlistLoading, setWishlistLoading]  = useState<string | null>(null);

  // ── Data state ──
  const [exam,               setExam]               = useState<ExamData | null>(null);
  const [topics,             setTopics]             = useState<Topic[]>([]);
  const [subjects,           setSubjects]           = useState<Subject[]>([]);
  const [topicTestsMap,      setTopicTestsMap]      = useState<Record<string, TestSeries[]>>({});
  const [coinsBalance,       setCoinsBalance]       = useState(0);
  const [coinsUsed,          setCoinsUsed]          = useState('0');
  const [categoryPurchased,  setCategoryPurchased]  = useState(false);
  const [purchasedSubjectIds,setPurchasedSubjectIds]= useState<Set<string>>(new Set());

  // ── Reviews state ──
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [avgRating, setAvgRating] = useState(4.5);

  // ── Payment modal target ──
  const [purchaseTarget, setPurchaseTarget] = useState<{
    type: 'category' | 'subject';
    id: string;
    price: number;
    name: string;
  } | null>(null);

  // ── Coupon state ──
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponData | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // ── Alert ──
  const [customAlert, setCustomAlert] = useState<CustomAlertConfig>({
    visible: false, title: '', message: '', type: 'info',
  });

  const triggerAlert = (
    title: string,
    message: string,
    type: AlertType = 'info',
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText = 'OK',
    cancelText?: string,
  ) => setCustomAlert({ visible: true, title, message, type, onConfirm, onCancel, confirmText, cancelText });

  const hideAlert = () => setCustomAlert(prev => ({ ...prev, visible: false }));

  // ─── Auth helpers ─────────────────────────────────────────────────────────

  const getAuthHeader = (): Record<string, string> =>
    user?.token ? { Authorization: `Bearer ${user.token}` } : {};

  const requireLogin = (actionText: string): boolean => {
    if (!user) {
      triggerAlert(
        'Login Required',
        `Please login to ${actionText}.`,
        'warning',
        () => { hideAlert(); navigation.navigate('Login'); },
        hideAlert,
        'Login',
        'Cancel',
      );
      return false;
    }
    return true;
  };

  // ─── Load Razorpay & data ─────────────────────────────────────────────────

  useEffect(() => {
    if (targetId) {
      fetchExamAndTopics();
      fetchReviews();
    }
  }, [targetId, user]);

  const fetchReviews = async () => {
    if (!targetId) return;
    try {
      const res = await fetch(`${BASE_URL}/test-series/review/${targetId}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        setReviewStats(data.stats || null);
        if (data.stats?.averageRating) {
          setAvgRating(Number(data.stats.averageRating));
        }
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const fetchExamAndTopics = async () => {
    try {
      setLoading(true);

      // 1. Exam (category) info
      const examRes = await apiClient(ENDPOINTS.GET_EXAMINATIONS);
      const examData: ExamData | undefined =
        examRes?.data?.examinationCategories?.find((e: any) => e._id === targetId);
      setExam(examData ?? null);

      // 2. Subjects (with pricing)
      const subjectsRes = await apiClient(ENDPOINTS.GET_SUBJECTS_BY_EXAM(targetId));
      const fetchedSubjects: Subject[] = subjectsRes?.data?.subjects || [];
      setSubjects(fetchedSubjects);

      if (fetchedSubjects.length === 0) {
        setTopics([]);
        setLoading(false);
        return;
      }

      // 3. Purchase status
      if (user?.token && user?.id) {
        await checkPurchaseStatus(targetId, fetchedSubjects.map(s => s._id));
        fetchWalletData();

        // 4. Fetch wishlist
        try {
          const wishlistRes = await fetch(`${BASE_URL}/wishlist/my`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          const wishlistData = await wishlistRes.json();
          if (wishlistData?.data?.items) {
            const ids = new Set<string>();
            wishlistData.data.items.forEach((i: any) => {
              if (i.item_type === 'test_series') ids.add(i.item_id);
            });
            setWishlistIds(ids);
          }
        } catch (err) {
          console.error('Wishlist fetch failed', err);
        }
      }

      // 5. Topics under each subject + inline tests (OPTIMIZED: Parallel Fetching)
      const subjectPromises = fetchedSubjects.map(async (subject) => {
        try {
          const topicsRes = await apiClient(ENDPOINTS.GET_TOPICS_BY_SUBJECT(subject._id));
          const subjectTopics: any[] = topicsRes?.data?.topicCategories || [];

          // Fetch tests for all topics in this subject in parallel
          const topicPromises = subjectTopics.map(async (topic) => {
            try {
              const tsRes = await apiClient(ENDPOINTS.GET_TESTS_BY_TOPIC(topic._id));
              const testSeries = tsRes?.data?.testSeries || [];
              return { topic, testSeries };
            } catch {
              return { topic, testSeries: [] };
            }
          });

          const results = await Promise.all(topicPromises);
          return { subject, results };
        } catch (err) {
          console.error('Error fetching subject data:', subject.name, err);
          return { subject, results: [] };
        }
      });

      const allSubjectResults = await Promise.all(subjectPromises);
      
      const allTopics: Topic[] = [];
      const testsMap: Record<string, TestSeries[]> = {};

      allSubjectResults.forEach(({ subject, results }) => {
        results.forEach(({ topic, testSeries }) => {
          testsMap[topic._id] = testSeries;
          allTopics.push({
            ...topic,
            testSeriesCount: testSeries.length,
            subject: {
              _id:           subject._id,
              name:          subject.name,
              code:          subject.code,
              isPaid:        subject.isPaid,
              price:         subject.price,
              originalPrice: subject.originalPrice,
              discount:      subject.discount,
            },
          });
        });
      });

      setTopics(allTopics);
      setTopicTestsMap(testsMap);
    } catch (err) {
      console.error('fetchExamAndTopics error:', err);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Purchase status ──────────────────────────────────────────────────────

  const checkPurchaseStatus = async (categoryId: string, subjectIds: string[]) => {
    try {
      // Check CATEGORY purchase
      const catRes = await fetch(
        `${BASE_URL}/test-series-enrollment/purchase/check-purchase?type=category&item_id=${categoryId}&student_id=${user?.id}`,
        { headers: getAuthHeader() },
      );
      const catData = await catRes.json();

      if (catData?.purchased) {
        setCategoryPurchased(true);
        setPurchasedSubjectIds(new Set(subjectIds));
        return;
      }

      // Check SUBJECT purchases
      const purchasedIds = new Set<string>();
      await Promise.all(
        subjectIds.map(async subjectId => {
          try {
            const subRes = await fetch(
              `${BASE_URL}/purchase/check-purchase?type=subject&item_id=${subjectId}&student_id=${user?.id}`,
              { headers: getAuthHeader() },
            );
            const subData = await subRes.json();
            if (subData?.purchased) purchasedIds.add(subjectId);
          } catch {
            /* ignore */
          }
        }),
      );

      setCategoryPurchased(false);
      setPurchasedSubjectIds(purchasedIds);
    } catch (err) {
      console.log('Purchase check failed:', err);
    }
  };

  // Has user access to this topic's tests?
  const hasAccessToTopic = (topic: Topic): boolean => {
    if (!exam?.isPaid) return true;
    if (categoryPurchased) return true;
    if (purchasedSubjectIds.has(topic.subject._id)) return true;
    return false;
  };

  const everythingPurchased =
    categoryPurchased ||
    !exam?.isPaid ||
    (subjects.length > 0 && subjects.every(s => purchasedSubjectIds.has(s._id)));

  // ─── Wallet ───────────────────────────────────────────────────────────────

  const fetchWalletData = async () => {
    try {
      const res  = await fetch(`${BASE_URL}/student/wallet`, { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success) setCoinsBalance(data.wallet?.balance || 0);
    } catch {
      console.error('Wallet fetch failed');
    }
  };



  // ─── Payment ──────────────────────────────────────────────────────────────

  const openPurchaseModal = (
    type: 'category' | 'subject',
    id: string,
    price: number,
    name: string,
  ) => {
    if (!requireLogin('purchase this')) return;
    if (!price || price <= 0) {
      triggerAlert('Info', 'This item is free or has no price set.', 'info');
      return;
    }
    setPurchaseTarget({ type, id, price, name });
    setCoinsUsed('0');
    setCouponCode('');
    setAppliedCoupon(null);
    setPaymentModal(true);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      return triggerAlert('Coupon Code Required', 'Please enter a coupon code to apply.', 'warning');
    }
    try {
      setCouponLoading(true);
      const email = user?.email;
      const res = await fetch(`${BASE_URL}/coupons/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), email, amount: modalGross }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAppliedCoupon(data.data);
        triggerAlert('Coupon Applied! 🎉', data.message || 'Coupon applied successfully!', 'success');
      } else {
        setAppliedCoupon(null);
        triggerAlert('Invalid Coupon', data.message || 'Invalid or inactive coupon code.', 'error');
      }
    } catch {
      triggerAlert('Error', 'Failed to verify coupon. Please check your network and try again.', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const executePurchase = async () => {
    if (!purchaseTarget) return;

    const coins = Number(coinsUsed) || 0;

    if (coins > 0 && coins < MIN_COINS) {
      triggerAlert('Warning', `Minimum ${MIN_COINS} coins required to apply discount.`, 'warning');
      return;
    }
    if (coins > coinsBalance) {
      triggerAlert('Error', "You don't have enough coins.", 'error');
      return;
    }

    setPaymentLoading(true);

    try {
      // Create order
      const orderRes = await fetch(
        `${BASE_URL}/test-series-enrollment/purchase/create-order`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({
            type:        purchaseTarget.type,
            item_id:     purchaseTarget.id,
            coins_used:  coins,
            coupon_code: appliedCoupon?.code || '',
            student_data: {
              id:    user?.id,
              email: user?.email || '',
              name:  user?.name  || '',
              phone: (user as any)?.phn || (user as any)?.phone || '',
            },
          }),
        },
      );
      const orderData = await orderRes.json();
      if (!orderData?.success) throw new Error(orderData?.message || 'Failed to create order');

      const options = {
        description: `Purchase: ${purchaseTarget.name}`,
        currency:    orderData.currency,
        key:         RAZORPAY_KEY,
        amount:      orderData.amount,
        name:        'MYEDUDOCS',
        order_id:    orderData.orderId,
        prefill:     { email: user?.email, contact: (user as any)?.phn || (user as any)?.phone || '', name: user?.name },
        theme:       { color: '#6366F6' },
      };

      RazorpayCheckout.open(options)
        .then(async (rzpData: any) => {
          await verifyPayment(rzpData, coins);
        })
        .catch((err: any) => {
          triggerAlert('Payment Cancelled', err.description || 'Transaction was cancelled.', 'warning');
        });
    } catch (err: any) {
      triggerAlert('Error', err.message || 'Something went wrong initiating payment.', 'error');
    } finally {
      setPaymentLoading(false);
    }
  };

  const verifyPayment = async (rzpData: any, coins: number) => {
    if (!purchaseTarget) return;
    try {
      const res = await fetch(
        `${BASE_URL}/test-series-enrollment/purchase/verify-payment`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({
            type:                   purchaseTarget.type,
            item_id:                purchaseTarget.id,
            coins_used:             coins,
            coupon_code:            appliedCoupon?.code || '',
            razorpay_order_id:      rzpData.razorpay_order_id,
            razorpay_payment_id:    rzpData.razorpay_payment_id,
            razorpay_signature:     rzpData.razorpay_signature,
            student_data: {
              id:    user?.id,
              email: user?.email || '',
              name:  user?.name  || '',
              phone: (user as any)?.phn || (user as any)?.phone || '',
            },
          }),
        },
      );
      const verifyData = await res.json();

      if (verifyData?.success) {
        triggerAlert('Payment Successful! 🎉', 'Access unlocked successfully.', 'success');
        setCoinsUsed('0');
        setCouponCode('');
        setAppliedCoupon(null);
        setPaymentModal(false);
        await fetchExamAndTopics();
        fetchWalletData();
      } else {
        throw new Error(verifyData?.message || 'Verification failed');
      }
    } catch (err: any) {
      triggerAlert(
        'Verification Failed',
        err.response?.data?.message || err.message || 'Payment verification failed. Please contact support.',
        'error',
      );
    }
  };

  // ─── Wishlist ─────────────────────────────────────────────────────────────
  const toggleWishlist = async (itemId: string, itemTitle: string) => {
    if (!requireLogin('use the wishlist')) return;
    if (wishlistLoading) return;

    const isSaved = wishlistIds.has(itemId);
    setWishlistLoading(itemId);

    try {
      const res = await fetch(`${BASE_URL}/wishlist/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          item_type: 'test_series',
          item_id:   itemId,
          snapshot:  {
            title: itemTitle,
            code:  exam?.code,
            year:  exam?.year,
          },
        }),
      });
      if (res.ok) {
        setWishlistIds(prev => {
          const n = new Set(prev);
          isSaved ? n.delete(itemId) : n.add(itemId);
          return n;
        });
        triggerAlert(
          isSaved ? 'Removed' : 'Saved',
          isSaved ? 'Removed from wishlist' : 'Added to your wishlist ❤️',
          'success',
        );
      }
    } catch (err) {
      console.error('Wishlist action failed', err);
      triggerAlert('Error', 'Failed to update wishlist', 'error');
    } finally {
      setWishlistLoading(null);
    }
  };

  // ─── Share ────────────────────────────────────────────────────────────────

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Practice ${exam?.name || 'Test Series'} on MyEduDocs!\nhttps://myedudocs.in/exam-topics/${targetId || ''}`,
      });
    } catch {}
  };

  // ─── Navigation ───────────────────────────────────────────────────────────

  const handleStartTest = (testId: string, topic?: Topic) => {
    if (!requireLogin('start this test')) return;
    if (topic && !hasAccessToTopic(topic)) {
      triggerAlert('Access Required', 'Please purchase to access this test.', 'warning');
      return;
    }
    if (testId) {
      navigation.navigate('TestInterface', { testId, topicId: topic?._id });
    } else {
      if (topic) {
        setExpandedTopics(prev => ({ ...prev, [topic._id]: !prev[topic._id] }));
      }
    }
  };

  // ─── Computed values ──────────────────────────────────────────────────────

  const totalMockTests   = topics.reduce((sum, t) => sum + (t.testSeriesCount || 0), 0);
  const totalSubjCount   = new Set(topics.map(t => t.subject._id)).size;
  const totalQuestions   = totalMockTests * 100;
  const availableTopics  = topics.filter(t => (t.testSeriesCount || 0) > 0);

  const showCategoryPrice = !!(exam?.isPaid && (exam?.price ?? 0) > 0);
  const firstPaidSubject  = subjects.find(s => s.isPaid && (s.price ?? 0) > 0) ?? null;

  const modalBase = purchaseTarget?.price ?? 0;
  const modalGross = modalBase + (modalBase * GST_RATE);

  // Recalculate coupon discount dynamically if modal base price changes
  useEffect(() => {
    if (appliedCoupon && modalGross > 0) {
      let newDiscount = 0;
      if (appliedCoupon.discountType === 'percentage') {
        newDiscount = Math.round((modalGross * appliedCoupon.discountValue) / 100);
      } else {
        newDiscount = Math.min(appliedCoupon.discountValue, modalGross);
      }
      if (appliedCoupon.calculatedDiscount !== newDiscount) {
        setAppliedCoupon(prev => prev ? { ...prev, calculatedDiscount: newDiscount } : null);
      }
    }
  }, [modalGross]);

  // Pricing preview for modal
  const calcPricing = (base: number) => {
    const gst        = base * GST_RATE;
    const total      = base + gst;
    const coins      = Number(coinsUsed) || 0;
    const disc       = coins >= MIN_COINS ? coins * COIN_VALUE : 0;
    const couponDisc = appliedCoupon?.calculatedDiscount || 0;
    return { base, gst, total, disc, couponDisc, final: Math.max(total - disc - couponDisc, 0) };
  };

  const modalPricing = calcPricing(modalBase);

  if (loading) return <DetailsSkeleton />;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ScreenContainer
      header={{
        title: 'Test Series Details',
        showBack: true,
        showThemeToggle: true,
        showCoins: false,
        showNotifications: false,
      }}
      scroll={true}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.colors.background }]}>

        {/* ── Hero ── */}
        <View style={[styles.heroSection, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
          <View style={styles.tagsRow}>
            <View style={styles.leftTags}>
              <Text style={styles.categoryText}>{exam?.code}</Text>
              <View style={styles.languageWrap}>
                <Globe color="#94A3B8" size={13} />
                <Text style={[styles.languageText, { color: theme.colors.textMuted }]}>English</Text>
              </View>
            </View>
            <Text style={[styles.seriesYearText, { color: theme.colors.textMuted }]}>
              {exam?.year ? `${exam.year}/${exam.year + 1}` : 'Latest'}
            </Text>
          </View>

          <View style={styles.titleRow}>
            <Text style={[styles.mainTitle, { color: theme.colors.textMain }]}>{exam?.name}</Text>
            <View style={styles.titleIcons}>
              <TouchableOpacity
                onPress={() => exam && toggleWishlist(exam._id, exam.name)}
                style={{ marginRight: 14 }}
                disabled={wishlistLoading === exam?._id}
              >
                <Heart
                  color={wishlistIds.has(exam?._id ?? '') ? '#EF4444' : theme.colors.textLight}
                  fill={wishlistIds.has(exam?._id ?? '') ? '#EF4444' : 'none'}
                  size={20}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare}>
                <Share2 color={theme.colors.textLight} size={20} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.description, { color: theme.colors.textMuted }]}>
            {exam?.description ||
              'Updated questions based on PYQ analysis and more. Designed to simulate the real-time exam environment with expert-curated content to boost your preparation.'}
          </Text>

          {/* Rating */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <RatingBadge
              itemId={targetId}
              itemType="test_series"
              preloadedRating={avgRating}
              preloadedCount={reviews.length}
              size="md"
            />
            <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>• Highly Rated by Students</Text>
          </View>

          {/* Stat pills */}
          <View style={styles.statsPillsContainer}>
            <View style={[styles.statPill, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <FileText color="#6366F6" size={13} />
              <Text style={[styles.statPillText, { color: theme.colors.textMain }]}>{totalMockTests} Mock Tests</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <BookOpen color="#6366F6" size={13} />
              <Text style={[styles.statPillText, { color: theme.colors.textMain }]}>{totalSubjCount} Subject Wise</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <HelpCircle color="#6366F6" size={13} />
              <Text style={[styles.statPillText, { color: theme.colors.textMain }]}>{totalQuestions}+ Questions</Text>
            </View>
          </View>
        </View>

        {/* ── What You Get ── */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>WHAT YOU GET</Text>
          <View style={styles.featuresGrid}>
            {WHAT_YOU_GET.map(f => (
              <View key={f.id} style={[styles.featureCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={[styles.featureIconBox, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }]}>
                  <f.icon color="#6366F6" size={20} strokeWidth={2} />
                </View>
                <Text style={[styles.featureCardTitle, { color: theme.colors.textMain }]}>{f.title}</Text>
              </View>
            ))}
          </View>

          <View style={styles.bulletPointsContainer}>
            {[
              [CheckCircle2,       '1 Year Validity'],
              [MonitorSmartphone, 'Access anywhere, anytime'],
              [RotateCw,           'Comprehensive coverage of syllabus'],
            ].map(([Icon, label], i) => (
              <View key={i} style={styles.bulletRow}>
                <Icon color="#6366F6" size={16} />
                <Text style={[styles.bulletText, { color: theme.colors.textMain }]}>{label as string}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Price Card (inline) ── */}
        {(showCategoryPrice || firstPaidSubject) && (
          <View style={[styles.sectionContainer, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>PRICING</Text>

            <View style={[styles.priceCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              {/* Category price */}
              {showCategoryPrice && (
                <View style={styles.priceCardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.priceCardLabel, { color: theme.colors.textMain }]}>Full Test Series</Text>
                    <Text style={[styles.priceCardSub, { color: theme.colors.textMuted }]}>All {totalSubjCount} subjects included</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.priceCardValue, { color: theme.colors.textMain }]}>{formatCurrency(exam!.price!)}</Text>
                    {exam?.originalPrice && exam.originalPrice > exam.price! && (
                      <Text style={[styles.priceCardOld, { color: theme.colors.textLight }]}>{formatCurrency(exam.originalPrice)}</Text>
                    )}
                    {exam?.discount ? (
                      <View style={styles.discountPill}>
                        <Tag color="#16A34A" size={10} />
                        <Text style={styles.discountPillText}>{exam.discount}% OFF</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              )}

              {/* Subject price */}
              {firstPaidSubject && (
                <View style={[styles.priceCardRow, showCategoryPrice && { marginTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.priceCardLabel, { color: theme.colors.textMain }]}>{firstPaidSubject.name} Only</Text>
                    <Text style={[styles.priceCardSub, { color: theme.colors.textMuted }]}>
                      {topics.filter(t => t.subject._id === firstPaidSubject._id).length} topics
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.priceCardValue, { color: theme.colors.textMain }]}>{formatCurrency(firstPaidSubject.price!)}</Text>
                    {firstPaidSubject.originalPrice && firstPaidSubject.originalPrice > firstPaidSubject.price! && (
                      <Text style={[styles.priceCardOld, { color: theme.colors.textLight }]}>{formatCurrency(firstPaidSubject.originalPrice)}</Text>
                    )}
                    {firstPaidSubject.discount ? (
                      <View style={styles.discountPill}>
                        <Tag color="#16A34A" size={10} />
                        <Text style={styles.discountPillText}>{firstPaidSubject.discount}% OFF</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              )}

              {/* GST note */}
              <Text style={[styles.gstNote, { color: theme.colors.textLight }]}>* Prices shown are exclusive of 18% GST</Text>

              {/* Benefits */}
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <CheckCircle2 color="#6366F6" size={15} />
                  <Text style={[styles.benefitText, { color: theme.colors.textMain }]}>Full-length tests — Real exam feel</Text>
                </View>
                <View style={styles.benefitItem}>
                  <CheckCircle2 color="#6366F6" size={15} />
                  <Text style={[styles.benefitText, { color: theme.colors.textMain }]}>Practice on mobile or desktop anytime</Text>
                </View>
                <View style={styles.benefitItem}>
                  <CheckCircle2 color="#6366F6" size={15} />
                  <Text style={[styles.benefitText, { color: theme.colors.textMain }]}>Valid for 1 year from date of purchase</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Available Tests ── */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
          <View style={styles.mockTestHeader}>
            <Text style={[styles.mockTestTitle, { color: theme.colors.textMain }]}>Available Tests</Text>
            <Text style={[styles.mockTestCount, { color: theme.colors.textMuted }]}>{availableTopics.length} Topics</Text>
          </View>

          {availableTopics.length > 0 && !everythingPurchased && (
            <View style={[styles.unlockBanner, { backgroundColor: isDarkMode ? 'rgba(245,158,11,0.12)' : '#FFFBEB', borderColor: isDarkMode ? 'rgba(245,158,11,0.25)' : '#FDE68A' }]}>
              <Lock color="#D97706" size={18} style={{ marginRight: 10 }} />
              <Text style={[styles.unlockBannerText, { color: isDarkMode ? '#FCD34D' : '#B45309' }]}>
                Unlock all {totalMockTests} tests by enrolling in the test series.
              </Text>
            </View>
          )}

          <View style={styles.testList}>
            {availableTopics.length === 0 ? 
              <Text style={[styles.emptyText, { color: theme.colors.textLight }]}>Tests are coming soon for this exam.</Text>
            : availableTopics.map((topic, index) => {
                const hasAccess  = hasAccessToTopic(topic);
                const isExpanded = expandedTopics[topic._id] ?? false;
                const tests      = topicTestsMap[topic._id] || [];
                const totalQ     = (topic.testSeriesCount || 0) * 100;
                const totalMins  = (topic.testSeriesCount || 0) * 120;

                return (
                  <View key={topic._id} style={[styles.testCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>

                    {/* Topic header row */}
                    <View style={styles.testCardHeaderRow}>
                      <View style={[styles.testIndexBadge, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }]}>
                        <Text style={styles.testIndexText}>
                          {String(index + 1).padStart(2, '0')}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginHorizontal: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={[styles.testItemTitle, { color: theme.colors.textMain }]} numberOfLines={2}>{topic.name}</Text>
                          <TouchableOpacity
                            onPress={() => toggleWishlist(topic._id, topic.name)}
                            disabled={wishlistLoading === topic._id}
                          >
                            <Heart
                              color={wishlistIds.has(topic._id) ? '#EF4444' : theme.colors.textLight}
                              fill={wishlistIds.has(topic._id) ? '#EF4444' : 'none'}
                              size={15}
                            />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.testMetaRow}>
                          <View style={styles.testMetaItem}>
                            <HelpCircle color={theme.colors.textLight} size={12} />
                            <Text style={[styles.testMetaText, { color: theme.colors.textMuted }]}>{totalQ} Qs</Text>
                          </View>
                          <Text style={styles.metaDot}>•</Text>
                          <View style={styles.testMetaItem}>
                            <Clock color={theme.colors.textLight} size={12} />
                            <Text style={[styles.testMetaText, { color: theme.colors.textMuted }]}>{totalMins} Mins</Text>
                          </View>
                          <Text style={styles.metaDot}>•</Text>
                          <View style={[styles.typeBadge, !topic.subject.isPaid && styles.typeBadgeFree, { backgroundColor: !topic.subject.isPaid ? (isDarkMode ? 'rgba(16,185,129,0.15)' : '#DCFCE7') : (isDarkMode ? 'rgba(99,102,241,0.15)' : '#EEF2FF') }]}>
                            <Text style={[styles.typeBadgeText, !topic.subject.isPaid && styles.typeBadgeTextFree]}>
                              {topic.subject.isPaid ? 'FULL LENGTH' : 'FREE'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Status badge */}
                      {hasAccess ? (
                        <View style={[styles.availableBadge, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.15)' : '#DCFCE7' }]}>
                          <CheckCircle2 color="#16A34A" size={12} />
                          <Text style={styles.availableText}>OPEN</Text>
                        </View>
                      ) : (
                        <View style={[styles.lockedBadge, { backgroundColor: isDarkMode ? theme.colors.border : '#F1F5F9' }]}>
                          <Lock color={theme.colors.textLight} size={12} />
                        </View>
                      )}
                    </View>

                    {/* Action row */}
                    <View style={styles.testActionButtons}>
                      {/* Expand / collapse */}
                      <TouchableOpacity
                        style={[styles.btnOutline, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}
                        onPress={() =>
                          setExpandedTopics(prev => ({ ...prev, [topic._id]: !prev[topic._id] }))
                        }
                      >
                        {isExpanded
                          ? <ChevronUp color={theme.colors.primary} size={15} />
                          : <ChevronDown color={theme.colors.primary} size={15} />
                        }
                        <Text style={[styles.btnOutlineText, { color: theme.colors.primary }]}>
                          {isExpanded ? 'Hide Tests' : `${topic.testSeriesCount} Tests`}
                        </Text>
                      </TouchableOpacity>

                      {/* Access / buy button */}
                      {hasAccess ? (
                        <TouchableOpacity
                          style={[styles.btnSolid, { backgroundColor: theme.colors.primary }]}
                          onPress={() => handleStartTest('', topic)}
                        >
                          <Text style={styles.btnSolidText}>Start</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.btnBuy, { backgroundColor: isDarkMode ? theme.colors.primary : '#1E293B' }]}
                          onPress={() => {
                            const subj = subjects.find(s => s._id === topic.subject._id);
                            if (showCategoryPrice && !categoryPurchased) {
                              openPurchaseModal('category', exam!._id, exam!.price!, exam!.name);
                            } else if (subj?.isPaid && subj.price) {
                              openPurchaseModal('subject', subj._id, subj.price, subj.name);
                            }
                          }}
                        >
                          <Lock color="#FFFFFF" size={12} />
                          <Text style={styles.btnBuyText}>Unlock</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* ── Inline tests list ── */}
                    {isExpanded && (
                      <View style={[styles.inlineTestsList, { borderTopColor: theme.colors.border }]}>
                        {tests.length === 0 ? (
                          <Text style={[styles.emptyText, { color: theme.colors.textLight }]}>No tests available</Text>
                        ) : (
                          tests.map((test, i) => (
                            <View key={test._id} style={[styles.inlineTestItem, { backgroundColor: isDarkMode ? theme.colors.background : '#F8FAFF', borderColor: theme.colors.border }]}>
                              <View style={styles.inlineTestLeft}>
                                <Text style={[styles.inlineTestNo, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.15)' : '#EEF2FF', color: theme.colors.primary }]}>
                                  {String(i + 1).padStart(2, '0')}
                                </Text>
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.inlineTestTitle, { color: theme.colors.textMain }]}>{test.title}</Text>
                                  <Text style={[styles.inlineTestMeta, { color: theme.colors.textMuted }]}>
                                    {test.duration} min • {test.totalQuestions || 100} Questions
                                    {test.difficulty ? ` • ${test.difficulty}` : ''}
                                  </Text>
                                </View>
                              </View>

                              {hasAccess ? (
                                <TouchableOpacity
                                  style={[styles.inlineBtnStart, { backgroundColor: theme.colors.primary }]}
                                  onPress={() => handleStartTest(test._id, topic)}
                                >
                                  <Text style={styles.inlineBtnStartText}>Start</Text>
                                </TouchableOpacity>
                              ) : (
                                <TouchableOpacity
                                  style={[styles.inlineBtnLocked, { backgroundColor: isDarkMode ? theme.colors.border : '#F1F5F9', borderColor: theme.colors.border }]}
                                  onPress={() => {
                                    const subj = subjects.find(s => s._id === topic.subject._id);
                                    if (showCategoryPrice && !categoryPurchased) {
                                      openPurchaseModal('category', exam!._id, exam!.price!, exam!.name);
                                    } else if (subj?.isPaid && subj.price) {
                                      openPurchaseModal('subject', subj._id, subj.price, subj.name);
                                    }
                                  }}
                                >
                                  <Lock color={theme.colors.textLight} size={12} />
                                  <Text style={[styles.inlineBtnLockedText, { color: theme.colors.textMuted }]}>Locked</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          ))
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            }
          </View>
        </View>

        {/* ── Student Feedback ── */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
          <View style={styles.feedbackHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Student Feedback</Text>
            <Text style={[styles.feedbackTotalText, { color: theme.colors.textMuted }]}>
              {reviews.length} {reviews.length === 1 ? 'rating' : 'ratings'}
            </Text>
          </View>

          <View style={[styles.ratingOverview, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.ratingLeft, { borderRightColor: theme.colors.border }]}>
              <Text style={[styles.ratingHuge, { color: theme.colors.primary }]}>{avgRating.toFixed(1)}</Text>
              <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                {Array(5).fill(0).map((_, i) => (
                  <Star
                    key={i}
                    color={i < Math.round(avgRating) ? '#F59E0B' : theme.colors.border}
                    fill={i < Math.round(avgRating) ? '#F59E0B' : theme.colors.border}
                    size={12}
                  />
                ))}
              </View>
              <Text style={[styles.ratingSub, { color: theme.colors.textLight }]}>EXAM RATING</Text>
            </View>
            <View style={styles.ratingBars}>
              {[5, 4, 3, 2, 1].map((star, idx) => {
                const count = reviews.filter((r: any) => Math.round(r.rating) === star).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : (star === 5 ? 70 : 5);
                return (
                  <View key={idx} style={styles.ratingBarRow}>
                    <Text style={[styles.ratingBarStar, { color: theme.colors.textMuted }]}>{star}</Text>
                    <View style={[styles.ratingBarBg, { backgroundColor: theme.colors.border }]}>
                      <View style={[styles.ratingBarFill, { backgroundColor: theme.colors.primary, width: `${percentage}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.writeReviewBtn, { borderColor: theme.colors.primary }]}
            onPress={() => {
              if (!user) {
                triggerAlert('Login Required', 'Please login to write a review.', 'warning', () => navigation.navigate('Login'), hideAlert, 'Login', 'Cancel');
              } else {
                setReviewModalVisible(true);
              }
            }}
          >
            <Text style={[styles.writeReviewText, { color: theme.colors.primary }]}>✎ Write a review</Text>
          </TouchableOpacity>

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <View style={styles.emptyReviews}>
              <Star color={theme.colors.textLight} size={32} />
              <Text style={[styles.emptyReviewsText, { color: theme.colors.textLight }]}>No reviews yet. Be the first to share your experience!</Text>
            </View>
          ) : (
            reviews.slice(0, 5).map((rev, idx) => (
              <View key={rev._id || idx} style={[styles.reviewItem, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.reviewHeader}>
                  <View style={[styles.reviewAvatar, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }]}>
                    <Text style={[styles.avatarText, { color: theme.colors.primary }]}>{(rev.student_id?.name || 'S')[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reviewName, { color: theme.colors.textMain }]}>{rev.student_id?.name || 'Student'}</Text>
                    <View style={{ flexDirection: 'row', marginTop: 2 }}>
                      {Array(5).fill(0).map((_, i) => (
                        <Star
                          key={i}
                          color={i < rev.rating ? '#F59E0B' : theme.colors.border}
                          fill={i < rev.rating ? '#F59E0B' : theme.colors.border}
                          size={10}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.reviewDate, { color: theme.colors.textLight }]}>
                    {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently'}
                  </Text>
                </View>
                {rev.title ? <Text style={[styles.reviewTitle, { color: theme.colors.textMain }]}>{rev.title}</Text> : null}
                <Text style={[styles.reviewText, { color: theme.colors.textMuted }]}>{rev.comment}</Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* ── Footer ── */}
      <View style={[styles.footerContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        {/* Price display */}
        <View style={styles.footerPriceSection}>
          {showCategoryPrice ? (
            <>
              <Text style={[styles.footerPrice, { color: theme.colors.textMain }]}>{formatCurrency(exam!.price!)}</Text>
              {exam?.originalPrice && exam.originalPrice > exam.price! && (
                <Text style={[styles.footerOldPrice, { color: theme.colors.textLight }]}>{formatCurrency(exam.originalPrice)}</Text>
              )}
            </>
          ) : firstPaidSubject ? (
            <Text style={[styles.footerPrice, { color: theme.colors.textMain }]}>{formatCurrency(firstPaidSubject.price!)}</Text>
          ) : (
            <Text style={[styles.footerPrice, { color: theme.colors.textMain }]}>Free</Text>
          )}
          <View style={styles.limitedTimeRow}>
            <Timer color="#6366F6" size={11} />
            <Text style={styles.limitedTimeText}>Incl. taxes</Text>
          </View>
        </View>

        {/* CTA buttons */}
        {everythingPurchased ? (
          <View style={[styles.enrollBtn, { backgroundColor: '#10B981', flexDirection: 'row', gap: 6 }]}>
            <CheckCircle2 color="#FFF" size={16} />
            <Text style={styles.enrollBtnText}>Enrolled</Text>
          </View>
        ) : (
          <View style={{ gap: 6 }}>
            {showCategoryPrice && !categoryPurchased && (
              <TouchableOpacity
                style={[styles.enrollBtn, { backgroundColor: theme.colors.primary }]}
                disabled={paymentLoading}
                onPress={() => openPurchaseModal('category', exam!._id, exam!.price!, exam!.name)}
              >
                <Text style={styles.enrollBtnText}>Buy Full Series</Text>
              </TouchableOpacity>
            )}
            {firstPaidSubject && !purchasedSubjectIds.has(firstPaidSubject._id) && (
              <TouchableOpacity
                style={[styles.enrollBtn, { backgroundColor: theme.colors.primary }, showCategoryPrice && [styles.enrollBtnOutline, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]]}
                disabled={paymentLoading}
                onPress={() => openPurchaseModal('subject', firstPaidSubject._id, firstPaidSubject.price!, firstPaidSubject.name)}
              >
                <Text style={[styles.enrollBtnText, showCategoryPrice && { color: theme.colors.primary }]}>
                  {showCategoryPrice ? `Buy ${firstPaidSubject.name}` : 'Enroll Now'}
                </Text>
              </TouchableOpacity>
            )}
            {!showCategoryPrice && !firstPaidSubject && (
              <View style={[styles.enrollBtn, { backgroundColor: '#94A3B8' }]}>
                <Text style={styles.enrollBtnText}>Coming Soon</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── Payment Modal ── */}
      <Modal
        visible={paymentModal}
        animationType="slide"
        transparent
        onRequestClose={() => setPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.paymentModalCard, { backgroundColor: theme.colors.surface }]}>

            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitleText, { color: theme.colors.textMain }]}>Complete Purchase</Text>
              <TouchableOpacity onPress={() => setPaymentModal(false)} style={[styles.closeModalBtn, { backgroundColor: theme.colors.background }]}>
                <X color={theme.colors.textMuted} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>

              {/* Summary */}
              <View style={[styles.miniCourseSummary, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <Text style={[styles.miniCourseTitle, { color: theme.colors.textMain }]}>{purchaseTarget?.name}</Text>
                <Text style={[styles.miniCourseSubtitle, { color: theme.colors.textMuted }]}>
                  {purchaseTarget?.type === 'category' ? 'Full Test Series' : 'Subject Access'} • 1 Year Validity
                </Text>
              </View>

              {/* Coins */}
              <View style={styles.coinUsageBox}>
                <View style={styles.coinBoxTitleRow}>
                  <Coins color="#6366F6" size={16} />
                  <Text style={[styles.coinBoxTitle, { color: theme.colors.textMain }]}>Use Wallet Coins</Text>
                </View>

                <TextInput
                  style={[styles.coinInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textMain }]}
                  keyboardType="number-pad"
                  value={coinsUsed}
                  onChangeText={text => {
                    let val = parseInt(text.replace(/\D/g, ''), 10) || 0;
                    if (val > coinsBalance) val = coinsBalance;
                    setCoinsUsed(val.toString());
                  }}
                  placeholder="Enter coins to use"
                  placeholderTextColor={theme.colors.textLight}
                />

                <Text style={[styles.coinBoxSub, { color: theme.colors.textMuted }]}>
                  Balance: <Text style={{ fontWeight: '700', color: theme.colors.textMain }}>{coinsBalance}</Text> coins
                  {'  '}(100 coins = ₹10)
                </Text>

                {Number(coinsUsed) > 0 && Number(coinsUsed) < MIN_COINS && (
                  <Text style={styles.coinWarning}>
                    Minimum {MIN_COINS} coins required to apply discount.
                  </Text>
                )}
              </View>

              {/* Coupon Code Box */}
              <CouponInput
                couponCode={couponCode}
                onChangeCode={setCouponCode}
                onApply={handleApplyCoupon}
                onRemove={handleRemoveCoupon}
                appliedCoupon={appliedCoupon}
                loading={couponLoading}
                containerStyle={{ marginBottom: 14 }}
              />

              {/* Price breakdown */}
              <View style={[styles.priceBreakdownBox, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceRowLabel, { color: theme.colors.textMuted }]}>Base Price</Text>
                  <Text style={[styles.priceRowValue, { color: theme.colors.textMain }]}>{formatCurrency(modalPricing.base)}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceRowLabel, { color: theme.colors.textMuted }]}>GST (18%)</Text>
                  <Text style={[styles.priceRowValue, { color: theme.colors.textMain }]}>{formatCurrency(modalPricing.gst)}</Text>
                </View>
                {modalPricing.disc > 0 && Number(coinsUsed) >= MIN_COINS && (
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceRowLabel, { color: '#10B981' }]}>Coin Discount</Text>
                    <Text style={[styles.priceRowValue, { color: '#10B981' }]}>
                      - {formatCurrency(modalPricing.disc)}
                    </Text>
                  </View>
                )}
                {modalPricing.couponDisc > 0 && appliedCoupon && (
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceRowLabel, { color: '#10B981' }]}>
                      Coupon ({appliedCoupon.code})
                    </Text>
                    <Text style={[styles.priceRowValue, { color: '#10B981' }]}>
                      - {formatCurrency(modalPricing.couponDisc)}
                    </Text>
                  </View>
                )}
                <View style={[styles.priceDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.priceRow}>
                  <Text style={[styles.priceRowLabelBold, { color: theme.colors.textMain }]}>Final Payable</Text>
                  <Text style={[styles.priceRowValueBold, { color: theme.colors.primary }]}>{formatCurrency(modalPricing.final)}</Text>
                </View>
              </View>

            </ScrollView>

            <View style={[styles.modalFooterActions, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity
                style={[styles.payNowBtn, paymentLoading && { opacity: 0.7 }]}
                onPress={executePurchase}
                disabled={paymentLoading}
              >
                {paymentLoading
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.payNowText}>Proceed to Pay</Text>
                }
              </TouchableOpacity>
              <Text style={[styles.secureText, { color: theme.colors.textLight }]}>🔒 Guaranteed Safe Checkout</Text>
            </View>

          </View>
        </View>
      </Modal>

      {/* ── Review Modal ── */}
      <ReviewModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        itemId={targetId}
        itemType="test_series"
        itemName={exam?.name || 'Test Series'}
        token={user?.token || ''}
        onSuccess={fetchReviews}
      />

      {/* ── Custom Alert ── */}
      <Modal
        visible={customAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={hideAlert}
      >
        <View style={styles.customAlertOverlay}>
          <View style={[styles.customAlertBox, { backgroundColor: theme.colors.surface }]}>
            <View style={[
              styles.customAlertIconContainer,
              customAlert.type === 'success' && { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.15)' : '#ECFDF5' },
              customAlert.type === 'error'   && { backgroundColor: isDarkMode ? 'rgba(239,68,68,0.15)' : '#FEF2F2' },
              customAlert.type === 'warning' && { backgroundColor: isDarkMode ? 'rgba(245,158,11,0.15)' : '#FFFBEB' },
              customAlert.type === 'info'    && { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.15)' : '#EEF2FF' },
            ]}>
              {customAlert.type === 'success' && <CheckCircle2 color="#10B981" size={30} />}
              {customAlert.type === 'error'   && <XCircle     color="#EF4444" size={30} />}
              {customAlert.type === 'warning' && <AlertTriangle color="#F59E0B" size={30} />}
              {customAlert.type === 'info'    && <Info        color="#6366F6" size={30} />}
            </View>

            <Text style={[styles.customAlertTitle, { color: theme.colors.textMain }]}>{customAlert.title}</Text>
            <Text style={[styles.customAlertMessage, { color: theme.colors.textMuted }]}>{customAlert.message}</Text>

            <View style={styles.customAlertActionRow}>
              {customAlert.onCancel && (
                <TouchableOpacity style={[styles.customAlertCancelBtn, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, borderWidth: 1 }]} onPress={customAlert.onCancel}>
                  <Text style={[styles.customAlertCancelText, { color: theme.colors.textMuted }]}>{customAlert.cancelText || 'Cancel'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.customAlertConfirmBtn,
                  customAlert.type === 'error'   && { backgroundColor: '#EF4444' },
                  customAlert.type === 'warning' && { backgroundColor: '#F59E0B' },
                  customAlert.type === 'success' && { backgroundColor: '#10B981' },
                ]}
                onPress={customAlert.onConfirm || hideAlert}
              >
                <Text style={styles.customAlertConfirmText}>{customAlert.confirmText || 'OK'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScreenContainer>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: '#FFFFFF' },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerIcon:  { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#0F172A', paddingHorizontal: 8 },

  scrollContent: { paddingBottom: 140 },

  // Hero
  heroSection:        { padding: 20, borderBottomWidth: 6, borderBottomColor: '#F8FAFC' },
  tagsRow:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  leftTags:           { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryText:       { fontSize: 12, fontWeight: '800', color: '#6366F6' },
  languageWrap:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  languageText:       { fontSize: 12, fontWeight: '500', color: '#64748B' },
  seriesYearText:     { fontSize: 12, fontWeight: '600', color: '#64748B' },
  titleRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  mainTitle:          { flex: 1, fontSize: 20, fontWeight: '800', color: '#0F172A', lineHeight: 28, marginRight: 12 },
  titleIcons:         { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  description:        { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 18 },
  statsPillsContainer:{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statPill:           { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, gap: 5 },
  statPillText:       { fontSize: 11, fontWeight: '600', color: '#475569' },

  // Sections
  sectionContainer:     { padding: 20, borderBottomWidth: 6, borderBottomColor: '#F8FAFC' },
  sectionTitle:         { fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 1.2, marginBottom: 16 },

  // Features grid
  featuresGrid:         { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  featureCard:          { width: '48%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14 },
  featureIconBox:       { width: 36, height: 36, borderRadius: 8, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  featureCardTitle:     { fontSize: 12, fontWeight: '700', color: '#0F172A', lineHeight: 18 },
  bulletPointsContainer:{ gap: 12 },
  bulletRow:            { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bulletText:           { fontSize: 13, fontWeight: '500', color: '#0F172A' },

  // Price card
  priceCard:        { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 16 },
  priceCardRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceCardLabel:   { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  priceCardSub:     { fontSize: 11, color: '#64748B', marginTop: 2 },
  priceCardValue:   { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  priceCardOld:     { fontSize: 12, color: '#94A3B8', textDecorationLine: 'line-through', marginTop: 2 },
  discountPill:     { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  discountPillText: { fontSize: 10, fontWeight: '800', color: '#16A34A' },
  gstNote:          { fontSize: 11, color: '#94A3B8', marginTop: 12, marginBottom: 14 },
  benefitsList:     { gap: 10 },
  benefitItem:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitText:      { fontSize: 13, color: '#475569', fontWeight: '500' },

  // Tests section
  mockTestHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  mockTestTitle:    { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  mockTestCount:    { fontSize: 12, fontWeight: '500', color: '#64748B' },
  unlockBanner:     { flexDirection: 'row', backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 12, padding: 14, marginBottom: 16, alignItems: 'center' },
  unlockBannerText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#B45309', lineHeight: 18 },
  testList:         { gap: 14 },
  emptyText:        { textAlign: 'center', padding: 24, color: '#94A3B8', fontSize: 13, fontStyle: 'italic' },

  // Test card
  testCard: { 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    borderRadius: 24, 
    padding: 20, 
    overflow: 'hidden',
    shadowColor: '#5B6CFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 16
  },
  testCardHeaderRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  testIndexBadge:     { width: 34, height: 34, borderRadius: 10, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  testIndexText:      { fontSize: 13, fontWeight: '800', color: '#6366F6' },
  testItemTitle:      { fontSize: 15, fontWeight: '800', color: '#0F172A', lineHeight: 22, flex: 1 },
  testMetaRow:        { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 6, flexWrap: 'wrap' },
  testMetaItem:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  testMetaText:       { fontSize: 11, fontWeight: '500', color: '#64748B' },
  metaDot:            { color: '#CBD5E1', fontSize: 12 },
  typeBadge:          { backgroundColor: '#EEF2FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeBadgeFree:      { backgroundColor: '#DCFCE7' },
  typeBadgeText:      { fontSize: 9, fontWeight: '800', color: '#6366F6', letterSpacing: 0.5 },
  typeBadgeTextFree:  { color: '#16A34A' },
  availableBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  availableText:      { fontSize: 10, fontWeight: '800', color: '#16A34A', letterSpacing: 0.5 },
  lockedBadge:        { width: 28, height: 28, borderRadius: 8, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  testActionButtons:  { flexDirection: 'row', gap: 10 },
  btnSolid:           { flex: 1, backgroundColor: '#6366F6', paddingVertical: 12, borderRadius: 12, alignItems: 'center', shadowColor: '#6366F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  btnSolidText:       { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  btnBuy:             { flex: 1, backgroundColor: '#1E293B', paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  btnBuyText:         { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  btnOutline:         { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#6366F6', paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnOutlineText:     { color: '#6366F6', fontSize: 13, fontWeight: '800' },

  // Inline tests
  inlineTestsList:    { marginTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16, gap: 12 },
  inlineTestItem:     { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFF', 
    borderWidth: 1,
    borderColor: '#E8EDFF',
    borderRadius: 14, 
    padding: 14,
    shadowColor: '#5B6CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1
  },
  inlineTestLeft:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 10 },
  inlineTestNo:       { fontSize: 11, fontWeight: '800', color: '#6366F6', width: 30, height: 30, borderRadius: 8, backgroundColor: '#EEF2FF', textAlign: 'center', textAlignVertical: 'center', lineHeight: 30 },
  inlineTestTitle:    { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  inlineTestMeta:     { fontSize: 11, color: '#64748B', fontWeight: '600' },
  inlineBtnStart:     { backgroundColor: '#6366F6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, shadowColor: '#6366F6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  inlineBtnStartText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  inlineBtnLocked:    { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  inlineBtnLockedText:{ color: '#94A3B8', fontSize: 12, fontWeight: '700' },

  // --- Feedback Styles ---
  feedbackHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  feedbackTotalText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  ratingOverview: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  ratingLeft: { flex: 0.8, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#E2E8F0', paddingRight: 20 },
  ratingHuge: { fontSize: 36, fontWeight: '800', color: '#6366F6', marginBottom: 4 },
  ratingSub: { fontSize: 9, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
  ratingBars: { flex: 1, paddingLeft: 20, justifyContent: 'center', gap: 6 },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingBarStar: { fontSize: 10, fontWeight: '700', color: '#475569', width: 10 },
  ratingBarBg: { flex: 1, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, overflow: 'hidden' },
  ratingBarFill: { height: '100%', backgroundColor: '#6366F6', borderRadius: 2 },
  
  writeReviewBtn: { borderWidth: 1, borderColor: '#6366F6', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginBottom: 24, borderStyle: 'dashed' },
  writeReviewText: { color: '#6366F6', fontSize: 14, fontWeight: '700' },
  
  reviewItem: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 16 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#6366F6', fontSize: 14, fontWeight: '700' },
  reviewName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  reviewDate: { fontSize: 11, color: '#94A3B8' },
  reviewTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  reviewText: { fontSize: 13, color: '#475569', lineHeight: 20 },
  emptyReviews: { alignItems: 'center', paddingVertical: 32 },
  emptyReviewsText: { color: '#94A3B8', fontSize: 13, marginTop: 12, textAlign: 'center' },

  // Footer
  footerContainer:     { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 12 },
  footerPriceSection:  { flexDirection: 'column' },
  footerPrice:         { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  footerOldPrice:      { fontSize: 12, color: '#94A3B8', textDecorationLine: 'line-through' },
  limitedTimeRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  limitedTimeText:     { fontSize: 10, fontWeight: '600', color: '#6366F6' },
  enrollBtn:           { backgroundColor: '#6366F6', paddingHorizontal: 22, paddingVertical: 13, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  enrollBtnOutline:    { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#6366F6' },
  enrollBtnText:       { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // Payment modal
  modalOverlay:        { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  paymentModalCard:    { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitleText:      { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  closeModalBtn:       { padding: 4, backgroundColor: '#F8FAFC', borderRadius: 20 },
  modalBody:           { padding: 20 },
  miniCourseSummary:   { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, marginBottom: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  miniCourseTitle:     { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  miniCourseSubtitle:  { fontSize: 12, color: '#64748B' },
  coinUsageBox:        { marginBottom: 20 },
  coinBoxTitleRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  coinBoxTitle:        { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  coinInput:           { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: '600', color: '#6366F6', backgroundColor: '#F8FAFC' },
  coinBoxSub:          { fontSize: 11, color: '#64748B', marginTop: 6 },
  coinWarning:         { fontSize: 11, color: '#EF4444', marginTop: 4 },
  priceBreakdownBox:   { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14 },
  priceRow:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  priceRowLabel:       { fontSize: 13, color: '#64748B', fontWeight: '500' },
  priceRowValue:       { fontSize: 13, color: '#0F172A', fontWeight: '600' },
  priceDivider:        { height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 },
  priceRowLabelBold:   { fontSize: 15, color: '#0F172A', fontWeight: '800' },
  priceRowValueBold:   { fontSize: 16, color: '#6366F6', fontWeight: '800' },
  modalFooterActions:  { padding: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  payNowBtn:           { backgroundColor: '#10B981', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  payNowText:          { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secureText:          { textAlign: 'center', fontSize: 11, color: '#94A3B8', fontWeight: '600' },

  // Custom alert
  customAlertOverlay:       { flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'center', alignItems: 'center' },
  customAlertBox:           { backgroundColor: '#FFFFFF', width: '85%', maxWidth: 380, borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  customAlertIconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  customAlertTitle:         { fontSize: 18, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 8 },
  customAlertMessage:       { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 22, paddingHorizontal: 6 },
  customAlertActionRow:     { flexDirection: 'row', gap: 10, width: '100%' },
  customAlertCancelBtn:     { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  customAlertCancelText:    { color: '#475569', fontSize: 14, fontWeight: '700' },
  customAlertConfirmBtn:    { flex: 1, backgroundColor: '#6366F6', paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  customAlertConfirmText:   { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
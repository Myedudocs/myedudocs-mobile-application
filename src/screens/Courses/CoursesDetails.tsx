import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
  Linking,
  Modal,
  TextInput
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import {
  Share2,
  Heart,
  Globe,
  Download,
  Star,
  PlayCircle,
  Calendar,
  Infinity as InfinityIcon,
  FileText,
  MonitorPlay,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
  BookIcon,
  X,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react-native';
import RatingBadge from '../../components/RatingBadge';
import DetailsSkeleton from '../../components/skeletons/DetailsSkeleton';
import ReviewModal from '../../components/ReviewModal';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { CouponInput, AppliedCouponData } from '../../components/common/CouponInput';

// --- IMPORT GLOBAL AUTH & API ---
import { useTheme } from '../../context/ThemeContext';
import { theme as staticTheme } from '../../styles/theme'; 
import { ENDPOINTS, apiClient, BASE_URL } from '../../service/api.service';
import { useAuth } from '../../context/AuthContext';

// --------------------------------------------------------
// 1. FALLBACK DATA & CONSTANTS
// --------------------------------------------------------
const FALLBACK_META = {
  title: 'Loading Course...',
  mentor: 'Expert Faculty',
  rating: 4.8,
  reviewsCount: 0,
  studentsCount: 0,
  description: "Comprehensive coverage of the syllabus.",
  price: 0,
  oldPrice: 0,
  image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
  language: 'English',
  skillLevel: 'Beginner to Advanced',
  duration: 0,
  syllabus: undefined as string | undefined,
};

const WHAT_YOU_GET = [
  { icon: PlayCircle, title: 'Recorded video classes', sub: 'High-quality video lectures' },
  { icon: FileText, title: 'PDF notes', sub: 'Comprehensive study guides & cheat sheets' },
  { icon: MonitorPlay, title: 'Live classes', sub: 'Bi-weekly interactive live workshops' },
];

const GST_RATE = 0.18;
const COIN_VALUE = 0.10; // 1 coin = ₹0.10
const MIN_COINS = 100;

// CUSTOM ALERT TYPES
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

// --------------------------------------------------------
// 2. HELPER FUNCTIONS
// --------------------------------------------------------
const getImageUrl = (url?: string) => {
  if (!url) return FALLBACK_META.image;
  if (url.startsWith('http')) return url;
  return `${BASE_URL.replace('/api/v1', '')}/${url.replace(/\\/g, '/')}`;
};

const formatCurrency = (amount: number) => {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

// --------------------------------------------------------
// 3. MAIN COMPONENT
// --------------------------------------------------------
export const CourseDetails = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { id } = route.params || {}; 
  const { user } = useAuth(); // Global Auth
  const { theme, isDarkMode } = useTheme();

  // --- CUSTOM ALERT STATE ---
  const [customAlert, setCustomAlert] = useState<CustomAlertConfig>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const triggerAlert = (
    title: string,
    message: string,
    type: AlertType = 'info',
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText = 'OK',
    cancelText?: string
  ) => {
    setCustomAlert({ visible: true, title, message, type, onConfirm, onCancel, confirmText, cancelText });
  };

  const hideAlert = () => {
    setCustomAlert(prev => ({ ...prev, visible: false }));
  };

  // --- UI States ---
  const [activeTab, setActiveTab] = useState<'Overview' | 'Curriculum'>('Overview');
  const [expandedFaqs, setExpandedFaqs] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['0']));
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  // --- Data States ---
  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number>(4.8);
  const [loading, setLoading] = useState(true);

  // --- Wallet & Purchase States ---
  const [walletBalance, setWalletBalance] = useState(0);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [coinsToUse, setCoinsToUse] = useState('0'); 
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  // --- Coupon States ---
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponData | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) {
        setLoading(false);
        return; 
      }
      try {
        setLoading(true);
        // Fetch Course Details
        const courseData = await apiClient(`${BASE_URL}/course/courseDetails/${id}`);
        if (courseData.course) {
          setCourseDetails(courseData.course);
          if (courseData.course.course_faqs?.length > 0) {
            setExpandedFaqs(new Set([courseData.course.course_faqs[0]._id || '0']));
          }
        }

        // Fetch Reviews
        const reviewData = await apiClient(`${BASE_URL}/course/review/${id}`);
        if (reviewData.success) {
          setReviews(reviewData.reviews || []);
          setAvgRating(Number(reviewData.averageRating) || 0);
        }

        if (user?.token) {
          fetchWalletData();
          checkPurchaseStatus();
          checkWishlistStatus();
        }

      } catch (error) {
        console.error('Failed to load course details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, user]);

  const fetchReviews = async () => {
    if (!id) return;
    try {
      const reviewData = await apiClient(`${BASE_URL}/course/review/${id}`);
      if (reviewData.success) {
        setReviews(reviewData.reviews || []);
        setAvgRating(Number(reviewData.averageRating) || 0);
      }
    } catch (error) {
      console.error('Failed to reload reviews:', error);
    }
  };

  // --- API CALLS: USER DATA ---
  const fetchWalletData = async () => {
    try {
      const res = await fetch(`${BASE_URL}/student/wallet`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (data.success) setWalletBalance(data.wallet.balance || 0);
    } catch (err) {
      console.error("Wallet fetch failed", err);
    }
  };

  const checkPurchaseStatus = async () => {
    try {
      const res = await fetch(`${BASE_URL}/students/course/payment/check-purchase/${id}?student_id=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setIsPurchased(data.purchased || false);
      }
    } catch (err) {
      console.error('Error checking purchase status', err);
    }
  };

  const checkWishlistStatus = async () => {
    try {
      const res = await fetch(`${BASE_URL}/wishlist/my`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (data?.data?.items) {
        const exists = data.data.items.some((i: any) => i.item_type === "course" && i.item_id === id);
        setIsWishlisted(exists);
      }
    } catch (err) {
      console.error("Wishlist check failed", err);
    }
  };

  // --- ACTIONS ---
  const handleWishlistToggle = async () => {
    if (!user) {
      return triggerAlert("Login Required", "Please login to use the wishlist.", "warning", () => { hideAlert(); navigation.navigate('Login'); }, hideAlert, "Login", "Cancel");
    }
    if (wishlistLoading) return;

    try {
      setWishlistLoading(true);
      const res = await fetch(`${BASE_URL}/wishlist/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({
          item_type: "course",
          item_id: id,
          snapshot: {
            title: courseDetails.title,
            price: courseDetails.price,
            coverphoto: courseDetails.coverphoto,
            teacher: courseDetails.teacher_id?.tname
          }
        })
      });
      if (res.ok) {
        setIsWishlisted(!isWishlisted);
        triggerAlert(isWishlisted ? "Removed" : "Saved", isWishlisted ? "Course removed from wishlist." : "Course added to your wishlist ❤️", "success");
      }
    } catch (err) {
      triggerAlert("Error", "Failed to update wishlist.", "error");
    } finally {
      setWishlistLoading(false);
    }
  };

  // --- PAYMENT LOGIC ---
  const handleEnrollClick = () => {
    if (!user) {
      return triggerAlert("Login Required", "Please login to purchase this course.", "warning", () => { hideAlert(); navigation.navigate('Login'); }, hideAlert, "Login", "Cancel");
    }
    if (isPurchased) return navigation.navigate('MyCourses'); 
    setPaymentModalVisible(true);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      return triggerAlert("Coupon Code Required", "Please enter a coupon code to apply.", "warning");
    }
    try {
      setCouponLoading(true);
      const email = user?.email;
      const baseAmount = pricing.totalAmount;
      const res = await fetch(`${BASE_URL}/coupons/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), email, amount: baseAmount })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAppliedCoupon(data.data);
        triggerAlert("Coupon Applied! 🎉", data.message || "Coupon applied successfully!", "success");
      } else {
        setAppliedCoupon(null);
        triggerAlert("Invalid Coupon", data.message || "Invalid or inactive coupon code.", "error");
      }
    } catch {
      triggerAlert("Error", "Failed to verify coupon. Please check your network and try again.", "error");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const executePurchase = async () => {
    if (!courseDetails) return;

    const coinsNum = Number(coinsToUse) || 0;
    if (coinsNum > 0 && coinsNum < MIN_COINS) {
      return triggerAlert("Warning", `Minimum ${MIN_COINS} coins required to use wallet discount.`, "warning");
    }
    if (coinsNum > walletBalance) {
      return triggerAlert("Insufficient Coins", "You do not have enough coins in your wallet.", "error");
    }

    const pricing = calculatePricing(courseDetails.price);
    const coinDiscount = coinsNum >= MIN_COINS ? coinsNum * COIN_VALUE : 0;
    const couponDiscount = appliedCoupon?.calculatedDiscount || 0;
    const finalAmount = Math.max(pricing.totalAmount - coinDiscount - couponDiscount, 0);

    try {
      setPaymentLoading(true);

      // CASE 1: FULL COIN / COUPON PAYMENT (Amount is 0)
      if (finalAmount <= 0) {
        const res = await fetch(`${BASE_URL}/student/wallet/purchase-course`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.token || ''}` },
          body: JSON.stringify({
            course_id: id,
            coins_used: coinsNum >= MIN_COINS ? coinsNum : 0,
            coupon_code: appliedCoupon?.code || '',
            amount_paid: 0
          })
        });
        const data = await res.json();
        if (data.success) {
          triggerAlert("Success 🎉", "Course purchased using discount!", "success");
          setIsPurchased(true);
          setPaymentModalVisible(false);
          setAppliedCoupon(null);
          setCouponCode('');
          fetchWalletData();
        } else {
          triggerAlert("Error", data.message || "Purchase failed", "error");
        }
        setPaymentLoading(false);
        return;
      }

      // CASE 2: NATIVE RAZORPAY CHECKOUT
      const orderRes = await fetch(`${BASE_URL}/students/course/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.token || ''}` },
        body: JSON.stringify({
          course_id: id,
          coins_used: coinsNum >= MIN_COINS ? coinsNum : 0,
          coupon_code: appliedCoupon?.code || '',
          amount_after_discount: finalAmount,
          student_data: { id: user?.id, name: user?.name, email: user?.email, phone: (user as any)?.phn || (user as any)?.phone || '' }
        })
      });
      
      const orderData = await orderRes.json();

      const options = {
        description: courseDetails.title,
        image: getImageUrl(courseDetails.coverphoto),
        currency: 'INR',
        key: 'rzp_live_SMJIYo75cfQOFp', // <-- YOUR ACTUAL KEY
        amount: orderData.amount,
        name: 'MYEDUDOCS',
        order_id: orderData.orderId,
        prefill: {
          email: user?.email,
          contact: (user as any)?.phn || (user as any)?.phone || '',
          name: user?.name
        },
        theme: { color: '#6366F6' }
      };

      RazorpayCheckout.open(options)
        .then(async (data: any) => {
          const verify = await fetch(`${BASE_URL}/students/course/payment/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.token}` },
            body: JSON.stringify({
              course_id: id,
              coins_used: coinsNum >= MIN_COINS ? coinsNum : 0,
              coupon_code: appliedCoupon?.code || '',
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_order_id: data.razorpay_order_id,
              razorpay_signature: data.razorpay_signature,
              student_data: { id: user?.id, name: user?.name, email: user?.email, phone: (user as any)?.phn || (user as any)?.phone || '' }
            })
          });
          const verifyData = await verify.json();
          
          if (verifyData.success) {
            triggerAlert("Welcome Aboard! 🎉", "Course purchased successfully!", "success");
            setIsPurchased(true);
            setPaymentModalVisible(false);
            setAppliedCoupon(null);
            setCouponCode('');
            fetchWalletData();
          } else {
            triggerAlert("Verification Failed", "Payment verification failed on server.", "error");
          }
        })
        .catch((error: any) => {
          triggerAlert("Payment Cancelled", error.description || "Transaction was cancelled.", "warning");
        });

    } catch (err) {
      triggerAlert("Error", "Something went wrong initiating the payment.", "error");
    } finally {
      setPaymentLoading(false);
    }
  };

  // --- PRICING CALCS ---
  const calculatePricing = (basePrice: number) => {
    const gstAmount = basePrice * GST_RATE;
    const totalAmount = basePrice + gstAmount;
    return { basePrice, gstAmount, totalAmount };
  };

  // --- FORMAT DATA ---
  const meta = courseDetails ? {
    title: courseDetails.title,
    mentor: courseDetails.teacher_id?.tname || FALLBACK_META.mentor,
    rating: avgRating,
    reviewsCount: reviews.length,
    studentsCount: courseDetails.enrolled_count || FALLBACK_META.studentsCount,
    description: courseDetails.short_desc || FALLBACK_META.description,
    price: courseDetails.price,
    oldPrice: courseDetails.actual_price || (courseDetails.price * 1.5), 
    image: getImageUrl(courseDetails.coverphoto),
    language: courseDetails.language || 'English',
    skillLevel: courseDetails.skill_level || 'Beginner',
    duration: courseDetails.duration || 0,
    syllabus: courseDetails.syllabus
  } : FALLBACK_META;

  const pricing = calculatePricing(meta.price);

  // Recalculate coupon discount dynamically if price changes
  useEffect(() => {
    if (appliedCoupon && pricing.totalAmount > 0) {
      let newDiscount = 0;
      if (appliedCoupon.discountType === 'percentage') {
        newDiscount = Math.round((pricing.totalAmount * appliedCoupon.discountValue) / 100);
      } else {
        newDiscount = Math.min(appliedCoupon.discountValue, pricing.totalAmount);
      }
      if (appliedCoupon.calculatedDiscount !== newDiscount) {
        setAppliedCoupon(prev => prev ? { ...prev, calculatedDiscount: newDiscount } : null);
      }
    }
  }, [pricing.totalAmount]);

  const coinDiscountPreview = (Number(coinsToUse) >= MIN_COINS ? Number(coinsToUse) * COIN_VALUE : 0);
  const couponDiscountPreview = appliedCoupon?.calculatedDiscount || 0;
  const finalPayablePreview = Math.max(pricing.totalAmount - coinDiscountPreview - couponDiscountPreview, 0);

  const whatYouWillLearn = courseDetails?.what_you_will_learn?.map((item: any) => item.text) || [];
  const whoIsThisFor = courseDetails?.who_this_course_is_for?.map((item: any) => item.text).join(' ') || 'Not specified.';
  const faqs = courseDetails?.course_faqs || [];
  const chapters = courseDetails?.chapters || [];

  const totalRatingCount = reviews.length;

  // Handlers
  const toggleFaq = (faqId: string) => {
    const newExpanded = new Set(expandedFaqs);
    if (newExpanded.has(faqId)) newExpanded.delete(faqId);
    else newExpanded.add(faqId);
    setExpandedFaqs(newExpanded);
  };
  const toggleModule = (modId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(modId)) newExpanded.delete(modId);
    else newExpanded.add(modId);
    setExpandedModules(newExpanded);
  };
  const handleShare = async () => {
    try {
      await Share.share({ message: `Check out this amazing course: ${meta.title}\nhttps://myedudocs.in/course-details/${id || ''}` });
    } catch (error) { console.log('Error sharing:', error); }
  };
  const handleDownloadSyllabus = () => {
    if (meta.syllabus) Linking.openURL(getImageUrl(meta.syllabus));
  };
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} color={i < rating ? '#F59E0B' : '#E2E8F0'} fill={i < rating ? '#F59E0B' : 'transparent'} size={14} />
    ));
  };
  
  const handleWriteReviewClick = () => {
    if (!user?.token) {
      triggerAlert("Login Required", "Please login to write a review.", "info", () => { hideAlert(); navigation.navigate("Login"); }, hideAlert, "Login", "Cancel");
      return;
    }
    if (!isPurchased) {
      triggerAlert("Notice", "You must purchase this course to write a review.", "warning");
      return;
    }
    setReviewModalVisible(true);
  };

  if (loading) {
    return <DetailsSkeleton />;
  }

  if (loading) return <DetailsSkeleton />;

  return (
    <>
      <ScreenContainer
        header={{
          title: 'Course Details',
          showBack: true,
          showThemeToggle: true,
          showCoins: false,
          showNotifications: false,
          rightElement: (
            <TouchableOpacity onPress={handleShare} activeOpacity={0.7} style={styles.headerIcon}>
              <Share2 color={theme.colors.textMain} size={22} />
            </TouchableOpacity>
          ),
        }}
        scroll={false}
      >

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* --- HERO SECTION --- */}
          <Image source={{ uri: meta.image }} style={styles.heroImage} />

          <View style={styles.paddingContainer}>
            <View style={styles.tagsRow}>
              <View style={styles.leftTags}>
                <Text style={styles.tagPrimary}>{meta.skillLevel}</Text>
                <View style={styles.languageWrap}>
                  <Globe color={theme.colors.textMuted} size={12} strokeWidth={2} />
                  <Text style={[styles.tagMuted, { color: theme.colors.textMuted }]}>{meta.language}</Text>
                </View>
              </View>
              {meta.syllabus && (
                <TouchableOpacity style={[styles.syllabusBtn, { backgroundColor: isDarkMode ? theme.colors.border : '#F5F8FF', borderColor: theme.colors.border }]} onPress={handleDownloadSyllabus}>
                  <Download color={theme.colors.primary} size={12} strokeWidth={2.5} />
                  <Text style={[styles.syllabusText, { color: theme.colors.primary }]}>Free Syllabus</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.titleRow}>
              <Text style={[styles.mainTitle, { color: theme.colors.textMain }]}>{meta.title}</Text>
              <View style={styles.titleIcons}>
                <TouchableOpacity onPress={handleWishlistToggle} disabled={wishlistLoading}>
                  {wishlistLoading ? <ActivityIndicator size="small" color="#EF4444" /> : <Heart color={isWishlisted ? "#EF4444" : theme.colors.textMuted} fill={isWishlisted ? "#EF4444" : "transparent"} size={20} />}
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.description, { color: theme.colors.textMuted }]}>{meta.description}</Text>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
              <RatingBadge 
                itemId={id}
                itemType="course"
                preloadedRating={meta.rating}
                preloadedCount={meta.reviewsCount}
                size="md"
              />
              <Text style={[styles.statTextMuted, { color: theme.colors.textLight }]}>•</Text>
              <Text style={[styles.statTextMuted, { color: theme.colors.textLight }]}>{meta.studentsCount} students enrolled</Text>
            </View>

            {/* Course Highlights Card */}
            <Text style={[styles.sectionTitleSmall, { color: theme.colors.textMuted }]}>Course Highlights</Text>
            <View style={[styles.highlightsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.highlightItem}>
                <View style={[styles.highlightIconBg, { backgroundColor: isDarkMode ? theme.colors.border : '#F5F8FF' }]}><PlayCircle color={theme.colors.primary} size={20} /></View>
                <Text style={[styles.highlightVal, { color: theme.colors.textMain }]}>{meta.duration} hrs</Text>
                <Text style={[styles.highlightLbl, { color: theme.colors.textLight }]}>Hours of video</Text>
              </View>
              <View style={styles.highlightItem}>
                <View style={[styles.highlightIconBg, { backgroundColor: isDarkMode ? theme.colors.border : '#F5F8FF' }]}><Calendar color={theme.colors.primary} size={20} /></View>
                <Text style={[styles.highlightVal, { color: theme.colors.textMain }]}>Weekly</Text>
                <Text style={[styles.highlightLbl, { color: theme.colors.textLight }]}>Live classes</Text>
              </View>
              <View style={styles.highlightItem}>
                <View style={[styles.highlightIconBg, { backgroundColor: isDarkMode ? theme.colors.border : '#F5F8FF' }]}><InfinityIcon color={theme.colors.primary} size={20} /></View>
                <Text style={[styles.highlightVal, { color: theme.colors.textMain }]}>Lifetime</Text>
                <Text style={[styles.highlightLbl, { color: theme.colors.textLight }]}>Course access</Text>
              </View>
            </View>

            {/* --- TABS --- */}
            <View style={[styles.tabsContainer, { borderBottomColor: theme.colors.border }]}>
              <TouchableOpacity style={[styles.tabBtn, activeTab === 'Overview' && [styles.tabBtnActive, { borderBottomColor: theme.colors.primary }]]} onPress={() => setActiveTab('Overview')}>
                <Text style={[styles.tabText, { color: theme.colors.textMuted }, activeTab === 'Overview' && [styles.tabTextActive, { color: theme.colors.primary }]]}>Overview</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, activeTab === 'Curriculum' && [styles.tabBtnActive, { borderBottomColor: theme.colors.primary }]]} onPress={() => setActiveTab('Curriculum')}>
                <Text style={[styles.tabText, { color: theme.colors.textMuted }, activeTab === 'Curriculum' && [styles.tabTextActive, { color: theme.colors.primary }]]}>Curriculum</Text>
              </TouchableOpacity>
            </View>

            {/* ========================================== */}
            {/* TAB 1: OVERVIEW */}
            {/* ========================================== */}
            {activeTab === 'Overview' && (
              <View style={styles.paddingContainer}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textMain }]}>What you get</Text>
                {WHAT_YOU_GET.map((item, idx) => (
                  <View key={idx} style={styles.benefitRow}>
                    <View style={[styles.benefitIconBox, { backgroundColor: isDarkMode ? theme.colors.border : '#EEF2FF' }]}>
                      <item.icon color={theme.colors.primary} size={20} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.benefitTitle, { color: theme.colors.textMain }]}>{item.title}</Text>
                      <Text style={[styles.benefitSub, { color: theme.colors.textMuted }]}>{item.sub}</Text>
                    </View>
                  </View>
                ))}

                {whatYouWillLearn.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: 24, color: theme.colors.textMain }]}>What you will learn</Text>
                    {whatYouWillLearn.map((text: string, idx: number) => (
                      <View key={idx} style={styles.learnRow}>
                        <CheckCircle2 color={theme.colors.primary} size={18} style={{ marginTop: 2 }} />
                        <Text style={[styles.learnText, { color: theme.colors.textMuted }]}>{text}</Text>
                      </View>
                    ))}
                  </>
                )}

                <Text style={[styles.sectionTitle, { marginTop: 24, color: theme.colors.textMain }]}>Who this course is for</Text>
                <Text style={[styles.paragraphText, { color: theme.colors.textMuted }]}>{whoIsThisFor}</Text>

                {faqs.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: 24, color: theme.colors.textMain }]}>FAQs</Text>
                    <View style={styles.faqContainer}>
                      {faqs.map((faq: any, idx: number) => {
                        const faqId = faq._id || idx.toString();
                        const isOpen = expandedFaqs.has(faqId);
                        return (
                          <View key={faqId} style={[styles.faqItem, { borderBottomColor: theme.colors.border }]}>
                            <TouchableOpacity style={styles.faqHeader} onPress={() => toggleFaq(faqId)}>
                              <Text style={[styles.faqQuestion, { color: theme.colors.textMain }, isOpen && { color: theme.colors.primary }]}>{faq.question}</Text>
                              {isOpen ? <ChevronUp color={theme.colors.textLight} size={20} /> : <ChevronDown color={theme.colors.textLight} size={20} />}
                            </TouchableOpacity>
                            {isOpen && <Text style={[styles.faqAnswer, { color: theme.colors.textMuted }]}>{faq.answer}</Text>}
                          </View>
                        );
                      })}
                    </View>
                  </>
                )}

                <View style={styles.feedbackHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textMain }]}>Student Feedback</Text>
                  <Text style={[styles.reviewCountText, { color: theme.colors.textMuted }]}>
                    {totalRatingCount} {totalRatingCount === 1 ? 'rating' : 'ratings'}
                  </Text>
                </View>

                <TouchableOpacity 
                  style={[styles.writeReviewBtn, { borderColor: theme.colors.primary }]} 
                  onPress={handleWriteReviewClick}
                >
                  <Text style={[styles.writeReviewText, { color: theme.colors.primary }]}>✎ Write a review</Text>
                </TouchableOpacity>

                <View style={[styles.ratingOverview, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={styles.ratingLeft}>
                    <Text style={[styles.ratingHuge, { color: theme.colors.textMain }]}>{Number(meta.rating).toFixed(1)}</Text>
                    <View style={{ flexDirection: 'row', marginBottom: 4 }}>{renderStars(Math.round(meta.rating))}</View>
                    <Text style={[styles.ratingSub, { color: theme.colors.textMuted }]}>COURSE RATING</Text>
                  </View>
                  <View style={styles.ratingBars}>
                    {[5, 4, 3, 2, 1].map((star, idx) => {
                      const count = reviews.filter((r: any) => Math.round(r.rating) === star).length;
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : (star === 5 ? 70 : 5);
                      return (
                        <View key={idx} style={styles.ratingBarRow}>
                          <Text style={[styles.ratingBarStar, { color: theme.colors.textMuted }]}>{star}</Text>
                          <View style={[styles.ratingBarBg, { backgroundColor: theme.colors.border }]}>
                            <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Reviews: show all real reviews */}
                {reviews.length > 0 ? reviews.map((rev: any, idx: number) => (
                  <View key={rev._id || idx.toString()} style={[styles.reviewItem, { borderBottomColor: theme.colors.border }]}>
                    <View style={styles.reviewHeader}>
                      <Image source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.student_id?.name || 'S')}&background=6366F6&color=fff&size=64` }} style={styles.reviewAvatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.reviewName, { color: theme.colors.textMain }]}>{rev.student_id?.name || 'Student'}</Text>
                        <View style={{ flexDirection: 'row' }}>{renderStars(rev.rating)}</View>
                      </View>
                      <Text style={[styles.reviewDate, { color: theme.colors.textLight }]}>
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                      </Text>
                    </View>
                    <Text style={[styles.reviewText, { color: theme.colors.textMuted }]}>{rev.comment}</Text>
                  </View>
                )) : (
                  <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                    <Star color={theme.colors.border} fill={theme.colors.border} size={32} />
                    <Text style={{ color: theme.colors.textLight, fontSize: 14, marginTop: 12 }}>No reviews yet. Be the first!</Text>
                  </View>
                )}
              </View>
            )}

            {/* ========================================== */}
            {/* TAB 2: CURRICULUM */}
            {/* ========================================== */}
            {activeTab === 'Curriculum' && (
              <View style={styles.curriculumTab}>
                <View style={[styles.quickStatsRow, { backgroundColor: isDarkMode ? theme.colors.surface : '#F8FAFC' }]}>
                  <Text style={[styles.quickStatText, { color: theme.colors.textMain }]}>📹 {chapters.filter((c: any) => c.youtube_video).length} Recorded Videos</Text>
                  <Text style={[styles.quickStatText, { color: theme.colors.textMain }]}>📄 Notes</Text>
                  <Text style={[styles.quickStatText, { color: '#EF4444' }]}>🔴 {chapters.filter((c: any) => c.practice_set).length} Live Classes</Text>
                  <Text style={[styles.quickStatText, { color: theme.colors.textMain }]}>• {meta.duration}h total</Text>
                </View>

                <View style={styles.modulesContainer}>
                  {chapters.map((mod: any, index: number) => {
                    const modId = mod._id || index.toString();
                    const isOpen = expandedModules.has(modId);
                    
                    const lessons = [];
                    if (mod.youtube_video) lessons.push({ id: 'v', type: 'video', title: 'Video Lecture', duration: 'YOUTUBE' });
                    if (mod.study_material) lessons.push({ id: 'n', type: 'note', title: 'Study Material', meta: 'PDF / DOC' });
                    if (mod.practice_set) lessons.push({ id: 'p', type: 'live', title: 'Practice Set', meta: 'QUESTIONS' });
                    
                    const subtitle = `${lessons.length} Item(s)`;

                    return (
                      <View key={modId} style={[styles.moduleCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <TouchableOpacity style={styles.moduleHeader} onPress={() => toggleModule(modId)}>
                          <View style={[styles.moduleNumBadge, { backgroundColor: isDarkMode ? theme.colors.border : '#F1F5F9' }]}>
                            <Text style={[styles.moduleNumText, { color: theme.colors.textMain }]}>{(index + 1).toString().padStart(2, '0')}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.moduleTitle, { color: theme.colors.textMain }]}>{mod.chapter_name}</Text>
                            <Text style={[styles.moduleSubtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
                          </View>
                          {isOpen ? <ChevronUp color={theme.colors.textLight} size={20} /> : <ChevronDown color={theme.colors.textLight} size={20} />}
                        </TouchableOpacity>

                        {isOpen && lessons.length > 0 && (
                          <View style={[styles.lessonsList, { borderTopColor: theme.colors.border }]}>
                            {lessons.map((lesson: any, i: number) => (
                              <View key={lesson.id + i} style={styles.lessonItem}>
                                {lesson.type === 'video' && <PlayCircle color="#94A3B8" size={20} />}
                                {lesson.type === 'note' && <FileText color="#94A3B8" size={20} />}
                                {lesson.type === 'live' && <BookIcon color="#EF4444" size={20} />}

                                <View style={styles.lessonInfo}>
                                  <Text style={[styles.lessonTitle, { color: theme.colors.textMain }]}>{lesson.title}</Text>
                                  {lesson.type === 'video' && <Text style={[styles.lessonDuration, { color: theme.colors.textLight }]}>{lesson.duration}</Text>}
                                  {lesson.type === 'note' && <Text style={[styles.noteMetaText, { color: theme.colors.textLight }]}>{lesson.meta}</Text>}
                                  {lesson.type === 'live' && <Text style={[styles.liveMetaText, { color: '#EF4444' }]}>{lesson.meta}</Text>}
                                </View>

                                {isPurchased ? (
                                  <CheckCircle2 color="#10B981" size={18} />
                                ) : (
                                  <>
                                    {index === 0 && i === 0 && <Text style={styles.previewTag}>Free Preview</Text>}
                                    {(index !== 0 || i !== 0) && <Lock color={theme.colors.textLight} size={18} />}
                                  </>
                                )}
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

          </View>
        </ScrollView>

        {/* --- FIXED BOTTOM FOOTER --- */}
        <View style={[styles.footerContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          <View style={styles.priceWrap}>
            <Text style={[styles.footerPriceLabel, { color: theme.colors.textLight }]}>TOTAL PRICE (inc. GST)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.footerCurrentPrice, { color: theme.colors.primary }]}>{formatCurrency(pricing.totalAmount)}</Text>
              {meta.oldPrice > meta.price && (
                <Text style={[styles.footerOldPrice, { color: theme.colors.textLight }]}>{formatCurrency(meta.oldPrice)}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={[styles.footerEnrollBtn, { backgroundColor: theme.colors.primary }]} onPress={handleEnrollClick}>
            <Text style={styles.footerEnrollText}>{isPurchased ? 'Go to Course' : 'Enroll Now'}</Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================= */}
        {/* PAYMENT MODAL (COINS + RAZORPAY) */}
        {/* ========================================================= */}
        <Modal
          visible={paymentModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setPaymentModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.paymentModalCard, { backgroundColor: theme.colors.surface }]}>
              
              <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.modalTitleText, { color: theme.colors.textMain }]}>Complete Purchase</Text>
                <TouchableOpacity onPress={() => setPaymentModalVisible(false)} style={styles.closeModalBtn}>
                  <X color={theme.colors.textMain} size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={[styles.miniCourseSummary, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: theme.colors.border }]}>
                  <Text style={[styles.miniCourseTitle, { color: theme.colors.textMain }]}>{meta.title}</Text>
                  <Text style={[styles.miniCourseSubtitle, { color: theme.colors.textMuted }]}>Lifetime Access • {chapters.length} Modules</Text>
                </View>

                <View style={styles.coinUsageBox}>
                  <Text style={[styles.coinBoxTitle, { color: theme.colors.textMain }]}>Use Wallet Coins</Text>
                  <TextInput 
                    style={[styles.coinInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textMain }]}
                    keyboardType="number-pad"
                    value={coinsToUse.toString()}
                    onChangeText={(text) => {
                      let val = parseInt(text.replace(/\D/g, ''), 10) || 0;
                      if (val > walletBalance) val = walletBalance; 
                      setCoinsToUse(val.toString());
                    }}
                  />
                  <Text style={[styles.coinBoxSub, { color: theme.colors.textMuted }]}>Available Balance: {walletBalance} coins (100 coins = ₹10)</Text>
                  {Number(coinsToUse) > 0 && Number(coinsToUse) < MIN_COINS && (
                    <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>Minimum {MIN_COINS} coins required to apply discount.</Text>
                  )}
                </View>

                {/* Coupon Box */}
                <CouponInput
                  couponCode={couponCode}
                  onChangeCode={setCouponCode}
                  onApply={handleApplyCoupon}
                  onRemove={handleRemoveCoupon}
                  appliedCoupon={appliedCoupon}
                  loading={couponLoading}
                  containerStyle={{ marginBottom: 12 }}
                />

                <View style={[styles.priceBreakdownBox, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: theme.colors.border }]}>
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceRowLabel, { color: theme.colors.textMuted }]}>Base Price</Text>
                    <Text style={[styles.priceRowValue, { color: theme.colors.textMain }]}>{formatCurrency(pricing.basePrice)}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceRowLabel, { color: theme.colors.textMuted }]}>GST (18%)</Text>
                    <Text style={[styles.priceRowValue, { color: theme.colors.textMain }]}>{formatCurrency(pricing.gstAmount)}</Text>
                  </View>
                  {coinDiscountPreview > 0 && Number(coinsToUse) >= MIN_COINS && (
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceRowLabel, { color: '#10B981' }]}>Coin Discount</Text>
                      <Text style={[styles.priceRowValue, { color: '#10B981' }]}>- {formatCurrency(coinDiscountPreview)}</Text>
                    </View>
                  )}
                  {couponDiscountPreview > 0 && appliedCoupon && (
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceRowLabel, { color: '#10B981' }]}>Coupon ({appliedCoupon.code})</Text>
                      <Text style={[styles.priceRowValue, { color: '#10B981' }]}>- {formatCurrency(couponDiscountPreview)}</Text>
                    </View>
                  )}
                  <View style={[styles.priceDivider, { backgroundColor: theme.colors.border }]} />
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceRowLabelBold, { color: theme.colors.textMain }]}>Final Payable</Text>
                    <Text style={[styles.priceRowValueBold, { color: theme.colors.primary }]}>{formatCurrency(finalPayablePreview)}</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooterActions}>
                <TouchableOpacity 
                  style={[styles.payNowBtn, paymentLoading && { opacity: 0.7 }]} 
                  activeOpacity={0.8}
                  onPress={executePurchase}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.payNowText}>Proceed to Pay</Text>}
                </TouchableOpacity>
                <Text style={styles.secureText}>🔒 Guaranteed Safe Checkout</Text>
              </View>

            </View>
          </View>
        </Modal>

        {/* ========================================================= */}
        {/* CUSTOM ALERT MODAL */}
        {/* ========================================================= */}
        <Modal
          visible={customAlert.visible}
          transparent={true}
          animationType="fade"
          onRequestClose={hideAlert}
        >
          <View style={styles.customAlertOverlay}>
            <View style={styles.customAlertBox}>
              
              <View style={[styles.customAlertIconContainer, 
                customAlert.type === 'success' && { backgroundColor: '#ECFDF5' },
                customAlert.type === 'error' && { backgroundColor: '#FEF2F2' },
                customAlert.type === 'warning' && { backgroundColor: '#FFFBEB' },
                customAlert.type === 'info' && { backgroundColor: '#EEF2FF' },
              ]}>
                {customAlert.type === 'success' && <CheckCircle2 color="#10B981" size={32} />}
                {customAlert.type === 'error' && <XCircle color="#EF4444" size={32} />}
                {customAlert.type === 'warning' && <AlertTriangle color="#F59E0B" size={32} />}
                {customAlert.type === 'info' && <Info color="#6366F6" size={32} />}
              </View>

              <Text style={styles.customAlertTitle}>{customAlert.title}</Text>
              <Text style={styles.customAlertMessage}>{customAlert.message}</Text>

              <View style={styles.customAlertActionRow}>
                {customAlert.onCancel && (
                  <TouchableOpacity style={styles.customAlertCancelBtn} onPress={customAlert.onCancel} activeOpacity={0.8}>
                    <Text style={styles.customAlertCancelText}>{customAlert.cancelText || 'Cancel'}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={[styles.customAlertConfirmBtn, 
                    customAlert.type === 'error' && { backgroundColor: '#EF4444' },
                    customAlert.type === 'warning' && { backgroundColor: '#F59E0B' },
                    customAlert.type === 'success' && { backgroundColor: '#10B981' }
                  ]} 
                  onPress={customAlert.onConfirm || hideAlert} 
                  activeOpacity={0.8}
                >
                  <Text style={styles.customAlertConfirmText}>{customAlert.confirmText || 'OK'}</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </Modal>

        {/* REVIEW MODAL */}
        <ReviewModal
          visible={reviewModalVisible}
          onClose={() => setReviewModalVisible(false)}
          itemId={id}
          itemType="course"
          itemName={courseDetails?.title || 'Course'}
          token={user?.token || ''}
          onSuccess={fetchReviews}
        />

      </ScreenContainer>
    </>
  );
};

// --------------------------------------------------------
// EXACT STYLES
// --------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: staticTheme.colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: staticTheme.colors.surface
  },
  headerIcon: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: staticTheme.colors.textMain, paddingHorizontal: 10 },
  scrollContent: { paddingBottom: 100 },

  heroImage: { width: '100%', height: 220, resizeMode: 'cover' },
  paddingContainer: { padding: 20 },

  tagsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  leftTags: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tagPrimary: { color: staticTheme.colors.primary, fontSize: 12, fontWeight: '700' },
  languageWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagMuted: { color: staticTheme.colors.textMuted, fontSize: 12, fontWeight: '500' },
  syllabusBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: staticTheme.colors.border, backgroundColor: staticTheme.colors.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  syllabusText: { color: staticTheme.colors.primary, fontSize: 10, fontWeight: '600' },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  mainTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: staticTheme.colors.textMain, lineHeight: 28 },
  titleIcons: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },

  description: { fontSize: 13, color: staticTheme.colors.textMuted, lineHeight: 20, marginBottom: 16 },

  statsBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: staticTheme.colors.success, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  ratingText: { color: staticTheme.colors.surface, fontSize: 12, fontWeight: '700' },
  statTextMuted: { color: staticTheme.colors.textMuted, fontSize: 12, fontWeight: '500' },

  sectionTitleSmall: { fontSize: 14, fontWeight: '700', color: staticTheme.colors.textMain, marginBottom: 12 },
  highlightsCard: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: staticTheme.colors.background, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: staticTheme.colors.border },
  highlightItem: { alignItems: 'center' },
  highlightIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: staticTheme.colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  highlightVal: { fontSize: 14, fontWeight: '700', color: staticTheme.colors.textMain },
  highlightLbl: { fontSize: 10, color: staticTheme.colors.textMuted, marginTop: 2 },

  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: staticTheme.colors.border, marginHorizontal: 20 },
  tabBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: staticTheme.colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: staticTheme.colors.textLight },
  tabTextActive: { color: staticTheme.colors.primary },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: staticTheme.colors.textMain, marginBottom: 16 },

  benefitRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: staticTheme.colors.background, padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: staticTheme.colors.border },
  benefitIconBox: { width: 44, height: 44, borderRadius: 8, backgroundColor: staticTheme.colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  benefitTitle: { fontSize: 14, fontWeight: '700', color: staticTheme.colors.textMain, marginBottom: 2 },
  benefitSub: { fontSize: 11, color: staticTheme.colors.textMuted },

  learnRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  learnText: { flex: 1, fontSize: 13, color: staticTheme.colors.textMuted, lineHeight: 20 },

  paragraphText: { fontSize: 13, color: staticTheme.colors.textMuted, lineHeight: 22 },

  faqContainer: { borderTopWidth: 1, borderTopColor: staticTheme.colors.border },
  faqItem: { borderBottomWidth: 1, borderBottomColor: staticTheme.colors.border, paddingVertical: 16 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '600', color: staticTheme.colors.textMain, paddingRight: 16 },
  faqAnswer: { fontSize: 13, color: staticTheme.colors.textMuted, marginTop: 12, lineHeight: 20 },

  feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 16 },
  reviewCountText: { fontSize: 12, color: staticTheme.colors.textMuted, fontWeight: '500' },

  ratingOverview: { flexDirection: 'row', backgroundColor: staticTheme.colors.background, padding: 20, borderRadius: 16, marginBottom: 24 },
  ratingLeft: { flex: 0.8, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: staticTheme.colors.border, paddingRight: 20 },
  ratingHuge: { fontSize: 40, fontWeight: '800', color: staticTheme.colors.primary, marginBottom: 4 },
  ratingSub: { fontSize: 9, fontWeight: '700', color: staticTheme.colors.textLight, letterSpacing: 0.5 },
  ratingBars: { flex: 1, paddingLeft: 20, justifyContent: 'center', gap: 6 },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingBarStar: { fontSize: 10, fontWeight: '700', color: staticTheme.colors.textMuted, width: 10 },
  ratingBarBg: { flex: 1, height: 4, backgroundColor: staticTheme.colors.border, borderRadius: 2 },
  ratingBarFill: { height: '100%', backgroundColor: staticTheme.colors.primary, borderRadius: 2 },

  reviewItem: { marginBottom: 24 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  reviewName: { fontSize: 14, fontWeight: '700', color: staticTheme.colors.textMain, marginBottom: 2 },
  reviewDate: { fontSize: 11, color: staticTheme.colors.textLight },
  reviewText: { fontSize: 13, color: staticTheme.colors.textMuted, lineHeight: 20 },

  writeReviewBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 20,
    borderStyle: 'dashed',
  },
  writeReviewText: {
    fontSize: 14,
    fontWeight: '700',
  },

  curriculumTab: { backgroundColor: staticTheme.colors.background, paddingBottom: 40 },
  quickStatsRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8, paddingVertical: 16, backgroundColor: staticTheme.colors.background, paddingHorizontal: 20 },
  quickStatText: { fontSize: 9, color: staticTheme.colors.textMuted, fontWeight: '500' },

  modulesContainer: { paddingHorizontal: 20, paddingTop: 16 },
  moduleCard: { backgroundColor: staticTheme.colors.surface, borderWidth: 1, borderColor: staticTheme.colors.border, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  moduleHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  moduleNumBadge: { backgroundColor: staticTheme.colors.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginRight: 12 },
  moduleNumText: { color: staticTheme.colors.primary, fontSize: 13, fontWeight: '700' },
  moduleTitle: { fontSize: 14, fontWeight: '700', color: staticTheme.colors.textMain, marginBottom: 2 },
  moduleSubtitle: { fontSize: 11, color: staticTheme.colors.textMuted },

  lessonsList: { borderTopWidth: 1, borderTopColor: staticTheme.colors.border },
  lessonItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: staticTheme.colors.background },
  lessonInfo: { flex: 1, marginLeft: 12 },
  lessonTitle: { fontSize: 13, fontWeight: '600', color: staticTheme.colors.textMain, marginBottom: 2 },
  lessonDuration: { fontSize: 11, color: staticTheme.colors.textLight, textTransform: 'uppercase' },
  noteMetaText: { fontSize: 10, color: staticTheme.colors.secondary, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
  liveMetaText: { fontSize: 10, color: staticTheme.colors.danger, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
  previewTag: { fontSize: 10, color: staticTheme.colors.primary, backgroundColor: staticTheme.colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontWeight: '600' },

  footerContainer: {
    position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: staticTheme.colors.surface,
    paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: staticTheme.colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 10,
  },
  priceWrap: { flexDirection: 'column' },
  footerPriceLabel: { fontSize: 10, color: staticTheme.colors.textMuted, fontWeight: '600', marginBottom: 2 },
  footerCurrentPrice: { fontSize: 22, fontWeight: '800', color: staticTheme.colors.textMain },
  footerOldPrice: { fontSize: 14, color: staticTheme.colors.textLight, textDecorationLine: 'line-through' },
  footerEnrollBtn: { backgroundColor: staticTheme.colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8 },
  footerEnrollText: { color: staticTheme.colors.surface, fontSize: 15, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  paymentModalCard: { backgroundColor: staticTheme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: staticTheme.colors.border },
  modalTitleText: { fontSize: 18, fontWeight: '800', color: staticTheme.colors.textMain },
  closeModalBtn: { padding: 4, backgroundColor: staticTheme.colors.background, borderRadius: 20 },
  modalBody: { padding: 20 },

  miniCourseSummary: { backgroundColor: staticTheme.colors.background, padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: staticTheme.colors.border },
  miniCourseTitle: { fontSize: 14, fontWeight: '700', color: staticTheme.colors.textMain, marginBottom: 4 },
  miniCourseSubtitle: { fontSize: 12, color: staticTheme.colors.textMuted },

  coinUsageBox: { marginBottom: 24 },
  coinBoxTitle: { fontSize: 13, fontWeight: '700', color: staticTheme.colors.textMain, marginBottom: 8 },
  coinInput: { borderWidth: 1.5, borderColor: staticTheme.colors.border, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, fontWeight: '600', color: staticTheme.colors.primary, backgroundColor: staticTheme.colors.background },
  coinBoxSub: { fontSize: 11, color: staticTheme.colors.textMuted, marginTop: 8 },

  priceBreakdownBox: { backgroundColor: staticTheme.colors.surface, borderWidth: 1, borderColor: staticTheme.colors.border, borderRadius: 12, padding: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  priceRowLabel: { fontSize: 13, color: staticTheme.colors.textMuted, fontWeight: '500' },
  priceRowValue: { fontSize: 13, color: staticTheme.colors.textMain, fontWeight: '600' },
  priceDivider: { height: 1, backgroundColor: staticTheme.colors.border, marginVertical: 12 },
  priceRowLabelBold: { fontSize: 15, color: staticTheme.colors.textMain, fontWeight: '800' },
  priceRowValueBold: { fontSize: 16, color: staticTheme.colors.primary, fontWeight: '800' },

  modalFooterActions: { padding: 20, borderTopWidth: 1, borderTopColor: staticTheme.colors.border, backgroundColor: staticTheme.colors.surface },
  payNowBtn: { backgroundColor: staticTheme.colors.success, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  payNowText: { color: staticTheme.colors.surface, fontSize: 16, fontWeight: '800' },
  secureText: { textAlign: 'center', fontSize: 11, color: staticTheme.colors.textLight, fontWeight: '600' },

  // --- CUSTOM ALERT MODAL ---
  customAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customAlertBox: {
    backgroundColor: staticTheme.colors.surface,
    width: '85%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  customAlertIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  customAlertTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: staticTheme.colors.textMain,
    textAlign: 'center',
    marginBottom: 8,
  },
  customAlertMessage: {
    fontSize: 14,
    color: staticTheme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  customAlertActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  customAlertCancelBtn: {
    flex: 1,
    backgroundColor: staticTheme.colors.border,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAlertCancelText: {
    color: staticTheme.colors.textMain,
    fontSize: 14,
    fontWeight: '700',
  },
  customAlertConfirmBtn: {
    flex: 1,
    backgroundColor: staticTheme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAlertConfirmText: {
    color: staticTheme.colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
});
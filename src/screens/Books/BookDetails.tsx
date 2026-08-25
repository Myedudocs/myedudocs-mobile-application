import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Share,
  Modal
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ChevronLeft, Share2, Heart, Globe, Star, FileText, Book,
  RotateCw, BookOpen, Copy, MapPin, ShoppingCart, CheckCircle2,
  XCircle, AlertTriangle, Info, Zap, Target
} from 'lucide-react-native';
import RatingBadge from '../../components/RatingBadge';
import DetailsSkeleton from '../../components/skeletons/DetailsSkeleton';
import ReviewModal from '../../components/ReviewModal';

import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { ENDPOINTS, apiClient, BASE_URL } from '../../service/api.service';
import { useAuth } from '../../context/AuthContext';
import { APP_CONFIG } from '../../config';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { CouponInput, AppliedCouponData } from '../../components/common/CouponInput';
import { getImageUrl, DEFAULT_BOOK_PLACEHOLDER } from '../../utils/image.utils';

// Native Razorpay (Ensure `react-native-razorpay` is installed)
import RazorpayCheckout from 'react-native-razorpay';

// --------------------------------------------------------
// 1. FALLBACK DATA
// --------------------------------------------------------
const FALLBACK_BOOK = {
  title: 'General Studies - Handbook of social matters',
  author: 'MyEdudocs Editorial Team',
  category: { name: 'UPSC' },
  language: 'English',
  description: "Master the entire syllabus from Prelims to Interview with India's top educators. Comprehensive coverage of GS, CSAT, and Current Affairs.",
  coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80',
  isPopular: true,
  digitalPrice: 225,
  digitalDiscountPercentage: 45,
  physicalPrice: 800,
  physicalDiscountPercentage: 37,
};

const WHATS_INSIDE = [
  { icon: Zap, title: 'Latest Content', desc: 'Updated 2024 content with latest amendments.' },
  { icon: BookOpen, title: 'Previous Year Qs', desc: 'Includes 10 Years PYQs with detailed solutions.' },
  { icon: Target, title: 'Practice MCQs', desc: 'Chapter-wise MCQ for thorough practice.' },
  { icon: MapPin, title: 'Mind Maps', desc: 'Quick revision mind maps included at the end.' },
];

const FALLBACK_REVIEWS: any[] = [];

const COIN_VALUE = 0.10;
const MIN_COINS = 100;

// --- CUSTOM ALERT TYPE ---
type AlertType = 'success' | 'error' | 'warning' | 'info';
interface CustomAlertConfig {
  visible: boolean; title: string; message: string; type: AlertType;
  onConfirm?: () => void; onCancel?: () => void; confirmText?: string; cancelText?: string;
}

// --------------------------------------------------------
// 2. HELPER FUNCTIONS
// --------------------------------------------------------
const getFinalPrice = (price?: number, discount?: number) => {
  if (!price || price <= 0) return 0;
  if (!discount || discount <= 0) return price;
  return Math.round(price - (price * discount) / 100);
};
const formatCurrency = (amount: number) => `₹${Number(amount).toLocaleString('en-IN')}`;

// --------------------------------------------------------
// 3. MAIN COMPONENT
// --------------------------------------------------------
export const BookDetails = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { id } = route.params || {};
  const { user } = useAuth(); // Global Auth
  const { theme: themeData, isDarkMode } = useTheme();

  // States
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'hardcopy'>('pdf');
  const [bookDetails, setBookDetails] = useState<any>(null);
  const [imgError, setImgError] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number>(4.0);
  const [loading, setLoading] = useState(true);

  // Combo & Wallet States
  const [comboBooks, setComboBooks] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [coinsToUse, setCoinsToUse] = useState(''); // String for TextInput

  // Coupon States
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponData | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Purchase & Wishlist States
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  // Custom Alert
  const [customAlert, setCustomAlert] = useState<CustomAlertConfig>({ visible: false, title: '', message: '', type: 'info' });
  const triggerAlert = (title: string, message: string, type: AlertType = 'info', onConfirm?: () => void, onCancel?: () => void, confirmText = 'OK', cancelText?: string) => {
    setCustomAlert({ visible: true, title, message, type, onConfirm, onCancel, confirmText, cancelText });
  };
  const hideAlert = () => setCustomAlert(prev => ({ ...prev, visible: false }));

  // --- 1. FETCH BOOK DETAILS & REVIEWS ---
  useEffect(() => {
    const fetchBookData = async () => {
      if (!id) { setLoading(false); return; }
      try {
        setLoading(true);
        const bookData = await apiClient(ENDPOINTS.GET_BOOK_DETAILS(id));

        if (bookData.book) {
          setBookDetails(bookData.book);
          const hasDigital = typeof bookData.book.digitalPrice === "number" && bookData.book.digitalPrice > 0;
          const hasPhysical = typeof bookData.book.physicalPrice === "number" && bookData.book.physicalPrice > 0;
          if (hasPhysical && !hasDigital) setSelectedFormat('hardcopy');
          else setSelectedFormat('pdf');
        }

        const revData = await apiClient(ENDPOINTS.GET_BOOK_REVIEWS(id));
        if (revData.reviews) setReviews(revData.reviews);
        if (revData.stats) setAvgRating(Number(revData.stats.averageRating) || 4.0);
      } catch (error) {
        console.error('Error fetching book details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookData();
  }, [id]);

  const fetchReviews = async () => {
    if (!id) return;
    try {
      const revData = await apiClient(ENDPOINTS.GET_BOOK_REVIEWS(id));
      if (revData.reviews) setReviews(revData.reviews);
      if (revData.stats) setAvgRating(Number(revData.stats.averageRating) || 4.0);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  // --- 2. FETCH WALLET BALANCE ---
  useEffect(() => {
    const fetchWallet = async () => {
      if (!user?.token) return;
      try {
        const res = await fetch(`${BASE_URL}/student/wallet`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        if (data.success) setWalletBalance(data.wallet.balance || 0);
      } catch (err) {
        console.error("Wallet load failed");
      }
    };
    fetchWallet();
  }, [user]);

  // --- 3. FETCH COMBO BOOKS ---
  useEffect(() => {
    if (!bookDetails?._id) return;
    const fetchComboBooks = async () => {
      try {
        const res = await fetch(`${BASE_URL}/books/approved?page=1&limit=50`);
        const data = await res.json();
        const all = data.books || [];
        const filtered = all.filter((b: any) => b._id !== bookDetails._id);
        const shuffled = filtered.sort(() => 0.5 - Math.random());
        setComboBooks(shuffled.slice(0, 2));
      } catch (err) {
        console.error("Combo fetch failed");
      }
    };
    fetchComboBooks();
  }, [bookDetails]);

  // --- 4. CHECK PURCHASE & WISHLIST STATUS ---
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user?.token || !bookDetails?._id) return;

      try {
        // Check Purchase
        const purRes = await fetch(`${BASE_URL}/students/books/payment/check-purchase/${bookDetails._id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const purData = await purRes.json();
        if (purData.success && purData.purchased) setIsPurchased(true);

        // Check Wishlist
        const wishRes = await fetch(`${BASE_URL}/wishlist/my`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const wishData = await wishRes.json();
        if (wishData?.data?.items) {
          const exists = wishData.data.items.some((i: any) => i.item_type === "book" && String(i.item_id) === String(bookDetails._id));
          setIsWishlisted(exists);
        }
      } catch (err) {
        console.error("Status check failed", err);
      }
    };
    checkUserStatus();
  }, [user, bookDetails]);


  // --- COIN & COUPON LOGIC & CALCULATIONS ---
  const handleCoinChange = (val: string) => {
    let num = Number(val.replace(/[^0-9]/g, '')); // only numbers
    if (num > walletBalance) {
      triggerAlert("Insufficient Balance", `You only have ${walletBalance} coins available.`, "warning");
      num = walletBalance;
    }
    setCoinsToUse(num ? String(num) : '');
  };

  // STRONGLY VALIDATE ON BLUR (When user finishes typing and taps outside)
  const handleCoinBlur = () => {
    const num = Number(coinsToUse);
    if (num > 0 && num < MIN_COINS) {
      triggerAlert("Invalid Amount", `A minimum of ${MIN_COINS} coins is required to apply a discount.`, "warning");
      setCoinsToUse('');
    }
  };

  // STRONGLY VALIDATE "USE MAX" BUTTON
  const handleUseMax = () => {
    if (walletBalance < MIN_COINS) {
      triggerAlert("Insufficient Balance", `You need at least ${MIN_COINS} coins in your wallet to use the discount feature.`, "warning");
      setCoinsToUse('');
      return;
    }
    setCoinsToUse(String(walletBalance));
  };

  const meta = bookDetails || FALLBACK_BOOK;
  const hasDigital = typeof meta?.digitalPrice === "number" && meta.digitalPrice > 0;
  const hasPhysical = typeof meta?.physicalPrice === "number" && meta.physicalPrice > 0;

  // Single book prices
  const baseDigitalPrice = getFinalPrice(meta.digitalPrice, meta.digitalDiscountPercentage);
  const basePhysicalPrice = getFinalPrice(meta.physicalPrice, meta.physicalDiscountPercentage);
  const currentBasePrice = selectedFormat === 'pdf' ? baseDigitalPrice : basePhysicalPrice;

  // Dynamic Coupon Recalculation
  useEffect(() => {
    if (appliedCoupon && currentBasePrice > 0) {
      let newDiscount = 0;
      if (appliedCoupon.discountType === 'percentage') {
        newDiscount = Math.round((currentBasePrice * appliedCoupon.discountValue) / 100);
      } else {
        newDiscount = Math.min(appliedCoupon.discountValue, currentBasePrice);
      }
      if (appliedCoupon.calculatedDiscount !== newDiscount) {
        setAppliedCoupon(prev => prev ? { ...prev, calculatedDiscount: newDiscount } : null);
      }
    }
  }, [currentBasePrice]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      return triggerAlert("Coupon Code Required", "Please enter a coupon code to apply.", "warning");
    }
    try {
      setCouponLoading(true);
      const email = user?.email;
      const res = await fetch(`${BASE_URL}/coupons/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), email, amount: currentBasePrice })
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

  const parsedCoins = Number(coinsToUse) || 0;
  const coinDiscount = parsedCoins >= MIN_COINS ? Math.floor(parsedCoins * COIN_VALUE) : 0;
  const couponDiscount = (selectedFormat === 'pdf' && appliedCoupon) ? appliedCoupon.calculatedDiscount : 0;
  const finalPriceAfterCoins = Math.max(currentBasePrice - coinDiscount - couponDiscount, 0);

  // Properly define the old price and discount for the footer
  const currentOldPrice = selectedFormat === 'pdf' ? meta.digitalPrice : meta.physicalPrice;
  const hasDiscount = selectedFormat === 'pdf' ? (meta.digitalDiscountPercentage > 0) : (meta.physicalDiscountPercentage > 0);

  // Bundle prices
  const bundleBasePrice = currentBasePrice + comboBooks.reduce((sum, b) => sum + getFinalPrice(b.physicalPrice, b.physicalDiscountPercentage), 0);


  // --- ACTIONS ---
  const handleShare = async () => {
    try { await Share.share({ message: `Check out "${meta.title}" on MyEduDocs!\nhttps://myedudocs.in/book-details/${id || ''}` }); } catch (error) { }
  };

  const toggleWishlist = async () => {
    if (!user?.token) {
      triggerAlert("Login Required", "Please login to use the wishlist ❤️", "info", () => { hideAlert(); navigation.navigate("Login"); }, hideAlert, "Login", "Cancel");
      return;
    }
    if (wishlistLoading) return;

    try {
      setWishlistLoading(true);
      const res = await fetch(`${BASE_URL}/wishlist/add`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({
          item_type: "book",
          item_id: meta._id,
          snapshot: {
            title: meta.title,
            author: meta.author,
            coverImage: meta.coverImage,
            price: meta.digitalPrice || meta.physicalPrice || 0
          }
        })
      });
      if (res.ok) {
        setIsWishlisted(!isWishlisted);
        triggerAlert(isWishlisted ? "Removed" : "Saved", isWishlisted ? "Removed from wishlist" : "Added to wishlist ❤️", "success");
      }
    } catch (err) {
      triggerAlert("Error", "Wishlist action failed", "error");
    } finally {
      setWishlistLoading(false);
    }
  };

  const addBookToCart = async (bookObj: any, isBundle = false) => {
    const cartKey = user?.id ? `myedudocs-cart-${user.id}` : "myedudocs-guest-cart";
    const bookType = "paperback"; // Only hardcovers go to cart
    const basePrice = bookObj.physicalPrice;
    const discount = bookObj.physicalDiscountPercentage;

    if (!basePrice || basePrice <= 0) {
      if (!isBundle) triggerAlert("Not Available", "Physical book is not available for this item.", "warning");
      return;
    }
    const finalPrice = getFinalPrice(basePrice, discount);

    try {
      const cartStr = await AsyncStorage.getItem(cartKey);
      let cart: any[] = cartStr ? JSON.parse(cartStr) : [];
      const existing = cart.find(i => i.bookId === bookObj._id && i.bookType === bookType);

      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          cartItemId: `${bookObj._id}-${bookType}-${Date.now()}`,
          book_id: bookObj._id, bookId: bookObj._id, bookType,
          title: bookObj.title, author: bookObj.author, coverImage: bookObj.coverImage || bookObj.image || bookObj.thumbnail,
          basePrice, discountPercentage: discount || 0, finalPrice, quantity: 1, addedAt: new Date().toISOString()
        });
      }
      await AsyncStorage.setItem(cartKey, JSON.stringify(cart));
      if (!isBundle) {
        triggerAlert(
          "Added to Cart 🛒",
          `"${bookObj.title}" has been added to your cart.`,
          "success",
          () => {
            hideAlert();
            navigation.navigate("Cart");
          },
          hideAlert,
          "View Cart",
          "Continue"
        );
      }
    } catch (e) {
      if (!isBundle) triggerAlert("Error", "Failed to add item to cart.", "error");
    }
  };

  const handleBundleCart = async () => {
    await addBookToCart(meta, true);
    for (let cb of comboBooks) {
      await addBookToCart(cb, true);
    }
    triggerAlert(
      "Bundle Added 🛒",
      "All items have been added to your cart.",
      "success",
      () => {
        hideAlert();
        navigation.navigate("Cart");
      },
      hideAlert,
      "View Cart",
      "Continue"
    );
  };

  const openRazorpayForEbook = async () => {
    try {
      setPurchaseLoading(true);
      if (!user?.token) {
        triggerAlert("Login Required", "Please login to purchase.", "info", () => { hideAlert(); navigation.navigate("Login"); }, hideAlert, "Login", "Cancel");
        return;
      }

      // STRICT BACKEND VERIFICATION FOR COINS
      const finalCoinsToUse = parsedCoins >= MIN_COINS ? parsedCoins : 0;

      // STEP 1: Create Order using standard resilient apiClient
      const orderData = await apiClient(`${BASE_URL}/students/books/payment/create-order`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
        data: {
          book_id: meta._id,
          purchase_type: "pdftype",
          coins_used: finalCoinsToUse,
          coupon_code: appliedCoupon?.code || ''
        },
        bypassCache: true
      });

      if (!orderData.success) throw new Error(orderData.message || "Order creation failed");

      // STEP 2: Open Razorpay Natively with securely centralized key
      const options = {
        description: meta.title,
        image: getImageUrl(meta.coverImage),
        currency: 'INR',
        key: APP_CONFIG.RAZORPAY_KEY,
        amount: orderData.amount,
        name: 'MyEduDocs',
        order_id: orderData.orderId,
        theme: { color: '#6366F6' }
      };

      RazorpayCheckout.open(options).then(async (data: any) => {
        // STEP 3: Verify Payment (Resilient with automatic Retries and Exponential Backoff)
        let retries = 3;
        let delayMs = 2000;

        const attemptVerification = async (): Promise<any> => {
          try {
            const response = await apiClient(`${BASE_URL}/students/books/payment/verify-payment`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${user.token}`
              },
              data: {
                book_id: meta._id,
                purchase_type: 'pdftype',
                coins_used: finalCoinsToUse,
                coupon_code: appliedCoupon?.code || '',
                razorpay_order_id: data.razorpay_order_id,
                razorpay_payment_id: data.razorpay_payment_id,
                razorpay_signature: data.razorpay_signature,
              },
              bypassCache: true
            });
            return response;
          } catch (error) {
            if (retries > 0) {
              retries--;
              // Wait and try again (Exponential backoff)
              await new Promise(resolve => setTimeout(resolve, delayMs));
              delayMs *= 1.5; 
              return attemptVerification();
            }
            throw error;
          }
        };

        try {
          const verifyData = await attemptVerification();
          if (verifyData && verifyData.success) {
            setIsPurchased(true);
            setAppliedCoupon(null);
            setCouponCode('');
            triggerAlert("Success! 🎉", "Purchase successful! You can now access this eBook from the Student Portal.", "success");
          } else {
            triggerAlert("Verification Error", "Verification failed. Please capture a screenshot and contact support.", "error");
          }
        } catch (verifyError: any) {
          triggerAlert(
            "Connection Timeout",
            "Payment verification timed out. Don't worry! If your money was deducted, our backend will reconcile it automatically within 10 minutes.",
            "warning"
          );
        }

      }).catch((error: any) => {
        triggerAlert("Payment Cancelled", "The payment process was cancelled or failed.", "warning");
      });

    } catch (err: any) {
      triggerAlert("Error", err.message || "Payment initialization failed", "error");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (selectedFormat === 'pdf') {
      if (isPurchased) {
        triggerAlert("Already Owned", "You already own this eBook. Access it from your Student Dashboard.", "info");
        return;
      }
      openRazorpayForEbook();
    } else {
      addBookToCart(meta);
      navigation.navigate('Cart');
    }
  };

  const handleWriteReviewClick = () => {
    if (!user?.token) {
      triggerAlert("Login Required", "Please login to write a review.", "info", () => { hideAlert(); navigation.navigate("Login"); }, hideAlert, "Login", "Cancel");
      return;
    }
    if (!isPurchased) {
      triggerAlert("Notice", "You must purchase this book to write a review.", "warning");
      return;
    }
    setReviewModalVisible(true);
  };


  // --- RENDERING ---
  if (loading) {
    return <DetailsSkeleton />;
  }

  const displayReviews = reviews.length > 0 ? reviews : FALLBACK_REVIEWS;

  const totalRatingCount = reviews.length;


  return (
    <ScreenContainer
      header={{
        title: 'Book Details',
        showBack: true,
        showThemeToggle: true,
        showCoins: false,
        showNotifications: false,
        rightElement: (
          <TouchableOpacity onPress={handleShare} activeOpacity={0.7} style={styles.headerIcon}>
            <Share2 color={themeData.colors.textMain} size={20} />
          </TouchableOpacity>
        ),
      }}
      scroll={false}
    >

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, backgroundColor: themeData.colors.background }}>

        {/* --- BOOK IMAGE CAROUSEL AREA --- */}
        <View style={[styles.imageSection, { backgroundColor: themeData.colors.background }]}>
          <View style={[styles.imageContainer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#E2E8F0' }]}>
            <Image
              source={{ uri: imgError ? DEFAULT_BOOK_PLACEHOLDER : getImageUrl(meta.coverImage || meta.image || meta.thumbnail || meta.coverPhoto) }}
              style={styles.bookImage}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
            {meta.isPopular && (
              <View style={styles.bestSellerBadge}>
                <Text style={styles.bestSellerText}>BEST SELLER</Text>
              </View>
            )}
          </View>
          <View style={styles.paginationDots}>
            <View style={[styles.dot, { backgroundColor: themeData.colors.textMain }]} />
            <View style={[styles.dot, { backgroundColor: themeData.colors.border }]} />
            <View style={[styles.dot, { backgroundColor: themeData.colors.border }]} />
          </View>
        </View>

        <View style={styles.paddingContainer}>

          {/* Tags & Actions */}
          <View style={styles.tagsRow}>
            <View style={styles.leftTags}>
              <Text style={styles.tagPrimary}>{meta.category?.name || 'General'}</Text>
              <View style={styles.languageWrap}>
                <Globe color={themeData.colors.textMuted} size={12} strokeWidth={2} />
                <Text style={[styles.tagMuted, { color: themeData.colors.textMuted }]}>{meta.language || 'English'}</Text>
              </View>
            </View>
            <View style={styles.actionIcons}>
              <TouchableOpacity activeOpacity={0.7} onPress={toggleWishlist} disabled={wishlistLoading}>
                {wishlistLoading ? <ActivityIndicator size="small" color={themeData.colors.danger} /> : <Heart color={isWishlisted ? themeData.colors.danger : themeData.colors.textMuted} fill={isWishlisted ? themeData.colors.danger : "transparent"} size={20} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Title & Author */}
          <Text style={[styles.mainTitle, { color: themeData.colors.textMain }]}>{meta.title}</Text>
          <View style={styles.authorRow}>
            <Text style={[styles.authorText, { color: themeData.colors.textMuted }]}>By <Text style={[styles.authorName, { color: themeData.colors.primary }]}>{meta.author || 'Unknown'}</Text></Text>
            <RatingBadge
              itemId={id}
              itemType="book"
              preloadedRating={meta.rating}
              preloadedCount={meta.reviews}
              size="md"
            />
          </View>

          {/* --- PURCHASED BANNER --- */}
          {isPurchased && selectedFormat === 'pdf' && (
            <View style={[styles.purchasedBanner, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.1)' : '#ECFDF5', borderColor: themeData.colors.success }]}>
              <View style={styles.purchasedTag}><CheckCircle2 color={themeData.colors.surface} size={12} /><Text style={styles.purchasedTagText}>Purchased</Text></View>
              <Text style={styles.purchasedDesc}>You own this eBook! Access it from Student Portal → My Books.</Text>
            </View>
          )}

          {/* --- FORMAT SELECTION --- */}
          <View style={styles.formatSelectionRow}>
            {hasDigital && (
              <TouchableOpacity
                style={[
                  styles.formatBox,
                  { backgroundColor: themeData.colors.surface, borderColor: themeData.colors.border },
                  selectedFormat === 'pdf' && { borderColor: themeData.colors.primary, borderWidth: 1.5, backgroundColor: isDarkMode ? 'rgba(99,102,246,0.15)' : themeData.colors.primaryLight }
                ]}
                onPress={() => setSelectedFormat('pdf')}
                activeOpacity={0.8}
              >
                <View style={styles.recommendedBadge}><Text style={styles.recommendedText}>RECOMMENDED</Text></View>
                <View style={styles.formatTopRow}>
                  <FileText color={selectedFormat === 'pdf' ? themeData.colors.primary : themeData.colors.textMuted} size={14} strokeWidth={2.5} />
                  <Text style={[styles.formatTitle, { color: selectedFormat === 'pdf' ? themeData.colors.primary : themeData.colors.textMuted }]}>Ebook</Text>
                </View>
                <View style={styles.formatPriceRow}>
                  <Text style={[styles.currentPrice, { color: themeData.colors.textMain }]}>{formatCurrency(baseDigitalPrice)}</Text>
                  {meta.digitalDiscountPercentage > 0 && <Text style={[styles.oldPrice, { color: themeData.colors.textLight }]}>{formatCurrency(meta.digitalPrice)}</Text>}
                </View>
              </TouchableOpacity>
            )}

            {hasPhysical && (
              <TouchableOpacity
                style={[
                  styles.formatBox,
                  { backgroundColor: themeData.colors.surface, borderColor: themeData.colors.border },
                  selectedFormat === 'hardcopy' && { borderColor: themeData.colors.primary, borderWidth: 1.5, backgroundColor: isDarkMode ? 'rgba(99,102,246,0.15)' : themeData.colors.primaryLight }
                ]}
                onPress={() => setSelectedFormat('hardcopy')}
                activeOpacity={0.8}
              >
                <View style={styles.formatTopRow}>
                  <Book color={selectedFormat === 'hardcopy' ? themeData.colors.primary : themeData.colors.textMuted} size={14} strokeWidth={2} />
                  <Text style={[styles.formatTitle, { color: selectedFormat === 'hardcopy' ? themeData.colors.primary : themeData.colors.textMuted }]}>Paperback</Text>
                </View>
                <View style={styles.formatPriceRow}>
                  <Text style={[styles.currentPrice, { color: themeData.colors.textMain }]}>{formatCurrency(basePhysicalPrice)}</Text>
                  {meta.physicalDiscountPercentage > 0 && <Text style={[styles.oldPrice, { color: themeData.colors.textLight }]}>{formatCurrency(meta.physicalPrice)}</Text>}
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* --- WALLET COINS & COUPON SECTION (EBOOK ONLY) --- */}
          {user?.token && selectedFormat === 'pdf' && !isPurchased && (
            <View style={[styles.coinsSection, { backgroundColor: themeData.colors.surface, borderColor: themeData.colors.border }]}>
              <View style={styles.coinsHeader}>
                <Text style={[styles.coinsTitle, { color: themeData.colors.textMain }]}>Use Coins</Text>
                <Text style={[styles.coinsBalance, { color: themeData.colors.textMuted }]}>Balance: {walletBalance} coins</Text>
              </View>
              <View style={styles.coinsInputRow}>
                <TextInput
                  style={[styles.coinsInput, { backgroundColor: themeData.colors.background, borderColor: themeData.colors.border, color: themeData.colors.textMain }]}
                  placeholder="0"
                  placeholderTextColor={themeData.colors.textLight}
                  keyboardType="number-pad"
                  value={coinsToUse}
                  onChangeText={handleCoinChange}
                  onBlur={handleCoinBlur}
                />
                <TouchableOpacity style={[styles.coinsMaxBtn, { backgroundColor: isDarkMode ? 'rgba(99,102,246,0.2)' : themeData.colors.primaryLight }]} onPress={handleUseMax}>
                  <Text style={[styles.coinsMaxText, { color: themeData.colors.primary }]}>Use Max</Text>
                </TouchableOpacity>
              </View>

              {/* Dynamic Warning Message while typing */}
              {parsedCoins > 0 && parsedCoins < MIN_COINS && (
                <Text style={[styles.coinsHintText, { color: themeData.colors.danger }]}>Minimum 100 coins required to apply discount.</Text>
              )}

              {/* Coupon Input Box */}
              <CouponInput
                couponCode={couponCode}
                onChangeCode={setCouponCode}
                onApply={handleApplyCoupon}
                onRemove={handleRemoveCoupon}
                appliedCoupon={appliedCoupon}
                loading={couponLoading}
                containerStyle={{ marginTop: 14 }}
              />

              {(parsedCoins >= MIN_COINS || (appliedCoupon && couponDiscount > 0)) && (
                <View style={[styles.coinsDiscountBox, { backgroundColor: themeData.colors.background, borderColor: themeData.colors.border, borderWidth: 1 }]}>
                  {parsedCoins >= MIN_COINS && (
                    <Text style={styles.coinsSuccessText}>✓ Coin Discount: -₹{coinDiscount}</Text>
                  )}
                  {appliedCoupon && couponDiscount > 0 && (
                    <Text style={[styles.coinsSuccessText, { marginTop: parsedCoins >= MIN_COINS ? 4 : 0 }]}>
                      ✓ Coupon Discount ({appliedCoupon.code}): -₹{couponDiscount}
                    </Text>
                  )}
                  <Text style={[styles.coinsFinalText, { marginTop: 6, color: themeData.colors.primary }]}>Final Price: ₹{finalPriceAfterCoins}</Text>
                </View>
              )}
            </View>
          )}

          {/* Detailed Overview */}
          <Text style={[styles.sectionTitle, { color: themeData.colors.textMain }]}>Detailed Overview</Text>
          <Text style={[styles.descriptionText, { color: themeData.colors.textMuted }]}>{meta.description}</Text>

          {/* What's Inside */}
          <Text style={[styles.sectionTitle, { marginTop: 24, color: themeData.colors.textMain }]}>What's Inside</Text>
          <View style={styles.whatsInsideContainer}>
            {WHATS_INSIDE.map((item, idx) => (
              <View key={idx} style={[styles.insideCard, { backgroundColor: themeData.colors.surface, borderColor: themeData.colors.border }]}>
                <View style={[styles.insideIconBox, { backgroundColor: isDarkMode ? 'rgba(99,102,246,0.15)' : themeData.colors.primaryLight }]}>
                  <item.icon color={themeData.colors.primary} size={20} strokeWidth={2} />
                </View>
                <View style={styles.insideTextWrap}>
                  <Text style={[styles.insideTitle, { color: themeData.colors.textMain }]}>{item.title}</Text>
                  <Text style={[styles.insideDesc, { color: themeData.colors.textMuted }]}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* --- FREQUENTLY BOUGHT TOGETHER --- */}
          {comboBooks.length > 0 && selectedFormat === 'hardcopy' && (
            <View style={styles.bundleSection}>
              <Text style={[styles.sectionTitle, { color: themeData.colors.textMain }]}>Frequently Bought Together</Text>
              <View style={[styles.bundleCard, { backgroundColor: themeData.colors.surface, borderColor: themeData.colors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bundleScroll}>
                  <Image source={{ uri: getImageUrl(meta.coverImage) }} style={styles.bundleImg} />
                  <Text style={[styles.bundlePlus, { color: themeData.colors.textLight }]}>+</Text>
                  {comboBooks.map((cb, idx) => (
                    <React.Fragment key={cb._id}>
                      <Image source={{ uri: getImageUrl(cb.coverImage) }} style={styles.bundleImg} />
                      {idx < comboBooks.length - 1 && <Text style={[styles.bundlePlus, { color: themeData.colors.textLight }]}>+</Text>}
                    </React.Fragment>
                  ))}
                </ScrollView>
                <View style={[styles.bundleInfoBox, { borderTopColor: themeData.colors.border }]}>
                  <Text style={[styles.bundleTitle, { color: themeData.colors.textMain }]}>Combo Set Offer</Text>
                  <Text style={[styles.bundleDesc, { color: themeData.colors.textMuted }]}>Complete your preparation with this curated bundle.</Text>
                  <View style={styles.bundlePriceRow}>
                    <Text style={[styles.bundleCurrentPrice, { color: themeData.colors.textMain }]}>{formatCurrency(bundleBasePrice - 150)}</Text>
                    <Text style={[styles.bundleOldPrice, { color: themeData.colors.textLight }]}>{formatCurrency(bundleBasePrice)}</Text>
                    <View style={[styles.bundleSaveTag, { backgroundColor: themeData.colors.background }]}><Text style={styles.bundleSaveText}>SAVE EXTRA</Text></View>
                  </View>
                  <TouchableOpacity style={styles.bundleAddBtn} onPress={handleBundleCart}>
                    <ShoppingCart color={themeData.colors.surface} size={14} style={{ marginRight: 6 }} />
                    <Text style={styles.bundleAddText}>Add Bundle to Cart</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Student Feedback */}
          <View style={styles.feedbackHeaderRow}>
            <Text style={[styles.sectionTitle, { color: themeData.colors.textMain }]}>STUDENT FEEDBACK</Text>
            {reviews.length > 0 && (
              <Text style={[styles.feedbackTotalText, { color: themeData.colors.textMuted }]}>
                {reviews.length} {reviews.length === 1 ? 'rating' : 'ratings'}
              </Text>
            )}
          </View>

          <View style={[styles.ratingOverview, { backgroundColor: themeData.colors.surface, borderColor: themeData.colors.border }]}>
            <View style={[styles.ratingLeft, { borderRightColor: themeData.colors.border }]}>
              <Text style={[styles.ratingHuge, { color: themeData.colors.primary }]}>{Number(avgRating || 0).toFixed(1)}</Text>
              <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                {Array(5).fill(0).map((_, i) => (
                  <Star
                    key={i}
                    color={i < Math.round(avgRating || 0) ? '#F59E0B' : '#E2E8F0'}
                    fill={i < Math.round(avgRating || 0) ? '#F59E0B' : 'transparent'}
                    size={12}
                    strokeWidth={2}
                  />
                ))}
              </View>
              <Text style={[styles.ratingSub, { color: themeData.colors.textLight }]}>BOOK RATING</Text>
            </View>
            <View style={styles.ratingBars}>
              {[5, 4, 3, 2, 1].map((star, idx) => {
                const count = reviews.filter((r: any) => Math.round(r.rating) === star).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <View key={idx} style={styles.ratingBarRow}>
                    <Text style={[styles.ratingBarStar, { color: themeData.colors.textMuted }]}>{star}</Text>
                    <View style={[styles.ratingBarBg, { backgroundColor: themeData.colors.border }]}>
                      <View style={[styles.ratingBarFill, { width: `${percentage}%`, backgroundColor: themeData.colors.primary }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={[styles.writeReviewBtn, { borderColor: themeData.colors.primary, backgroundColor: isDarkMode ? 'rgba(99,102,246,0.08)' : 'transparent' }]} onPress={handleWriteReviewClick}>
            <Text style={[styles.writeReviewText, { color: themeData.colors.primary }]}>✎ Write a review</Text>
          </TouchableOpacity>

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <View style={[styles.emptyReviewsBox, { backgroundColor: themeData.colors.surface, borderColor: themeData.colors.border }]}>
              <View style={[styles.emptyReviewsIcon, { backgroundColor: isDarkMode ? 'rgba(99,102,246,0.15)' : themeData.colors.primaryLight }]}>
                <Star color={themeData.colors.textLight} size={32} strokeWidth={1} />
              </View>
              <Text style={[styles.emptyReviewsTitle, { color: themeData.colors.textMain }]}>No reviews yet</Text>
              <Text style={[styles.emptyReviewsText, { color: themeData.colors.textMuted }]}>Be the first to share your thoughts about this book!</Text>
            </View>
          ) : (
            reviews.slice(0, 10).map((rev, idx) => (
              <View key={rev._id || idx.toString()} style={[styles.reviewItem, { borderBottomColor: themeData.colors.border }]}>
                <View style={styles.reviewHeader}>
                  <View style={[styles.reviewAvatar, { backgroundColor: isDarkMode ? 'rgba(99,102,246,0.2)' : themeData.colors.primaryLight }]}>
                    <Text style={[styles.avatarText, { color: themeData.colors.primary }]}>{(rev.studentName || rev.name || 'S').charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reviewName, { color: themeData.colors.textMain }]}>{rev.studentName || rev.name || 'Student'}</Text>
                    <View style={{ flexDirection: 'row', marginTop: 2 }}>
                      {Array(5).fill(0).map((_, i) => (
                        <Star
                          key={i}
                          color={i < rev.rating ? '#F59E0B' : '#E2E8F0'}
                          fill={i < rev.rating ? '#F59E0B' : 'transparent'}
                          size={10}
                          strokeWidth={2}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.reviewDate, { color: themeData.colors.textLight }]}>
                    {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently'}
                  </Text>
                </View>
                {rev.title ? <Text style={[styles.reviewTitle, { color: themeData.colors.textMain }]}>{rev.title}</Text> : null}
                <Text style={[styles.reviewText, { color: themeData.colors.textMuted }]}>{rev.review || rev.comment || rev.text}</Text>
                {(rev.verified || isPurchased) && (
                  <View style={styles.verifiedTag}>
                    <CheckCircle2 color={themeData.colors.success} size={12} />
                    <Text style={styles.verifiedText}>Verified Purchase</Text>
                  </View>
                )}
              </View>
            ))
          )}

        </View>
      </ScrollView>

      {/* --- FIXED BOTTOM FOOTER --- */}
      <View style={[styles.footerContainer, { backgroundColor: themeData.colors.surface, borderTopColor: themeData.colors.border }]}>
        <View style={styles.priceWrap}>
          <Text style={[styles.footerPriceLabel, { color: themeData.colors.textMuted }]}>TOTAL PRICE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.footerCurrentPrice, { color: themeData.colors.textMain }]}>₹{finalPriceAfterCoins}</Text>
            {hasDiscount && currentOldPrice ? (
              <Text style={[styles.footerOldPrice, { color: themeData.colors.textLight }]}>{formatCurrency(currentOldPrice)}</Text>
            ) : null}
          </View>
        </View>

        {/* Ebook Buy Logic */}
        {selectedFormat === 'pdf' && (
          <TouchableOpacity
            style={[styles.footerBuyBtn, isPurchased && { backgroundColor: '#10B981' }]}
            activeOpacity={0.8}
            onPress={handleBuyNow}
            disabled={purchaseLoading}
          >
            {purchaseLoading ? <ActivityIndicator color={themeData.colors.surface} size="small" /> : (
              <Text style={styles.footerBuyText}>{isPurchased ? 'Owned ✓' : 'Buy Now'}</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Physical Add To Cart Logic */}
        {selectedFormat === 'hardcopy' && (
          <TouchableOpacity
            style={styles.footerBuyBtn}
            activeOpacity={0.8}
            onPress={() => addBookToCart(meta)}
          >
            <ShoppingCart color={themeData.colors.surface} size={16} style={{ marginRight: 6 }} />
            <Text style={styles.footerBuyText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* CUSTOM ALERT MODAL */}
      <Modal visible={customAlert.visible} transparent={true} animationType="fade" onRequestClose={hideAlert}>
        <View style={styles.customAlertOverlay}>
          <View style={[styles.customAlertBox, { backgroundColor: themeData.colors.surface }]}>
            <View style={[styles.customAlertIconContainer,
            customAlert.type === 'success' && { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.15)' : '#ECFDF5' },
            customAlert.type === 'error' && { backgroundColor: isDarkMode ? 'rgba(239,68,68,0.15)' : '#FEF2F2' },
            customAlert.type === 'warning' && { backgroundColor: isDarkMode ? 'rgba(245,158,11,0.15)' : '#FFFBEB' },
            customAlert.type === 'info' && { backgroundColor: isDarkMode ? 'rgba(99,102,246,0.15)' : '#EEF2FF' },
            ]}>
              {customAlert.type === 'success' && <CheckCircle2 color={themeData.colors.success} size={32} />}
              {customAlert.type === 'error' && <XCircle color={themeData.colors.danger} size={32} />}
              {customAlert.type === 'warning' && <AlertTriangle color="#F59E0B" size={32} />}
              {customAlert.type === 'info' && <Info color={themeData.colors.primary} size={32} />}
            </View>
            <Text style={[styles.customAlertTitle, { color: themeData.colors.textMain }]}>{customAlert.title}</Text>
            <Text style={[styles.customAlertMessage, { color: themeData.colors.textMuted }]}>{customAlert.message}</Text>
            <View style={styles.customAlertActionRow}>
              {customAlert.onCancel && (
                <TouchableOpacity style={[styles.customAlertCancelBtn, { backgroundColor: themeData.colors.background, borderColor: themeData.colors.border, borderWidth: 1 }]} onPress={customAlert.onCancel} activeOpacity={0.8}>
                  <Text style={[styles.customAlertCancelText, { color: themeData.colors.textMain }]}>{customAlert.cancelText || 'Cancel'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.customAlertConfirmBtn,
                customAlert.type === 'error' && { backgroundColor: '#EF4444' },
                customAlert.type === 'warning' && { backgroundColor: '#F59E0B' },
                customAlert.type === 'success' && { backgroundColor: '#10B981' }
                ]}
                onPress={customAlert.onConfirm || hideAlert} activeOpacity={0.8}
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
        itemType="book"
        itemName={meta.title}
        token={user?.token || ''}
        onSuccess={fetchReviews}
      />
    </ScreenContainer>
  );
};

// --------------------------------------------------------
// EXACT STYLES (Unchanged)
// --------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: theme.colors.surface },
  headerIcon: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textMain },
  scrollContent: { paddingBottom: 100 },
  imageSection: { alignItems: 'center', paddingTop: 16, paddingBottom: 24 },
  imageContainer: { width: 180, height: 250, backgroundColor: '#1E3A5F', borderRadius: 8, position: 'relative', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  bookImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  bestSellerBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: theme.colors.secondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  bestSellerText: { color: theme.colors.surface, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  paginationDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.border },
  dotActive: { backgroundColor: theme.colors.textMain },
  paddingContainer: { paddingHorizontal: 20 },
  tagsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  leftTags: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tagPrimary: { color: theme.colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  languageWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagMuted: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '500' },
  actionIcons: { flexDirection: 'row', alignItems: 'center' },
  mainTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.textMain, lineHeight: 28, marginBottom: 8 },
  authorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  authorText: { fontSize: 12, color: theme.colors.textMuted },
  authorName: { color: theme.colors.primary },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  ratingBadgeText: { color: theme.colors.surface, fontSize: 10, fontWeight: '700' },
  reviewCountText: { fontSize: 11, color: theme.colors.textMuted },

  purchasedBanner: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.success, borderRadius: 12, padding: 14, marginBottom: 20 },
  purchasedTag: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.success, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, marginBottom: 8 },
  purchasedTagText: { color: theme.colors.surface, fontSize: 11, fontWeight: '700' },
  purchasedDesc: { color: theme.colors.success, fontSize: 13, fontWeight: '500' },

  formatSelectionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  formatBox: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 16, position: 'relative', backgroundColor: theme.colors.surface },
  formatBoxActive: { borderColor: theme.colors.primary, borderWidth: 1.5, backgroundColor: theme.colors.primaryLight },
  recommendedBadge: { position: 'absolute', top: -10, alignSelf: 'center', backgroundColor: theme.colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  recommendedText: { color: theme.colors.surface, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  formatTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  formatTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
  formatTitleActive: { color: theme.colors.primary },
  formatPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  currentPrice: { fontSize: 18, fontWeight: '800', color: theme.colors.textMain },
  currentPriceActive: { color: theme.colors.textMain },
  oldPrice: { fontSize: 11, color: theme.colors.textLight, textDecorationLine: 'line-through' },

  coinsSection: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 16, marginBottom: 24 },
  coinsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  coinsTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.textMain },
  coinsBalance: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '500' },
  coinsInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  coinsInput: { flex: 1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingHorizontal: 12, height: 40, fontSize: 14, color: theme.colors.textMain },
  coinsMaxBtn: { backgroundColor: theme.colors.primaryLight, paddingHorizontal: 16, height: 40, justifyContent: 'center', borderRadius: 8 },
  coinsMaxText: { color: theme.colors.primary, fontSize: 12, fontWeight: '700' },
  coinsHintText: { fontSize: 11, color: theme.colors.textLight, marginTop: 8 },
  coinsDiscountBox: { backgroundColor: theme.colors.background, padding: 12, borderRadius: 8, marginTop: 12 },
  coinsSuccessText: { color: theme.colors.success, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  coinsFinalText: { color: theme.colors.success, fontSize: 14, fontWeight: '800' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textMain, marginBottom: 12 },
  descriptionText: { fontSize: 13, color: theme.colors.textMuted, lineHeight: 22 },

  // What's Inside
  whatsInsideContainer: { gap: 12 },
  insideCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  insideIconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: theme.colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  insideTextWrap: { flex: 1 },
  insideTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.textMain, marginBottom: 4 },
  insideDesc: { fontSize: 11, color: theme.colors.textMuted, lineHeight: 16 },

  bundleSection: { marginTop: 32 },
  bundleCard: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 16 },
  bundleScroll: { flexDirection: 'row', alignItems: 'center', paddingBottom: 16 },
  bundleImg: { width: 70, height: 100, borderRadius: 8, backgroundColor: '#1E3A5F' },
  bundlePlus: { fontSize: 24, fontWeight: '800', color: theme.colors.textLight, marginHorizontal: 12 },
  bundleInfoBox: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 16 },
  bundleTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.textMain, marginBottom: 4 },
  bundleDesc: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 12 },
  bundlePriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  bundleCurrentPrice: { fontSize: 18, fontWeight: '800', color: theme.colors.textMain },
  bundleOldPrice: { fontSize: 12, color: theme.colors.textLight, textDecorationLine: 'line-through' },
  bundleSaveTag: { backgroundColor: theme.colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  bundleSaveText: { color: theme.colors.success, fontSize: 9, fontWeight: '800' },
  bundleAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary, paddingVertical: 12, borderRadius: 8 },
  bundleAddText: { color: theme.colors.surface, fontSize: 14, fontWeight: '700' },

  feedbackHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  feedbackTotalText: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '500' },
  ratingOverview: { flexDirection: 'row', backgroundColor: theme.colors.background, padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.colors.border },
  ratingLeft: { flex: 0.8, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: theme.colors.border, paddingRight: 20 },
  ratingHuge: { fontSize: 36, fontWeight: '800', color: theme.colors.primary, marginBottom: 4 },
  ratingSub: { fontSize: 9, fontWeight: '700', color: theme.colors.textLight, letterSpacing: 0.5 },
  ratingBars: { flex: 1, paddingLeft: 20, justifyContent: 'center', gap: 6 },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingBarStar: { fontSize: 10, fontWeight: '700', color: theme.colors.textMuted, width: 10 },
  ratingBarBg: { flex: 1, height: 4, backgroundColor: theme.colors.border, borderRadius: 2, overflow: 'hidden' },
  ratingBarFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 2 },

  writeReviewBtn: { borderWidth: 1, borderColor: theme.colors.primary, borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginBottom: 24, borderStyle: 'dashed' },
  writeReviewText: { color: theme.colors.primary, fontSize: 14, fontWeight: '700' },

  emptyReviewsBox: { alignItems: 'center', paddingVertical: 40, backgroundColor: theme.colors.background, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.colors.border },
  emptyReviewsIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyReviewsTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textMain, marginBottom: 4 },
  emptyReviewsText: { fontSize: 13, color: theme.colors.textMuted, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },

  reviewItem: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 16 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: theme.colors.primary, fontSize: 14, fontWeight: '800' },
  reviewName: { fontSize: 14, fontWeight: '700', color: theme.colors.textMain },
  reviewDate: { fontSize: 11, color: theme.colors.textLight },
  reviewTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.textMain, marginBottom: 4 },
  reviewText: { fontSize: 13, color: theme.colors.textMuted, lineHeight: 20 },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  verifiedText: { fontSize: 10, color: theme.colors.success, fontWeight: '600' },

  footerContainer: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.surface, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: theme.colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 10 },
  priceWrap: { flexDirection: 'column' },
  footerPriceLabel: { fontSize: 10, color: theme.colors.textMuted, fontWeight: '700', marginBottom: 2, textTransform: 'uppercase' },
  footerCurrentPrice: { fontSize: 22, fontWeight: '800', color: theme.colors.textMain },
  footerOldPrice: { fontSize: 14, color: theme.colors.textLight, textDecorationLine: 'line-through' },
  footerBuyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8 },
  footerBuyText: { color: theme.colors.surface, fontSize: 15, fontWeight: '700' },

  customAlertOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  customAlertBox: { backgroundColor: theme.colors.surface, width: '100%', maxWidth: 380, borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  customAlertIconContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  customAlertTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.textMain, textAlign: 'center', marginBottom: 16 },
  customAlertMessage: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 10 },
  customAlertActionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  customAlertCancelBtn: { flex: 1, backgroundColor: theme.colors.border, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  customAlertCancelText: { color: theme.colors.textMain, fontSize: 14, fontWeight: '700' },
  customAlertConfirmBtn: { flex: 1, flexDirection: 'row', backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  customAlertConfirmText: { color: theme.colors.surface, fontSize: 14, fontWeight: '700' },
});
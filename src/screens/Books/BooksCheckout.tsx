import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MapPin, CreditCard, ShieldCheck, Wallet,
  CheckCircle2, XCircle, AlertTriangle, Info, Truck,
  Plus, Edit2, Trash2, Home, Briefcase, Tag as TagIcon, Check
} from 'lucide-react-native';
import RazorpayCheckout from 'react-native-razorpay';

import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { BASE_URL } from '../../service/api.service';
import { useAuth } from '../../context/AuthContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { CouponInput, AppliedCouponData } from '../../components/common/CouponInput';

// --------------------------------------------------------
// 1. CONSTANTS & TYPES
// --------------------------------------------------------
const SHIPPING_CHARGE = 100;
const COIN_VALUE = 0.10;
const MIN_COINS_TO_USE = 100;

interface CartItem {
  cartItemId: string;
  bookId: string;
  bookType: 'pdftype' | 'paperback';
  title: string;
  author: string;
  coverImage: string;
  basePrice: number;
  discountPercentage: number;
  finalPrice: number;
  quantity: number;
  isChecked?: boolean; 
}

export interface SavedAddress {
  id: string;
  fullName: string;
  phone: string;
  house: string;
  area: string;
  landmark?: string;
  pincode: string;
  city: string;
  state: string;
  district?: string;
  country?: string;
  label: 'Home' | 'Work' | 'Other';
  isDefault?: boolean;
}

const emptyAddress: Omit<SavedAddress, 'id'> = {
  fullName: "",
  phone: "",
  house: "",
  area: "",
  landmark: "",
  pincode: "",
  city: "",
  state: "",
  district: "",
  country: "India",
  label: "Home"
};

type AlertType = 'success' | 'error' | 'warning' | 'info';
interface CustomAlertConfig {
  visible: boolean; title: string; message: string; type: AlertType;
  onConfirm?: () => void; onCancel?: () => void; confirmText?: string; cancelText?: string;
}

// --------------------------------------------------------
// 2. MAIN COMPONENT
// --------------------------------------------------------
export const BooksCheckout = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth(); // Global Auth
  const { theme: themeData, isDarkMode } = useTheme();

  // --- UI & DATA STATES ---
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [coinsToUse, setCoinsToUse] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');

  // --- COUPON STATES ---
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponData | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // --- SAVED ADDRESS STATES ---
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressLabel, setAddressLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const [addressForm, setAddressForm] = useState({
    ...emptyAddress,
    fullName: user?.name || "",
    phone: (user as any)?.phone || (user as any)?.phn || ""
  });

  // --- CUSTOM ALERT ---
  const [customAlert, setCustomAlert] = useState<CustomAlertConfig>({ visible: false, title: '', message: '', type: 'info' });
  const triggerAlert = (title: string, message: string, type: AlertType = 'info', onConfirm?: () => void, onCancel?: () => void, confirmText = 'OK', cancelText?: string) => {
    setCustomAlert({ visible: true, title, message, type, onConfirm, onCancel, confirmText, cancelText });
  };
  const hideAlert = () => setCustomAlert(prev => ({ ...prev, visible: false }));

  // --- 1. INITIALIZATION & ADDRESS LOADING ---
  const syncAddressToBackend = async (addr: SavedAddress) => {
    if (!user?.token) return;
    try {
      await fetch(`${BASE_URL}/student/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          deliveryAddress: {
            fullName: addr.fullName,
            phone: addr.phone,
            house: addr.house,
            area: addr.area,
            landmark: addr.landmark || "",
            pincode: addr.pincode,
            city: addr.city,
            district: addr.district || "",
            state: addr.state,
            country: addr.country || "India"
          }
        })
      });
    } catch (e) {
      console.error("Profile address sync error:", e);
    }
  };

  const loadSavedAddresses = async (userId: string, currentUser: any) => {
    const localKey = `myedudocs-saved-addresses-${userId}`;
    let addresses: SavedAddress[] = [];
    try {
      const stored = await AsyncStorage.getItem(localKey);
      addresses = stored ? JSON.parse(stored) : [];
    } catch {
      addresses = [];
    }

    // Auto-fetch & seed from MongoDB student profile deliveryAddress
    const profileAddr = (currentUser as any)?.deliveryAddress;
    const hasProfileAddress = profileAddr && (profileAddr.house || profileAddr.pincode || profileAddr.city || profileAddr.area);

    if (hasProfileAddress) {
      const seeded: SavedAddress = {
        id: addresses.length > 0 ? addresses[0].id : `addr-profile-${Date.now()}`,
        fullName: profileAddr.fullName || currentUser?.name || "",
        phone: profileAddr.phone || (currentUser as any)?.phone || (currentUser as any)?.phn || "",
        house: profileAddr.house || "",
        area: profileAddr.area || "",
        landmark: profileAddr.landmark || "",
        pincode: profileAddr.pincode || "",
        city: profileAddr.city || "",
        state: profileAddr.state || "",
        district: profileAddr.district || "",
        country: profileAddr.country || "India",
        label: (profileAddr.label as any) || "Home",
        isDefault: true
      };

      if (addresses.length === 0) {
        addresses = [seeded];
      } else {
        // Keep primary synced with latest backend database deliveryAddress
        addresses[0] = { ...addresses[0], ...seeded };
      }
      await AsyncStorage.setItem(localKey, JSON.stringify(addresses));
    }

    setSavedAddresses(addresses);

    if (addresses.length > 0) {
      const def = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddressId(def.id);
      setAddressForm(def);
      setAddressLabel(def.label || "Home");
      setShowNewAddressForm(false);
    } else {
      setSelectedAddressId(null);
      setAddressForm({
        ...emptyAddress,
        fullName: currentUser?.name || "",
        phone: (currentUser as any)?.phone || (currentUser as any)?.phn || ""
      });
      setShowNewAddressForm(true);
    }
  };

  useEffect(() => {
    const initCheckout = async () => {
      if (!user?.token || !user?.id) {
        triggerAlert("Login Required", "Please login to proceed to checkout.", "info", () => { hideAlert(); navigation.navigate('Login'); });
        return;
      }

      try {
        setLoading(true);

        // 1. Fetch Live Profile from Server (MongoDB) to get live saved deliveryAddress
        let liveStudent = user;
        try {
          const profileRes = await fetch(`${BASE_URL}/student/profile`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          const profileData = await profileRes.json();
          if (profileData.success && profileData.user) {
            liveStudent = { ...user, ...profileData.user };
          }
        } catch (profErr) {
          console.error("Live profile fetch error:", profErr);
        }

        // 2. Fetch Wallet Balance
        const walletRes = await fetch(`${BASE_URL}/student/wallet`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const walletData = await walletRes.json();
        if (walletData.success) setWalletBalance(walletData.wallet.balance || 0);

        // 3. Load Saved Addresses with live DB profile data
        await loadSavedAddresses(user.id, liveStudent);

        // 4. Load Cart from AsyncStorage (Only Checked Items if passed, else load all)
        const cartKey = `myedudocs-cart-${user.id}`;
        const storedCart = await AsyncStorage.getItem(cartKey);
        
        if (route.params?.cartItems) {
          setCartItems(route.params.cartItems);
        } else if (storedCart) {
          const parsed = JSON.parse(storedCart);
          const itemsToCheckout = parsed.filter((i: CartItem) => i.isChecked !== false);
          
          if (itemsToCheckout.length === 0) {
            triggerAlert("Empty Cart", "No items selected for checkout.", "warning", () => { hideAlert(); navigation.goBack(); });
            return;
          }
          setCartItems(itemsToCheckout);
        }

      } catch (err) {
        console.error("Checkout Initialization Failed", err);
        triggerAlert("Error", "Failed to initialize checkout. Please try again.", "error", () => { hideAlert(); navigation.goBack(); });
      } finally {
        setLoading(false);
      }
    };

    initCheckout();
  }, [user]);

  // --- 2. CALCULATIONS ---
  const subtotal = useMemo(() => 
    cartItems.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0), 
  [cartItems]);

  const hasPhysicalBook = useMemo(() => cartItems.some(i => i.bookType === 'paperback'), [cartItems]);
  const shippingFee = hasPhysicalBook ? SHIPPING_CHARGE : 0;
  const grossAmount = subtotal + shippingFee;
  
  const parsedCoins = Number(coinsToUse) || 0;
  const coinDiscount = parsedCoins >= MIN_COINS_TO_USE ? Math.floor(parsedCoins * COIN_VALUE) : 0;
  const couponDiscount = appliedCoupon?.calculatedDiscount || 0;
  
  const totalAmount = Math.max(grossAmount - coinDiscount - couponDiscount, 0);

  // Dynamic Coupon Recalculation
  useEffect(() => {
    if (appliedCoupon && grossAmount > 0) {
      let newDiscount = 0;
      if (appliedCoupon.discountType === 'percentage') {
        newDiscount = Math.round((grossAmount * appliedCoupon.discountValue) / 100);
      } else {
        newDiscount = Math.min(appliedCoupon.discountValue, grossAmount);
      }
      if (appliedCoupon.calculatedDiscount !== newDiscount) {
        setAppliedCoupon(prev => prev ? { ...prev, calculatedDiscount: newDiscount } : null);
      }
    }
  }, [grossAmount]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      triggerAlert("Empty Code", "Please enter a coupon code to apply.", "warning");
      return;
    }

    setCouponLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/coupons/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          email: user?.email,
          amount: grossAmount
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAppliedCoupon(data.data);
        triggerAlert("Coupon Applied 🎉", `Successfully applied "${data.data.code}"! You saved ₹${data.data.calculatedDiscount}.`, "success");
      } else {
        setAppliedCoupon(null);
        triggerAlert("Invalid Coupon", data.message || "This coupon code is not valid.", "error");
      }
    } catch (e) {
      triggerAlert("Error", "Failed to verify coupon. Please check your network and try again.", "error");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  // --- 3. COIN VALIDATION LOGIC ---
  const handleCoinChange = (val: string) => {
    let num = Number(val.replace(/[^0-9]/g, ''));
    if (num > walletBalance) {
      triggerAlert("Insufficient Balance", `You only have ${walletBalance} coins available.`, "warning");
      num = walletBalance;
    }
    setCoinsToUse(num ? String(num) : '');
  };

  const handleCoinBlur = () => {
    const num = Number(coinsToUse);
    if (num > 0 && num < MIN_COINS_TO_USE) {
      triggerAlert("Invalid Amount", `A minimum of ${MIN_COINS_TO_USE} coins is required to apply a discount.`, "warning");
      setCoinsToUse('');
    }
  };

  const handleUseMaxCoins = () => {
    if (walletBalance < MIN_COINS_TO_USE) {
      triggerAlert("Insufficient Balance", `You need at least ${MIN_COINS_TO_USE} coins to use the discount feature.`, "warning");
      setCoinsToUse('');
      return;
    }
    setCoinsToUse(String(walletBalance));
  };

  // --- 4. ADDRESS HANDLERS ---
  const handleSelectAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setAddressForm(addr);
    setAddressLabel(addr.label || 'Home');
    setShowNewAddressForm(false);
    setEditingAddressId(null);
  };

  const handleAddNewAddressClick = () => {
    setShowNewAddressForm(true);
    setSelectedAddressId(null);
    setEditingAddressId(null);
    setAddressLabel('Home');
    setAddressForm({
      ...emptyAddress,
      fullName: user?.name || "",
      phone: (user as any)?.phone || (user as any)?.phn || ""
    });
  };

  const handleEditAddress = (addr: SavedAddress) => {
    setShowNewAddressForm(true);
    setEditingAddressId(addr.id);
    setSelectedAddressId(null);
    setAddressForm(addr);
    setAddressLabel(addr.label || 'Home');
  };

  const handleDeleteAddress = (addrId: string) => {
    triggerAlert(
      "Delete Address",
      "Are you sure you want to remove this delivery address?",
      "warning",
      async () => {
        hideAlert();
        if (!user?.id) return;
        const localKey = `myedudocs-saved-addresses-${user.id}`;
        const filtered = savedAddresses.filter(a => a.id !== addrId);
        await AsyncStorage.setItem(localKey, JSON.stringify(filtered));
        setSavedAddresses(filtered);

        if (selectedAddressId === addrId) {
          if (filtered.length > 0) {
            handleSelectAddress(filtered[0]);
          } else {
            handleAddNewAddressClick();
          }
        }
      },
      hideAlert,
      "Delete",
      "Cancel"
    );
  };

  const handlePincodeLookup = async (pin: string) => {
    const val = pin.replace(/\D/g, "").slice(0, 6);
    setAddressForm(prev => ({ ...prev, pincode: val }));

    if (val.length === 6) {
      setPincodeLoading(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
        const data = await res.json();
        if (data[0]?.Status === "Success") {
          const po = data[0].PostOffice[0];
          setAddressForm(prev => ({
            ...prev,
            city: po.Block && po.Block !== "NA" ? po.Block : po.District || po.Name,
            district: po.District,
            state: po.State
          }));
        } else {
          triggerAlert("Invalid Pincode", "Could not find location for this pincode.", "warning");
        }
      } catch (e) {
        console.error("Pincode error", e);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  const handleSaveAddress = async () => {
    if (!user?.id) {
      triggerAlert("Login Required", "Please login to save address.", "info");
      return;
    }

    if (addressForm.fullName.trim().length < 3) {
      triggerAlert("Invalid Name", "Please enter receiver full name (at least 3 characters).", "warning");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(addressForm.phone.trim())) {
      triggerAlert("Invalid Phone", "Please enter a valid 10-digit mobile number starting with 6-9.", "warning");
      return;
    }
    if (addressForm.pincode.trim().length !== 6) {
      triggerAlert("Invalid Pincode", "Please enter a valid 6-digit postal code.", "warning");
      return;
    }
    if (!addressForm.house.trim()) {
      triggerAlert("Missing Field", "Please enter House / Building details.", "warning");
      return;
    }
    if (!addressForm.area.trim()) {
      triggerAlert("Missing Field", "Please enter Street / Area / Sector.", "warning");
      return;
    }
    if (!addressForm.city.trim() || !addressForm.state.trim()) {
      triggerAlert("Missing Location", "Please enter a valid pincode to auto-fill City and State.", "warning");
      return;
    }

    const localKey = `myedudocs-saved-addresses-${user.id}`;
    let updatedList = [...savedAddresses];

    const addressToSave: SavedAddress = {
      ...addressForm,
      id: editingAddressId || `addr-${Date.now()}`,
      label: addressLabel,
      isDefault: savedAddresses.length === 0
    };

    if (editingAddressId) {
      updatedList = updatedList.map(a => a.id === editingAddressId ? addressToSave : a);
    } else {
      updatedList.push(addressToSave);
    }

    await AsyncStorage.setItem(localKey, JSON.stringify(updatedList));
    setSavedAddresses(updatedList);

    const target = editingAddressId
      ? updatedList.find(a => a.id === editingAddressId)
      : updatedList[updatedList.length - 1];

    if (target) {
      setSelectedAddressId(target.id);
      setAddressForm(target);
      setShowNewAddressForm(false);
      setEditingAddressId(null);
      // Sync address directly with backend student profile in MongoDB
      syncAddressToBackend(target);
    }
    triggerAlert("Address Saved", "Delivery address saved successfully!", "success");
  };

  // --- 5. PLACE ORDER & RAZORPAY ---
  const activeSelectedAddress = useMemo(() => {
    return savedAddresses.find(a => a.id === selectedAddressId) || (savedAddresses.length > 0 ? savedAddresses[0] : null);
  }, [savedAddresses, selectedAddressId]);

  const isAddressValid = !showNewAddressForm && activeSelectedAddress !== null &&
    activeSelectedAddress.fullName.length >= 3 &&
    /^[6-9]\d{9}$/.test(activeSelectedAddress.phone) &&
    activeSelectedAddress.pincode.length === 6 &&
    activeSelectedAddress.house.length > 0 &&
    activeSelectedAddress.area.length > 0 &&
    activeSelectedAddress.city.length > 0;

  const placeOrder = async () => {
    if (hasPhysicalBook && !isAddressValid) {
      triggerAlert("Delivery Address Required", "Please select or save a valid delivery address before placing the order.", "warning");
      return;
    }

    setPaymentLoading(true);

    const deliveryPayload = activeSelectedAddress || addressForm;

    const orderPayload = {
      books: cartItems.map(i => ({ 
        book_id: i.bookId, 
        quantity: i.quantity, 
        purchase_type: i.bookType, 
        finalPrice: i.finalPrice 
      })),
      shippingCharge: shippingFee,
      appliedCoins: coinDiscount > 0 ? parsedCoins : 0,
      coinDiscount: coinDiscount,
      coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
      couponDiscount: couponDiscount,
      paymentMethod: paymentMethod,
      totalAmount: totalAmount,
      deliveryAddress: hasPhysicalBook ? {
        fullName: deliveryPayload.fullName,
        phone: deliveryPayload.phone,
        house: deliveryPayload.house,
        area: deliveryPayload.area,
        landmark: deliveryPayload.landmark || "",
        pincode: deliveryPayload.pincode,
        city: deliveryPayload.city,
        state: deliveryPayload.state,
        district: deliveryPayload.district || "",
        country: deliveryPayload.country || "India"
      } : undefined
    };

    try {
      // 1. ONLINE PAYMENT FLOW
      if (paymentMethod === 'razorpay') {
        const res = await fetch(`${BASE_URL}/books/cart/create-cart-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.token}`
          },
          body: JSON.stringify(orderPayload)
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Could not initiate payment.');

        const options = {
          description: 'MyEduDocs Cart Checkout',
          image: 'https://myedudocs.in/logo.png',
          currency: 'INR',
          key: data.key_id,
          amount: data.order.amount,
          name: 'MyEduDocs',
          order_id: data.order.id,
          prefill: {
            email: user?.email || '',
            contact: deliveryPayload.phone || (user as any)?.phone || '',
            name: deliveryPayload.fullName || user?.name || ''
          },
          theme: { color: themeData.colors.primary }
        };

        RazorpayCheckout.open(options).then(async (response: any) => {
          // Verify
          const verifyRes = await fetch(`${BASE_URL}/books/cart/verify-cart-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user?.token}`
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              ...orderPayload
            })
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            // Clear Cart & Redirect
            await AsyncStorage.removeItem(`myedudocs-cart-${user?.id}`);
            triggerAlert("Order Placed 🎉", "Your payment was successful and your order has been placed!", "success", () => {
              hideAlert();
              navigation.navigate('MyPurchasedBooks');
            });
          } else {
            throw new Error(verifyData.message || "Payment verification failed.");
          }
        }).catch((error: any) => {
          console.error("Razorpay Error:", error);
          triggerAlert("Payment Cancelled", error.description || "The payment transaction was cancelled.", "info");
        });

      } else {
        // 2. CASH ON DELIVERY (COD)
        const codRes = await fetch(`${BASE_URL}/books/cart/create-cart-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.token}`
          },
          body: JSON.stringify(orderPayload)
        });

        const codData = await codRes.json();
        if (codData.success) {
          await AsyncStorage.removeItem(`myedudocs-cart-${user?.id}`);
          triggerAlert("Order Placed 🎉", "Your COD order has been placed successfully!", "success", () => {
            hideAlert();
            navigation.navigate('MyPurchasedBooks');
          });
        } else {
          throw new Error(codData.message || "Failed to place COD order.");
        }
      }

    } catch (e: any) {
      console.error("Checkout Payment Error:", e);
      triggerAlert("Order Error", e.message || "Something went wrong while placing your order.", "error");
    } finally {
      setPaymentLoading(false);
    }
  };

  // --- RENDER ---
  if (loading) {
    return (
      <ScreenContainer header={{ title: 'Checkout', showBack: true }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={themeData.colors.primary} />
          <Text style={{ marginTop: 12, color: themeData.colors.textMuted, fontSize: 13 }}>Setting up secure checkout...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer header={{ title: 'Checkout', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }} scroll={false}>

      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: themeData.colors.background }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { backgroundColor: themeData.colors.background }]}>

          {/* SECURE BADGE */}
          <View style={styles.secureBadgeRow}>
            <ShieldCheck color={themeData.colors.success} size={16} />
            <Text style={styles.secureBadgeText}>100% Secure Transaction</Text>
          </View>

          {/* 1. DELIVERY ADDRESS (Only if physical book exists) */}
          {hasPhysicalBook && (
            <View style={[styles.sectionCard, { backgroundColor: themeData.colors.surface, borderColor: themeData.colors.border }]}>
              
              {/* Header */}
              <View style={styles.sectionHeaderBetween}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <MapPin color={themeData.colors.textMain} size={20} />
                  <Text style={[styles.sectionTitle, { color: themeData.colors.textMain }]}>1. Delivery Address</Text>
                </View>
                {!showNewAddressForm && (
                  <TouchableOpacity
                    style={[styles.addAddressHeaderBtn, { borderColor: themeData.colors.primary, backgroundColor: isDarkMode ? 'rgba(99,102,246,0.1)' : themeData.colors.primaryLight }]}
                    onPress={handleAddNewAddressClick}
                    activeOpacity={0.8}
                  >
                    <Plus color={themeData.colors.primary} size={14} style={{ marginRight: 4 }} />
                    <Text style={[styles.addAddressHeaderText, { color: themeData.colors.primary }]}>Add New</Text>
                  </TouchableOpacity>
                )}
              </View>

              {showNewAddressForm ? (
                /* ADD / EDIT ADDRESS FORM */
                <View style={styles.addressFormContainer}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={[styles.formSubHeader, { color: themeData.colors.textMain }]}>
                      {editingAddressId ? "Edit Address" : "Add a New Address"}
                    </Text>
                    {savedAddresses.length > 0 && (
                      <TouchableOpacity
                        onPress={() => {
                          setShowNewAddressForm(false);
                          setEditingAddressId(null);
                          if (savedAddresses.length > 0) {
                            handleSelectAddress(savedAddresses.find(a => a.isDefault) || savedAddresses[0]);
                          }
                        }}
                      >
                        <Text style={{ color: themeData.colors.primary, fontSize: 13, fontWeight: '600' }}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: themeData.colors.textMuted }]}>Full Name</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: themeData.colors.background, borderColor: themeData.colors.border, color: themeData.colors.textMain }]}
                      placeholder="e.g. Rahul Sharma"
                      placeholderTextColor={themeData.colors.textLight}
                      value={addressForm.fullName}
                      onChangeText={t => setAddressForm({ ...addressForm, fullName: t })}
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                      <Text style={[styles.inputLabel, { color: themeData.colors.textMuted }]}>Mobile Number</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: themeData.colors.background, borderColor: themeData.colors.border, color: themeData.colors.textMain }]}
                        keyboardType="number-pad"
                        maxLength={10}
                        placeholder="10-digit mobile"
                        placeholderTextColor={themeData.colors.textLight}
                        value={addressForm.phone}
                        onChangeText={t => setAddressForm({ ...addressForm, phone: t.replace(/\D/g, "") })}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.inputLabel, { color: themeData.colors.textMuted }]}>
                        Pincode {pincodeLoading && <ActivityIndicator size="small" color={themeData.colors.primary} style={{ marginLeft: 6 }} />}
                      </Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: themeData.colors.background, borderColor: themeData.colors.border, color: themeData.colors.textMain }]}
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholder="6-digit pin"
                        placeholderTextColor={themeData.colors.textLight}
                        value={addressForm.pincode}
                        onChangeText={handlePincodeLookup}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: themeData.colors.textMuted }]}>House No. / Flat / Building Name</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: themeData.colors.background, borderColor: themeData.colors.border, color: themeData.colors.textMain }]}
                      placeholder="e.g. Flat 4B, Silver Tower"
                      placeholderTextColor={themeData.colors.textLight}
                      value={addressForm.house}
                      onChangeText={t => setAddressForm({ ...addressForm, house: t })}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: themeData.colors.textMuted }]}>Road Name / Area / Sector</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: themeData.colors.background, borderColor: themeData.colors.border, color: themeData.colors.textMain }]}
                      placeholder="e.g. MG Road, Near Metro"
                      placeholderTextColor={themeData.colors.textLight}
                      value={addressForm.area}
                      onChangeText={t => setAddressForm({ ...addressForm, area: t })}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: themeData.colors.textMuted }]}>Landmark (Optional)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: themeData.colors.background, borderColor: themeData.colors.border, color: themeData.colors.textMain }]}
                      placeholder="e.g. Near City Mall"
                      placeholderTextColor={themeData.colors.textLight}
                      value={addressForm.landmark}
                      onChangeText={t => setAddressForm({ ...addressForm, landmark: t })}
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                      <Text style={[styles.inputLabel, { color: themeData.colors.textMuted }]}>City / District</Text>
                      <TextInput
                        style={[styles.input, styles.inputDisabled, { backgroundColor: themeData.colors.background, borderColor: themeData.colors.border, color: themeData.colors.textMuted }]}
                        editable={false}
                        value={addressForm.city}
                        placeholder="Auto-filled"
                        placeholderTextColor={themeData.colors.textLight}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.inputLabel, { color: themeData.colors.textMuted }]}>State</Text>
                      <TextInput
                        style={[styles.input, styles.inputDisabled, { backgroundColor: themeData.colors.background, borderColor: themeData.colors.border, color: themeData.colors.textMuted }]}
                        editable={false}
                        value={addressForm.state}
                        placeholder="Auto-filled"
                        placeholderTextColor={themeData.colors.textLight}
                      />
                    </View>
                  </View>

                  {/* Address Type Pills */}
                  <View style={{ marginBottom: 20 }}>
                    <Text style={[styles.inputLabel, { color: themeData.colors.textMuted, marginBottom: 8 }]}>Address Type</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {(['Home', 'Work', 'Other'] as const).map(lbl => (
                        <TouchableOpacity
                          key={lbl}
                          onPress={() => setAddressLabel(lbl)}
                          style={[
                            styles.labelPill,
                            { backgroundColor: themeData.colors.background, borderColor: themeData.colors.border },
                            addressLabel === lbl && { borderColor: themeData.colors.primary, backgroundColor: isDarkMode ? 'rgba(99,102,246,0.15)' : themeData.colors.primaryLight }
                          ]}
                        >
                          <Text style={[styles.labelPillText, { color: themeData.colors.textMuted }, addressLabel === lbl && { color: themeData.colors.primary, fontWeight: '700' }]}>
                            {lbl} {lbl === 'Home' ? '(All day)' : lbl === 'Work' ? '(9am-5pm)' : ''}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {savedAddresses.length > 0 && (
                      <TouchableOpacity
                        style={[styles.cancelAddressBtn, { backgroundColor: themeData.colors.background, borderColor: themeData.colors.border }]}
                        onPress={() => {
                          setShowNewAddressForm(false);
                          setEditingAddressId(null);
                          if (savedAddresses.length > 0) {
                            handleSelectAddress(savedAddresses.find(a => a.isDefault) || savedAddresses[0]);
                          }
                        }}
                      >
                        <Text style={[styles.cancelAddressBtnText, { color: themeData.colors.textMain }]}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.saveAddressBtn, { backgroundColor: themeData.colors.primary, flex: 1 }]}
                      onPress={handleSaveAddress}
                    >
                      <Text style={styles.saveAddressBtnText}>Save & Deliver Here</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* SAVED ADDRESS CARDS LIST */
                <View style={styles.savedAddressesList}>
                  {savedAddresses.map(addr => {
                    const isSelected = selectedAddressId === addr.id;
                    const badgeBg = addr.label === 'Home' ? '#ECFDF5' : addr.label === 'Work' ? '#EFF6FF' : '#FFFBEB';
                    const badgeText = addr.label === 'Home' ? '#10B981' : addr.label === 'Work' ? '#3B82F6' : '#F59E0B';

                    return (
                      <TouchableOpacity
                        key={addr.id}
                        style={[
                          styles.savedAddressCard,
                          { backgroundColor: themeData.colors.surface, borderColor: themeData.colors.border },
                          isSelected && { borderColor: themeData.colors.primary, borderWidth: 2, backgroundColor: isDarkMode ? 'rgba(99,102,246,0.08)' : '#F6FCFF' }
                        ]}
                        activeOpacity={0.8}
                        onPress={() => handleSelectAddress(addr)}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                            <View style={[styles.radioOuter, isSelected && { borderColor: themeData.colors.primary }]}>
                              {isSelected && <View style={[styles.radioInner, { backgroundColor: themeData.colors.primary }]} />}
                            </View>
                            <Text style={[styles.addressCardName, { color: themeData.colors.textMain }]}>{addr.fullName}</Text>
                            <View style={[styles.addressBadge, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : badgeBg }]}>
                              <Text style={[styles.addressBadgeText, { color: badgeText }]}>{(addr.label || 'HOME').toUpperCase()}</Text>
                            </View>
                          </View>

                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                              style={styles.addressActionBtn}
                              onPress={() => handleEditAddress(addr)}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <Edit2 color={themeData.colors.textMuted} size={15} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.addressActionBtn}
                              onPress={() => handleDeleteAddress(addr.id)}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <Trash2 color={themeData.colors.danger} size={15} />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={{ paddingLeft: 30, marginTop: 8 }}>
                          <Text style={[styles.addressCardLine, { color: themeData.colors.textMuted }]}>
                            {addr.house}, {addr.area}
                          </Text>
                          {addr.landmark ? (
                            <Text style={[styles.addressCardLine, { color: themeData.colors.textLight, fontSize: 12 }]}>
                              Landmark: {addr.landmark}
                            </Text>
                          ) : null}
                          <Text style={[styles.addressCardCity, { color: themeData.colors.textMain }]}>
                            {addr.city}, {addr.state} - {addr.pincode}
                          </Text>
                          <Text style={[styles.addressCardPhone, { color: themeData.colors.textMuted }]}>
                            Phone: <Text style={{ color: themeData.colors.textMain, fontWeight: '600' }}>{addr.phone}</Text>
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* 2. WALLET & COINS */}
          <View style={[styles.sectionCard, { backgroundColor: themeData.colors.surface, borderColor: themeData.colors.border }]}>
            <View style={styles.sectionHeader}>
              <Wallet color={themeData.colors.textMain} size={20} />
              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.sectionTitle, { color: themeData.colors.textMain }]}>2. Use Reward Coins</Text>
                <Text style={[styles.walletBalanceText, { color: themeData.colors.primary }]}>Balance: {walletBalance}</Text>
              </View>
            </View>

            <View style={styles.coinsInputRow}>
              <TextInput
                style={[styles.coinsInput, { backgroundColor: themeData.colors.background, borderColor: themeData.colors.border, color: themeData.colors.textMain }]}
                placeholder="Enter coins"
                placeholderTextColor={themeData.colors.textLight}
                keyboardType="number-pad"
                value={coinsToUse}
                onChangeText={handleCoinChange}
                onBlur={handleCoinBlur}
              />
              <TouchableOpacity style={[styles.coinsMaxBtn, { backgroundColor: isDarkMode ? 'rgba(99,102,246,0.2)' : themeData.colors.primaryLight }]} onPress={handleUseMaxCoins}>
                <Text style={[styles.coinsMaxText, { color: themeData.colors.primary }]}>Use Max</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.coinsHintText, { color: themeData.colors.textLight }]}>Minimum 100 coins required (10 coins = ₹1)</Text>

            {parsedCoins >= MIN_COINS_TO_USE && (
              <View style={[styles.coinsAppliedBox, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.1)' : '#ECFDF5', borderColor: themeData.colors.success }]}>
                <CheckCircle2 color={themeData.colors.success} size={16} />
                <Text style={[styles.coinsAppliedText, { color: themeData.colors.success }]}>₹{coinDiscount} discount applied!</Text>
              </View>
            )}
          </View>

          {/* 3. COUPONS & DISCOUNTS */}
          <View style={[styles.sectionCard, { backgroundColor: themeData.colors.surface, borderColor: themeData.colors.border }]}>
            <CouponInput
              couponCode={couponCode}
              onChangeCode={setCouponCode}
              onApply={handleApplyCoupon}
              onRemove={handleRemoveCoupon}
              appliedCoupon={appliedCoupon}
              loading={couponLoading}
            />
          </View>

          {/* 4. PAYMENT METHOD */}
          <View style={[styles.sectionCard, { backgroundColor: themeData.colors.surface, borderColor: themeData.colors.border }]}>
            <View style={styles.sectionHeader}>
              <CreditCard color={themeData.colors.textMain} size={20} />
              <Text style={[styles.sectionTitle, { color: themeData.colors.textMain }]}>4. Payment Method</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.paymentBox,
                { backgroundColor: themeData.colors.surface, borderColor: themeData.colors.border },
                paymentMethod === 'razorpay' && { borderColor: themeData.colors.primary, backgroundColor: isDarkMode ? 'rgba(99,102,246,0.12)' : themeData.colors.primaryLight }
              ]}
              activeOpacity={0.8}
              onPress={() => setPaymentMethod('razorpay')}
            >
              <View style={styles.radioContainer}>
                <View style={[styles.radioOuter, { borderColor: paymentMethod === 'razorpay' ? themeData.colors.primary : themeData.colors.border }]}>
                  {paymentMethod === 'razorpay' && <View style={[styles.radioInner, { backgroundColor: themeData.colors.primary }]} />}
                </View>
                <View>
                  <Text style={[styles.paymentTitle, { color: themeData.colors.textMain }]}>Online Payment</Text>
                  <Text style={[styles.paymentDesc, { color: themeData.colors.textMuted }]}>UPI, Cards, Netbanking & Wallets</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentBox,
                { backgroundColor: themeData.colors.surface, borderColor: themeData.colors.border, marginBottom: 0 },
                paymentMethod === 'cod' && { borderColor: themeData.colors.primary, backgroundColor: isDarkMode ? 'rgba(99,102,246,0.12)' : themeData.colors.primaryLight }
              ]}
              activeOpacity={0.8}
              onPress={() => setPaymentMethod('cod')}
            >
              <View style={styles.radioContainer}>
                <View style={[styles.radioOuter, { borderColor: paymentMethod === 'cod' ? themeData.colors.primary : themeData.colors.border }]}>
                  {paymentMethod === 'cod' && <View style={[styles.radioInner, { backgroundColor: themeData.colors.primary }]} />}
                </View>
                <View>
                  <Text style={[styles.paymentTitle, { color: themeData.colors.textMain }]}>Cash on Delivery</Text>
                  <Text style={[styles.paymentDesc, { color: themeData.colors.textMuted }]}>Pay when you receive the book</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- FIXED BOTTOM SUMMARY & CHECKOUT --- */}
      <View style={[styles.footerContainer, { backgroundColor: themeData.colors.surface, borderTopColor: themeData.colors.border }]}>

        {/* Summary Breakdown */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: themeData.colors.textMuted }]}>Subtotal ({cartItems.length} items)</Text>
            <Text style={[styles.summaryVal, { color: themeData.colors.textMain }]}>₹{subtotal}</Text>
          </View>
          {shippingFee > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: themeData.colors.textMuted }]}>Shipping Fee</Text>
              <Text style={[styles.summaryVal, { color: themeData.colors.textMain }]}>+ ₹{shippingFee}</Text>
            </View>
          )}
          {coinDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: themeData.colors.success }]}>Coin Discount</Text>
              <Text style={[styles.summaryVal, { color: themeData.colors.success }]}>- ₹{coinDiscount}</Text>
            </View>
          )}
          {couponDiscount > 0 && appliedCoupon && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: themeData.colors.success }]}>Coupon ({appliedCoupon.code})</Text>
              <Text style={[styles.summaryVal, { color: themeData.colors.success }]}>- ₹{couponDiscount}</Text>
            </View>
          )}
          <View style={[styles.summaryDivider, { backgroundColor: themeData.colors.border }]} />
          <View style={styles.summaryTotalRow}>
            <Text style={[styles.summaryTotalLabel, { color: themeData.colors.textMain }]}>Total Amount</Text>
            <Text style={[styles.summaryTotalVal, { color: themeData.colors.primary }]}>₹{totalAmount}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.placeOrderBtn, { backgroundColor: themeData.colors.primary }, (!isAddressValid && hasPhysicalBook) && { opacity: 0.6 }]}
          activeOpacity={0.8}
          disabled={paymentLoading || (!isAddressValid && hasPhysicalBook)}
          onPress={placeOrder}
        >
          {paymentLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={[styles.placeOrderText, { color: '#FFFFFF' }]}>
              {(!isAddressValid && hasPhysicalBook) ? 'Select Valid Delivery Address' : 'Pay & Place Order'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* CUSTOM ALERT MODAL */}
      <Modal visible={customAlert.visible} transparent={true} animationType="fade" onRequestClose={hideAlert}>
        <View style={styles.customAlertOverlay}>
          <View style={[styles.customAlertBox, { backgroundColor: themeData.colors.surface }]}>
            <View style={[styles.customAlertIconContainer,
              customAlert.type === 'success' && { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.15)' : themeData.colors.success },
              customAlert.type === 'error' && { backgroundColor: isDarkMode ? 'rgba(239,68,68,0.15)' : themeData.colors.danger },
              customAlert.type === 'warning' && { backgroundColor: isDarkMode ? 'rgba(245,158,11,0.15)' : '#FFFBEB' },
              customAlert.type === 'info' && { backgroundColor: isDarkMode ? 'rgba(99,102,246,0.15)' : themeData.colors.primaryLight },
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
                  customAlert.type === 'error' && { backgroundColor: themeData.colors.danger },
                  customAlert.type === 'warning' && { backgroundColor: '#F59E0B' },
                  customAlert.type === 'success' && { backgroundColor: themeData.colors.success }
                ]}
                onPress={customAlert.onConfirm || hideAlert} activeOpacity={0.8}
              >
                <Text style={[styles.customAlertConfirmText, { color: '#FFFFFF' }]}>{customAlert.confirmText || 'OK'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScreenContainer>
  );
};

// --------------------------------------------------------
// EXACT STYLES 
// --------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  headerIcon: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textMain },

  scrollContent: { paddingBottom: 240 },

  secureBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 },
  secureBadgeText: { color: theme.colors.success, fontSize: 12, fontWeight: '600' },

  sectionCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  sectionHeaderBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.textMain },

  // Saved Address Styles
  addAddressHeaderBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  addAddressHeaderText: { fontSize: 12, fontWeight: '700' },
  addressFormContainer: { marginTop: 4 },
  formSubHeader: { fontSize: 15, fontWeight: '700' },
  labelPill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  labelPillText: { fontSize: 12, fontWeight: '600' },
  cancelAddressBtn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelAddressBtnText: { fontSize: 14, fontWeight: '600' },
  saveAddressBtn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveAddressBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  savedAddressesList: { gap: 12 },
  savedAddressCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  addressCardName: { fontSize: 14, fontWeight: '700' },
  addressBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  addressBadgeText: { fontSize: 10, fontWeight: '800' },
  addressActionBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  addressCardLine: { fontSize: 13, lineHeight: 18, marginBottom: 2 },
  addressCardCity: { fontSize: 13, fontWeight: '700', marginTop: 2, marginBottom: 4 },
  addressCardPhone: { fontSize: 12, marginTop: 2 },

  // Inputs
  inputGroup: { marginBottom: 16 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.textMuted, marginBottom: 6 },
  input: { height: 48, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingHorizontal: 14, fontSize: 14, color: theme.colors.textMain, backgroundColor: theme.colors.surface },
  inputDisabled: { backgroundColor: theme.colors.background, color: theme.colors.textMuted },

  // Wallet
  walletBalanceText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  coinsInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coinsInput: { flex: 1, height: 44, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingHorizontal: 14, fontSize: 14, color: theme.colors.textMain },
  coinsMaxBtn: { backgroundColor: theme.colors.primaryLight, paddingHorizontal: 16, height: 44, justifyContent: 'center', borderRadius: 8 },
  coinsMaxText: { color: theme.colors.primary, fontSize: 13, fontWeight: '700' },
  coinsHintText: { fontSize: 11, color: theme.colors.textLight, marginTop: 8 },
  coinsAppliedBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.background, padding: 12, borderRadius: 8, marginTop: 12, borderWidth: 1, borderColor: theme.colors.success },
  coinsAppliedText: { color: theme.colors.success, fontSize: 12, fontWeight: '700' },

  // Payments
  paymentBox: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, marginBottom: 12 },
  paymentBoxActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
  radioContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
  radioOuterActive: { borderColor: theme.colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
  paymentTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.textMain, marginBottom: 2 },
  paymentDesc: { fontSize: 11, color: theme.colors.textMuted },

  // Footer Summary
  footerContainer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 10 },
  summaryBox: { marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 13, color: theme.colors.textMuted, fontWeight: '500' },
  summaryVal: { fontSize: 13, color: theme.colors.textMain, fontWeight: '600' },
  summaryDivider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 12 },
  summaryTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTotalLabel: { fontSize: 16, fontWeight: '800', color: theme.colors.textMain },
  summaryTotalVal: { fontSize: 22, fontWeight: '800', color: theme.colors.primary },

  placeOrderBtn: { backgroundColor: theme.colors.textMain, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  placeOrderText: { color: theme.colors.surface, fontSize: 15, fontWeight: '700' },

  // Custom Alert
  customAlertOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  customAlertBox: { backgroundColor: theme.colors.surface, width: '100%', maxWidth: 380, borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  customAlertIconContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  customAlertTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.textMain, textAlign: 'center', marginBottom: 12 },
  customAlertMessage: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 10 },
  customAlertActionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  customAlertCancelBtn: { flex: 1, backgroundColor: theme.colors.border, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  customAlertCancelText: { color: theme.colors.textMain, fontSize: 14, fontWeight: '700' },
  customAlertConfirmBtn: { flex: 1, flexDirection: 'row', backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  customAlertConfirmText: { color: theme.colors.surface, fontSize: 14, fontWeight: '700' },
});
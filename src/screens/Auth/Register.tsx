import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin,
  statusCodes
} from '@react-native-google-signin/google-signin';
import {
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  CheckCircle,
  Chrome,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react-native';
import { ENDPOINTS } from '../../service/api.service';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';


// Add your Google Client ID here
export const googleClientId = "388392832057-bne7f64qudvrooqbacud41tte0i7fitp.apps.googleusercontent.com";

// --- CUSTOM ALERT TYPES ---
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

export const Register = () => {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
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

  // --- STATES ---
  const [step, setStep] = useState<"register" | "verify-otp">("register");
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phn: '',
    password: ''
  });

  // OTP State
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  // --- TIMER LOGIC ---
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [countdown]);



  // --- GUEST CART MERGE LOGIC ---
  const mergeGuestCart = async (loggedInUserId: string) => {
    const mergedFlagKey = `guest-cart-merged-${loggedInUserId}`;

    try {
      const hasMerged = await AsyncStorage.getItem(mergedFlagKey);
      if (hasMerged) return;

      const guestCartKey = "myedudocs-guest-cart";
      const userCartKey = `myedudocs-cart-${loggedInUserId}`;

      const guestCartStr = await AsyncStorage.getItem(guestCartKey);
      const userCartStr = await AsyncStorage.getItem(userCartKey);

      let guestCart: any[] = guestCartStr ? JSON.parse(guestCartStr) : [];
      let userCart: any[] = userCartStr ? JSON.parse(userCartStr) : [];

      if (!guestCart.length) return;

      guestCart.forEach((guestItem: any) => {
        const existingItem = userCart.find((item: any) => item.bookId === guestItem.bookId);
        if (existingItem) {
          existingItem.quantity += guestItem.quantity;
        } else {
          userCart.push({ ...guestItem, addedBy: loggedInUserId });
        }
      });

      await AsyncStorage.setItem(userCartKey, JSON.stringify(userCart));
      await AsyncStorage.removeItem(guestCartKey);
      await AsyncStorage.setItem(mergedFlagKey, "true");

      console.log("Cart merged successfully!");
    } catch (e) {
      console.error("Cart merge failed", e);
    }
  };

  // --- HANDLERS ---
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSendOTP = async () => {
    if (!formData.name || !formData.email || !formData.phn || !formData.password) {
      return triggerAlert("Missing Fields", "Please fill in all fields to continue.", "warning");
    }
    if (formData.password.length < 6) {
      return triggerAlert("Invalid Password", "Password must be at least 6 characters.", "warning");
    }

    try {
      setLoading(true);
      // NOTE: Ensure your endpoint supports this payload
      const res = await fetch(ENDPOINTS.SEND_REGISTRATION_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success || res.ok) {
        triggerAlert("OTP Sent!", "Verification code has been sent to your email.", "success");
        setStep("verify-otp");
        setCountdown(60);
        setOtp("");
      } else {
        triggerAlert("Error", data.message || "Failed to send OTP", "error");
      }
    } catch (err: any) {
      triggerAlert("Network Error", "Please check your internet connection and try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    console.log("Verify Button Pressed!");
    if (otp.length !== 6) {
      console.log("OTP too short:", otp.length);
      return triggerAlert("Invalid OTP", "Please enter a valid 6-digit code.", "warning");
    }


    try {
      console.log("Verifying OTP for:", formData.email, "OTP:", otp);
      setOtpLoading(true);
      const res = await fetch(ENDPOINTS.VERIFY_REGISTRATION_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim(), otp: otp.trim() })
      });

      const data = await res.json();
      console.log("Verify OTP Response:", data);

      if (data.success || res.ok) {

        // For OTP registration, redirect to login (no auto-login)
        triggerAlert(
          "Welcome! 🎉",
          "Registration Successful! Please login to continue.",
          "success",
          () => {
            hideAlert();
            navigation.navigate("Login");
          }
        );
      } else {
        triggerAlert("Verification Failed", data.message || "The code you entered is incorrect.", "error");
      }
    } catch (err: any) {
      triggerAlert("Network Error", "Please check your internet connection and try again.", "error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      console.log("--- Google Auth Start ---");

      // Ensure any previous session is cleared
      try { await GoogleSignin.signOut(); } catch (e) {}

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      setLoading(true);

      // Increased delay and ensuring we are on the UI thread's good side
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log("Calling GoogleSignin.signIn()...");
      const userInfo = await GoogleSignin.signIn();
      console.log("Sign-In Success:", userInfo.data?.user.email);

      const tokens = await GoogleSignin.getTokens();
      const credential = tokens.idToken;

      if (!credential) {
        throw new Error("No ID token received from Google");
      }

      console.log("Sending to backend...");
      const res = await fetch(ENDPOINTS.GOOGLE_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });


      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Google Authentication failed");
      }

      const authUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        token: data.user.token
      };

      await mergeGuestCart(authUser.id);
      await login(authUser);

      triggerAlert("Welcome! 🎉", "Account created successfully!", "success");

    } catch (error: any) {
      console.log("GOOGLE ERROR:", error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("User cancelled");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("Already in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        triggerAlert("Error", "Play services not available", "error");
      } else {
        triggerAlert("Google Auth Error", error.message || "Google sign-in failed", "error");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer
      scroll={true}
      header={{
        title: 'Create Account',
        showBack: true,
        showThemeToggle: true,
        showCoins: false,
        showNotifications: false,
      }}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>

            {/* --- HEADER --- */}
            <View style={styles.header}>
              <View style={[styles.iconBox, { backgroundColor: isDarkMode ? theme.colors.border : '#EEF2FF' }]}>
                {step === "register" ? <ShieldCheck color={theme.colors.primary} size={32} /> : <KeyRound color={theme.colors.primary} size={32} />}
              </View>
              <Text style={[styles.title, { color: theme.colors.textMain }]}>{step === "register" ? "Create Account" : "Verify Email"}</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                {step === "register"
                  ? "Join MyEduDocs and start your learning journey today."
                  : `We sent a 6-digit code to ${formData.email}`
                }
              </Text>
            </View>

            {/* --- STEP 1: REGISTRATION FORM --- */}
            {step === "register" ? (
              <>
                <TouchableOpacity
                  style={[styles.googleBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={handleGoogleAuth}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <View style={[styles.googleIconCircle, { backgroundColor: theme.colors.background }]}>
                    <Image
                      source={require('../../../assets/images/google_logo.png')}
                      style={styles.googleLogoImg}
                    />
                  </View>
                  <Text style={[styles.googleBtnText, { color: theme.colors.textMain }]}>Sign up with Google</Text>
                </TouchableOpacity>


                <View style={styles.separatorContainer}>
                  <View style={[styles.separatorLine, { backgroundColor: theme.colors.border }]} />
                  <Text style={[styles.separatorText, { color: theme.colors.textLight }]}>OR</Text>
                  <View style={[styles.separatorLine, { backgroundColor: theme.colors.border }]} />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.textMain }]}>Full Name</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <User color={theme.colors.textLight} size={18} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.colors.textMain }]}
                      placeholder="John Doe"
                      placeholderTextColor={theme.colors.textLight}
                      value={formData.name}
                      onChangeText={(val) => handleInputChange('name', val)}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.textMain }]}>Email Address</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <Mail color={theme.colors.textLight} size={18} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.colors.textMain }]}
                      placeholder="name@example.com"
                      placeholderTextColor={theme.colors.textLight}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={formData.email}
                      onChangeText={(val) => handleInputChange('email', val.trim())}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.textMain }]}>Phone Number</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <Phone color={theme.colors.textLight} size={18} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.colors.textMain }]}
                      placeholder="Enter 10-digit number"
                      placeholderTextColor={theme.colors.textLight}
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={formData.phn}
                      onChangeText={(val) => handleInputChange('phn', val.replace(/[^0-9]/g, ''))}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.textMain }]}>Password</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <Lock color={theme.colors.textLight} size={18} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { flex: 1, color: theme.colors.textMain }]}
                      placeholder="Create a password"
                      placeholderTextColor={theme.colors.textLight}
                      secureTextEntry={!showPassword}
                      value={formData.password}
                      onChangeText={(val) => handleInputChange('password', val)}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                      {showPassword ? <EyeOff color={theme.colors.textLight} size={18} /> : <Eye color={theme.colors.textLight} size={18} />}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={handleSendOTP}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Send Verification Code</Text>
                      <ArrowRight color="#FFFFFF" size={18} />
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (

              /* --- STEP 2: OTP VERIFICATION FORM --- */
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.textMain }]}>Verification Code</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <KeyRound color={theme.colors.textLight} size={18} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.colors.textMain }]}
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor={theme.colors.textLight}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otp}
                      onChangeText={(val) => setOtp(val.replace(/[^0-9]/g, ''))}
                    />
                  </View>
                </View>

                <View style={styles.timerContainer}>
                  {countdown > 0 ? (
                    <Text style={[styles.timerText, { color: theme.colors.textMuted }]}>
                      Resend available in <Text style={[styles.timerHighlight, { color: theme.colors.textMain }]}>{countdown}s</Text>
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleSendOTP} disabled={otpLoading}>
                      <Text style={[styles.resendText, { color: theme.colors.primary }]}>Resend Code</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={handleVerifyOTP}
                  disabled={otpLoading}
                  activeOpacity={0.8}
                >
                  {otpLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Verify & Complete</Text>
                      <CheckCircle color="#FFFFFF" size={18} />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setStep("register")}
                  activeOpacity={0.7}
                >
                  <ArrowLeft color={theme.colors.textMuted} size={16} />
                  <Text style={[styles.backBtnText, { color: theme.colors.textMuted }]}>Go back to details</Text>
                </TouchableOpacity>
              </>
            )}

            {/* --- FOOTER --- */}
            <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
              <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={[styles.loginText, { color: theme.colors.primary }]}>Login</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
          <View style={[styles.customAlertBox, { backgroundColor: theme.colors.surface }]}>

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

            <Text style={[styles.customAlertTitle, { color: theme.colors.textMain }]}>{customAlert.title}</Text>
            <Text style={[styles.customAlertMessage, { color: theme.colors.textMuted }]}>{customAlert.message}</Text>

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
    </ScreenContainer>
  );
};

// --------------------------------------------------------
// EXACT STYLES
// --------------------------------------------------------
const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },

  // Main Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  // Header Area
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Google Button
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleLogoImg: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  googleBtnText: {

    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },


  // Separator
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  separatorText: {
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },

  // Form Inputs
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: '#0F172A',
  },

  // Buttons
  primaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6366F6',
    borderRadius: 10,
    paddingVertical: 16,
    marginTop: 8,
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // OTP specific
  timerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 13,
    color: '#64748B',
  },
  timerHighlight: {
    fontWeight: '700',
    color: '#0F172A',
  },
  resendText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F6',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  loginText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F6',
  },

  // --- CUSTOM ALERT MODAL STYLES ---
  customAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customAlertBox: {
    backgroundColor: '#FFFFFF',
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
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  customAlertMessage: {
    fontSize: 14,
    color: '#64748B',
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
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAlertCancelText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  customAlertConfirmBtn: {
    flex: 1,
    backgroundColor: '#6366F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAlertConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

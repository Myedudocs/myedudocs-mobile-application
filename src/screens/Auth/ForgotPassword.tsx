import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
    Mail, Lock, ArrowRight, ShieldCheck, KeyRound,
    CheckCircle2, XCircle, AlertTriangle, Info, Clock, Eye, EyeOff
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import BASE_URL, { ENDPOINTS } from '../../service/api.service';

type Step = "EMAIL" | "VERIFY" | "SUCCESS";

export const ForgotPassword = () => {
    const navigation = useNavigation<any>();
    const { theme, isDarkMode } = useTheme();

    // --- STATES ---
    const [step, setStep] = useState<Step>("EMAIL");
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [showPassword, setShowPassword] = useState(false);

    // Form States
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // --- CUSTOM ALERT STATE ---
    const [customAlert, setCustomAlert] = useState({
        visible: false, title: '', message: '', type: 'info' as 'success' | 'error' | 'warning' | 'info'
    });

    const triggerAlert = (title: string, message: string, type: any = 'info') => {
        setCustomAlert({ visible: true, title, message, type });
    };

    // --- TIMER LOGIC ---
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    // --- STEP 1: SEND OTP ---
    const handleSendCode = async () => {
        if (!email.trim()) return triggerAlert("Error", "Please enter your email", "warning");

        try {
            setLoading(true);
            const res = await fetch(`${BASE_URL}/users/send-forgot-password-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase() })
            });
            const data = await res.json();

            if (data.success) {
                setStep("VERIFY");
                setCountdown(900); // 15 minutes as per web ref
                triggerAlert("OTP Sent", "Reset code sent to your email!", "success");
            } else {
                triggerAlert("Error", data.message || "Failed to send code", "error");
            }
        } catch (err) {
            triggerAlert("Connection Error", "Could not reach server", "error");
        } finally {
            setLoading(false);
        }
    };

    // --- STEP 2: VERIFY & RESET ---
    const handleResetPassword = async () => {
        if (otp.length !== 6) return triggerAlert("Invalid OTP", "Enter 6-digit code", "warning");
        if (newPassword !== confirmPassword) return triggerAlert("Mismatch", "Passwords do not match", "error");
        if (newPassword.length < 6) return triggerAlert("Weak Password", "Minimum 6 characters required", "warning");

        try {
            setLoading(true);
            const res = await fetch(`${BASE_URL}/users/verify-forgot-password-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    resetCode: otp.trim(),
                    newPassword
                })
            });
            const data = await res.json();

            if (data.success) {
                setStep("SUCCESS");
                setTimeout(() => navigation.navigate("Login"), 3000);
            } else {
                triggerAlert("Reset Failed", data.message || "Invalid OTP or request", "error");
            }
        } catch (err) {
            triggerAlert("Error", "Something went wrong", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenContainer
            scroll={true}
            header={{
                title: 'Reset Password',
                showBack: true,
                showThemeToggle: true,
                showCoins: false,
                showNotifications: false,
            }}
        >
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        {/* HEADER ICON */}
                        <View style={styles.header}>
                            <View style={[styles.iconBox, { backgroundColor: isDarkMode ? theme.colors.border : '#EEF2FF' }]}>
                                {step === "EMAIL" && <Mail color={theme.colors.primary} size={32} />}
                                {step === "VERIFY" && <KeyRound color={theme.colors.primary} size={32} />}
                                {step === "SUCCESS" && <CheckCircle2 color="#10B981" size={32} />}
                            </View>
                            <Text style={[styles.title, { color: theme.colors.textMain }]}>
                                {step === "EMAIL" ? "Forgot Password?" : step === "VERIFY" ? "Verify Code" : "Password Reset!"}
                            </Text>
                            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                                {step === "EMAIL" ? "No worries, we'll send you reset instructions." :
                                    step === "VERIFY" ? `Enter the 6-digit code sent to ${email}` :
                                        "Your password has been updated successfully."}
                            </Text>
                        </View>

                        {/* STEP 1: EMAIL INPUT */}
                        {step === "EMAIL" && (
                            <View style={styles.form}>
                                <View style={styles.formGroup}>
                                    <Text style={[styles.label, { color: theme.colors.textMain }]}>Email Address</Text>
                                    <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                                        <Mail color={theme.colors.textLight} size={18} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: theme.colors.textMain }]}
                                            placeholder="name@example.com"
                                            placeholderTextColor={theme.colors.textLight}
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>
                                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]} onPress={handleSendCode} disabled={loading}>
                                    {loading ? <ActivityIndicator color="#FFF" /> : (
                                        <>
                                            <Text style={styles.primaryBtnText}>Send Reset Code</Text>
                                            <ArrowRight color="#FFF" size={18} />
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* STEP 2: VERIFY & NEW PASSWORD */}
                        {step === "VERIFY" && (
                            <View style={styles.form}>
                                <View style={styles.formGroup}>
                                    <Text style={[styles.label, { color: theme.colors.textMain }]}>Reset Code</Text>
                                    <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                                        <KeyRound color={theme.colors.textLight} size={18} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: theme.colors.textMain }]}
                                            placeholder="000000"
                                            placeholderTextColor={theme.colors.textLight}
                                            value={otp}
                                            onChangeText={setOtp}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                        />
                                    </View>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={[styles.label, { color: theme.colors.textMain }]}>New Password</Text>
                                    <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                                        <Lock color={theme.colors.textLight} size={18} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: theme.colors.textMain }]}
                                            placeholder="••••••••"
                                            placeholderTextColor={theme.colors.textLight}
                                            secureTextEntry={!showPassword}
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff color={theme.colors.textLight} size={18} /> : <Eye color={theme.colors.textLight} size={18} />}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={[styles.label, { color: theme.colors.textMain }]}>Confirm Password</Text>
                                    <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                                        <Lock color={theme.colors.textLight} size={18} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: theme.colors.textMain }]}
                                            placeholder="••••••••"
                                            placeholderTextColor={theme.colors.textLight}
                                            secureTextEntry={!showPassword}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                        />
                                    </View>
                                </View>

                                <View style={styles.timerRow}>
                                    <Clock color={theme.colors.textMuted} size={14} />
                                    <Text style={[styles.timerText, { color: theme.colors.textMuted }]}>
                                        {countdown > 0 ? `Expires in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}` : "Code Expired"}
                                    </Text>
                                </View>

                                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]} onPress={handleResetPassword} disabled={loading}>
                                    {loading ? <ActivityIndicator color="#FFF" /> : (
                                        <Text style={styles.primaryBtnText}>Update Password</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => setStep("EMAIL")} style={styles.secondaryBtn}>
                                    <Text style={[styles.secondaryBtnText, { color: theme.colors.primary }]}>Resend Email</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* STEP 3: SUCCESS VIEW */}
                        {step === "SUCCESS" && (
                            <View style={styles.successContainer}>
                                <Text style={[styles.redirectText, { color: theme.colors.textMuted }]}>Redirecting to login in 3 seconds...</Text>
                                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.navigate("Login")}>
                                    <Text style={styles.primaryBtnText}>Sign In Now</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* REUSABLE MODAL (Mirroring your Login.tsx) */}
            <Modal visible={customAlert.visible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.alertBox, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.alertTitle, { color: theme.colors.textMain }]}>{customAlert.title}</Text>
                        <Text style={[styles.alertMsg, { color: theme.colors.textMuted }]}>{customAlert.message}</Text>
                        <TouchableOpacity style={[styles.alertBtn, { backgroundColor: theme.colors.primary }]} onPress={() => setCustomAlert({ ...customAlert, visible: false })}>
                            <Text style={styles.alertBtnText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    scrollContent: { flexGrow: 1, padding: 20, justifyContent: 'center' },
    backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 },
    backBtnText: { color: '#64748B', fontWeight: '600', fontSize: 14 },
    card: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    header: { alignItems: 'center', marginBottom: 30 },
    iconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },
    form: { gap: 16 },
    formGroup: { gap: 8 },
    label: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, height: 50, color: '#0F172A', fontSize: 15 },
    primaryBtn: { backgroundColor: '#6366F6', borderRadius: 12, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 10 },
    primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    secondaryBtn: { alignItems: 'center', marginTop: 10 },
    secondaryBtnText: { color: '#6366F1', fontWeight: '700' },
    timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 10 },
    timerText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    successContainer: { alignItems: 'center', paddingVertical: 20 },
    redirectText: { color: '#64748B', marginBottom: 20 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    alertBox: { width: '80%', backgroundColor: '#FFF', borderRadius: 20, padding: 24, alignItems: 'center' },
    alertTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
    alertMsg: { textAlign: 'center', color: '#64748B', marginBottom: 20 },
    alertBtn: { backgroundColor: '#6366F6', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10 },
    alertBtnText: { color: '#FFF', fontWeight: '700' }
});

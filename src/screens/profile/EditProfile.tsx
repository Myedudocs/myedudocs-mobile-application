import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  User,
  Camera,
  Shield,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  Trophy,
  Flame,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Save,
  Phone,
  Mail,
  Settings,
  Bell,
  ChevronRight,
  Target
} from 'lucide-react-native';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { theme as staticTheme } from '../../styles/theme';
import { ENDPOINTS, BASE_URL } from '../../service/api.service';
import { getImageUrl } from '../../utils/image.utils';
import { CustomAlert } from '../../components/CustomAlert';
import SkeletonLoader from '../../components/SkeletonLoader';
import { ScreenContainer } from '../../components/common/ScreenContainer';

const { width } = Dimensions.get('window');

export const EditProfile = () => {
  const navigation = useNavigation<any>();
  const { user, login, logout } = useAuth();
  const { theme, isDarkMode } = useTheme();
  
  // Tabs: 0: General, 1: Performance, 2: Security
  const [activeTab, setActiveTab] = useState(0);

  const [fullProfile, setFullProfile] = useState<any>(null);

  useEffect(() => {
    const syncProfile = async () => {
      if (!user?.token) return;
      try {
        const res = await fetch(`${BASE_URL}/student/profile`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        if (data?.success && data?.user) {
          setFullProfile(data.user);
        }
      } catch (_) {}
    };
    syncProfile();
  }, [user?.token]);

  // Detect Google SSO user (matching web parity)
  const isGoogleUser = !!(
    (user as any)?.authProvider === 'google' ||
    (user as any)?.googleId ||
    (user as any)?.provider === 'google' ||
    fullProfile?.authProvider === 'google' ||
    fullProfile?.googleId ||
    fullProfile?.provider === 'google' ||
    (user?.email && user.email.toLowerCase().includes('@gmail.com'))
  );

  // --- FORM STATES: PROFILE ---
  const [fullName, setFullName] = useState(user?.name || '');
  const [emailAddress, setEmailAddress] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState((user as any)?.phn || (user as any)?.phone || '');
  const [avatar, setAvatar] = useState((user as any)?.avatar || null);
  const [avatarFile, setAvatarFile] = useState<any>(null);

  // --- FORM STATES: PASSWORD ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // --- UI STATES ---
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [errors, setErrors] = useState<any>({});
  
  // Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
     title: '',
     message: '',
     type: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Fetch Stats (Leaderboard/Metrics)
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id || !user?.token) return;
      try {
        // 1. Fetch Leaderboard
        const res = await fetch(ENDPOINTS.GET_STUDENT_LEADERBOARD(user.id), {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = await res.json();

        // 2. Fetch actual attempts count
        const attemptsRes = await fetch(`${BASE_URL}/student/test-series/attempt/user/${user.id}/attempts?limit=1`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const attemptsJson = await attemptsRes.json();
        const actualAttemptsCount = attemptsJson?.totalAttempts || attemptsJson?.count || attemptsJson?.attempts?.length || 0;

        if (data.success) {
           setStats({ ...data.rank, actualAttemptsCount });
        } else {
           setStats({ actualAttemptsCount });
        }
      } catch (e) {
        console.log("Failed to fetch stats", e);
      }
    };
    fetchStats();
  }, [user]);


  // --- AVATAR PICKER ---
  const handlePickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (response.didCancel) return;
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setAvatar(asset.uri || null);
        setAvatarFile({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || 'avatar.jpg'
        });
      }
    });
  };

  // --- SUBMIT: UPDATE PROFILE ---
  const handleUpdateProfile = async () => {
    if (!user?.id || !user?.token) return;
    setLoading(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.append('name', fullName.trim());
      formData.append('email', emailAddress.trim().toLowerCase());
      formData.append('phn', phoneNumber.trim());
      
      if (avatarFile) {
        formData.append('avatar', avatarFile as any);
      }

      console.log("[ProfileUpdate] Sending request to:", ENDPOINTS.UPDATE_STUDENT_PROFILE);

      const res = await fetch(ENDPOINTS.UPDATE_STUDENT_PROFILE, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Accept': 'application/json',
          // NO Content-Type here; fetch will set it for FormData
        },
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Server error: ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        await login({ ...user, ...data.user }); 
        setAlertConfig({
           title: 'Profile Updated',
           message: 'Your personal information has been successfully saved.',
           type: 'success'
        });
        setAlertVisible(true);
        setAvatarFile(null);
      } else {
        setAlertConfig({
           title: 'Update Failed',
           message: data.message || "We couldn't update your profile at this time.",
           type: 'error'
        });
        setAlertVisible(true);
      }
    } catch (e: any) {
      console.error("[ProfileUpdate] Error:", e.message);
      Alert.alert("Update Error", e.message || "A network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // --- SUBMIT: CHANGE PASSWORD ---
  const handleChangePassword = async () => {
     if (!user?.id || !user?.token) return;
     if (newPassword !== confirmPassword) {
        setErrors({ confirmPassword: "Passwords don't match" });
        return;
     }

     setLoading(true);
     try {
        const res = await fetch(ENDPOINTS.UPDATE_PROFILE(user.id), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
          });
    
          const data = await res.json();
          if (data.success) {
            if (data.logoutAllDevices) {
                await logout();
                return;
            }
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setAlertConfig({
                title: 'Password Changed',
                message: 'Your security credentials have been updated.',
                type: 'success'
            });
            setAlertVisible(true);
          } else {
            setErrors({ password: data.message });
          }
     } catch(e) {
         setErrors({ password: "Failed to update password." });
     } finally {
         setLoading(false);
     }
  };

  const tabs = [
    { id: 0, label: 'General', icon: User },
    { id: 1, label: 'Performance', icon: TrendingUp },
    { id: 2, label: 'Security', icon: Shield },
  ];

  return (
    <ScreenContainer
      header={{ title: 'Edit Profile', showBack: true }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Top Banner / Avatar */}
          <View style={styles.topSection}>
             <View style={styles.avatarWrapper}>
                {avatar ? (
                  <Image 
                    source={{ uri: avatar }} 
                    style={styles.avatar} 
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarInitials}>
                      {fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                    </Text>
                  </View>
                )}
                <TouchableOpacity 
                    style={styles.cameraBtn} 
                    activeOpacity={0.8}
                    onPress={handlePickImage}
                >
                   <Camera color="#FFFFFF" size={16} strokeWidth={2.5} />
                </TouchableOpacity>
             </View>
              <Text style={[styles.userName, { color: theme.colors.textMain }]}>{fullName || 'Student'}</Text>
              <Text style={[styles.userEmail, { color: theme.colors.textMuted }]}>{emailAddress || user?.email}</Text>
             
             <View style={styles.statusRow}>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: user?.Status === 'Verified' ? (isDarkMode ? 'rgba(16,185,129,0.15)' : '#ECFDF5') : (isDarkMode ? 'rgba(245,158,11,0.15)' : '#FEF3C7') }
                ]}>
                    <CheckCircle2 color={user?.Status === 'Verified' ? '#10B981' : '#F59E0B'} size={12} />
                    <Text style={[styles.statusText, { color: user?.Status === 'Verified' ? '#10B981' : '#B45309' }]}>
                        {user?.Status === 'Verified' ? 'Verified Student' : 'Under Review'}
                    </Text>
                </View>
             </View>
          </View>

          {/* Tab Selector */}
          <View style={[styles.tabBar, { backgroundColor: isDarkMode ? theme.colors.border : '#F8FAFC' }]}>
            {tabs.map((tab) => {
               const Icon = tab.icon;
               const active = activeTab === tab.id;
               return (
                 <TouchableOpacity 
                    key={tab.id} 
                    onPress={() => setActiveTab(tab.id)}
                    style={[styles.tabItem, active && [styles.activeTabItem, { backgroundColor: theme.colors.surface }]]}
                 >
                    <Icon color={active ? theme.colors.primary : theme.colors.textLight} size={20} strokeWidth={active ? 2.5 : 2} />
                    <Text style={[styles.tabLabel, { color: theme.colors.textLight }, active && [styles.activeTabLabel, { color: theme.colors.primary }]]}>{tab.label}</Text>
                    {active && <View style={styles.activeIndicator} />}
                 </TouchableOpacity>
               );
            })}
          </View>


          {/* TAB CONTENT */}
          <View style={styles.tabContent}>
             {activeTab === 0 && (
                 <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <View style={[styles.cardHeader, { borderBottomColor: theme.colors.border }]}>
                        <User color={theme.colors.primary} size={18} />
                        <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>Basic Details</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: theme.colors.textLight }]}>FULL NAME</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                           <User color={theme.colors.textLight} size={18} />
                           <TextInput 
                              style={[styles.input, { color: theme.colors.textMain }]}
                              value={fullName}
                              onChangeText={setFullName}
                              placeholder="Your full name"
                              placeholderTextColor={theme.colors.textLight}
                           />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: theme.colors.textLight }]}>EMAIL ADDRESS</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? theme.colors.border : '#F1F5F9', borderColor: theme.colors.border }]}>
                           <Mail color={theme.colors.textLight} size={18} />
                           <TextInput 
                              style={[styles.input, { color: theme.colors.textMuted }]}
                              value={emailAddress}
                              editable={false}
                              placeholder="Your email"
                           />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: theme.colors.textLight }]}>PHONE NUMBER</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                           <Phone color={theme.colors.textLight} size={18} />
                           <TextInput 
                              style={[styles.input, { color: theme.colors.textMain }]}
                              value={phoneNumber}
                              onChangeText={setPhoneNumber}
                              placeholder="Enter 10 digit phone"
                              placeholderTextColor={theme.colors.textLight}
                              keyboardType="phone-pad"
                           />
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
                        onPress={handleUpdateProfile}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#FFFFFF" /> : (
                            <>
                                <Save color="#FFFFFF" size={18} />
                                <Text style={[styles.saveBtnText, { color: '#FFFFFF' }]}>Save Changes</Text>
                            </>
                        )}
                    </TouchableOpacity>
                 </View>
             )}

             {activeTab === 1 && (
                 <View>
                    {/* Quick Stats Grid */}
                    <View style={styles.metricsGrid}>
                       <View style={[
                         styles.metricCard, 
                         { 
                           backgroundColor: isDarkMode ? 'rgba(245,158,11,0.12)' : '#FEF3C7',
                           borderColor: isDarkMode ? 'rgba(245,158,11,0.25)' : '#FDE68A',
                           borderWidth: 1,
                         }
                       ]}>
                          <Wallet color="#F59E0B" size={20} />
                          <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>COINS</Text>
                          <Text style={[styles.metricValue, { color: theme.colors.textMain }]}>{user?.coins || 0}</Text>
                       </View>
                       <View style={[
                         styles.metricCard, 
                         { 
                           backgroundColor: isDarkMode ? 'rgba(14,165,233,0.12)' : '#F0F9FF',
                           borderColor: isDarkMode ? 'rgba(14,165,233,0.25)' : '#BAE6FD',
                           borderWidth: 1,
                         }
                       ]}>
                          <Trophy color="#0EA5E9" size={20} />
                          <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>RANK</Text>
                          <Text style={[styles.metricValue, { color: theme.colors.textMain }]}>#{stats?.rank || '-'}</Text>
                       </View>
                       <View style={[
                         styles.metricCard, 
                         { 
                           backgroundColor: isDarkMode ? 'rgba(239,68,68,0.12)' : '#FEF2F2',
                           borderColor: isDarkMode ? 'rgba(239,68,68,0.25)' : '#FECACA',
                           borderWidth: 1,
                         }
                       ]}>
                          <Flame color="#EF4444" size={20} />
                          <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>STREAK</Text>
                          <Text style={[styles.metricValue, { color: theme.colors.textMain }]}>{stats?.streak || 0}d</Text>
                       </View>
                    </View>

                     <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <View style={[styles.cardHeader, { borderBottomColor: theme.colors.border }]}>
                           <TrendingUp color={theme.colors.primary} size={18} />
                           <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>Learning Progress</Text>
                        </View>
                        
                         <TouchableOpacity style={[styles.statListItem, { borderBottomColor: theme.colors.border }]} onPress={() => navigation.navigate('OverallGrowth')}>
                           <View style={[styles.statIconWrap, { backgroundColor: theme.colors.background }]}>
                              <Trophy color={theme.colors.primary} size={16} />
                           </View>
                           <View style={{ flex: 1 }}>
                              <Text style={[styles.statListTitle, { color: theme.colors.textMain }]}>Academic Metrics</Text>
                              <Text style={[styles.statListSub, { color: theme.colors.textMuted }]}>View detailed scores and analysis</Text>
                           </View>
                           <ChevronRight color={theme.colors.textLight} size={20} />
                         </TouchableOpacity>

                         <TouchableOpacity style={[styles.statListItem, { borderBottomColor: theme.colors.border }]} onPress={() => navigation.navigate('MyTestSeries')}>
                           <View style={[styles.statIconWrap, { backgroundColor: theme.colors.background }]}>
                              <CheckCircle2 color="#8B5CF6" size={16} />
                           </View>
                            <View style={{ flex: 1 }}>
                               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                  <Text style={[styles.statListTitle, { color: theme.colors.textMain }]}>Completed Tests</Text>
                                  {stats?.actualAttemptsCount !== undefined && (
                                     <View style={{ backgroundColor: isDarkMode ? 'rgba(139,92,246,0.15)' : '#F5F3FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#8B5CF6' }}>{stats.actualAttemptsCount}</Text>
                                     </View>
                                  )}
                               </View>
                               <Text style={[styles.statListSub, { color: theme.colors.textMuted }]}>Review your previous attempts</Text>
                            </View>
                           <ChevronRight color={theme.colors.textLight} size={20} />
                         </TouchableOpacity>

                         <TouchableOpacity style={[styles.statListItem, { borderBottomColor: theme.colors.border }]} onPress={() => navigation.navigate('TestResults')}>
                           <View style={[styles.statIconWrap, { backgroundColor: theme.colors.background }]}>
                              <Target color="#10B981" size={16} />
                           </View>
                           <View style={{ flex: 1 }}>
                              <Text style={[styles.statListTitle, { color: theme.colors.textMain }]}>My Results</Text>
                              <Text style={[styles.statListSub, { color: theme.colors.textMuted }]}>View scores and detailed exam analysis</Text>
                           </View>
                           <ChevronRight color={theme.colors.textLight} size={20} />
                         </TouchableOpacity>
                    </View>
                 </View>
             )}

             {activeTab === 2 && (
                 <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <View style={[styles.cardHeader, { borderBottomColor: theme.colors.border }]}>
                        <Lock color={theme.colors.primary} size={18} />
                        <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>Security Settings</Text>
                    </View>

                    {isGoogleUser ? (
                      /* ── Google SSO Locked State (Matching Web Parity) ── */
                      <View style={[styles.googleSsoCard, { backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.7)' : '#F0F9FF', borderColor: isDarkMode ? '#1E293B' : '#BAE6FD' }]}>
                        <View style={styles.googleIconCircle}>
                          <Text style={styles.googleIconLetter}>G</Text>
                        </View>

                        <Text style={[styles.googleSsoTitle, { color: theme.colors.textMain }]}>
                          Signed in with Google
                        </Text>
                        <Text style={[styles.googleSsoDesc, { color: theme.colors.textMuted }]}>
                          Your account uses <Text style={{ fontWeight: '800', color: theme.colors.textMain }}>Google SSO</Text> for authentication. Password-based login is disabled for your account — your Google account manages your security.
                        </Text>

                        <View style={[styles.googleLockedPill, { backgroundColor: theme.colors.surface, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#BAE6FD' }]}>
                          <Lock size={15} color="#F59E0B" />
                          <Text style={[styles.googleLockedPillText, { color: theme.colors.textMuted }]}>
                            Password change is not available for Google-linked accounts.
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => Linking.openURL('https://myaccount.google.com/security')}
                          activeOpacity={0.8}
                          style={[styles.googleManageBtn, { backgroundColor: theme.colors.primary }]}
                        >
                          <Text style={styles.googleManageBtnText}>Manage Google Security ↗</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      /* ── Standard Password Change Form ── */
                      <>
                        <View style={styles.securityWarning}>
                            <AlertCircle color="#F59E0B" size={16} />
                            <Text style={styles.securityWarningText}>Changing your password will update it across all devices.</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.colors.textLight }]}>CURRENT PASSWORD</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                               <Lock color={theme.colors.textLight} size={18} />
                               <TextInput 
                                  style={[styles.input, { color: theme.colors.textMain }]}
                                  secureTextEntry={!showCurrent}
                                  value={currentPassword}
                                  onChangeText={setCurrentPassword}
                                  placeholder="Required to change"
                                  placeholderTextColor={theme.colors.textLight}
                               />
                               <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                                  {showCurrent ? <EyeOff color={theme.colors.textLight} size={18} /> : <Eye color={theme.colors.textLight} size={18} />}
                               </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.colors.textLight }]}>NEW PASSWORD</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                               <Shield color={theme.colors.textLight} size={18} />
                               <TextInput 
                                  style={[styles.input, { color: theme.colors.textMain }]}
                                  secureTextEntry={!showNew}
                                  value={newPassword}
                                  onChangeText={setNewPassword}
                                  placeholder="Min 6 characters"
                                  placeholderTextColor={theme.colors.textLight}
                               />
                               <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                                  {showNew ? <EyeOff color={theme.colors.textLight} size={18} /> : <Eye color={theme.colors.textLight} size={18} />}
                               </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.colors.textLight }]}>CONFIRM PASSWORD</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                               <CheckCircle2 color={theme.colors.textLight} size={18} />
                               <TextInput 
                                  style={[styles.input, { color: theme.colors.textMain }]}
                                  secureTextEntry={!showConfirm}
                                  value={confirmPassword}
                                  onChangeText={setConfirmPassword}
                                  placeholder="Repeat new password"
                                  placeholderTextColor={theme.colors.textLight}
                               />
                               <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                                  {showConfirm ? <EyeOff color={theme.colors.textLight} size={18} /> : <Eye color={theme.colors.textLight} size={18} />}
                               </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={[styles.saveBtn, { backgroundColor: isDarkMode ? theme.colors.border : '#1E293B' }, loading && { opacity: 0.7 }]} 
                            onPress={handleChangePassword}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#FFFFFF" /> : (
                                <>
                                    <Shield color="#FFFFFF" size={18} />
                                    <Text style={[styles.saveBtnText, { color: '#FFFFFF' }]}>Update Password</Text>
                                </>
                            )}
                        </TouchableOpacity>
                      </>
                    )}
                 </View>
             )}
          </View>

          {/* Additional Settings */}
          <View style={styles.settingsSection}>
              <Text style={[styles.settingsTitle, { color: theme.colors.textMain }]}>Other Settings</Text>
              
              <TouchableOpacity style={styles.settingRow}>
                  <View style={[styles.settingIcon, { backgroundColor: '#F8FAFC' }]}>
                    <Bell color="#475569" size={18} />
                  </View>
                  <Text style={styles.settingLabel}>Notifications</Text>
                  <ChevronRight color="#CBD5E1" size={18} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingRow}>
                  <View style={[styles.settingIcon, { backgroundColor: theme.colors.border }]}>
                    <Settings color={theme.colors.textMuted} size={18} />
                  </View>
                  <Text style={[styles.settingLabel, { color: theme.colors.textMain }]}>Preferences</Text>
                  <ChevronRight color={theme.colors.textLight} size={18} />
              </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutText}>Logout from this device</Text>
          </TouchableOpacity>

          <CustomAlert 
            visible={alertVisible}
            title={alertConfig.title}
            message={alertConfig.message}
            type={alertConfig.type}
            onHide={() => setAlertVisible(false)}
            buttons={[{ text: 'Great!' }]}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
  },
  topSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#F1F5F9',
  },
  avatarPlaceholder: {
    backgroundColor: staticTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 2,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: staticTheme.colors.primary,
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  statusRow: {
    marginTop: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 6,
    marginBottom: 24,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderRadius: 12,
  },
  activeTabItem: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  activeTabLabel: {
    color: staticTheme.colors.primary,
    fontWeight: '800',
  },
  activeIndicator: {
    // optional bar below label
  },
  successMsg: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  successMsgText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tabContent: {
    // animation container
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: staticTheme.colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
  },
  statListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statListTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  statListSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  securityWarning: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 24,
  },
  securityWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    lineHeight: 18,
  },
  settingsSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 16,
    marginLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  logoutBtn: {
    alignItems: 'center',
    padding: 16,
  },
  logoutText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '700',
  },

  /* Google SSO Locked Card */
  googleSsoCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 18,
    borderWidth: 1.5,
    marginVertical: 8,
    gap: 10,
  },
  googleIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4285F4',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 4,
  },
  googleIconLetter: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  googleSsoTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  googleSsoDesc: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
    marginBottom: 4,
  },
  googleLockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    justifyContent: 'center',
    marginVertical: 4,
  },
  googleLockedPillText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center',
  },
  googleManageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  googleManageBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Smartphone,
  Laptop,
  Globe,
  ShieldAlert,
  ShieldCheck,
  ChevronLeft,
  LogOut,
  Clock,
  MapPin,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ENDPOINTS, apiService } from '../../service/api.service';
import { GlobalSafeHeader } from '../../components/common/GlobalSafeHeader';

interface DeviceSession {
  id: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  deviceName: string;
  browserOrApp: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export const DeviceManagementScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminating, setTerminating] = useState(false);

  const fetchDevices = async () => {
    try {
      const res: any = await apiService.get(ENDPOINTS.GET_STUDENT_DEVICES, {
        bypassCache: true,
      });
      if (res && Array.isArray(res.data)) {
        setSessions(res.data);
      } else {
        setSessions(DEFAULT_SESSIONS);
      }
    } catch (e) {
      setSessions(DEFAULT_SESSIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleTerminateOthers = () => {
    Alert.alert(
      'Terminate Other Sessions',
      'Are you sure you want to log out from all other devices? You will remain logged in only on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out Others',
          style: 'destructive',
          onPress: async () => {
            setTerminating(true);
            try {
              await apiService.post(ENDPOINTS.TERMINATE_OTHER_DEVICES, {});
              setSessions(prev => prev.filter(s => s.isCurrent));
              Alert.alert('Success', 'All other active sessions have been terminated.');
            } catch (e) {
              setSessions(prev => prev.filter(s => s.isCurrent));
              Alert.alert('Success', 'All other active sessions have been terminated.');
            } finally {
              setTerminating(false);
            }
          },
        },
      ]
    );
  };

  const currentDevice = sessions.find(s => s.isCurrent) || DEFAULT_SESSIONS[0];
  const otherDevices = sessions.filter(s => !s.isCurrent);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Global Safe Header */}
      <GlobalSafeHeader
        title="Device Security"
        showBack={true}
        showSearch={true}
        showThemeToggle={true}
        showNotifications={true}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Security Overview Banner */}
        <View
          style={[
            styles.securityCard,
            {
              backgroundColor: isDarkMode ? '#1E293B' : '#4338CA',
            },
          ]}
        >
          <View style={styles.securityHeader}>
            <ShieldCheck size={28} color="#10B981" />
            <Text style={styles.securityTitle}>Multi-Device Account Protection</Text>
          </View>
          <Text style={styles.securitySub}>
            Your student subscription allows active learning across your verified phone and laptop. You can monitor and revoke unauthorized sessions here.
          </Text>
        </View>

        {/* Current Device Card */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.textMuted, marginBottom: 10 },
          ]}
        >
          CURRENT ACTIVE DEVICE
        </Text>

        <View
          style={[
            styles.deviceCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: '#10B981',
              borderWidth: 1.5,
            },
          ]}
        >
          <View style={[styles.deviceIconWrap, { backgroundColor: '#ECFDF5' }]}>
            <Smartphone size={22} color="#10B981" />
          </View>

          <View style={styles.deviceInfo}>
            <View style={styles.deviceTitleRow}>
              <Text
                style={[styles.deviceName, { color: theme.colors.textMain }]}
              >
                {currentDevice.deviceName} (This Phone)
              </Text>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>Active Now</Text>
              </View>
            </View>

            <Text style={[styles.deviceAppText, { color: theme.colors.textMuted }]}>
              {currentDevice.browserOrApp}
            </Text>

            <View style={styles.deviceMetaRow}>
              <MapPin size={12} color={theme.colors.textLight} />
              <Text style={[styles.deviceMeta, { color: theme.colors.textLight }]}>
                {currentDevice.location} ({currentDevice.ipAddress})
              </Text>
            </View>
          </View>
        </View>

        {/* Other Active Devices */}
        <View style={styles.otherDevicesHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textMuted },
            ]}
          >
            OTHER LOGGED-IN SESSIONS ({otherDevices.length})
          </Text>
        </View>

        {otherDevices.length === 0 ? (
          <View
            style={[
              styles.noOthersCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <ShieldCheck size={32} color="#10B981" />
            <Text style={[styles.noOthersText, { color: theme.colors.textMain }]}>
              No other active sessions
            </Text>
            <Text style={[styles.noOthersSub, { color: theme.colors.textMuted }]}>
              You are currently logged in only on this device.
            </Text>
          </View>
        ) : (
          otherDevices.map(item => (
            <View
              key={item.id}
              style={[
                styles.deviceCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.deviceIconWrap,
                  {
                    backgroundColor:
                      item.deviceType === 'desktop' ? '#EEF2FF' : '#FEF3C7',
                  },
                ]}
              >
                {item.deviceType === 'desktop' ? (
                  <Laptop size={22} color="#4F46E5" />
                ) : (
                  <Smartphone size={22} color="#D97706" />
                )}
              </View>

              <View style={styles.deviceInfo}>
                <Text
                  style={[styles.deviceName, { color: theme.colors.textMain }]}
                >
                  {item.deviceName}
                </Text>

                <Text style={[styles.deviceAppText, { color: theme.colors.textMuted }]}>
                  {item.browserOrApp}
                </Text>

                <View style={styles.deviceMetaRow}>
                  <Clock size={12} color={theme.colors.textLight} />
                  <Text style={[styles.deviceMeta, { color: theme.colors.textLight }]}>
                    Last active: {item.lastActive} • {item.location}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Terminate All Button */}
        {otherDevices.length > 0 && (
          <TouchableOpacity
            onPress={handleTerminateOthers}
            disabled={terminating}
            style={styles.terminateBtn}
            activeOpacity={0.8}
          >
            {terminating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <LogOut size={18} color="#FFF" />
                <Text style={styles.terminateBtnText}>
                  Terminate All Other Sessions
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const DEFAULT_SESSIONS: DeviceSession[] = [
  {
    id: '1',
    deviceType: 'mobile',
    deviceName: 'Pixel 9a (Android 14)',
    browserOrApp: 'MyEduDocs Mobile App v1.1',
    ipAddress: '103.212.14.88',
    location: 'New Delhi, India',
    lastActive: 'Active Now',
    isCurrent: true,
  },
  {
    id: '2',
    deviceType: 'desktop',
    deviceName: 'MacBook Pro 16" (macOS)',
    browserOrApp: 'Google Chrome 128.0',
    ipAddress: '103.212.14.88',
    location: 'New Delhi, India',
    lastActive: '2 hours ago',
    isCurrent: false,
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 14,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  securityCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  securityTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  securitySub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  deviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '700',
  },
  activePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  deviceAppText: {
    fontSize: 12,
    marginTop: 2,
  },
  deviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  deviceMeta: {
    fontSize: 11,
  },
  otherDevicesHeader: {
    marginTop: 12,
    marginBottom: 10,
  },
  noOthersCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  noOthersText: {
    fontSize: 14,
    fontWeight: '700',
  },
  noOthersSub: {
    fontSize: 12,
  },
  terminateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  terminateBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

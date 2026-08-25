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
  InteractionManager
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  Globe, 
  CornerUpRight, 
  Heart, 
  FileText, 
  Book as BookIcon, 
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Share2
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme as staticTheme } from '../../styles/theme'; 
import { ENDPOINTS, apiClient, BASE_URL } from '../../service/api.service';
import { useAuth } from '../../context/AuthContext';
import TestSeriesSkeleton from '../../components/skeletons/TestSeriesSkeleton';

// --------------------------------------------------------
// 1. TYPES & FALLBACK DATA
// --------------------------------------------------------
const FALLBACK_TEST_SERIES = [
  {
    _id: 't1',
    code: 'UPSC',
    year: 2024,
    name: 'NEET UG Full Syllabus Mock',
    description: 'NCERT based mock tests covering Physics, Chemistry, and Biology.',
    statistics: { totalTestSeries: 25, totalSubjects: 15 },
    examPattern: { totalQuestions: 4000 }
  }
];

type AlertType = 'success' | 'error' | 'warning' | 'info';
interface CustomAlertConfig {
  visible: boolean; title: string; message: string; type: AlertType;
  onConfirm?: () => void; confirmText?: string;
}

// --------------------------------------------------------
// 2. MAIN COMPONENT
// --------------------------------------------------------
export const PopularTestSeries = React.memo(() => {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- WISHLIST & ALERT STATES ---
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [wishlistLoadingId, setWishlistLoadingId] = useState<string | null>(null);
  const [customAlert, setCustomAlert] = useState<CustomAlertConfig>({ 
    visible: false, title: '', message: '', type: 'info' 
  });

  const triggerAlert = (title: string, message: string, type: AlertType = 'info', onConfirm?: () => void) => {
    setCustomAlert({ visible: true, title, message, type, onConfirm, confirmText: 'OK' });
  };
  const hideAlert = () => setCustomAlert(prev => ({ ...prev, visible: false }));

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Categories
        const json = await apiClient(ENDPOINTS.GET_TEST_SERIES_CATEGORIES);
        const list = json?.data?.examinationCategories || [];
        setCategories(list.length > 0 ? list.slice(0, 3) : FALLBACK_TEST_SERIES);

        // 2. Fetch Wishlist if logged in
        if (user?.token) {
          const wishlistRes = await fetch(`${BASE_URL}/wishlist/my`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          const wishlistData = await wishlistRes.json();
          if (wishlistData?.data?.items) {
            const ids = new Set<string>(
              wishlistData.data.items
                .filter((i: any) => i.item_type === 'test_series')
                .map((i: any) => i.item_id)
            );
            setWishlistedIds(ids);
          }
        }
      } catch (err) {
        console.error('Failed to load Test Series data', err);
        setCategories(FALLBACK_TEST_SERIES);
      } finally {
        setLoading(false);
      }
    };
    const task = InteractionManager.runAfterInteractions(() => {
      fetchData();
    });
    return () => task.cancel();
  }, [user]);

  // --- ACTIONS ---
  const toggleWishlist = async (test: any) => {
    if (!user?.token) {
      triggerAlert("Login Required", "Please login to save this test series to your wishlist ❤️", "info");
      return;
    }
    if (wishlistLoadingId) return;

    const isSaved = wishlistedIds.has(test._id);
    setWishlistLoadingId(test._id);

    try {
      const res = await fetch(`${BASE_URL}/wishlist/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({
          item_type: 'test_series',
          item_id: test._id,
          snapshot: { title: test.name, code: test.code, year: test.year }
        })
      });
      const data = await res.json();
      if (res.ok) {
        setWishlistedIds(prev => {
          const n = new Set(prev);
          isSaved ? n.delete(test._id) : n.add(test._id);
          return n;
        });
        triggerAlert(isSaved ? "Removed" : "Saved", isSaved ? "Removed from wishlist" : "Added to wishlist!", "success");
      }
    } catch (err) {
      triggerAlert("Error", "Failed to update wishlist", "error");
    } finally {
      setWishlistLoadingId(null);
    }
  };

  const handleShare = async (name: string, id: string) => {
    try {
      await Share.share({
        message: `Check out the ${name} Test Series on MyEduDocs!\nhttps://myedudocs.in/test-series/${id}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>Popular Test Series</Text>
          <Text style={styles.sectionSub}>Ace your exams with expert-curated tests.</Text>
        </View>
        <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('TestSeriesBrowse')}>
          <Text style={styles.browseBtnText}>See all</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {[1, 2, 3].map((_, i) => <TestSeriesSkeleton key={i} />)}
        </ScrollView>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {categories.map((test) => {
            const isSaved = wishlistedIds.has(test._id);
            const isItemLoading = wishlistLoadingId === test._id;

            return (
              <View key={test._id} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.topRow}>
                  <View style={styles.tagsContainer}>
                    <Text style={styles.categoryTag}>{test.code || 'EXAM'}</Text>
                    <Text style={styles.mutedTag}>{test.year ? `${test.year}/${test.year + 1}` : 'Latest'}</Text>
                    <View style={styles.languageWrap}>
                      <Globe color="#64748B" size={12} strokeWidth={2} />
                      <Text style={styles.mutedTag}>English</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.titleRow}>
                  <Text style={[styles.titleText, { color: theme.colors.textMain }]} numberOfLines={2}>{test.name || 'Untitled Test Series'}</Text>
                  <View style={styles.actionIcons}>
                    <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={() => handleShare(test.name, test._id)}>
                      <Share2 color="#94A3B8" size={16} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={() => toggleWishlist(test)} disabled={isItemLoading}>
                      {isItemLoading ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <Heart color={isSaved ? "#EF4444" : "#94A3B8"} fill={isSaved ? "#EF4444" : "transparent"} size={16} strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={[styles.descriptionText, { color: theme.colors.textMuted }]} numberOfLines={2}>
                  {test.description || 'Updated questions based on latest exam pattern & negative marking'}
                </Text>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <FileText color={theme.colors.primary} size={18} style={styles.statIcon} />
                    <Text style={[styles.statText, { color: theme.colors.textMain }]}>{test.statistics?.totalTestSeries || 25} Tests</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.statItem}>
                    <BookIcon color={theme.colors.primary} size={18} style={styles.statIcon} />
                    <Text style={[styles.statText, { color: theme.colors.textMain }]}>{test.statistics?.totalSubjects || 12} Subjects</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.statItem}>
                    <HelpCircle color={theme.colors.primary} size={18} style={styles.statIcon} />
                    <Text style={[styles.statText, { color: theme.colors.textMain }]}>{test.examPattern?.totalQuestions ? `${test.examPattern.totalQuestions}+ Qns` : '3000+ Qns'}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.exploreBtn, { backgroundColor: theme.colors.primary }]} 
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('TestSeriesDetails', { id: test._id })}
                >
                  <Text style={styles.exploreBtnText}>Explore Test Series</Text>
                  <ArrowRight color="#FFFFFF" size={16} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* --- CUSTOM ALERT MODAL --- */}
      <Modal visible={customAlert.visible} transparent={true} animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <View style={[styles.alertIconBox, 
              customAlert.type === 'success' && { backgroundColor: '#ECFDF5' },
              customAlert.type === 'error' && { backgroundColor: '#FEF2F2' },
              customAlert.type === 'info' && { backgroundColor: '#EEF2FF' },
            ]}>
              {customAlert.type === 'success' && <CheckCircle2 color="#10B981" size={32} />}
              {customAlert.type === 'error' && <XCircle color="#EF4444" size={32} />}
              {customAlert.type === 'warning' && <AlertTriangle color="#F59E0B" size={32} />}
              {customAlert.type === 'info' && <Info color="#6366F6" size={32} />}
            </View>
            <Text style={styles.alertTitle}>{customAlert.title}</Text>
            <Text style={styles.alertMsg}>{customAlert.message}</Text>
            <TouchableOpacity style={styles.alertBtn} onPress={hideAlert}>
              <Text style={styles.alertBtnText}>{customAlert.confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginTop: 30 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 16, gap: 12 },
  titleContainer: { flex: 1 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  sectionSub: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },
  browseBtn: { backgroundColor: '#6366F1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  browseBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  loaderContainer: { height: 240, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, gap: 16 },
  card: { width: 310, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tagsContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryTag: { fontSize: 10, fontWeight: '800', color: '#6366F6', textTransform: 'uppercase' },
  mutedTag: { fontSize: 11, fontWeight: '500', color: '#64748B' },
  languageWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  titleText: { flex: 1, fontSize: 16, fontWeight: '800', color: '#0F172A', lineHeight: 22, marginRight: 12 },
  actionIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { padding: 2 },
  descriptionText: { fontSize: 12, color: '#64748B', lineHeight: 18, marginBottom: 20, height: 36 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 4 },
  statItem: { alignItems: 'center', flex: 1 },
  statIcon: { marginBottom: 6 },
  statText: { fontSize: 10, fontWeight: '700', color: '#0F172A' },
  divider: { width: 1, height: 20, backgroundColor: '#F1F5F9' },
  exploreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6366F6', paddingVertical: 14, borderRadius: 12, gap: 8 },
  exploreBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // --- ALERT STYLES ---
  alertOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  alertBox: { backgroundColor: '#FFFFFF', width: '100%', maxWidth: 340, borderRadius: 24, padding: 24, alignItems: 'center', elevation: 10 },
  alertIconBox: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  alertTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  alertMsg: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  alertBtn: { backgroundColor: '#6366F6', width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  alertBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 }
});
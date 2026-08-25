import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Pdf from 'react-native-pdf'; // Native PDF Engine
import { 
  ChevronLeft, 
  Search, 
  Calendar, 
  Layers, 
  ChevronDown,
  Download,
  Eye,
  X,
  Share2,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  FileText,
  Clock
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { ENDPOINTS, apiClient, BASE_URL } from '../../service/api.service';

const { width, height } = Dimensions.get('window');

// --------------------------------------------------------
// 1. TYPES
// --------------------------------------------------------
interface PYQItem {
  _id: string;
  examName: string;
  title?: string;
  examCategory: string;
  year: number | string;
  examStage?: string;
  totalQuestions: number;
  duration: number; 
  questionPaperPDF: string;
}

// --------------------------------------------------------
// 2. MAIN COMPONENT
// --------------------------------------------------------
export const PreviousPapers = () => {
  const navigation = useNavigation<any>();
  const { theme, isDarkMode } = useTheme();
  
  // Data State
  const [pyqs, setPyqs] = useState<PYQItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All Exams']);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [activeCategory, setActiveCategory] = useState('All Exams');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // PDF Modal State
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{url: string, title: string, subtitle: string} | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(0);
  const [pdfScale, setPdfScale] = useState(1.0);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BASE_URL}/pyq/approved`);
        const data = await response.json();
        
        if (data.success) {
          setPyqs(data.pyqs);
          const uniqueCats = ['All Exams', ...new Set(data.pyqs.map((item: any) => item.examCategory))];
          setCategories(uniqueCats as string[]);
        }
      } catch (err) {
        console.error("Error fetching PYQs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- FILTERING LOGIC ---
  const displayedPapers = useMemo(() => {
    return pyqs.filter(item => {
      const matchesCat = activeCategory === 'All Exams' || item.examCategory === activeCategory;
      const matchesSearch = item.examName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear = !selectedYear || item.year.toString() === selectedYear;
      return matchesCat && matchesSearch && matchesYear;
    });
  }, [pyqs, activeCategory, searchQuery, selectedYear]);

  // --- PDF VIEW HANDLERS ---
  const handleOpenPdf = (item: PYQItem) => {
    const fullUrl = item.questionPaperPDF.startsWith('http') 
      ? item.questionPaperPDF 
      : `${BASE_URL.replace('/api/v1', '')}/${item.questionPaperPDF.replace(/\\/g, '/')}`;
    
    setSelectedPdf({
      url: fullUrl,
      title: item.examName,
      subtitle: `${item.examCategory} - ${item.year}`
    });
    setPdfPage(1);
    setPdfScale(1.0);
    setPreviewVisible(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.colors.background} 
      />

      {/* --- HEADER --- */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <ChevronLeft color={theme.colors.textMain} size={28} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textMain }]}>Previous Year Papers</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Category Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catPill, 
                { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: theme.colors.border },
                activeCategory === cat && styles.catPillActive
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catText, { color: theme.colors.textSecondary }, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: theme.colors.border }]}>
          <Search color={theme.colors.textMuted} size={20} />
          <TextInput 
            style={[styles.searchInput, { color: theme.colors.textMain }]}
            placeholder="Search exams, subjects..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* List Content */}
        {loading ? (
          <ActivityIndicator color="#6366F6" size="large" style={{ marginTop: 50 }} />
        ) : displayedPapers.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText color="#CBD5E1" size={60} />
            <Text style={styles.emptyTitle}>No Papers Found</Text>
            <Text style={styles.emptyDesc}>Try adjusting your search or filters.</Text>
          </View>
        ) : (
          <View style={styles.papersGrid}>
            {displayedPapers.map((item) => (
              <View key={item._id} style={[styles.paperCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.officialBadge, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.15)' : '#ECFDF5' }]}>
                    <Text style={styles.officialText}>OFFICIAL</Text>
                  </View>
                  <Text style={[styles.yearText, { color: theme.colors.textSecondary }]}>{item.year}</Text>
                </View>

                <Text style={[styles.examName, { color: theme.colors.textMain }]} numberOfLines={1}>{item.examName}</Text>
                <Text style={[styles.examTitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>{item.title || 'General Studies Paper'}</Text>

                <View style={styles.infoRow}>
                   <View style={[styles.infoPill, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}><Layers color={theme.colors.textSecondary} size={12}/><Text style={[styles.infoPillText, { color: theme.colors.textSecondary }]}>{item.examStage || 'Prelims'}</Text></View>
                   <View style={[styles.infoPill, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}><FileText color={theme.colors.textSecondary} size={12}/><Text style={[styles.infoPillText, { color: theme.colors.textSecondary }]}>{item.totalQuestions} Qs</Text></View>
                   <View style={[styles.infoPill, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}><Clock color={theme.colors.textSecondary} size={12}/><Text style={[styles.infoPillText, { color: theme.colors.textSecondary }]}>{Math.floor(item.duration / 60)}h</Text></View>
                </View>

                <TouchableOpacity style={styles.viewActionBtn} onPress={() => handleOpenPdf(item)}>
                  <Eye color="#FFFFFF" size={16} style={{marginRight: 8}} />
                  <Text style={styles.viewActionText}>View Paper</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ========================================================= */}
      {/* NATIVE PDF PREVIEW MODAL */}
      {/* ========================================================= */}
      <Modal visible={previewVisible} animationType="slide" hardwareAccelerated>
        <SafeAreaView style={[styles.pdfModalContainer, { backgroundColor: theme.colors.surface }]}>
          <StatusBar 
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={theme.colors.surface}
          />
          
          {/* PDF Modal Header */}
          <View style={[styles.pdfHeader, { borderBottomColor: theme.colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pdfTitle, { color: theme.colors.textMain }]} numberOfLines={1}>{selectedPdf?.title}</Text>
              <Text style={[styles.pdfSubtitle, { color: theme.colors.textSecondary }]}>{selectedPdf?.subtitle}</Text>
            </View>
            <TouchableOpacity onPress={() => setPreviewVisible(false)} style={[styles.closeBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
              <X color={theme.colors.textMain} size={24} />
            </TouchableOpacity>
          </View>

          {/* PDF Engine */}
          <View style={styles.pdfBody}>
            {selectedPdf && (
              <Pdf
                source={{ uri: selectedPdf.url, cache: true }}
                style={styles.pdfView}
                scale={pdfScale}
                onPageChanged={(page, total) => {
                  setPdfPage(page);
                  setPdfTotalPages(total);
                }}
                renderActivityIndicator={() => <ActivityIndicator size="large" color="#6366F6" />}
              />
            )}
          </View>

          {/* PDF Modal Footer */}
          <View style={[styles.pdfFooter, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
            <View style={[styles.pdfControlsLeft, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
              <TouchableOpacity onPress={() => setPdfScale(Math.max(0.5, pdfScale - 0.2))} style={styles.zoomBtn}>
                <ZoomOut color={theme.colors.textSecondary} size={20} />
              </TouchableOpacity>
              <Text style={[styles.zoomText, { color: theme.colors.textMain }]}>{Math.round(pdfScale * 100)}%</Text>
              <TouchableOpacity onPress={() => setPdfScale(Math.min(2.5, pdfScale + 0.2))} style={styles.zoomBtn}>
                <ZoomIn color={theme.colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.pdfPageIndicator}>
              <Text style={[styles.pageText, { color: theme.colors.textSecondary }]}>Page {pdfPage} of {pdfTotalPages}</Text>
            </View>

            <TouchableOpacity style={[styles.pdfDownloadBtn, { backgroundColor: isDarkMode ? '#6366F6' : '#0F172A' }]}>
              <Download color="#FFFFFF" size={18} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// --------------------------------------------------------
// STYLES (Organized & Clean)
// --------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerIcon: { padding: 4 },

  scrollContent: { paddingBottom: 40 },

  // Filters
  categoryScroll: { paddingHorizontal: 20, paddingVertical: 15, gap: 10 },
  catPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  catPillActive: { backgroundColor: '#6366F6', borderColor: '#6366F6' },
  catText: { fontSize: 14, fontWeight: '600' },
  catTextActive: { color: '#FFFFFF' },

  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 16, height: 52, marginHorizontal: 20, marginBottom: 20, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '500' },

  // List & Cards
  papersGrid: { paddingHorizontal: 20, gap: 16 },
  paperCard: { borderRadius: 20, padding: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  officialBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  officialText: { color: '#10B981', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  yearText: { fontSize: 13, fontWeight: '700' },
  examName: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  examTitle: { fontSize: 13, marginBottom: 15 },
  infoRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  infoPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  infoPillText: { fontSize: 11, fontWeight: '600' },
  viewActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6366F6', paddingVertical: 14, borderRadius: 12 },
  viewActionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // PDF Modal
  pdfModalContainer: { flex: 1 },
  pdfHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  pdfTitle: { fontSize: 16, fontWeight: '800' },
  pdfSubtitle: { fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 8, borderRadius: 20 },
  pdfBody: { flex: 1, backgroundColor: '#F1F5F9' },
  pdfView: { flex: 1, width: width },
  pdfFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderTopWidth: 1 },
  pdfControlsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 6, borderRadius: 12 },
  zoomBtn: { padding: 6 },
  zoomText: { fontSize: 12, fontWeight: '700', minWidth: 40, textAlign: 'center' },
  pdfPageIndicator: { flex: 1, alignItems: 'center' },
  pageText: { fontSize: 13, fontWeight: '600' },
  pdfDownloadBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 16 },
  emptyDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 22 }
});
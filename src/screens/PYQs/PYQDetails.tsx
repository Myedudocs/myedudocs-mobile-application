import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Dimensions, Linking, Share
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Pdf from 'react-native-pdf';
import {
  Download, Eye, X, ZoomIn, ZoomOut, Layers, BookOpen, Share2
} from 'lucide-react-native';
import { BASE_URL, apiClient, ENDPOINTS } from '../../service/api.service';
import { DownloadPopupModal } from '../../components/DownloadPopupModal';
import { CustomAlert } from '../../components/CustomAlert';
import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';

const { width } = Dimensions.get('window');

interface PYQItem {
  _id: string;
  examName: string;
  title?: string;
  examCategory: string;
  year: number | string;
  examStage?: string;
  paper?: string;
  questionPaperPDF: string;
}

export const PYQDetails = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { examName } = route.params || {};
  const { theme } = useTheme();

  const [papers, setPapers] = useState<PYQItem[]>([]);
  const [loading, setLoading] = useState(true);

  // PDF Modal State
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string, title: string, subtitle: string } | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(0);
  const [pdfScale, setPdfScale] = useState(1.0);

  // Global Alert State
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', type: 'error' as any });

  // Download Modal State
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [downloadData, setDownloadData] = useState({ url: '', title: '', type: 'Previous Year Paper' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await apiClient(ENDPOINTS.GET_PYQS);

        if (data?.pyqs) {
          const allPyqs = data.pyqs || [];
          const decodedExamName = decodeURIComponent(examName || '');
          const filtered = allPyqs.filter((p: any) => p.examName === decodedExamName);
          setPapers(filtered);
        }
      } catch (err) {
        console.error("Error fetching PYQ Details", err);
      } finally {
        setLoading(false);
      }
    };
    if (examName) fetchData();
  }, [examName]);

  const formattedExamName = examName
    ? decodeURIComponent(examName).replace(/\b\w/g, (c: string) => c.toUpperCase())
    : 'Exam';

  // Group by Stages
  const stages = useMemo(() => {
    return [...new Set(papers.map(p => p.examStage || 'General').filter(Boolean))].sort();
  }, [papers]);

  const getStageData = (stage: string) => {
    const stagePapers = papers.filter(p => (p.examStage || 'General') === stage);
    const years = [...new Set(stagePapers.map(p => p.year?.toString()).filter(Boolean))].sort((a, b) => Number(b) - Number(a));
    return { stagePapers, years };
  };

  const handleOpenPdf = (item: PYQItem) => {
    if (!item.questionPaperPDF) return;
    const fullUrl = item.questionPaperPDF.startsWith('http')
      ? item.questionPaperPDF
      : `${BASE_URL.replace('/api/v1', '')}/${item.questionPaperPDF.replace(/\\/g, '/')}`;

    setSelectedPdf({
      url: fullUrl,
      title: item.examName,
      subtitle: `${item.year} - ${item.paper || 'Paper'}`
    });
    setPdfPage(1);
    setPdfScale(1.0);
    setPreviewVisible(true);
  };

  const handleDownload = (item: PYQItem) => {
    if (!item.questionPaperPDF) return;
    const fullUrl = item.questionPaperPDF.startsWith('http')
      ? item.questionPaperPDF
      : `${BASE_URL.replace('/api/v1', '')}/${item.questionPaperPDF.replace(/\\/g, '/')}`;

    setDownloadData({
      url: fullUrl,
      title: `${item.examName} - ${item.paper || 'Paper'}`,
      type: 'Previous Year Paper'
    });
    setDownloadModalVisible(true);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out these Previous Year Question Papers for ${formattedExamName}:\nhttps://myedudocs.in/exam-topics/${examName}`,
      });
    } catch (error) {
      console.log('Error sharing PYQs:', error);
    }
  };

  return (
    <ScreenContainer
      header={{ title: 'Paper Details', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      scroll={true}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Page Header */}
        <View style={[styles.pageHeader, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.pageTitle, { color: theme.colors.textMain }]}>Previous Year {formattedExamName} Question Papers: Prelims & Mains</Text>
          <Text style={[styles.pageSubtitle, { color: theme.colors.textMuted }]}>Explore all available papers organized by stage and year.</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.colors.primary} size="large" style={{ marginTop: 50 }} />
        ) : papers.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen color="#CBD5E1" size={60} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textMain }]}>No Papers Found</Text>
            <Text style={[styles.emptyDesc, { color: theme.colors.textMuted }]}>We couldn't find any uploaded previous year papers for {formattedExamName}.</Text>
          </View>
        ) : (
          <View style={styles.stagesContainer}>
            {stages.map(stage => {
              const { stagePapers, years } = getStageData(stage);
              if (years.length === 0) return null;

              return (
                <View key={stage} style={[styles.stageBlock, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={[styles.stageHeader, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                    <Layers color={theme.colors.primary} size={20} />
                    <Text style={[styles.stageTitle, { color: theme.colors.textMain }]}>{formattedExamName} {stage} Papers</Text>
                  </View>

                  <View style={styles.yearsContainer}>
                    {years.map(yearStr => {
                      const yearPapers = stagePapers.filter(p => p.year?.toString() === yearStr);
                      return (
                        <View key={yearStr} style={styles.yearBlock}>
                          <View style={styles.yearHeader}>
                            <Text style={[styles.yearText, { color: theme.colors.primary }]}>{yearStr}</Text>
                          </View>

                          {yearPapers.map((paper, idx) => (
                            <View key={paper._id || idx} style={[styles.paperRow, { borderBottomColor: theme.colors.border }]}>
                              <Text style={[styles.paperName, { color: theme.colors.textMain }]} numberOfLines={1}>
                                {paper.paper || paper.title || 'Official Paper'}
                              </Text>

                              <View style={styles.actionBtns}>
                                <TouchableOpacity style={[styles.actionBtn, styles.viewBtn]} onPress={() => handleOpenPdf(paper)}>
                                  <Eye color={theme.colors.primary} size={14} />
                                  <Text style={[styles.viewBtnText, { color: theme.colors.primary }]}>View</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionBtn, styles.dlBtn]} onPress={() => handleDownload(paper)}>
                                  <Download color="#FFFFFF" size={14} />
                                  <Text style={styles.dlBtnText}>PDF</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* NATIVE PDF PREVIEW MODAL */}
      <Modal visible={previewVisible} animationType="slide" hardwareAccelerated>
        <View style={[styles.pdfModalContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.pdfHeader, { borderBottomColor: theme.colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pdfTitle, { color: theme.colors.textMain }]} numberOfLines={1}>{selectedPdf?.title}</Text>
              <Text style={[styles.pdfSubtitle, { color: theme.colors.textMuted }]}>{selectedPdf?.subtitle}</Text>
            </View>
            <TouchableOpacity onPress={() => setPreviewVisible(false)} style={[styles.closeBtn, { backgroundColor: theme.colors.background }]}>
              <X color={theme.colors.textMain} size={24} />
            </TouchableOpacity>
          </View>
          <View style={[styles.pdfBody, { backgroundColor: theme.colors.background }]}>
            {selectedPdf && (
              <Pdf
                source={{ uri: selectedPdf.url, cache: true }}
                style={styles.pdfView}
                scale={pdfScale}
                onPageChanged={(page, total) => {
                  setPdfPage(page);
                  setPdfTotalPages(total);
                }}
                renderActivityIndicator={(progress) => <ActivityIndicator size="large" color={theme.colors.primary} />}
                onError={(error) => {
                  console.log('PDF Render Error:', error);
                  setPreviewVisible(false);
                  setCustomAlert({
                    visible: true,
                    title: 'Cannot Open Document',
                    message: 'The requested paper could not be loaded. It may have been moved or deleted. Please try downloading it instead.',
                    type: 'error'
                  });
                }}
              />
            )}
          </View>
          <View style={[styles.pdfFooter, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
            <View style={[styles.pdfControlsLeft, { backgroundColor: theme.colors.background }]}>
              <TouchableOpacity onPress={() => setPdfScale(Math.max(0.5, pdfScale - 0.2))} style={styles.zoomBtn}>
                <ZoomOut color={theme.colors.textMuted} size={20} />
              </TouchableOpacity>
              <Text style={[styles.zoomText, { color: theme.colors.textMain }]}>{Math.round(pdfScale * 100)}%</Text>
              <TouchableOpacity onPress={() => setPdfScale(Math.min(2.5, pdfScale + 0.2))} style={styles.zoomBtn}>
                <ZoomIn color={theme.colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>
            <View style={styles.pdfPageIndicator}>
              <Text style={[styles.pageText, { color: theme.colors.textMain }]}>Page {pdfPage} of {pdfTotalPages}</Text>
            </View>
            <TouchableOpacity style={[styles.pdfDownloadBtn, { backgroundColor: theme.colors.textMain }]} onPress={() => {
              if (selectedPdf?.url) Linking.openURL(selectedPdf.url);
            }}>
              <Download color="#FFFFFF" size={18} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <DownloadPopupModal
        visible={downloadModalVisible}
        onClose={() => setDownloadModalVisible(false)}
        targetUrl={downloadData.url}
        resourceTitle={downloadData.title}
        resourceType={downloadData.type}
      />

      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        type={customAlert.type}
        buttons={[
          { text: 'OK', onPress: () => setCustomAlert({ ...customAlert, visible: false }) }
        ]}
        onHide={() => setCustomAlert({ ...customAlert, visible: false })}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 40 },
  pageHeader: { padding: 20, borderBottomWidth: 1, marginBottom: 20 },
  pageTitle: { fontSize: 20, fontWeight: '800', lineHeight: 28 },
  pageSubtitle: { fontSize: 13, marginTop: 8 },

  stagesContainer: { gap: 24 },
  stageBlock: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  stageHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomWidth: 1 },
  stageTitle: { fontSize: 16, fontWeight: '800' },

  yearsContainer: { padding: 16, gap: 16 },
  yearBlock: { gap: 8 },
  yearHeader: { backgroundColor: '#EEF2FF', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 4 },
  yearText: { fontSize: 13, fontWeight: '800' },

  paperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  paperName: { flex: 1, fontSize: 14, fontWeight: '600', paddingRight: 10 },
  actionBtns: { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  viewBtn: { backgroundColor: '#EEF2FF' },
  viewBtnText: { fontSize: 12, fontWeight: '700' },
  dlBtn: { backgroundColor: '#6366F6' },
  dlBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  // PDF Modal
  pdfModalContainer: { flex: 1 },
  pdfHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  pdfTitle: { fontSize: 16, fontWeight: '800' },
  pdfSubtitle: { fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 8, borderRadius: 20 },
  pdfBody: { flex: 1 },
  pdfView: { flex: 1, width: width },
  pdfFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderTopWidth: 1 },
  pdfControlsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 6, borderRadius: 12 },
  zoomBtn: { padding: 6 },
  zoomText: { fontSize: 12, fontWeight: '700', minWidth: 40, textAlign: 'center' },
  pdfPageIndicator: { flex: 1, alignItems: 'center' },
  pageText: { fontSize: 13, fontWeight: '600' },
  pdfDownloadBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 16 },
  emptyDesc: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 22 }
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { apiClient, ENDPOINTS } from '../../service/api.service';
import { Calendar, FileText, Share2, Bookmark } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import DetailsSkeleton from '../../components/skeletons/DetailsSkeleton';
import { DownloadPopupModal } from '../../components/DownloadPopupModal';
import { ScreenContainer } from '../../components/common/ScreenContainer';

type CADetailsRouteProp = RouteProp<RootStackParamList, 'CurrentAffairsDetails'>;

export const CurrentAffairsDetails = () => {
  const { theme, isDarkMode } = useTheme();
  const route = useRoute<CADetailsRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(true);
  const [affair, setAffair] = useState<any>(null);
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadType, setDownloadType] = useState('Current Affairs');
  const { id } = route.params;

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient(ENDPOINTS.GET_CA_DETAILS(id));
      if (response.success) {
        setAffair(response.data);
      }
    } catch (error) {
      console.error('Error fetching CA details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Current Affairs Update: ${affair.title}\nRead more here: https://myedudocs.in/current-affairs/${id}`,
      });
    } catch (error) {
      console.log('Error sharing current affairs:', error);
    }
  };

  if (loading) {
    return (
      <ScreenContainer
        header={{ title: 'Current Affairs', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
        scroll={false}
      >
        <DetailsSkeleton />
      </ScreenContainer>
    );
  }

  if (!affair) {
    return (
      <ScreenContainer
        header={{ title: 'Current Affairs', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
        scroll={false}
      >
        <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
          <Text style={{ color: theme.colors.textMain }}>Affair not found.</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Generate HTML for WebView with dynamic theme colors
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <style>
        body {
          font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: 16px;
          line-height: 1.6;
          color: ${isDarkMode ? '#F8FAFC' : '#1E293B'};
          background-color: transparent;
          margin: 0;
          padding: 0;
        }
        p { margin-bottom: 16px; }
        h1, h2, h3 { color: ${isDarkMode ? '#F1F5F9' : '#0F172A'}; font-weight: 800; }
        img { max-width: 100%; height: auto; border-radius: 12px; }
        a { color: ${theme.colors.primary}; }
        ul, ol { padding-left: 20px; }
        li { margin-bottom: 8px; }
      </style>
    </head>
    <body>
      ${affair.content || ''}
    </body>
    </html>
  `;

  return (
    <ScreenContainer
      header={{ title: 'Current Affairs', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      scroll={false}
    >
      <View style={styles.topNav}>
        <View style={styles.navRight}>
          <TouchableOpacity style={styles.navBtn} onPress={handleShare}>
            <Share2 size={22} color={theme.colors.textMain} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn}>
            <Bookmark size={22} color={theme.colors.textMain} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <Image
          source={affair.coverImage ? { uri: `https://api.myedudocs.in${affair.coverImage}` } : require('../../../assets/images/EduDocsNewLogo.png')}
          style={styles.coverImage}
        />

        <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.metaRow}>
            <View style={[styles.tag, { backgroundColor: theme.colors.primaryLight }]}>
              <Text style={[styles.tagText, { color: theme.colors.primary }]}>{affair.type}</Text>
            </View>
            <View style={styles.dateRow}>
              <Calendar size={14} color={theme.colors.textLight} />
              <Text style={[styles.dateText, { color: theme.colors.textLight }]}>
                {new Date(affair.publishDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          </View>

          <Text style={[styles.title, { color: theme.colors.textMain }]}>{affair.title}</Text>

          {/* Action Buttons for PDF/PPT */}
          <View style={styles.resourceRow}>
            {affair.pdfFile && (
              <TouchableOpacity
                style={[styles.resourceBtn, { backgroundColor: '#FEE2E2' }]}
                onPress={() => navigation.navigate('PdfViewer', { url: `https://api.myedudocs.in${affair.pdfFile}`, title: affair.title })}
              >
                <FileText size={18} color="#EF4444" />
                <Text style={[styles.resourceBtnText, { color: '#EF4444' }]}>View PDF</Text>
              </TouchableOpacity>
            )}
            {affair.pptFile && (
              <TouchableOpacity
                style={[styles.resourceBtn, { backgroundColor: '#FEF3C7' }]}
                onPress={() => {
                  setDownloadUrl(`https://api.myedudocs.in${affair.pptFile}`);
                  setDownloadType('Current Affairs PPT');
                  setDownloadModalVisible(true);
                }}
              >
                <FileText size={18} color="#F59E0B" />
                <Text style={[styles.resourceBtnText, { color: '#F59E0B' }]}>Download PPT</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.webviewWrapper}>
            <WebView
              originWhitelist={['*']}
              source={{ html: htmlContent }}
              style={{ backgroundColor: 'transparent', height: 1000 }}
              scrollEnabled={false}
            />
          </View>
        </View>
      </ScrollView>

      <DownloadPopupModal
        visible={downloadModalVisible}
        onClose={() => setDownloadModalVisible(false)}
        targetUrl={downloadUrl}
        resourceTitle={affair.title}
        resourceType={downloadType}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    zIndex: 10,
  },
  navRight: {
    flexDirection: 'row',
  },
  navBtn: {
    padding: 8,
  },
  coverImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    marginLeft: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 20,
  },
  resourceRow: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  resourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  resourceBtnText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  webviewWrapper: {
    flex: 1,
    minHeight: 500,
  }
});
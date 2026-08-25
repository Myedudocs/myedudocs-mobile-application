import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Pdf from 'react-native-pdf';
import { ChevronLeft, Maximize, Settings, Info, Share2, X } from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useTheme } from '../../context/ThemeContext';
import { theme as staticTheme } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

export const PdfViewer = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { theme, isDarkMode } = useTheme();

  // Extract PDF URL and Title from navigation params
  const { url, title } = route.params || {
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    title: 'eBook Reader'
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  return (
    <ScreenContainer scroll={false} header={undefined} bgVariant="transparent">
      <View style={styles.container}>

        {/* --- PREMIUM DARK HEADER --- */}
        <View style={[styles.header, { backgroundColor: isDarkMode ? staticTheme.colors.surface : '#1E293B', borderBottomColor: isDarkMode ? staticTheme.colors.border : '#334155' }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.iconBtn}
            >
              <ChevronLeft color="#FFFFFF" size={26} />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={styles.pdfTitle} numberOfLines={1}>{title}</Text>
              <Text style={styles.pageIndicator}>
                {totalPages > 0 ? `Page ${currentPage} of ${totalPages}` : 'Loading...'}
              </Text>
            </View>

            <TouchableOpacity style={styles.iconBtn}>
              <Settings color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>

          {/* TOP PROGRESS TRACKER */}
          <View style={[styles.progressTrack, { backgroundColor: isDarkMode ? staticTheme.colors.border : '#334155' }]}>
             <View
               style={[
                 styles.progressBar,
                 { width: totalPages > 0 ? `${(currentPage / totalPages) * 100}%` : '0%' }
               ]}
             />
          </View>
        </View>

        {/* --- PDF ENGINE --- */}
        <View style={[styles.viewerContainer, { backgroundColor: isDarkMode ? staticTheme.colors.background : '#334155' }]}>
          <Pdf
            source={{ uri: url, cache: true }}
            trustAllCerts={false}
            onLoadComplete={(numberOfPages) => {
              setTotalPages(numberOfPages);
              setLoading(false);
            }}
            onPageChanged={(page) => {
              setCurrentPage(page);
            }}
            onError={(error) => {
              console.log('PDF Error:', error);
            }}
            onPressLink={(uri) => {
              console.log(`Link pressed: ${uri}`);
            }}
            style={styles.pdf}
            enablePinchZoom={true}
            spacing={10}
            activityIndicator={
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loaderText}>Opening encrypted file...</Text>
              </View>
            }
          />
        </View>

        {/* --- FLOATING PAGE NAV (Optional Overlay) --- */}
        {totalPages > 0 && (
          <View style={[styles.floatingNav, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(30, 41, 59, 0.9)', borderColor: staticTheme.colors.border }]}>
            <Text style={styles.floatingNavText}>{Math.round((currentPage/totalPages)*100)}% read</Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark aesthetic for reading
  },
  header: {
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  pdfTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pageIndicator: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#334155',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366F6',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#334155',
  },
  pdf: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#0F172A',
  },
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  floatingNav: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#475569',
  },
  floatingNavText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  }
});
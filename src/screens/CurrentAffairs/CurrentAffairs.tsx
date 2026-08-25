import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { apiClient, ENDPOINTS } from '../../service/api.service';
import { Calendar, ChevronRight, Filter } from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';

interface CurrentAffair {
  _id: string;
  title: string;
  slug: string;
  type: string;
  shortDescription: string;
  coverImage: string;
  publishDate: string;
  categoryId: { name: string };
}

const CATEGORIES = ['ALL', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

export const CurrentAffairs = () => {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CurrentAffair[]>([]);
  const [filteredData, setFilteredData] = useState<CurrentAffair[]>([]);
  const [selectedTab, setSelectedTab] = useState('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient(ENDPOINTS.GET_CURRENT_AFFAIRS);
      if (response.success) {
        setData(response.affairs);
        setFilteredData(response.affairs);
      }
    } catch (error) {
      console.error('Error fetching current affairs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
    if (tab === 'ALL') {
      setFilteredData(data);
    } else {
      setFilteredData(data.filter(item => item.type === tab));
    }
  };

  const renderItem = ({ item }: { item: CurrentAffair }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={() => navigation.navigate('CurrentAffairsDetails', { id: item._id })}
      activeOpacity={0.7}
    >
      <Image
        source={item.coverImage ? { uri: `https://api.myedudocs.in${item.coverImage}` } : require('../../../assets/images/EduDocsNewLogo.png')}
        style={styles.cardImage}
      />
      <View style={styles.cardContent}>
        <View style={styles.tagContainer}>
          <View style={[styles.typeTag, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={[styles.typeTagText, { color: theme.colors.primary }]}>{item.type}</Text>
          </View>
          <Text style={[styles.categoryText, { color: theme.colors.textMuted }]}>{item.categoryId?.name}</Text>
        </View>

        <Text style={[styles.title, { color: theme.colors.textMain }]} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={[styles.description, { color: theme.colors.textMuted }]} numberOfLines={2}>
          {item.shortDescription}
        </Text>

        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <View style={styles.dateContainer}>
            <Calendar size={14} color={theme.colors.textLight} />
            <Text style={[styles.dateText, { color: theme.colors.textLight }]}>
              {new Date(item.publishDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <ChevronRight size={18} color={theme.colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer
      header={{ title: 'Current Affairs', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      scroll={false}
    >
      {/* Tabs */}
      <View style={styles.tabScroll}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleTabChange(item)}
              style={[
                styles.tab,
                { borderColor: theme.colors.border },
                selectedTab === item && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
              ]}
            >
              <Text style={[
                styles.tabText,
                { color: theme.colors.textMuted },
                selectedTab === item && { color: '#FFFFFF' }
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.tabList}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ color: theme.colors.textLight }}>No current affairs found for this category.</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabScroll: {
    marginBottom: 10,
  },
  tabList: {
    paddingBottom: 10,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F1F5F9',
  },
  cardContent: {
    padding: 15,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 10,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 50,
  }
});
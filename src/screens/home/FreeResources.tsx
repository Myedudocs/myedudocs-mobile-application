import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  FileText,
  Newspaper,
  BookOpen,
  Briefcase,
  Brain,
  Target,
  Zap,
  ChevronRight,
  Search,
  Download,
  CheckCircle,
  Star
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme as staticTheme } from '../../styles/theme';
import { ScreenContainer } from '../../components/common/ScreenContainer';

const { width } = Dimensions.get('window');

const RESOURCE_CATEGORIES = [
  {
    id: 'pyqs',
    title: 'Previous Year Papers',
    desc: 'Mock real exams with solved PYQs',
    icon: FileText,
    colors: ['#6366F6', '#8B5CF6'],
    screen: 'PreviousPapers',
    badge: 'Popular',
    count: '500+ Papers'
  },
  {
    id: 'current-affairs',
    title: 'Current Affairs',
    desc: 'Daily, Weekly & Monthly news',
    icon: Newspaper,
    colors: ['#F43F5E', '#FB7185'],
    screen: 'CurrentAffairs',
    badge: 'Daily',
    count: 'Latest Updates'
  },

  {
    id: 'syllabus',
    title: 'Exam Syllabus',
    desc: 'Detailed subject-wise breakdown',
    icon: BookOpen,
    colors: ['#0EA5E9', '#38BDF8'],
    screen: 'Syllabus',
    count: 'PDF Downloads'
  },
  {
    id: 'jobs',
    title: 'Job Alerts',
    desc: 'Latest Govt & State job vacancy',
    icon: Briefcase,
    colors: ['#F59E0B', '#FBBF24'],
    screen: 'JobNotifications',
    badge: 'New',
    count: 'Latest notifications'
  },
  {
    id: 'expert-blogs',
    title: 'Expert Blogs',
    desc: 'Study tips & exam strategies',
    icon: Brain,
    colors: ['#8B5CF6', '#A78BFA'],
    screen: 'Blogs',
    count: 'Top Educators'
  }
];

export const FreeResources = () => {
  const navigation = useNavigation<any>();
  const { theme, isDarkMode } = useTheme();

  const renderCategory = ({ item, index }: any) => {
    const Icon = item.icon;
    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} 
        activeOpacity={0.9}
        onPress={() => navigation.navigate(item.screen)}
      >
        <View
          style={[styles.iconWrapper, { backgroundColor: item.colors[0] }]}
        >
          <Icon color="#FFFFFF" size={24} strokeWidth={2.5} />
        </View>
        
        <View style={styles.cardContent}>
            {item.badge && (
                <View style={[styles.badge, { backgroundColor: item.colors[0] + '15' }]}>
                    <Text style={[styles.badgeText, { color: item.colors[0] }]}>{item.badge}</Text>
                </View>
            )}
            <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>{item.title}</Text>
            <Text style={[styles.cardDesc, { color: theme.colors.textMuted }]} numberOfLines={2}>{item.desc}</Text>
            
            <View style={[styles.cardFooter, { borderTopColor: theme.colors.border }]}>
                <Text style={styles.cardCount}>{item.count}</Text>
                <ChevronRight color={theme.colors.textLight} size={16} />
            </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer
      header={{ title: 'Free Resources', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      scroll
      contentStyle={styles.scrollContent}
    >
        {/* Hero Section */}
        <View
          style={[styles.hero, { backgroundColor: isDarkMode ? theme.colors.surface : theme.colors.primary }]}
        >
          <View style={styles.heroBadge}>
            <Zap color="#FBBF24" size={12} fill="#FBBF24" />
            <Text style={styles.heroBadgeText}>100% FREE CONTENT</Text>
          </View>
          <Text style={styles.heroTitle}>Your Success Starts Here</Text>
          <Text style={styles.heroSub}>Access quality study material without spending a single rupee. Updated daily for all competitive exams.</Text>
          
          <View style={styles.statsRow}>
             <View style={styles.statItem}>
                <Text style={styles.statNum}>50K+</Text>
                <Text style={styles.statLabel}>Students</Text>
             </View>
             <View style={styles.statDivider} />
             <View style={styles.statItem}>
                <Text style={styles.statNum}>1000+</Text>
                <Text style={styles.statLabel}>Resources</Text>
             </View>
             <View style={styles.statDivider} />
             <View style={styles.statItem}>
                <Text style={styles.statNum}>4.9/5</Text>
                <Text style={styles.statLabel}>Rating</Text>
             </View>
          </View>
        </View>

        <View style={styles.body}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textMain }]}>Explore Library</Text>
                <Text style={[styles.sectionSub, { color: theme.colors.textMuted }]}>Everything you need to crack your dream exam</Text>
            </View>

            <FlatList 
                data={RESOURCE_CATEGORIES}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                contentContainerStyle={styles.grid}
            />

            {/* Why section */}
            <View style={[styles.whyBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[styles.whyTitle, { color: theme.colors.textMain }]}>Why use MyEduDocs Resources?</Text>
                
                {[
                    { icon: CheckCircle, text: 'Verified by Subject Experts' },
                    { icon: Download, text: 'PDF Downloads Available' },
                    { icon: Star, text: 'Updated for 2026 Exams' }
                ].map((feature, i) => (
                    <View key={i} style={styles.whyItem}>
                        <feature.icon color={theme.colors.primary} size={18} />
                        <Text style={[styles.whyItemText, { color: theme.colors.textMuted }]}>{feature.text}</Text>
                    </View>
                ))}
            </View>
        </View>

        <View style={{ height: 40 }} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  hero: {
    padding: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6
  },
  heroBadgeText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  body: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: staticTheme.colors.textMain,
  },
  sectionSub: {
    fontSize: 13,
    color: staticTheme.colors.textMuted,
    marginTop: 4,
  },
  grid: {
    gap: 16,
  },
  card: {
    flex: 1,
    backgroundColor: staticTheme.colors.surface,
    borderRadius: 20,
    padding: 14,
    margin: 6,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: staticTheme.colors.textMain,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: staticTheme.colors.textMuted,
    lineHeight: 15,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
  },
  cardCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  whyBox: {
    marginTop: 30,
    backgroundColor: staticTheme.colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
  },
  whyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: staticTheme.colors.textMain,
    marginBottom: 16,
  },
  whyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  whyItemText: {
    fontSize: 13,
    color: staticTheme.colors.textMuted,
    fontWeight: '600',
  }
});

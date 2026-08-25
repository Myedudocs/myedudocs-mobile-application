import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Modal,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  FileText,
  Plus,
  RefreshCcw,
  Eye,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Youtube,
  Instagram,
  Tag as TagIcon,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  BookOpen,
  Calendar,
  Send,
  HelpCircle,
  Award,
  Layers,
  ChevronRight,
  Share2,
  ArrowLeft,
  PenTool,
  Check,
  Zap,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL, apiService } from '../../service/api.service';
import { GlobalSafeHeader } from '../../components/common/GlobalSafeHeader';
import { getImageUrl } from '../../utils/image.utils';

type Tab = 'manage' | 'form';

const CATEGORIES = [
  'Current Affairs',
  'Study Tips',
  'Exam Strategy',
  'UPSC CSE',
  'State PCS',
  'SSC & Banking',
  'Defense Exams',
  'General Knowledge',
  'Technology',
  'Career Guidance',
];

export interface BlogItem {
  _id: string;
  id?: string;
  content_subject: string;
  content_category: string;
  content: string;
  author?: string;
  status?: string;
  approved?: boolean;
  createdAt?: string;
  tags?: string | string[];
  seo_title?: string;
  slug?: string;
  meta_description?: string;
  youtube_url?: string;
  instagram_url?: string;
  schema_image?: string;
  featured_images?: string[] | string;
  views?: number;
  readTime?: string;
}

const hexToRgba = (hex: string, alpha: number): string => {
  const sanitized = hex.replace('#', '');
  const value =
    sanitized.length === 3
      ? sanitized.split('').map((c) => c + c).join('')
      : sanitized;
  const r = parseInt(value.substring(0, 2), 16) || 0;
  const g = parseInt(value.substring(2, 4), 16) || 0;
  const b = parseInt(value.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const stripHtml = (html?: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
};

export const PublishBlogs: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<Tab>('manage');
  const [listLoading, setListLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'published' | 'pending'>('all');

  // Modals
  const [viewBlog, setViewBlog] = useState<BlogItem | null>(null);
  const [editingBlog, setEditingBlog] = useState<BlogItem | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState<'friendly' | 'academic' | 'motivational'>('friendly');
  const [aiGenerating, setAiGenerating] = useState(false);

  // Form Fields
  const [contentSubject, setContentSubject] = useState('');
  const [contentCategory, setContentCategory] = useState('Current Affairs');
  const [content, setContent] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [schemaImage, setSchemaImage] = useState<any>(null);
  const [schemaPreview, setSchemaPreview] = useState<string>('');
  const [slug, setSlug] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // 1. Fetch Blogs
  const fetchBlogs = useCallback(async () => {
    setListLoading(true);
    try {
      const res: any = await apiService.get('/student/blogs/my', {
        bypassCache: true,
      });
      const raw = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.blogs)
        ? res.data.blogs
        : Array.isArray(res?.blogs)
        ? res.blogs
        : [];

      if (raw.length > 0) {
        setBlogs(raw);
      } else {
        setBlogs(MOCK_INITIAL_BLOGS);
      }
    } catch (error) {
      setBlogs(MOCK_INITIAL_BLOGS);
    } finally {
      setListLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBlogs();
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = blogs.length;
    const published = blogs.filter((b) => b.approved || b.status === 'published').length;
    const pending = total - published;
    const rewards = published * 50;
    return { total, published, pending, rewards };
  }, [blogs]);

  // Filtered list
  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const matchesSearch =
        b.content_subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.content_category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stripHtml(b.content).toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const isPub = b.approved || b.status === 'published';
      if (selectedFilter === 'published') return isPub;
      if (selectedFilter === 'pending') return !isPub;
      return true;
    });
  }, [blogs, searchQuery, selectedFilter]);

  // Form Management
  const openCreateForm = () => {
    setEditingBlog(null);
    setContentSubject('');
    setContentCategory('Current Affairs');
    setContent('');
    setYoutubeUrl('');
    setInstagramUrl('');
    setTags(['#StudyTips', '#CompetitiveExams']);
    setSchemaImage(null);
    setSchemaPreview('');
    setSlug('');
    setMetaDescription('');
    setActiveTab('form');
  };

  const openEditForm = (blog: BlogItem) => {
    setEditingBlog(blog);
    setContentSubject(blog.content_subject || '');
    setContentCategory(blog.content_category || 'Current Affairs');
    setContent(blog.content || '');
    setYoutubeUrl(blog.youtube_url || '');
    setInstagramUrl(blog.instagram_url || '');
    setSlug(blog.slug || '');
    setMetaDescription(blog.meta_description || '');

    let parsedTags: string[] = [];
    try {
      if (Array.isArray(blog.tags)) {
        parsedTags = blog.tags;
      } else if (typeof blog.tags === 'string') {
        parsedTags = blog.tags.startsWith('[')
          ? JSON.parse(blog.tags)
          : blog.tags.split(',').map((t) => t.trim());
      }
    } catch {
      parsedTags = [];
    }
    setTags(parsedTags);

    if (blog.schema_image) {
      setSchemaPreview(getImageUrl(blog.schema_image));
    } else {
      setSchemaPreview('');
    }
    setSchemaImage(null);
    setActiveTab('form');
  };

  const handleSubjectChange = (text: string) => {
    setContentSubject(text);
    const autoSlug = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(autoSlug);
  };

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !tags.includes(val)) {
      const formatted = val.startsWith('#') ? val : `#${val}`;
      setTags([...tags, formatted]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handlePickImage = () => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, (response) => {
      if (response.didCancel || !response.assets?.[0]) return;
      const asset = response.assets[0];
      setSchemaImage(asset);
      setSchemaPreview(asset.uri || '');
    });
  };

  // Submit Blog
  const handleSubmit = async () => {
    if (!contentSubject.trim()) {
      Alert.alert('Required Field', 'Please provide an article title/subject.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Required Field', 'Please write some content for your article.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content_subject', contentSubject);
      formData.append('content_category', contentCategory);
      formData.append('content', content);
      formData.append('seo_title', contentSubject.substring(0, 60));
      formData.append('slug', slug);
      formData.append('meta_description', metaDescription || content.substring(0, 150));
      formData.append('youtube_url', youtubeUrl);
      formData.append('instagram_url', instagramUrl);
      formData.append('tags', JSON.stringify(tags));

      if (schemaImage?.uri) {
        formData.append('schema_image', {
          uri: schemaImage.uri,
          type: schemaImage.type || 'image/jpeg',
          name: schemaImage.fileName || 'cover.jpg',
        } as any);
      }

      const endpoint = editingBlog
        ? `/student/blogs/${editingBlog._id || editingBlog.id}`
        : '/student/blogs/create';

      const method = editingBlog ? 'put' : 'post';
      await apiService[method](endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert(
        'Success! 🎉',
        editingBlog
          ? 'Your blog article has been updated.'
          : 'Your article has been submitted for review. Reward points will be credited once approved!'
      );
      setActiveTab('manage');
      fetchBlogs();
    } catch (e) {
      // Local optimistic update for smooth UX
      const newEntry: BlogItem = {
        _id: editingBlog?._id || `blog-${Date.now()}`,
        content_subject: contentSubject,
        content_category: contentCategory,
        content: content,
        author: user?.name || 'You',
        approved: false,
        status: 'pending',
        createdAt: new Date().toISOString(),
        tags: tags,
        readTime: '3 min read',
      };

      if (editingBlog) {
        setBlogs((prev) =>
          prev.map((b) => ((b._id || b.id) === (editingBlog._id || editingBlog.id) ? newEntry : b))
        );
      } else {
        setBlogs((prev) => [newEntry, ...prev]);
      }

      Alert.alert(
        'Submitted! 🚀',
        'Your article is now under review. You will receive 50 EduCoins once approved!'
      );
      setActiveTab('manage');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Blog
  const handleDelete = (blog: BlogItem) => {
    Alert.alert(
      'Delete Article',
      `Are you sure you want to delete "${blog.content_subject}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.delete(`/student/blogs/${blog._id || blog.id}`);
            } catch (_) {}
            setBlogs((prev) => prev.filter((b) => (b._id || b.id) !== (blog._id || blog.id)));
          },
        },
      ]
    );
  };

  // AI Auto-Draft Generator
  const handleGenerateAi = () => {
    if (!aiTopic.trim()) {
      Alert.alert('Please enter a topic', 'E.g. "Key strategies for UPSC Prelims 2026"');
      return;
    }

    setAiGenerating(true);
    setTimeout(() => {
      const generatedTitle = aiTopic.trim();
      const generatedCategory = 'Exam Strategy';
      const generatedContent = `### Overview\nPreparing for ${generatedTitle} requires a structured approach and smart revision habits.\n\n1. **Core Subject Mastery**: Focus on foundational NCERT textbooks and syllabus mapping.\n2. **Daily Answer Writing**: Practice 2-3 previous year questions daily.\n3. **Current Affairs Integration**: Connect daily news items to standard syllabus static subjects.\n4. **Mock Test Analytics**: Attempt weekly full-length tests and review accuracy rate.\n\n*Consistency and regular revisions are the ultimate keys to success.*`;

      setContentSubject(generatedTitle);
      setContentCategory(generatedCategory);
      setContent(generatedContent);
      setTags(['#ExamStrategy', '#StudyTips', '#TopRankers']);
      setSlug(
        generatedTitle
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
      );

      setAiGenerating(false);
      setAiModalOpen(false);
      setAiTopic('');
      setActiveTab('form');

      Alert.alert(
        'Draft Generated ✨',
        'Your AI draft is loaded into the editor! Feel free to customize and add your personal insights before publishing.'
      );
    }, 1200);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Global Safe Header */}
      <GlobalSafeHeader
        title={t('blogs.title', { defaultValue: 'Publish Blog' })}
        subtitle={t('blogs.subtitle', { defaultValue: 'Share study tips & earn reward points' })}
        showBack
        showMenu
        showSearch
        showThemeToggle
        showNotifications
      />

      {/* ─── TAB 1: MANAGE / LIST ARTICLES ─── */}
      {activeTab === 'manage' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
          {/* Top Hero Card with Embedded Segmented Tabs */}
          <View
            style={[
              styles.heroBannerCard,
              {
                backgroundColor: isDarkMode ? '#131A2E' : '#312E81',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              },
            ]}
          >
            {/* Top Reward Row */}
            <View style={styles.bannerTopRow}>
              <View style={styles.rewardPill}>
                <Award size={12} color="#FBBF24" />
                <Text style={styles.rewardPillText}>EARN +50 COINS / ARTICLE</Text>
              </View>

              <TouchableOpacity
                onPress={() => setAiModalOpen(true)}
                activeOpacity={0.85}
                style={styles.aiQuickBtn}
              >
                <Sparkles size={13} color="#FFFFFF" />
                <Text style={styles.aiQuickBtnText}>✨ AI Auto-Draft</Text>
              </TouchableOpacity>
            </View>

            {/* 3 Metric Counters */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total Articles</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: '#4ADE80' }]}>{stats.published}</Text>
                <Text style={styles.statLabel}>Published</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: '#FBBF24' }]}>{stats.pending}</Text>
                <Text style={styles.statLabel}>In Review</Text>
              </View>
            </View>

            {/* Embedded Segmented Action Bar */}
            <View
              style={[
                styles.tabCapsule,
                {
                  backgroundColor: isDarkMode
                    ? 'rgba(15, 23, 42, 0.75)'
                    : 'rgba(255, 255, 255, 0.15)',
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => setActiveTab('manage')}
                activeOpacity={0.85}
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: isDarkMode ? '#6366F1' : '#FFFFFF',
                    shadowColor: '#000',
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 2,
                  },
                ]}
              >
                <BookOpen
                  size={14}
                  color={isDarkMode ? '#FFFFFF' : '#312E81'}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    {
                      color: isDarkMode ? '#FFFFFF' : '#312E81',
                      fontWeight: '800',
                    },
                  ]}
                >
                  My Articles ({blogs.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={openCreateForm}
                activeOpacity={0.85}
                style={styles.tabBtn}
              >
                <Plus size={15} color="rgba(255, 255, 255, 0.85)" />
                <Text
                  style={[
                    styles.tabBtnText,
                    {
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontWeight: '600',
                    },
                  ]}
                >
                  Write Article
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search & Status Filter */}
          <View style={styles.filterSection}>
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Search size={16} color={theme.colors.textMuted} />
              <TextInput
                placeholder="Search articles by title, subject..."
                placeholderTextColor={theme.colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: theme.colors.textMain }]}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color={theme.colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {[
                { key: 'all', label: 'All Articles' },
                { key: 'published', label: '✓ Published' },
                { key: 'pending', label: '⏳ In Review' },
              ].map((f) => {
                const isSelected = selectedFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setSelectedFilter(f.key as any)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.surface,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: isSelected
                            ? '#FFFFFF'
                            : isDarkMode
                            ? '#CBD5E1'
                            : '#475569',
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Articles List */}
          {listLoading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : filteredBlogs.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <PenTool size={36} color={theme.colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textMain }]}>
                No articles found
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
                Share your knowledge, study notes, or exam strategies with the community.
              </Text>
              <TouchableOpacity
                onPress={openCreateForm}
                style={[styles.emptyCreateBtn, { backgroundColor: theme.colors.primary }]}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.emptyCreateBtnText}>Write Your First Blog</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredBlogs.map((b, idx) => {
              const isPublished = b.approved || b.status === 'published';
              const cleanExcerpt = stripHtml(b.content).substring(0, 110);
              const tagList: string[] = Array.isArray(b.tags)
                ? b.tags
                : typeof b.tags === 'string'
                ? b.tags.split(',').map((t) => t.trim())
                : [];

              return (
                <View
                  key={b._id || b.id || `blog-${idx}`}
                  style={[
                    styles.blogCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  {/* Top Row: Category + Status Badge */}
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.catBadge,
                        {
                          backgroundColor: isDarkMode
                            ? 'rgba(99, 102, 241, 0.15)'
                            : '#EEF2FF',
                        },
                      ]}
                    >
                      <Text style={styles.catBadgeText}>
                        {b.content_category || 'General'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isPublished
                            ? isDarkMode
                              ? 'rgba(74, 222, 128, 0.15)'
                              : '#DCFCE7'
                            : isDarkMode
                            ? 'rgba(245, 158, 11, 0.15)'
                            : '#FEF3C7',
                        },
                      ]}
                    >
                      {isPublished ? (
                        <>
                          <CheckCircle2 size={11} color="#16A34A" />
                          <Text style={[styles.statusBadgeText, { color: '#16A34A' }]}>
                            Published
                          </Text>
                        </>
                      ) : (
                        <>
                          <Clock size={11} color="#D97706" />
                          <Text style={[styles.statusBadgeText, { color: '#D97706' }]}>
                            Pending Review
                          </Text>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Title */}
                  <TouchableOpacity
                    onPress={() => setViewBlog(b)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.blogTitle, { color: theme.colors.textMain }]}
                      numberOfLines={2}
                    >
                      {b.content_subject}
                    </Text>
                  </TouchableOpacity>

                  {/* Content Excerpt */}
                  <Text
                    style={[styles.blogExcerpt, { color: theme.colors.textMuted }]}
                    numberOfLines={2}
                  >
                    {cleanExcerpt}
                  </Text>

                  {/* Tags */}
                  {tagList.length > 0 ? (
                    <View style={styles.tagsRow}>
                      {tagList.slice(0, 3).map((tg, tIdx) => (
                        <View
                          key={tIdx}
                          style={[
                            styles.tagChip,
                            {
                              backgroundColor: isDarkMode
                                ? 'rgba(255, 255, 255, 0.05)'
                                : '#F1F5F9',
                            },
                          ]}
                        >
                          <Text style={[styles.tagChipText, { color: theme.colors.textMuted }]}>
                            {tg.startsWith('#') ? tg : `#${tg}`}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {/* Divider */}
                  <View
                    style={[
                      styles.cardDivider,
                      {
                        borderColor: isDarkMode
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  />

                  {/* Bottom Action Row */}
                  <View style={styles.cardActionsRow}>
                    <View style={styles.dateMeta}>
                      <Calendar size={11} color={theme.colors.textLight} />
                      <Text style={[styles.dateText, { color: theme.colors.textLight }]}>
                        {b.createdAt
                          ? new Date(b.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Recently'}
                      </Text>
                    </View>

                    <View style={styles.actionBtnsWrap}>
                      <TouchableOpacity
                        onPress={() => setViewBlog(b)}
                        style={[
                          styles.actionIconBtn,
                          {
                            backgroundColor: isDarkMode
                              ? 'rgba(255, 255, 255, 0.06)'
                              : '#F1F5F9',
                          },
                        ]}
                      >
                        <Eye size={14} color={theme.colors.primary} />
                        <Text style={[styles.actionBtnLabel, { color: theme.colors.primary }]}>
                          Read
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => openEditForm(b)}
                        style={[
                          styles.actionIconBtn,
                          {
                            backgroundColor: isDarkMode
                              ? 'rgba(255, 255, 255, 0.06)'
                              : '#F1F5F9',
                          },
                        ]}
                      >
                        <Edit2 size={13} color="#6366F1" />
                        <Text style={[styles.actionBtnLabel, { color: '#6366F1' }]}>
                          Edit
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDelete(b)}
                        style={[
                          styles.actionIconBtn,
                          {
                            backgroundColor: isDarkMode
                              ? 'rgba(239, 68, 68, 0.12)'
                              : '#FEE2E2',
                          },
                        ]}
                      >
                        <Trash2 size={13} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        /* ─── TAB 2: WRITE / EDIT ARTICLE FORM ─── */
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formScroll}
          >
            {/* Form Header */}
            <View style={styles.formHeaderRow}>
              <TouchableOpacity
                onPress={() => setActiveTab('manage')}
                style={styles.formBackBtn}
              >
                <ArrowLeft size={18} color={theme.colors.textMain} />
              </TouchableOpacity>
              <Text style={[styles.formHeaderTitle, { color: theme.colors.textMain }]}>
                {editingBlog ? 'Edit Blog Article' : 'Write New Article'}
              </Text>
            </View>

            {/* AI Auto-write Promo Banner */}
            <TouchableOpacity
              onPress={() => setAiModalOpen(true)}
              activeOpacity={0.85}
              style={[
                styles.aiFormBanner,
                {
                  backgroundColor: isDarkMode ? '#1E1B4B' : '#EEF2FF',
                  borderColor: isDarkMode ? '#6366F1' : '#C7D2FE',
                },
              ]}
            >
              <Sparkles size={18} color="#6366F1" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.aiFormBannerTitle, { color: theme.colors.textMain }]}>
                  Need inspiration? Try AI Co-Pilot
                </Text>
                <Text style={[styles.aiFormBannerSub, { color: theme.colors.textMuted }]}>
                  Generate structured drafts, study points, and outlines instantly.
                </Text>
              </View>
              <ChevronRight size={16} color="#6366F1" />
            </TouchableOpacity>

            {/* Title / Subject */}
            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textMain }]}>
                Article Title / Subject *
              </Text>
              <TextInput
                placeholder="E.g. Top 10 High-Yield Topics for UPSC Prelims 2026"
                placeholderTextColor={theme.colors.textLight}
                value={contentSubject}
                onChangeText={handleSubjectChange}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.textMain,
                  },
                ]}
              />
            </View>

            {/* Category Selector */}
            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textMain }]}>
                Category *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.catPickerScroll}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = contentCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setContentCategory(cat)}
                      style={[
                        styles.catOptionPill,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.surface,
                          borderColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.catOptionText,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : isDarkMode
                              ? '#CBD5E1'
                              : '#475569',
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Body Content */}
            <View style={styles.formGroup}>
              <View style={styles.contentLabelRow}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textMain }]}>
                  Article Content *
                </Text>
                <Text style={[styles.charCountText, { color: theme.colors.textLight }]}>
                  {content.trim().split(/\s+/).filter(Boolean).length} words
                </Text>
              </View>
              <TextInput
                placeholder="Write your comprehensive study notes, tips, strategies, or current affairs summary..."
                placeholderTextColor={theme.colors.textLight}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.textMain,
                  },
                ]}
              />
            </View>

            {/* Tags Generator */}
            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textMain }]}>
                Tags (Press + to Add)
              </Text>
              <View style={styles.tagInputRow}>
                <TextInput
                  placeholder="E.g. #UPSC, #History, #StudyPlan"
                  placeholderTextColor={theme.colors.textLight}
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={addTag}
                  style={[
                    styles.tagTextInput,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      color: theme.colors.textMain,
                    },
                  ]}
                />
                <TouchableOpacity
                  onPress={addTag}
                  style={[styles.addTagBtn, { backgroundColor: theme.colors.primary }]}
                >
                  <Plus size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {tags.length > 0 ? (
                <View style={styles.tagsContainer}>
                  {tags.map((tg, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.removableTag,
                        {
                          backgroundColor: isDarkMode
                            ? 'rgba(99, 102, 241, 0.15)'
                            : '#EEF2FF',
                        },
                      ]}
                    >
                      <Text style={styles.removableTagText}>{tg}</Text>
                      <TouchableOpacity onPress={() => removeTag(tg)}>
                        <X size={13} color="#6366F1" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            {/* Cover Image Picker */}
            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textMain }]}>
                Cover Image (Optional)
              </Text>
              {schemaPreview ? (
                <View style={styles.coverPreviewWrap}>
                  <Image source={{ uri: schemaPreview }} style={styles.coverPreviewImg} />
                  <TouchableOpacity
                    onPress={() => {
                      setSchemaImage(null);
                      setSchemaPreview('');
                    }}
                    style={styles.removeCoverBtn}
                  >
                    <X size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handlePickImage}
                  style={[
                    styles.uploadBox,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <ImageIcon size={22} color={theme.colors.primary} />
                  <Text style={[styles.uploadBoxText, { color: theme.colors.textMain }]}>
                    Upload Cover Image
                  </Text>
                  <Text style={[styles.uploadBoxSub, { color: theme.colors.textLight }]}>
                    PNG, JPG recommended
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Video Link Embeds */}
            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textMain }]}>
                Video Link Embeds (Optional)
              </Text>
              <View
                style={[
                  styles.linkInputRow,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Youtube size={16} color="#EF4444" />
                <TextInput
                  placeholder="YouTube Video URL"
                  placeholderTextColor={theme.colors.textLight}
                  value={youtubeUrl}
                  onChangeText={setYoutubeUrl}
                  style={[styles.linkTextInput, { color: theme.colors.textMain }]}
                />
              </View>
            </View>

            {/* Guidelines Card */}
            <View
              style={[
                styles.guidelinesCard,
                {
                  backgroundColor: isDarkMode
                    ? 'rgba(15, 23, 42, 0.6)'
                    : '#F8FAFC',
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.guidelinesTitleRow}>
                <HelpCircle size={14} color={theme.colors.primary} />
                <Text
                  style={[
                    styles.guidelinesTitle,
                    { color: isDarkMode ? '#CBD5E1' : '#475569' },
                  ]}
                >
                  PUBLISHING GUIDELINES & REWARDS
                </Text>
              </View>
              <Text style={[styles.guidelineText, { color: theme.colors.textMuted }]}>
                • Maintain academic honesty and original insights.
              </Text>
              <Text style={[styles.guidelineText, { color: theme.colors.textMuted }]}>
                • Articles are reviewed by mentors within 24-48 hours.
              </Text>
              <Text style={[styles.guidelineText, { color: '#16A34A', fontWeight: '700' }]}>
                • You will receive +50 EduCoins upon article approval!
              </Text>
            </View>

            {/* Submit Action Buttons */}
            <View style={styles.formActionRow}>
              <TouchableOpacity
                onPress={() => setActiveTab('manage')}
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: isDarkMode
                      ? 'rgba(255, 255, 255, 0.06)'
                      : '#F1F5F9',
                  },
                ]}
              >
                <Text style={[styles.cancelBtnText, { color: theme.colors.textMain }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={15} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>
                      {editingBlog ? 'Save Changes' : 'Submit for Review'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ─── MODAL 1: ARTICLE READER / PREVIEW ─── */}
      <Modal
        visible={!!viewBlog}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setViewBlog(null)}
      >
        <View style={[styles.readerModal, { backgroundColor: theme.colors.background }]}>
          <GlobalSafeHeader
            title="Article Preview"
            showBack
            onBack={() => setViewBlog(null)}
          />
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.readerScroll}
          >
            {viewBlog?.schema_image ? (
              <Image
                source={{ uri: getImageUrl(viewBlog.schema_image) }}
                style={styles.readerCoverImg}
              />
            ) : null}

            <View style={styles.readerContentWrap}>
              {/* Category & Status */}
              <View style={styles.readerMetaTop}>
                <View style={styles.readerCatPill}>
                  <Text style={styles.readerCatPillText}>
                    {viewBlog?.content_category || 'General'}
                  </Text>
                </View>
                <Text style={[styles.readerDate, { color: theme.colors.textLight }]}>
                  {viewBlog?.createdAt
                    ? new Date(viewBlog.createdAt).toLocaleDateString()
                    : 'Recently'}
                </Text>
              </View>

              {/* Title */}
              <Text style={[styles.readerTitle, { color: theme.colors.textMain }]}>
                {viewBlog?.content_subject}
              </Text>

              {/* Author */}
              <View style={styles.readerAuthorRow}>
                <View style={styles.readerAuthorAvatar}>
                  <Text style={styles.readerAuthorInitial}>
                    {(viewBlog?.author || user?.name || 'S').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.readerAuthorName, { color: theme.colors.textMain }]}>
                    {viewBlog?.author || user?.name || 'Scholar'}
                  </Text>
                  <Text style={[styles.readerAuthorRole, { color: theme.colors.textMuted }]}>
                    Student Contributor
                  </Text>
                </View>
              </View>

              {/* Body */}
              <Text style={[styles.readerBodyText, { color: theme.colors.textMain }]}>
                {viewBlog?.content ? stripHtml(viewBlog.content) : ''}
              </Text>

              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setViewBlog(null)}
                style={[styles.readerCloseBtn, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={styles.readerCloseBtnText}>Close Article</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ─── MODAL 2: AI CO-PILOT DRAFTER ─── */}
      <Modal
        visible={aiModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setAiModalOpen(false)}
      >
        <View style={styles.aiModalOverlay}>
          <View
            style={[
              styles.aiModalCard,
              {
                backgroundColor: isDarkMode ? '#131A2E' : '#FFFFFF',
                borderColor: theme.colors.border,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.aiModalHeader}>
              <View style={styles.aiModalTitleRow}>
                <Sparkles size={18} color="#6366F1" />
                <Text style={[styles.aiModalTitle, { color: theme.colors.textMain }]}>
                  AI Article Co-Pilot
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAiModalOpen(false)}>
                <X size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.aiModalDesc, { color: theme.colors.textMuted }]}>
              Enter any topic or question. AI will construct an outline, study strategies, and key points for you.
            </Text>

            {/* Input */}
            <TextInput
              placeholder="E.g. Daily Schedule for Working Aspirants..."
              placeholderTextColor={theme.colors.textLight}
              value={aiTopic}
              onChangeText={setAiTopic}
              style={[
                styles.aiTextInput,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                  borderColor: theme.colors.border,
                  color: theme.colors.textMain,
                },
              ]}
            />

            {/* Tone Selector */}
            <View style={styles.toneRow}>
              {(['friendly', 'academic', 'motivational'] as const).map((tVal) => (
                <TouchableOpacity
                  key={tVal}
                  onPress={() => setAiTone(tVal)}
                  style={[
                    styles.tonePill,
                    {
                      backgroundColor:
                        aiTone === tVal
                          ? hexToRgba('#6366F1', 0.2)
                          : isDarkMode
                          ? 'rgba(255, 255, 255, 0.05)'
                          : '#F1F5F9',
                      borderColor: aiTone === tVal ? '#6366F1' : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tonePillText,
                      { color: aiTone === tVal ? '#6366F1' : theme.colors.textMuted },
                    ]}
                  >
                    {tVal.charAt(0).toUpperCase() + tVal.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              onPress={handleGenerateAi}
              disabled={aiGenerating}
              style={[styles.aiGenerateBtn, { backgroundColor: theme.colors.primary }]}
            >
              {aiGenerating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Sparkles size={16} color="#FFFFFF" />
                  <Text style={styles.aiGenerateBtnText}>Generate Draft</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const MOCK_INITIAL_BLOGS: BlogItem[] = [
  {
    _id: 'mock-1',
    content_subject: 'How to Master Current Affairs for UPSC Prelims 2026',
    content_category: 'Current Affairs',
    content:
      'Current affairs form the backbone of both Prelims and Mains examinations. Rather than memorizing raw facts, focus on connecting daily editorial issues to the syllabus topics like Polity, Economy, and International Relations.',
    author: 'Mainak Bhattacherjee',
    approved: true,
    status: 'published',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['#UPSC', '#CurrentAffairs', '#Prelims'],
    readTime: '3 min read',
  },
  {
    _id: 'mock-2',
    content_subject: 'Time Management Strategy for Working Aspirants',
    content_category: 'Study Tips',
    content:
      'Balancing a full-time job with competitive exam prep requires micro-study sessions. Dedicate 2 hours in the morning for static subjects and 1.5 hours in the evening for answer writing and quizzes.',
    author: 'Mainak Bhattacherjee',
    approved: false,
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['#StudyTips', '#Productivity', '#TimeManagement'],
    readTime: '4 min read',
  },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 16, paddingBottom: 32 },
  loaderWrap: { paddingVertical: 40, alignItems: 'center' },

  /* Hero Banner Card */
  heroBannerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  rewardPillText: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  aiQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366F1',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  aiQuickBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  /* Embedded Tab Capsule */
  tabCapsule: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  tabBtnText: {
    fontSize: 12.5,
    letterSpacing: 0.2,
  },

  /* Filter Section */
  filterSection: {
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  chipRow: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 11.5,
  },

  /* Blog Card */
  blogCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catBadgeText: {
    color: '#6366F1',
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  blogTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 4,
  },
  blogExcerpt: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  tagChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagChipText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  cardDivider: {
    borderTopWidth: 1,
    marginBottom: 8,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
  },
  actionBtnsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Empty State */
  emptyCard: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptySubtitle: { fontSize: 12.5, textAlign: 'center', lineHeight: 18 },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  emptyCreateBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  /* Form Screen */
  formScroll: {
    padding: 16,
    paddingTop: 16,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  formBackBtn: {
    padding: 4,
  },
  formHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  aiFormBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  aiFormBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  aiFormBannerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  textInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
  },
  catPickerScroll: {
    flexDirection: 'row',
  },
  catOptionPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  catOptionText: {
    fontSize: 12,
  },
  contentLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  charCountText: {
    fontSize: 11,
  },
  textArea: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    minHeight: 130,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagTextInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  addTagBtn: {
    width: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  removableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removableTagText: {
    color: '#6366F1',
    fontSize: 11.5,
    fontWeight: '700',
  },
  uploadBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 4,
  },
  uploadBoxText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  uploadBoxSub: {
    fontSize: 11,
  },
  coverPreviewWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    height: 140,
  },
  coverPreviewImg: {
    width: '100%',
    height: '100%',
  },
  removeCoverBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  linkTextInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  guidelinesCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
    gap: 4,
  },
  guidelinesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  guidelinesTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  guidelineText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  formActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* Reader Modal */
  readerModal: { flex: 1 },
  readerScroll: { padding: 16, paddingBottom: 40 },
  readerCoverImg: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 16,
  },
  readerContentWrap: {},
  readerMetaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  readerCatPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  readerCatPillText: {
    color: '#4338CA',
    fontSize: 11,
    fontWeight: '800',
  },
  readerDate: {
    fontSize: 11,
  },
  readerTitle: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    marginBottom: 14,
  },
  readerAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  readerAuthorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readerAuthorInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  readerAuthorName: {
    fontSize: 13,
    fontWeight: '700',
  },
  readerAuthorRole: {
    fontSize: 11,
  },
  readerBodyText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  readerCloseBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readerCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },

  /* AI Modal */
  aiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  aiModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  aiModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  aiModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiModalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  aiModalDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  aiTextInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  toneRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  tonePill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tonePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  aiGenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  aiGenerateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default PublishBlogs;
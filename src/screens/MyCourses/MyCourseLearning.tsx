/**
 * CourseLearning.tsx
 *
 * API logic  → mirrored from EnhancedCourseLearnPage (web)
 * UI layout  → mirrored from CourseLearning (React Native mock)
 * Auth       → useAuth() hook  (AuthContext)
 * Base URL   → BASE_URL        (api.service)
 *
 * Navigation param expected:  { courseId: string }
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  ChevronLeft,
  Share2,
  Download,
  PlayCircle,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  RotateCw,
  Maximize,
  User,
  CircleDot,
  BarChart2,
  BookOpen,
  PenLine,
  BookmarkPlus,
  TrendingUp,
  Clock,
  Trophy,
  Flame,
  Shield,
  Bell,
  Bookmark,
  Star,
  Zap,
  LogOut,
} from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAlert } from '../../context/AlertContext';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { theme as staticTheme } from '../../styles/theme';
import { BASE_URL } from '../../service/api.service';
import { ScreenContainer } from '../../components/common/ScreenContainer';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type LessonType = 'video' | 'note' | 'live' | 'pdf' | 'ppt' | 'doc';

interface Chapter {
  _id: string;
  chapter_name: string;
  study_material?: string;
  practice_set?: string;
  youtube_video?: string;
  other_materials?: string[];
}

interface CourseData {
  _id: string;
  title: string;
  short_desc: string;
  long_desc: string;
  duration: number;
  coverphoto: string;
  youtube_link: string;
  chapters: Chapter[];
  teacher_details: {
    tname: string;
    tspecialization: string;
    tprofile: string;
  };
  skill_level: string;
  language: string;
}

interface ChapterProgress {
  chapter_id: string;
  chapter_name: string;
  chapter_index: number;
  status: string;
  time_spent: number;
  completion_percentage: number;
  completed_at?: string;
  last_accessed_at?: string;
  video_progress?: {
    watched_duration: number;
    total_duration: number;
    completion_rate: number;
  };
  interactions?: {
    bookmarks: any[];
    notes: any[];
  };
}

interface CourseProgress {
  _id: string;
  overall_progress: {
    completion_percentage: number;
    status: string;
    total_time_spent: number;
    effective_learning_time: number;
    chapters_completed: number;
    chapters_in_progress: number;
    introduction_watched: boolean;
    last_chapter_accessed: {
      chapter_id: string;
      chapter_index: number;
      accessed_at: string;
    };
  };
  chapters: ChapterProgress[];
  milestones: Array<{
    type: string;
    description: string;
    achieved_at: string;
    points_earned: number;
  }>;
  analytics: {
    daily_streaks: {
      current_streak: number;
      longest_streak: number;
      last_activity_date: string;
    };
    performance_metrics: {
      focus_score: number;
      consistency_score: number;
      engagement_score: number;
      overall_performance_score: number;
    };
    learning_patterns: {
      avg_session_duration: number;
      total_sessions: number;
      preferred_learning_time: string;
      learning_velocity: number;
    };
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = `${BASE_URL}/student/courses/progress`;

const fmtTime = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const getFileExt = (mat?: string) => {
  if (!mat) return '';
  const name = mat.split('/').pop() || '';
  return (name.split('.').pop() || '').toLowerCase();
};

const getLessonType = (ch: Chapter): LessonType => {
  if (ch.youtube_video) return 'video';
  const ext = getFileExt(ch.study_material);
  if (['mp4', 'webm', 'mkv'].includes(ext)) return 'video';
  if (ext === 'pdf') return 'pdf';
  if (['ppt', 'pptx'].includes(ext)) return 'ppt';
  if (['doc', 'docx'].includes(ext)) return 'doc';
  return 'note';
};

const getAllNotes = (progress: CourseProgress | null, course: CourseData | null) => {
  if (!progress || !course) return [];
  const notes: Array<{
    content: string;
    noteIndex: number;
    chapterId: string;
    chapterName: string;
    chapterIndex: number;
    createdAt?: string;
  }> = [];
  progress.chapters.forEach((cp) => {
    const chapter = course.chapters.find((c) => c._id === cp.chapter_id);
    if (!chapter) return;
    (cp.interactions?.notes || []).forEach((n: any, ni: number) => {
      notes.push({
        content: n.content || n,
        noteIndex: ni,
        chapterId: cp.chapter_id,
        chapterName: cp.chapter_name || chapter.chapter_name,
        chapterIndex: cp.chapter_index,
        createdAt: n.created_at || n.createdAt,
      });
    });
  });
  return notes;
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Circular progress ring (SVG-less RN version using border trick) */
const ProgressRing = ({
  pct,
  size = 80,
  color = '#6366F1',
}: {
  pct: number;
  size?: number;
  color?: string;
}) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 6,
        borderColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.22, fontWeight: '800', color: '#0F172A' }}>
        {Math.round(pct)}%
      </Text>
    </View>
    {/* Overlay arc approximated with colored border */}
    <View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 6,
        borderColor: color,
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        transform: [{ rotate: `${(pct / 100) * 360 - 90}deg` }],
      }}
    />
  </View>
);

/** Thin progress bar */
const ProgressBar = ({
  pct,
  color = '#6366F1',
  height = 6,
  bg = '#F1F5F9',
}: {
  pct: number;
  color?: string;
  height?: number;
  bg?: string;
}) => (
  <View style={{ height, backgroundColor: bg, borderRadius: height, overflow: 'hidden' }}>
    <View
      style={{
        height: '100%',
        width: `${Math.min(pct || 0, 100)}%`,
        backgroundColor: color,
        borderRadius: height,
      }}
    />
  </View>
);

/** Avatar with initials fallback */
const Avatar = ({ name, size = 36 }: { name?: string; size?: number }) => {
  const initials = (name || 'S')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#6366F1',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#FFF', fontSize: size * 0.36, fontWeight: '800' }}>{initials}</Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────

type RouteParams = { courseId: string };

export const CourseLearning = () => {
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const courseId = route.params?.courseId;
  const { showAlert } = useAlert();

  // ── Core state ─────────────────────────────────────────────────────────────
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Chapter / playback state ────────────────────────────────────────────────
  const [currentChapter, setCurrentChapter] = useState(-1); // -1 = intro
  const [completedChapters, setCompletedChapters] = useState<number[]>([]);
  const [realtimeProgress, setRealtimeProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>({});

  // ── Session state ───────────────────────────────────────────────────────────
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chapterStartTime, setChapterStartTime] = useState<number | null>(null);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'Overview' | 'Curriculum'>('Curriculum');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showAllNotesModal, setShowAllNotesModal] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const sessionStart = useRef(Date.now());
  const lastUpd = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const actBuf = useRef<any[]>([]);

  // ─────────────────────────────────────────────────────────────────────────
  // API: LOAD COURSE
  // ─────────────────────────────────────────────────────────────────────────
  const loadCourse = useCallback(async () => {
    if (!user?.id || !courseId) return;
    try {
      setLoading(true);
      const res = await fetch(
        `${BASE_URL}/students/course/payment/course-access/${user.id}/${courseId}`
      );
      const data = await res.json();
      if (data.success && data.hasAccess) {
        setCourseData(data.course);
        // Auto-expand first chapter module
        if (data.course?.chapters?.length) {
          setExpandedModules(new Set([data.course.chapters[0]._id]));
        }
      } else {
        setErrorMsg(data.message || 'You do not have access to this course.');
      }
    } catch {
      setErrorMsg('Failed to verify course access. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, courseId]);

  // ─────────────────────────────────────────────────────────────────────────
  // API: INIT PROGRESS
  // ─────────────────────────────────────────────────────────────────────────
  const initProgress = useCallback(async () => {
    if (!user?.id || !courseId || !courseData) return;
    try {
      const params = new URLSearchParams({
        student_name: user.name || '',
        student_email: user.email || '',
        course_title: courseData.title,
        course_duration: courseData.duration.toString(),
        total_chapters: courseData.chapters.length.toString(),
      });

      const res = await fetch(`${API_BASE}/${user.id}/${courseId}?${params}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();

      if (data.success) {
        setCourseProgress(data.data);
        const done: number[] = data.data.chapters
          .filter((c: ChapterProgress) => c.status === 'completed')
          .map((c: ChapterProgress) => c.chapter_index);
        setCompletedChapters(done);
        setRealtimeProgress(data.data.overall_progress.completion_percentage);

        const lastIdx = data.data.overall_progress.last_chapter_accessed?.chapter_index;
        if (typeof lastIdx === 'number' && lastIdx >= 0) {
          setCurrentChapter(lastIdx);
          setExpandedModules(new Set([courseData.chapters[lastIdx]?._id]));
        }
      }

      // Start session
      try {
        const sRes = await fetch(`${API_BASE}/${user.id}/${courseId}/session/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            device_info: { device: 'mobile', os: Platform.OS },
          }),
        });
        const sData = await sRes.json();
        if (sData.success) {
          setCurrentSessionId(sData.data.session_id);
          sessionStart.current = Date.now();
        }
      } catch { }
    } catch (e) {
      console.error('initProgress error', e);
    }
  }, [user, courseId, courseData]);

  // ─────────────────────────────────────────────────────────────────────────
  // API: UPDATE CHAPTER
  // ─────────────────────────────────────────────────────────────────────────
  const updateChapter = useCallback(
    async (idx: number, status: string, timeSpent?: number, pct?: number) => {
      if (!user?.id || !courseId || !courseData || idx < 0) return;
      try {
        const ch = courseData.chapters[idx];
        const res = await fetch(`${API_BASE}/${user.id}/${courseId}/chapter`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            chapter_id: ch._id,
            chapter_name: ch.chapter_name,
            chapter_index: idx,
            status,
            time_spent: timeSpent || 0,
            completion_percentage: pct !== undefined ? pct : status === 'completed' ? 100 : 0,
            video_progress: {
              watched_duration: videoProgress[ch._id] || 0,
              total_duration: 0,
              completion_rate: videoProgress[ch._id] || 0,
            },
          }),
        });
        const result = await res.json();
        if (result.success) {
          setRealtimeProgress(result.data.overall_progress.completion_percentage);
          // Show milestone alerts
          if (result.data.new_milestones?.length) {
            result.data.new_milestones.forEach((m: any) => {
              showAlert('🎉 Milestone Achieved!', m.description, [], 'success');
            });
          }
          refreshProgress();
        }
      } catch (e) {
        console.error('updateChapter error', e);
      }
    },
    [user, courseId, courseData, videoProgress]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // API: UPDATE INTRO
  // ─────────────────────────────────────────────────────────────────────────
  const updateIntro = async (watched: boolean, t?: number) => {
    if (!user?.id || !courseId) return;
    try {
      await fetch(`${API_BASE}/${user.id}/${courseId}/introduction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ watched, watch_time: t || 0 }),
      });
      refreshProgress();
    } catch { }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // API: ACTIVITY LOGGING
  // ─────────────────────────────────────────────────────────────────────────
  const logAct = useCallback(
    (type: string, details?: any) => {
      if (!currentSessionId) return;
      actBuf.current.push({ type, details, timestamp: new Date().toISOString() });
      if (actBuf.current.length >= 5) flushBuf();
    },
    [currentSessionId]
  );

  const flushBuf = useCallback(async () => {
    if (!actBuf.current.length || !currentSessionId || !user?.id || !courseId) return;
    try {
      const acts = [...actBuf.current];
      actBuf.current = [];
      await fetch(`${API_BASE}/${user.id}/${courseId}/activities/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ session_id: currentSessionId, activities: acts }),
      });
    } catch { }
  }, [currentSessionId, user, courseId]);

  // ─────────────────────────────────────────────────────────────────────────
  // API: END SESSION
  // ─────────────────────────────────────────────────────────────────────────
  const endSession = useCallback(async () => {
    if (!currentSessionId || !user?.id || !courseId) return;
    try {
      await flushBuf();
      await fetch(`${API_BASE}/${user.id}/${courseId}/session/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          session_id: currentSessionId,
          end_time: new Date().toISOString(),
          total_duration: Math.floor((Date.now() - sessionStart.current) / 1000),
        }),
      });
    } catch { }
  }, [currentSessionId, user, courseId, flushBuf]);

  // ─────────────────────────────────────────────────────────────────────────
  // API: REFRESH PROGRESS
  // ─────────────────────────────────────────────────────────────────────────
  const refreshProgress = useCallback(async () => {
    if (!user?.id || !courseId) return;
    try {
      const res = await fetch(`${API_BASE}/${user.id}/${courseId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCourseProgress(data.data);
        setRealtimeProgress(data.data.overall_progress.completion_percentage);
      }
    } catch { }
  }, [user, courseId]);

  // ─────────────────────────────────────────────────────────────────────────
  // API: MARK CHAPTER DONE
  // ─────────────────────────────────────────────────────────────────────────
  const markDone = useCallback(
    async (idx: number) => {
      if (completedChapters.includes(idx)) return;
      const ts = chapterStartTime ? Math.floor((Date.now() - chapterStartTime) / 1000) : 0;
      setCompletedChapters((prev) => [...prev, idx]);
      await updateChapter(idx, 'completed', ts, 100);
      await logAct('chapter_complete', { chapter_index: idx, time_spent: ts });
      showAlert('🎉 Chapter Completed!', 'Great job! Keep going!', [], 'success');
    },
    [completedChapters, chapterStartTime, updateChapter, logAct]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // API: CHANGE CHAPTER
  // ─────────────────────────────────────────────────────────────────────────
  const changeChapter = useCallback(
    async (n: number) => {
      if (!courseData) return;
      // Save time on previous chapter
      if (currentChapter >= 0 && chapterStartTime) {
        const ts = Math.floor((Date.now() - chapterStartTime) / 1000);
        await updateChapter(currentChapter, 'in_progress', ts);
      }
      setCurrentChapter(n);
      setChapterStartTime(Date.now());
      setPlaying(false);
      if (n >= 0) {
        const ch = courseData.chapters[n];
        setExpandedModules((prev) => new Set([...prev, ch._id]));
        await updateChapter(n, 'in_progress');
        await logAct('chapter_access', { chapter_index: n });
      }
    },
    [currentChapter, chapterStartTime, courseData, updateChapter, logAct]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // API: SAVE NOTE
  // ─────────────────────────────────────────────────────────────────────────
  const saveNote = async () => {
    if (!currentNote.trim() || currentChapter < 0 || !courseData || !user?.id || !courseId) return;
    const ch = courseData.chapters[currentChapter];
    setSavingNote(true);
    try {
      await fetch(`${API_BASE}/${user.id}/${courseId}/chapter/${ch._id}/note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ content: currentNote }),
      });
      setCurrentNote('');
      setShowNoteModal(false);
      showAlert(' Note Saved', 'Your note has been saved successfully.', [], 'success');
      await refreshProgress();
    } catch {
      showAlert('Error', 'Failed to save note. Please try again.', [], 'error');
    } finally {
      setSavingNote(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // API: ADD BOOKMARK
  // ─────────────────────────────────────────────────────────────────────────
  const addBookmark = async () => {
    if (currentChapter < 0 || !courseData || !user?.id || !courseId) return;
    const ch = courseData.chapters[currentChapter];
    try {
      await fetch(`${API_BASE}/${user.id}/${courseId}/chapter/${ch._id}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ timestamp: 0, note: 'Bookmarked from mobile' }),
      });
      showAlert('🔖 Bookmark Added!', '', [], 'success');
    } catch {
      showAlert('Error', 'Failed to add bookmark.', [], 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  useEffect(() => {
    if (courseData && user?.id) initProgress();
  }, [courseData, user?.id]);

  // Periodic auto-save (every 30s)
  useEffect(() => {
    timerRef.current = setInterval(async () => {
      if (currentChapter >= 0 && chapterStartTime) {
        const ts = Math.floor((Date.now() - chapterStartTime) / 1000);
        if (ts > lastUpd.current + 30) {
          await updateChapter(currentChapter, 'in_progress', ts);
          lastUpd.current = ts;
        }
      }
      if (actBuf.current.length) flushBuf();
    }, 30000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentChapter, chapterStartTime, updateChapter, flushBuf]);

  // End session on unmount
  useEffect(() => {
    return () => { endSession(); };
  }, [endSession]);

  // ─────────────────────────────────────────────────────────────────────────
  // UI HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  const toggleModule = (id: string) => {
    const next = new Set(expandedModules);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedModules(next);
  };

  const activeChapterObj = currentChapter >= 0 ? courseData?.chapters[currentChapter] : null;
  const isWatchingVideo = activeChapterObj !== null && currentChapter !== -1;
  const totalNotes = getAllNotes(courseProgress, courseData);

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textMain }]}>Loading Course…</Text>
          <Text style={[styles.loadingSub, { color: theme.colors.textMuted }]}>Preparing your learning experience</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ERROR STATE
  // ─────────────────────────────────────────────────────────────────────────
  if (errorMsg || !courseData) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />
        <View style={styles.centerBox}>
          <Shield size={48} color="#EF4444" />
          <Text style={[styles.loadingText, { color: '#EF4444' }]}>Access Denied</Text>
          <Text style={[styles.loadingSub, { color: theme.colors.textMuted }]}>{errorMsg || 'You don\'t have access to this course.'}</Text>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} color="#FFF" />
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: HEADER
  // ─────────────────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          if (isWatchingVideo) {
            setCurrentChapter(-1);
          } else {
            endSession();
            navigation.goBack();
          }
        }}
      >
        <ChevronLeft color={theme.colors.textMain} size={24} />
      </TouchableOpacity>

      <View style={styles.headerTitleContainer}>
        {isWatchingVideo ? (
          <>
            <Text style={[styles.headerTitleSmall, { color: theme.colors.textMain }]} numberOfLines={1}>
              {courseData.title}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]} numberOfLines={1}>
              Chapter: {activeChapterObj?.chapter_name}
            </Text>
          </>
        ) : (
          <Text style={[styles.headerTitleMain, { color: theme.colors.textMain }]}>Course Details</Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        {totalNotes.length > 0 && (
          <TouchableOpacity activeOpacity={0.7} onPress={() => setShowAllNotesModal(true)}>
            <PenLine size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity activeOpacity={0.7}>
          <Share2 color={theme.colors.primary} size={22} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: MOCK VIDEO PLAYER (when watching a chapter)
  // ─────────────────────────────────────────────────────────────────────────
  const renderVideoPlayer = () => {
    const ch = activeChapterObj;
    if (!ch) return null;
    const cp = courseProgress?.chapters.find((c) => c.chapter_id === ch._id);
    const vr = cp?.video_progress?.completion_rate || 0;
    const isDone = completedChapters.includes(currentChapter);
    const coverUrl = courseData.coverphoto
      ? `${BASE_URL}/${courseData.coverphoto.replace(/\\/g, '/')}`
      : 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80';

    return (
      <View>
        {/* Video Player UI */}
        <View style={styles.videoPlayerContainer}>
          <Image source={{ uri: coverUrl }} style={styles.videoBackground} />
          <View style={styles.videoOverlay}>
            {/* Top row */}
            <View style={styles.videoTopControls}>
              <View style={styles.drmBadge}>
                <Shield size={10} color="#10B981" />
                <Text style={styles.drmText}>DRM Protected</Text>
              </View>
              <View style={styles.speedBadge}>
                <Text style={styles.speedText}>{playbackRate}x</Text>
              </View>
            </View>

            {/* Center controls */}
            <View style={styles.centerControls}>
              <TouchableOpacity>
                <RotateCcw color="#FFFFFF" size={24} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.playButtonLarge, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  setPlaying((p) => !p);
                  logAct(playing ? 'pause' : 'resume', { chapter_id: ch._id });
                }}
              >
                {playing ? (
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <View style={styles.pauseBar} />
                    <View style={styles.pauseBar} />
                  </View>
                ) : (
                  <Play color="#FFFFFF" size={24} fill="#FFFFFF" style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>
              <TouchableOpacity>
                <RotateCw color="#FFFFFF" size={24} />
              </TouchableOpacity>
            </View>

            {/* Bottom progress */}
            <View style={styles.videoBottomControls}>
              <View style={styles.videoProgressBarTrack}>
                <View style={[styles.videoProgressBarFill, { backgroundColor: theme.colors.primary, width: `${vr}%` }]} />
                <View style={[styles.videoProgressThumb, { left: `${vr}%` as any }]} />
              </View>
              <View style={styles.videoTimeRow}>
                <Text style={styles.videoTimeText}>{fmtTime((vr / 100) * 3600)}</Text>
                <View style={styles.videoTimeRight}>
                  <Text style={styles.videoTimeText}>Chapter {currentChapter + 1}</Text>
                  <Maximize color="#FFFFFF" size={16} style={{ marginLeft: 12 }} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Chapter info banner */}
        <View style={styles.chapterBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.chapterBannerLabel}>
              CHAPTER {currentChapter + 1} OF {courseData.chapters.length}
            </Text>
            <Text style={styles.chapterBannerTitle} numberOfLines={2}>
              📖 {ch.chapter_name}
            </Text>
          </View>
          <View style={{ gap: 8 }}>
            <TouchableOpacity
              style={[styles.markDoneBtn, isDone && styles.markDoneBtnDone]}
              onPress={() => markDone(currentChapter)}
              disabled={isDone}
            >
              <CheckCircle2 size={14} color="#FFF" />
              <Text style={styles.markDoneBtnText}>
                {isDone ? 'Completed ✓' : 'Mark Complete'}
              </Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={styles.iconActionBtn}
                onPress={() => setShowNoteModal(true)}
              >
                <PenLine size={14} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconActionBtn} onPress={addBookmark}>
                <BookmarkPlus size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Speed control bar */}
        <View style={styles.speedControlBar}>
          <Text style={styles.speedLabel}>Speed:</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.speedBtn, { borderColor: theme.colors.border }, playbackRate === r && [styles.speedBtnActive, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]]}
                onPress={() => {
                  setPlaybackRate(r);
                  logAct('speed_change', { speed: r });
                }}
              >
                <Text
                  style={[styles.speedBtnText, playbackRate === r && styles.speedBtnTextActive]}
                >
                  {r}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Chapter notes (if any) */}
        {(() => {
          const cp2 = courseProgress?.chapters.find((c) => c.chapter_id === ch._id);
          const notes = cp2?.interactions?.notes || [];
          if (!notes.length) return null;
          return (
            <View style={[styles.chapterNotesBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.chapterNotesHeader}>
                <PenLine size={14} color={theme.colors.primary} />
                <Text style={[styles.chapterNotesTitle, { color: theme.colors.textMain }]}>
                  Your Notes ({notes.length})
                </Text>
              </View>
              {notes.map((n: any, i: number) => (
                <View key={i} style={[styles.noteItem, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                  <Text style={[styles.noteItemText, { color: theme.colors.textMuted }]}>{n.content || n}</Text>
                </View>
              ))}
            </View>
          );
        })()}
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: COURSE COVER (intro / landing state)
  // ─────────────────────────────────────────────────────────────────────────
  const renderCourseCover = () => {
    const coverUrl = courseData.coverphoto
      ? `${BASE_URL}/${courseData.coverphoto.replace(/\\/g, '/')}`
      : 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80';

    const lastChIdx = courseProgress?.overall_progress?.last_chapter_accessed?.chapter_index;
    const lastChapter =
      typeof lastChIdx === 'number' && lastChIdx >= 0
        ? courseData.chapters[lastChIdx]
        : courseData.chapters[0];

    const introWatched = courseProgress?.overall_progress.introduction_watched;

    return (
      <>
        <Image source={{ uri: coverUrl }} style={styles.courseCoverImage} />
        <View style={styles.courseDetailsPadding}>
          {/* Tags & DRM */}
          <View style={styles.tagsRow}>
            <View style={styles.leftTags}>
              <Text style={styles.tagPrimary}>{courseData.skill_level}</Text>
              <Text style={styles.tagMuted}>🌐 {courseData.language}</Text>
            </View>
            <View style={styles.drmPill}>
              <Shield size={10} color="#10B981" />
              <Text style={styles.drmPillText}>DRM Protected</Text>
            </View>
          </View>

          <Text style={styles.courseMainTitle}>{courseData.title}</Text>

          <View style={styles.mentorRow}>
            <User color="#64748B" size={14} />
            <Text style={styles.mentorText}>By {courseData.teacher_details?.tname}</Text>
            <Text style={[styles.mentorText, { marginLeft: 8 }]}>
              • {courseData.teacher_details?.tspecialization}
            </Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Course Progress</Text>
            <Text style={styles.progressValue}>{Math.round(realtimeProgress)}% Completed</Text>
          </View>
          <ProgressBar pct={realtimeProgress} />
          <View style={{ height: 20 }} />

          {/* Quick stats */}
          <View style={styles.quickStatsRow}>
            <View style={styles.quickStat}>
              <Clock size={14} color="#6366F1" />
              <Text style={styles.quickStatText}>{courseData.duration}h</Text>
            </View>
            <View style={styles.quickStat}>
              <BookOpen size={14} color="#6366F1" />
              <Text style={styles.quickStatText}>{courseData.chapters.length} chapters</Text>
            </View>
            <View style={styles.quickStat}>
              <CheckCircle2 size={14} color="#10B981" />
              <Text style={styles.quickStatText}>{completedChapters.length} done</Text>
            </View>
            {courseProgress && (
              <View style={styles.quickStat}>
                <Flame size={14} color="#F97316" />
                <Text style={styles.quickStatText}>
                  {courseProgress.analytics.daily_streaks.current_streak}d streak
                </Text>
              </View>
            )}
          </View>

          {/* Resume / Start card */}
          <View style={styles.resumeCard}>
            <View style={styles.resumeCardHeader}>
              <PlayCircle color="#6366F1" size={28} strokeWidth={2} />
              <View style={styles.resumeCardInfo}>
                <Text style={styles.resumeLessonTitle} numberOfLines={2}>
                  {lastChapter?.chapter_name || 'Course Introduction'}
                </Text>
                <Text style={styles.resumeLessonMeta}>
                  {typeof lastChIdx === 'number' && lastChIdx >= 0
                    ? `Chapter ${lastChIdx + 1} • Continue learning`
                    : 'Start from the beginning'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.resumeBtn}
              activeOpacity={0.8}
              onPress={() => {
                const idx =
                  typeof lastChIdx === 'number' && lastChIdx >= 0 ? lastChIdx : 0;
                changeChapter(idx);
              }}
            >
              <PlayCircle color="#FFFFFF" size={16} />
              <Text style={styles.resumeBtnText}>
                {typeof lastChIdx === 'number' && lastChIdx >= 0
                  ? 'Resume Learning'
                  : 'Start Learning'}
              </Text>
            </TouchableOpacity>

            {/* Intro button (if youtube_link exists) */}
            {courseData.youtube_link && !introWatched && (
              <TouchableOpacity
                style={styles.introBtn}
                onPress={() => {
                  setCurrentChapter(-1);
                  updateIntro(true);
                }}
              >
                <Play size={14} color="#6366F1" />
                <Text style={styles.introBtnText}>Watch Introduction</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Analytics snapshot */}
          {courseProgress && (
            <TouchableOpacity
              style={styles.analyticsSnap}
              onPress={() => setShowAnalyticsModal(true)}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={16} color="#6366F1" />
                <Text style={styles.analyticsSnapTitle}>Learning Analytics</Text>
              </View>
              <View style={styles.analyticsSnapRow}>
                {[
                  {
                    label: 'Focus',
                    val: courseProgress.analytics.performance_metrics.focus_score,
                    color: '#0EA5E9',
                  },
                  {
                    label: 'Consistency',
                    val: courseProgress.analytics.performance_metrics.consistency_score,
                    color: '#10B981',
                  },
                  {
                    label: 'Engagement',
                    val: courseProgress.analytics.performance_metrics.engagement_score,
                    color: '#F59E0B',
                  },
                ].map((s) => (
                  <View key={s.label} style={styles.analyticsSnapItem}>
                    <Text style={[styles.analyticsSnapVal, { color: s.color }]}>{s.val}</Text>
                    <Text style={styles.analyticsSnapLabel}>{s.label}</Text>
                    <ProgressBar pct={s.val} color={s.color} height={3} />
                  </View>
                ))}
              </View>
              <Text style={styles.analyticsSnapHint}>Tap to view full analytics →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['Overview', 'Curriculum'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab Content */}
        {activeTab === 'Overview' && (
          <View style={styles.overviewPad}>
            <Text style={styles.sectionTitle}>About This Course</Text>
            <Text style={styles.overviewDesc}>{courseData.long_desc || courseData.short_desc}</Text>

            {/* Instructor card */}
            <View style={styles.instructorCard}>
              <Avatar name={courseData.teacher_details?.tname} size={52} />
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text style={styles.instructorName}>{courseData.teacher_details?.tname}</Text>
                <Text style={styles.instructorSpec}>{courseData.teacher_details?.tspecialization}</Text>
              </View>
            </View>

            {/* Course info grid */}
            <View style={styles.infoGrid}>
              {[
                { icon: <Clock size={15} color="#6366F1" />, label: 'Duration', val: `${courseData.duration}h` },
                { icon: <BookOpen size={15} color="#6366F1" />, label: 'Chapters', val: courseData.chapters.length },
                { icon: <Star size={15} color="#6366F1" />, label: 'Level', val: courseData.skill_level },
                { icon: <Zap size={15} color="#6366F1" />, label: 'Language', val: courseData.language },
              ].map((item) => (
                <View key={item.label} style={styles.infoGridItem}>
                  {item.icon}
                  <Text style={styles.infoGridVal}>{item.val}</Text>
                  <Text style={styles.infoGridLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: CURRICULUM ACCORDION (shared in both states)
  // ─────────────────────────────────────────────────────────────────────────
  const renderCurriculum = () => {
    const showCurriculum = isWatchingVideo || activeTab === 'Curriculum';
    if (!showCurriculum) return null;

    return (
      <View style={styles.curriculumContainer}>
        {!isWatchingVideo && (
          <View style={styles.curriculumQuickStats}>
            <Text style={styles.quickStatSmall}>
              📹 {courseData.chapters.filter((c) => getLessonType(c) === 'video').length} Videos
            </Text>
            <Text style={styles.quickStatSmall}>📄 Notes Available</Text>
            <Text style={[styles.quickStatSmall, { color: '#EF4444' }]}>
              🔴 Live Q&A Sessions
            </Text>
            <Text style={styles.quickStatSmall}>• {courseData.duration}h total</Text>
          </View>
        )}

        {courseData.chapters.map((ch, idx) => {
          const isExpanded = expandedModules.has(ch._id);
          const isDone = completedChapters.includes(idx);
          const isActive = currentChapter === idx;
          const cp = courseProgress?.chapters.find((c) => c.chapter_id === ch._id);
          const vr = cp?.video_progress?.completion_rate || 0;
          const hasNotes = (cp?.interactions?.notes?.length || 0) > 0;
          const lessonType = getLessonType(ch);

          return (
            <View key={ch._id} style={styles.moduleCard}>
              {/* Module header */}
              <TouchableOpacity
                style={[styles.moduleHeader, isActive && styles.moduleHeaderActive]}
                activeOpacity={0.7}
                onPress={() => toggleModule(ch._id)}
              >
                <View style={[styles.moduleNumBadge, isDone && styles.moduleNumBadgeDone]}>
                  {isDone ? (
                    <CheckCircle2 size={14} color="#10B981" />
                  ) : (
                    <Text style={[styles.moduleNumText, isDone && { color: '#10B981' }]}>
                      {String(idx + 1).padStart(2, '0')}
                    </Text>
                  )}
                </View>
                <View style={styles.moduleHeaderInfo}>
                  <Text style={[styles.moduleTitle, isActive && { color: '#6366F1' }]} numberOfLines={2}>
                    {ch.chapter_name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Text style={styles.moduleSubtitle}>
                      {lessonType === 'video' ? '🎬 Video' : lessonType === 'pdf' ? '📄 PDF' : lessonType === 'ppt' ? '📊 PPT' : lessonType === 'doc' ? '📝 Doc' : '📋 Material'}
                    </Text>
                    {isDone && <Text style={styles.doneTag}>Done</Text>}
                    {isActive && !isDone && (
                      <Text style={styles.watchingTag}>Watching</Text>
                    )}
                    {hasNotes && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <PenLine size={9} color="#8B5CF6" />
                        <Text style={styles.noteTag}>{cp?.interactions?.notes?.length}</Text>
                      </View>
                    )}
                  </View>
                  {vr > 0 && vr < 100 && (
                    <View style={{ marginTop: 6 }}>
                      <ProgressBar pct={vr} height={3} />
                    </View>
                  )}
                </View>
                {isExpanded ? (
                  <ChevronUp color="#94A3B8" size={20} />
                ) : (
                  <ChevronDown color="#94A3B8" size={20} />
                )}
              </TouchableOpacity>

              {/* Expanded lesson detail */}
              {isExpanded && (
                <View style={styles.lessonsList}>
                  {/* Primary: video / material */}
                  <TouchableOpacity
                    style={[styles.lessonItem, isActive && styles.lessonItemActive]}
                    activeOpacity={0.7}
                    onPress={() => changeChapter(idx)}
                  >
                    {lessonType === 'video' ? (
                      <PlayCircle color={isActive ? '#6366F1' : '#94A3B8'} size={20} />
                    ) : lessonType === 'pdf' ? (
                      <FileText color="#94A3B8" size={20} />
                    ) : lessonType === 'ppt' ? (
                      <BarChart2 color="#94A3B8" size={20} />
                    ) : (
                      <FileText color="#94A3B8" size={20} />
                    )}
                    <View style={styles.lessonInfo}>
                      <Text style={[styles.lessonTitle, isActive && { color: '#6366F1' }]}>
                        {ch.chapter_name}
                      </Text>
                      {lessonType === 'video' && (
                        <Text style={styles.lessonDuration}>
                          {vr > 0 ? `${Math.round(vr)}% watched` : 'Not started'}
                        </Text>
                      )}
                      {['pdf', 'ppt', 'doc'].includes(lessonType) && (
                        <Text style={styles.noteMetaText}>
                          {lessonType.toUpperCase()} • View only
                        </Text>
                      )}
                    </View>
                    {isDone && <CheckCircle2 color="#10B981" size={18} />}
                    {isActive && !isDone && <BarChart2 color="#6366F1" size={18} />}
                    {!isDone && !isActive && vr > 0 && (
                      <Text style={styles.lastWatchedTag}>Watching</Text>
                    )}
                  </TouchableOpacity>

                  {/* Practice set row */}
                  {ch.practice_set && (
                    <View style={styles.lessonItem}>
                      <FileText color="#3B82F6" size={20} />
                      <View style={styles.lessonInfo}>
                        <Text style={styles.lessonTitle}>Practice Set</Text>
                        <Text style={styles.noteMetaText}>PDF NOTES</Text>
                      </View>
                      <TouchableOpacity>
                        <Download color="#6366F1" size={18} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Live session placeholder */}
                  {ch.youtube_video && lessonType !== 'video' && (
                    <View style={styles.lessonItem}>
                      <CircleDot color="#EF4444" size={20} />
                      <View style={styles.lessonInfo}>
                        <Text style={styles.lessonTitle}>Live Q&A Session</Text>
                        <Text style={styles.liveMetaText}>LIVE CLASS</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: NOTE MODAL
  // ─────────────────────────────────────────────────────────────────────────
  const renderNoteModal = () => (
    <Modal
      visible={showNoteModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowNoteModal(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.noteModal}>
          <View style={styles.noteModalHeader}>
            <PenLine size={16} color="#C4B5FD" />
            <Text style={styles.noteModalTitle}>Add Note</Text>
            {currentChapter >= 0 && (
              <Text style={styles.noteModalChapter} numberOfLines={1}>
                — {courseData.chapters[currentChapter]?.chapter_name}
              </Text>
            )}
          </View>
          <View style={styles.noteModalBody}>
            <TextInput
              style={styles.noteTextArea}
              multiline
              numberOfLines={6}
              placeholder="Write your notes here…"
              placeholderTextColor="#94A3B8"
              value={currentNote}
              onChangeText={setCurrentNote}
              textAlignVertical="top"
            />
            <View style={styles.noteModalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setShowNoteModal(false); setCurrentNote(''); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, savingNote && { opacity: 0.6 }]}
                onPress={saveNote}
                disabled={savingNote}
              >
                {savingNote ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Bookmark size={13} color="#FFF" />
                    <Text style={styles.saveBtnText}>Save Note</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: ALL NOTES MODAL
  // ─────────────────────────────────────────────────────────────────────────
  const renderAllNotesModal = () => {
    const allNotes = getAllNotes(courseProgress, courseData);
    return (
      <Modal
        visible={showAllNotesModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAllNotesModal(false)}
      >
        <View style={styles.allNotesOverlay}>
          <View style={styles.allNotesSheet}>
            <View style={styles.allNotesHeader}>
              <View>
                <Text style={styles.allNotesTitle}>All Course Notes</Text>
                <Text style={styles.allNotesSub}>
                  {allNotes.length} note{allNotes.length !== 1 ? 's' : ''} across all chapters
                </Text>
              </View>
              <TouchableOpacity
                style={styles.allNotesClose}
                onPress={() => setShowAllNotesModal(false)}
              >
                <Text style={{ color: '#FFF', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>
            {allNotes.length === 0 ? (
              <View style={styles.centerBox}>
                <PenLine size={40} color="#E8E7F8" />
                <Text style={styles.emptyNotesText}>No notes yet</Text>
                <Text style={styles.emptyNotesSub}>Add notes while studying chapters.</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
                {allNotes.map((n, i) => (
                  <View key={`${n.chapterId}-${n.noteIndex}`} style={styles.noteCard}>
                    <View style={styles.noteCardHeader}>
                      <View style={styles.noteChip}>
                        <BookOpen size={10} color="#6366F1" />
                        <Text style={styles.noteChipText}>Ch.{n.chapterIndex + 1}</Text>
                      </View>
                      <Text style={styles.noteChapterName} numberOfLines={1}>
                        {n.chapterName}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          changeChapter(n.chapterIndex);
                          setShowAllNotesModal(false);
                        }}
                      >
                        <Text style={styles.noteGoBtn}>Go →</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.noteContent}>{n.content}</Text>
                    {n.createdAt && (
                      <View style={styles.noteTimestamp}>
                        <Clock size={10} color="#94A3B8" />
                        <Text style={styles.noteTimestampText}>
                          {new Date(n.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: ANALYTICS MODAL
  // ─────────────────────────────────────────────────────────────────────────
  const renderAnalyticsModal = () => {
    if (!courseProgress) return null;
    const { analytics, milestones, overall_progress } = courseProgress;
    return (
      <Modal
        visible={showAnalyticsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAnalyticsModal(false)}
      >
        <View style={styles.allNotesOverlay}>
          <View style={styles.allNotesSheet}>
            <View style={styles.allNotesHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TrendingUp size={16} color="#C4B5FD" />
                <Text style={styles.allNotesTitle}>Learning Analytics</Text>
              </View>
              <TouchableOpacity
                style={styles.allNotesClose}
                onPress={() => setShowAnalyticsModal(false)}
              >
                <Text style={{ color: '#FFF', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {/* Performance metrics */}
              <Text style={styles.sectionTitle}>Performance Metrics</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Focus', val: analytics.performance_metrics.focus_score, color: '#0EA5E9' },
                  { label: 'Consistency', val: analytics.performance_metrics.consistency_score, color: '#10B981' },
                  { label: 'Engagement', val: analytics.performance_metrics.engagement_score, color: '#F59E0B' },
                ].map((s) => (
                  <View key={s.label} style={styles.metricCard}>
                    <Text style={[styles.metricVal, { color: s.color }]}>{s.val}</Text>
                    <Text style={styles.metricLabel}>{s.label}</Text>
                    <ProgressBar pct={s.val} color={s.color} height={4} />
                  </View>
                ))}
              </View>

              {/* Streaks */}
              <Text style={styles.sectionTitle}>Streaks</Text>
              <View style={styles.streakRow}>
                <View style={styles.streakItem}>
                  <Flame size={20} color="#F97316" />
                  <Text style={styles.streakVal}>{analytics.daily_streaks.current_streak}d</Text>
                  <Text style={styles.streakLabel}>Current</Text>
                </View>
                <View style={styles.streakItem}>
                  <Trophy size={20} color="#F59E0B" />
                  <Text style={styles.streakVal}>{analytics.daily_streaks.longest_streak}d</Text>
                  <Text style={styles.streakLabel}>Best</Text>
                </View>
                <View style={styles.streakItem}>
                  <Clock size={20} color="#6366F1" />
                  <Text style={styles.streakVal}>{fmtTime(overall_progress.total_time_spent)}</Text>
                  <Text style={styles.streakLabel}>Total Time</Text>
                </View>
                <View style={styles.streakItem}>
                  <CheckCircle2 size={20} color="#10B981" />
                  <Text style={styles.streakVal}>{overall_progress.chapters_completed}</Text>
                  <Text style={styles.streakLabel}>Completed</Text>
                </View>
              </View>

              {/* Learning patterns */}
              <Text style={styles.sectionTitle}>Learning Patterns</Text>
              {[
                { label: 'Avg Session', val: `${analytics.learning_patterns.avg_session_duration} min` },
                { label: 'Total Sessions', val: analytics.learning_patterns.total_sessions },
                { label: 'Preferred Time', val: analytics.learning_patterns.preferred_learning_time },
                { label: 'Learning Velocity', val: `${analytics.learning_patterns.learning_velocity} ch/week` },
              ].map((r) => (
                <View key={r.label} style={styles.infoRow}>
                  <Text style={styles.infoRowLabel}>{r.label}</Text>
                  <Text style={styles.infoRowVal}>{r.val}</Text>
                </View>
              ))}

              {/* Milestones */}
              {milestones.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Milestones 🏆</Text>
                  {milestones.map((m, i) => (
                    <View key={i} style={styles.milestoneItem}>
                      <View style={styles.milestoneBadge}>
                        <Trophy size={14} color="#10B981" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.milestoneDesc}>{m.description}</Text>
                        <Text style={styles.milestoneMeta}>
                          {new Date(m.achieved_at).toLocaleDateString()}
                        </Text>
                      </View>
                      {m.points_earned > 0 && (
                        <View style={styles.pointsBadge}>
                          <Text style={styles.pointsText}>+{m.points_earned} pts</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FINAL RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ScreenContainer scroll={false} header={undefined}>
      {renderHeader()}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top section — changes based on state */}
        {isWatchingVideo ? renderVideoPlayer() : renderCourseCover()}

        {/* Curriculum accordion — always visible */}
        {renderCurriculum()}

        {/* Nav buttons when watching */}
        {isWatchingVideo && (
          <View style={styles.chapterNav}>
            <TouchableOpacity
              style={[styles.navBtn, currentChapter <= 0 && styles.navBtnDisabled]}
              disabled={currentChapter <= 0}
              onPress={() => changeChapter(Math.max(0, currentChapter - 1))}
            >
              <ChevronLeft size={16} color={currentChapter <= 0 ? '#CBD5E1' : '#6366F1'} />
              <Text style={[styles.navBtnText, currentChapter <= 0 && { color: '#CBD5E1' }]}>
                Previous
              </Text>
            </TouchableOpacity>

            <View style={styles.navCenter}>
              <Text style={styles.navCenterText}>
                Chapter {currentChapter + 1} of {courseData.chapters.length}
              </Text>
              {currentSessionId && (
                <View style={styles.sessionPill}>
                  <View style={styles.sessionDot} />
                  <Text style={styles.sessionText}>Auto-Saved</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.navBtn,
                styles.navBtnPrimary,
                currentChapter >= courseData.chapters.length - 1 && styles.navBtnDisabled,
              ]}
              disabled={currentChapter >= courseData.chapters.length - 1}
              onPress={() =>
                changeChapter(Math.min(courseData.chapters.length - 1, currentChapter + 1))
              }
            >
              <Text style={styles.navBtnPrimaryText}>Next</Text>
              <ChevronDown
                size={16}
                color={currentChapter >= courseData.chapters.length - 1 ? '#CBD5E1' : '#FFF'}
                style={{ transform: [{ rotate: '-90deg' }] }}
              />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      {renderNoteModal()}
      {renderAllNotesModal()}
      {renderAnalyticsModal()}
    </ScreenContainer>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: staticTheme.colors.background },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: { fontSize: 18, fontWeight: '700', color: staticTheme.colors.textMain, marginTop: 8 },
  loadingSub: { fontSize: 13, color: staticTheme.colors.textMuted, textAlign: 'center' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: staticTheme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 99,
    marginTop: 16,
  },
  backBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: staticTheme.colors.border,
    backgroundColor: staticTheme.colors.surface,
  },
  headerTitleContainer: { flex: 1, alignItems: 'center', marginHorizontal: 12 },
  headerTitleMain: { fontSize: 16, fontWeight: '700', color: staticTheme.colors.textMain },
  headerTitleSmall: { fontSize: 14, fontWeight: '700', color: staticTheme.colors.textMain },
  headerSubtitle: { fontSize: 12, color: staticTheme.colors.primary, fontWeight: '500', marginTop: 2 },

  scrollContent: { paddingBottom: 48 },

  // ── Video Player ─────────────────────────────────────────────────────────
  videoPlayerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoBackground: { ...StyleSheet.absoluteFillObject, opacity: 0.65 },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 14,
    justifyContent: 'space-between',
  },
  videoTopControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  drmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.35)',
  },
  drmText: { color: '#10B981', fontSize: 10, fontWeight: '700' },
  speedBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  speedText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  playButtonLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: staticTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseBar: { width: 4, height: 18, backgroundColor: '#FFF', borderRadius: 2 },
  videoBottomControls: { width: '100%' },
  videoProgressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 8,
    position: 'relative',
  },
  videoProgressBarFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: staticTheme.colors.primary,
    borderRadius: 2,
  },
  videoProgressThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#FFF',
    borderRadius: 6,
    top: -4,
    marginLeft: -6,
  },
  videoTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoTimeText: { color: '#FFF', fontSize: 10, fontWeight: '600' },
  videoTimeRight: { flexDirection: 'row', alignItems: 'center' },

  // ── Chapter Banner ───────────────────────────────────────────────────────
  chapterBanner: {
    backgroundColor: '#0F0B2D',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  chapterBannerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  chapterBannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  markDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  markDoneBtnDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  markDoneBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  iconActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: staticTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: staticTheme.colors.border,
    flexWrap: 'wrap',
  },
  speedLabel: { fontSize: 12, fontWeight: '700', color: staticTheme.colors.textMuted },
  speedBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
  },
  speedBtnActive: { backgroundColor: staticTheme.colors.primary, borderColor: staticTheme.colors.primary },
  speedBtnText: { fontSize: 11.5, fontWeight: '600', color: staticTheme.colors.textMuted },
  speedBtnTextActive: { color: '#FFF' },

  chapterNotesBox: {
    margin: 16,
    backgroundColor: staticTheme.colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
  },
  chapterNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  chapterNotesTitle: { fontSize: 13, fontWeight: '700', color: staticTheme.colors.textMain },
  noteItem: {
    backgroundColor: staticTheme.colors.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
  },
  noteItemText: { fontSize: 13, color: staticTheme.colors.textMuted, lineHeight: 20 },

  // ── Course Cover ─────────────────────────────────────────────────────────
  courseCoverImage: { width: '100%', height: 210, resizeMode: 'cover' },
  courseDetailsPadding: { padding: 20 },
  tagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leftTags: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  tagPrimary: { color: staticTheme.colors.primary, fontSize: 12, fontWeight: '700' },
  tagMuted: { color: staticTheme.colors.textMuted, fontSize: 12, fontWeight: '500' },
  drmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  drmPillText: { color: '#10B981', fontSize: 10, fontWeight: '700' },
  courseMainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: staticTheme.colors.textMain,
    marginBottom: 8,
    lineHeight: 28,
  },
  mentorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  mentorText: { color: staticTheme.colors.textMuted, fontSize: 12 },

  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, color: staticTheme.colors.textMuted, fontWeight: '500' },
  progressValue: { fontSize: 12, color: staticTheme.colors.primary, fontWeight: '700' },

  quickStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  quickStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: staticTheme.colors.surface,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickStatText: { fontSize: 11, color: staticTheme.colors.textMuted, fontWeight: '600' },

  // ── Resume Card ──────────────────────────────────────────────────────────
  resumeCard: {
    backgroundColor: staticTheme.colors.surface,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  resumeCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  resumeCardInfo: { flex: 1 },
  resumeLessonTitle: { fontSize: 14, fontWeight: '700', color: staticTheme.colors.primary, marginBottom: 4 },
  resumeLessonMeta: { fontSize: 11, color: staticTheme.colors.textMuted },
  resumeBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: staticTheme.colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 8,
  },
  resumeBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  introBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  introBtnText: { color: staticTheme.colors.primary, fontSize: 12, fontWeight: '600' },

  // ── Analytics Snap ───────────────────────────────────────────────────────
  analyticsSnap: {
    backgroundColor: staticTheme.colors.surface,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 4,
  },
  analyticsSnapTitle: { fontSize: 13, fontWeight: '700', color: staticTheme.colors.textMain },
  analyticsSnapRow: { flexDirection: 'row', gap: 10, marginVertical: 12 },
  analyticsSnapItem: { flex: 1, gap: 4 },
  analyticsSnapVal: { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  analyticsSnapLabel: { fontSize: 10, color: staticTheme.colors.textMuted, fontWeight: '600' },
  analyticsSnapHint: { fontSize: 11, color: staticTheme.colors.textLight, textAlign: 'right' },

  // ── Tabs ─────────────────────────────────────────────────────────────────
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: staticTheme.colors.border,
    marginHorizontal: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: staticTheme.colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: staticTheme.colors.textLight },
  tabTextActive: { color: staticTheme.colors.primary },

  // ── Overview Tab ─────────────────────────────────────────────────────────
  overviewPad: { padding: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: staticTheme.colors.textMain, marginBottom: 10 },
  overviewDesc: {
    fontSize: 13,
    color: staticTheme.colors.textMuted,
    lineHeight: 22,
    marginBottom: 20,
  },
  instructorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: staticTheme.colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
  },
  instructorName: { fontSize: 14, fontWeight: '700', color: staticTheme.colors.textMain },
  instructorSpec: { fontSize: 12, color: staticTheme.colors.textMuted, marginTop: 2 },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoGridItem: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: staticTheme.colors.surface,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
  },
  infoGridVal: { fontSize: 14, fontWeight: '700', color: staticTheme.colors.textMain, marginTop: 2 },
  infoGridLabel: { fontSize: 10, color: staticTheme.colors.textLight, fontWeight: '600' },

  // ── Curriculum ───────────────────────────────────────────────────────────
  curriculumContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: staticTheme.colors.background,
  },
  curriculumQuickStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  quickStatSmall: { fontSize: 9, color: staticTheme.colors.textMuted, fontWeight: '500' },
  moduleCard: {
    backgroundColor: staticTheme.colors.surface,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  moduleHeaderActive: { backgroundColor: staticTheme.colors.primary + '15' },
  moduleNumBadge: {
    backgroundColor: staticTheme.colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
  moduleNumBadgeDone: { backgroundColor: 'rgba(16,185,129,0.1)' },
  moduleNumText: { color: staticTheme.colors.primary, fontSize: 13, fontWeight: '700' },
  moduleHeaderInfo: { flex: 1 },
  moduleTitle: { fontSize: 13, fontWeight: '700', color: staticTheme.colors.textMain, marginBottom: 2 },
  moduleSubtitle: { fontSize: 11, color: staticTheme.colors.textMuted },
  doneTag: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '700',
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 99,
  },
  watchingTag: {
    fontSize: 10,
    color: staticTheme.colors.primary,
    fontWeight: '700',
    backgroundColor: staticTheme.colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 99,
  },
  noteTag: { fontSize: 9, color: '#8B5CF6', fontWeight: '700' },

  lessonsList: { borderTopWidth: 1, borderTopColor: staticTheme.colors.border },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: staticTheme.colors.border,
  },
  lessonItemActive: { backgroundColor: staticTheme.colors.primary + '15' },
  lessonInfo: { flex: 1, marginLeft: 12 },
  lessonTitle: { fontSize: 13, fontWeight: '600', color: staticTheme.colors.textMain, marginBottom: 2 },
  lessonDuration: { fontSize: 11, color: staticTheme.colors.textLight },
  noteMetaText: { fontSize: 10, color: '#3B82F6', fontWeight: '700', marginTop: 2 },
  liveMetaText: { fontSize: 10, color: '#EF4444', fontWeight: '700', marginTop: 2 },
  lastWatchedTag: {
    fontSize: 10,
    color: staticTheme.colors.primary,
    backgroundColor: staticTheme.colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '600',
  },

  // ── Chapter Nav ──────────────────────────────────────────────────────────
  chapterNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 16,
    padding: 16,
    backgroundColor: staticTheme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
    gap: 12,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
  },
  navBtnPrimary: { backgroundColor: staticTheme.colors.primary, borderColor: staticTheme.colors.primary },
  navBtnDisabled: { opacity: 0.35 },
  navBtnText: { fontSize: 12, fontWeight: '600', color: staticTheme.colors.primary },
  navBtnPrimaryText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  navCenter: { flex: 1, alignItems: 'center' },
  navCenterText: { fontSize: 12, fontWeight: '700', color: staticTheme.colors.textMain, textAlign: 'center' },
  sessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  sessionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  sessionText: { fontSize: 10, color: staticTheme.colors.textLight },

  // ── Note Modal ───────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(13,12,29,0.55)',
  },
  noteModal: { backgroundColor: staticTheme.colors.surface, borderRadius: 20, overflow: 'hidden', margin: 0 },
  noteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F0B2D',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  noteModalTitle: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  noteModalChapter: { color: 'rgba(255,255,255,0.5)', fontSize: 12, flex: 1 },
  noteModalBody: { padding: 20 },
  noteTextArea: {
    width: '100%',
    minHeight: 120,
    padding: 12,
    borderWidth: 1.5,
    borderColor: staticTheme.colors.border,
    borderRadius: 12,
    fontSize: 14,
    color: staticTheme.colors.textMain,
    backgroundColor: staticTheme.colors.background,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  noteModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
  },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: staticTheme.colors.textMuted },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 99,
    backgroundColor: staticTheme.colors.primary,
  },
  saveBtnText: { fontSize: 13, fontWeight: '600', color: '#FFF' },

  // ── All Notes Modal ──────────────────────────────────────────────────────
  allNotesOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13,12,29,0.55)',
    justifyContent: 'flex-end',
  },
  allNotesSheet: {
    backgroundColor: staticTheme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    flex: 1,
    overflow: 'hidden',
  },
  allNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#0F0B2D',
  },
  allNotesTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  allNotesSub: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  allNotesClose: {
    width: 34,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyNotesText: { fontSize: 15, fontWeight: '700', color: staticTheme.colors.textLight, marginTop: 12 },
  emptyNotesSub: { fontSize: 12, color: staticTheme.colors.border, textAlign: 'center' },
  noteCard: {
    backgroundColor: staticTheme.colors.surface,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  noteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: staticTheme.colors.primary + '10',
  },
  noteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: staticTheme.colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  noteChipText: { fontSize: 10.5, color: staticTheme.colors.primary, fontWeight: '700' },
  noteChapterName: { flex: 1, fontSize: 12, fontWeight: '600', color: staticTheme.colors.textMain },
  noteGoBtn: { fontSize: 11, color: staticTheme.colors.primary, fontWeight: '700' },
  noteContent: {
    fontSize: 13,
    color: staticTheme.colors.textMuted,
    lineHeight: 20,
    padding: 12,
  },
  noteTimestamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  noteTimestampText: { fontSize: 10.5, color: staticTheme.colors.textLight },

  // ── Analytics Modal ──────────────────────────────────────────────────────
  metricCard: {
    flex: 1,
    backgroundColor: staticTheme.colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
  },
  metricVal: { fontSize: 28, fontWeight: '800', lineHeight: 32 },
  metricLabel: { fontSize: 10, color: staticTheme.colors.textMuted, fontWeight: '600' },
  streakRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  streakItem: {
    flex: 1,
    backgroundColor: staticTheme.colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
  },
  streakVal: { fontSize: 15, fontWeight: '800', color: staticTheme.colors.textMain },
  streakLabel: { fontSize: 10, color: staticTheme.colors.textMuted },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: staticTheme.colors.border,
  },
  infoRowLabel: { fontSize: 13, color: staticTheme.colors.textMuted },
  infoRowVal: { fontSize: 13, fontWeight: '700', color: staticTheme.colors.textMain },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: staticTheme.colors.surface,
    borderRadius: 11,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
  },
  milestoneBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(16,185,129,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneDesc: { fontSize: 13, fontWeight: '700', color: staticTheme.colors.textMain },
  milestoneMeta: { fontSize: 11, color: staticTheme.colors.textLight, marginTop: 2 },
  pointsBadge: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  pointsText: { fontSize: 10, color: '#F59E0B', fontWeight: '700' },
});

export default CourseLearning;
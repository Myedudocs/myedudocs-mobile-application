import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Share, 
  Modal,
  InteractionManager
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  CornerUpRight, 
  Heart, 
  FileText, 
  Book, 
  ShoppingCart, 
  CheckCircle2, 
  XCircle, 
  Share2,
  Globe,
  Briefcase,
  Shield,
  TrainFront,
  GraduationCap,
  Library,
  School,
  ChevronRight
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { ENDPOINTS, apiClient, BASE_URL } from '../../service/api.service';
import { useAuth } from '../../context/AuthContext';
import RatingBadge from '../../components/RatingBadge';
import BookSkeleton from '../../components/skeletons/BookSkeleton';
import { getImageUrl } from '../../utils/image.utils';

// --------------------------------------------------------
// 1. HELPERS
// --------------------------------------------------------
const getFinalPrice = (price?: number, discount?: number) => {
  if (!price || price <= 0) return 0;
  if (!discount || discount <= 0) return price;
  return Math.round(price - (price * discount) / 100);
};

const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

type AlertType = 'success' | 'error' | 'warning' | 'info';
interface CustomAlertConfig {
  visible: boolean; title: string; message: string; type: AlertType;
  onConfirm?: () => void; onCancel?: () => void; confirmText?: string; cancelText?: string;
}

// --------------------------------------------------------
// 2. MAIN COMPONENT
// --------------------------------------------------------
const CategoryPill = ({ label, icon: Icon, active, onPress }: any) => (
  <TouchableOpacity 
    style={[styles.pill, active && styles.pillActive]} 
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Icon size={14} color={active ? '#FFFFFF' : '#64748B'} />
    <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
  </TouchableOpacity>
);

export const PopularBooks = React.memo(() => {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [books, setBooks] = useState<any[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedFormats, setSelectedFormats] = useState<Record<string, 'digital' | 'physical'>>({});
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [wishlistLoadingId, setWishlistLoadingId] = useState<string | null>(null);

  const [customAlert, setCustomAlert] = useState<CustomAlertConfig>({ visible: false, title: '', message: '', type: 'info' });

  const triggerAlert = (title: string, message: string, type: AlertType = 'info', onConfirm?: () => void, onCancel?: () => void, confirmText = 'OK', cancelText?: string) => {
    setCustomAlert({ visible: true, title, message, type, onConfirm, onCancel, confirmText, cancelText });
  };
  const hideAlert = () => setCustomAlert(prev => ({ ...prev, visible: false }));

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const json = await apiClient(ENDPOINTS.GET_POPULAR_BOOKS);
        const allBooks = json?.books || [];
        // The web shows all popular books, not just 4. 
        const finalList = allBooks.filter((b: any) => b.isPopular);

        if (finalList.length > 0) {
          setBooks(finalList);
          setFilteredBooks(finalList);
          
          const formatMap: Record<string, 'digital' | 'physical'> = {};
          finalList.forEach((b: any) => {
            formatMap[b._id] = (b.physicalPrice > 0) ? "physical" : "digital";
          });
          setSelectedFormats(formatMap);

          if (user?.token) {
            const wishlistRes = await fetch(`${BASE_URL}/wishlist/my`, {
              headers: { Authorization: `Bearer ${user.token}` }
            });
            const wishlistData = await wishlistRes.json();
            if (wishlistData?.data?.items) {
              const ids = new Set<string>(wishlistData.data.items.filter((i: any) => i.item_type === "book").map((i: any) => i.item_id));
              setWishlistedIds(ids);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load books', err);
      } finally {
        setLoading(false);
      }
    };
    const task = InteractionManager.runAfterInteractions(() => {
      initData();
    });
    return () => task.cancel();
  }, [user]);

  useEffect(() => {
    if (activeCategory === 'All') {
      setFilteredBooks(books);
    } else {
      setFilteredBooks(books.filter(b => b.category?.name?.toUpperCase() === activeCategory.toUpperCase()));
    }
  }, [activeCategory, books]);

  // --- ACTIONS (Same logic, but will be called from new UI) ---
  const toggleWishlist = async (book: any) => {
    if (!user?.token) {
      triggerAlert("Login Required", "Please login to use the wishlist ❤️", "info", () => { hideAlert(); navigation.navigate("Login"); }, hideAlert, "Login Now", "Cancel");
      return;
    }
    if (wishlistLoadingId) return;
    setWishlistLoadingId(book._id);
    const isSaved = wishlistedIds.has(book._id);

    try {
      const res = await fetch(`${BASE_URL}/wishlist/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({
          item_type: "book",
          item_id: book._id,
          snapshot: { title: book.title, author: book.author, coverImage: book.coverImage, price: book.digitalPrice || book.physicalPrice || 0 }
        })
      });
      if (res.ok) {
        setWishlistedIds(prev => {
          const n = new Set(prev);
          isSaved ? n.delete(book._id) : n.add(book._id);
          return n;
        });
        triggerAlert(isSaved ? "Removed" : "Saved", isSaved ? "Removed from wishlist" : "Added to wishlist ❤️", "success");
      }
    } catch (err) {
      triggerAlert("Error", "Failed to update wishlist", "error");
    } finally {
      setWishlistLoadingId(null);
    }
  };

  const addBookToCart = async (book: any) => {
    const cartKey = user?.id ? `myedudocs-cart-${user.id}` : "myedudocs-guest-cart";
    try {
      const cartStr = await AsyncStorage.getItem(cartKey);
      let cart = cartStr ? JSON.parse(cartStr) : [];
      const existing = cart.find((i: any) => i.bookId === book._id && i.bookType === 'paperback');

      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          bookId: book._id, 
          bookType: 'paperback',         
          title: book.title,
          author: book.author,
          coverImage: book.coverImage,
          finalPrice: getFinalPrice(book.physicalPrice, book.physicalDiscountPercentage),
          quantity: 1,
        });
      }
      await AsyncStorage.setItem(cartKey, JSON.stringify(cart));
      triggerAlert(
        "Added to Cart 🛒",
        `"${book.title}" added to your cart.`,
        "success",
        () => {
          hideAlert();
          navigation.navigate("Cart");
        },
        hideAlert,
        "View Cart",
        "Continue"
      );
    } catch (e) {
      triggerAlert("Error", "Failed to add to cart", "error");
    }
  };

  const handleShare = async (book: any) => {
    try {
      await Share.share({
        message: `Check out "${book.title}" on MyEduDocs!\nhttps://myedudocs.in/book-details/${book._id}`,
      });
    } catch (error) {
      console.log('Error sharing book:', error);
    }
  };

  const handleBuyNow = (book: any) => {
    const format = selectedFormats[book._id];
    navigation.navigate('BookDetails', { id: book._id, selectedFormat: format });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. Header with Browse All Button */}
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMain }]}>Popular Books</Text>
          <Text style={[styles.sectionSub, { color: theme.colors.textMuted }]}>Top-rated study materials for your preparation.</Text>
        </View>
        <TouchableOpacity 
          style={[styles.browseBtn, { backgroundColor: theme.colors.primary }]} 
          onPress={() => navigation.navigate('Books')}
          activeOpacity={0.8}
        >
          <Text style={styles.browseBtnText}>Browse All</Text>
          <ChevronRight color="#FFFFFF" size={14} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* 2. Category Filters (Horizontal Pills) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContainer}>
        {[
          { label: 'All Categories', icon: Globe, key: 'All' },
          { label: 'PRIVATE JOB', icon: Briefcase, key: 'PRIVATE JOB' },
          { label: 'BANK', icon: School, key: 'BANK' },
          { label: 'POLICE', icon: Shield, key: 'POLICE' },
          { label: 'RAILWAY', icon: TrainFront, key: 'RAILWAY' },
          { label: 'TEACHER', icon: GraduationCap, key: 'TEACHER' },
          { label: 'GOVERNMENT', icon: Library, key: 'GOVERNMENT' },
        ].map(cat => {
          const active = activeCategory === cat.key;
          const Icon = cat.icon;
          return (
            <TouchableOpacity 
              key={cat.key}
              style={[
                styles.pill, 
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                }
              ]} 
              onPress={() => setActiveCategory(cat.key)}
              activeOpacity={0.8}
            >
              <Icon size={14} color={active ? '#FFFFFF' : theme.colors.textMuted} />
              <Text style={[
                styles.pillText, 
                { color: active ? '#FFFFFF' : theme.colors.textMuted },
                active && styles.pillTextActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 3. Books Horizontal List */}
      {loading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {[1, 2, 3, 4].map((_, i) => <BookSkeleton key={i} />)}
        </ScrollView>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent} snapToInterval={280 + 16} decelerationRate="fast">
          {filteredBooks.map((book) => {
            const currentFormat = selectedFormats[book._id];
            const isSaved = wishlistedIds.has(book._id);

            return (
              <View key={book._id} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                {/* Book Cover Area */}
                <View style={[styles.imageContainer, { backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9' }]}>
                  <Image source={{ uri: getImageUrl(book.coverImage) }} style={styles.bookImage} resizeMode="contain" />
                  {book.isPopular && <View style={styles.bestSellerBadge}><Text style={styles.bestSellerText}>BEST SELLER</Text></View>}
                  
                  {/* Floating Actions */}
                  <View style={styles.floatingActions}>
                    <TouchableOpacity style={[styles.floatingBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]} onPress={() => handleShare(book)}>
                      <Share2 color={theme.colors.textMuted} size={15} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.floatingBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]} onPress={() => toggleWishlist(book)}>
                      {wishlistLoadingId === book._id ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <Heart color={isSaved ? "#EF4444" : theme.colors.textMuted} fill={isSaved ? "#EF4444" : "transparent"} size={15} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Info Row */}
                <View style={styles.infoRow}>
                  <View style={[styles.categoryBadge, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }]}>
                    <Text style={[styles.categoryLabel, { color: theme.colors.primary }]}>{book.category?.name?.toUpperCase() || 'BOOK'}</Text>
                  </View>
                  <View style={styles.langRow}>
                    <Globe color={theme.colors.textMuted} size={11} />
                    <Text style={[styles.langText, { color: theme.colors.textMuted }]}>{book.language || 'English'}</Text>
                  </View>
                </View>

                <Text style={[styles.bookTitle, { color: theme.colors.textMain }]} numberOfLines={2}>{book.title}</Text>
                <Text style={[styles.authorText, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  By {book.author || "MyEduDocs Team"}
                </Text>

                {/* Format Selector (Ebook vs Paperback) */}
                <View style={styles.formatGrid}>
                   {book.digitalPrice > 0 && (
                     <TouchableOpacity 
                       style={[
                         styles.formatCell, 
                         { 
                           backgroundColor: currentFormat === 'digital' ? (isDarkMode ? 'rgba(99,102,241,0.15)' : '#EEF2FF') : theme.colors.background,
                           borderColor: currentFormat === 'digital' ? theme.colors.primary : theme.colors.border,
                         }
                       ]} 
                       onPress={() => setSelectedFormats(p => ({...p, [book._id]: 'digital'}))}
                     >
                       <View style={styles.formatHeader}>
                         <FileText color={currentFormat === 'digital' ? theme.colors.primary : theme.colors.textMuted} size={12} />
                         <Text style={[styles.formatName, { color: currentFormat === 'digital' ? theme.colors.primary : theme.colors.textMuted }]}>EBOOK</Text>
                       </View>
                       <Text style={[styles.priceText, { color: theme.colors.textMain }]}>{formatCurrency(getFinalPrice(book.digitalPrice, book.digitalDiscountPercentage))}</Text>
                     </TouchableOpacity>
                   )}
                   {book.physicalPrice > 0 && (
                     <TouchableOpacity 
                       style={[
                         styles.formatCell, 
                         { 
                           backgroundColor: currentFormat === 'physical' ? (isDarkMode ? 'rgba(99,102,241,0.15)' : '#EEF2FF') : theme.colors.background,
                           borderColor: currentFormat === 'physical' ? theme.colors.primary : theme.colors.border,
                         }
                       ]} 
                       onPress={() => setSelectedFormats(p => ({...p, [book._id]: 'physical'}))}
                     >
                       <View style={styles.formatHeader}>
                         <Book color={currentFormat === 'physical' ? theme.colors.primary : theme.colors.textMuted} size={12} />
                         <Text style={[styles.formatName, { color: currentFormat === 'physical' ? theme.colors.primary : theme.colors.textMuted }]}>PAPERBACK</Text>
                       </View>
                       <Text style={[styles.priceText, { color: theme.colors.textMain }]}>{formatCurrency(getFinalPrice(book.physicalPrice, book.physicalDiscountPercentage))}</Text>
                     </TouchableOpacity>
                   )}
                </View>

                {/* Bottom Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.buyNowBtn, { backgroundColor: theme.colors.primary }]} onPress={() => handleBuyNow(book)} activeOpacity={0.85}>
                    <Text style={styles.buyNowText}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.addCartMini, 
                      { 
                        backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF',
                        borderColor: theme.colors.primary,
                      }
                    ]} 
                    onPress={() => addBookToCart(book)}
                    activeOpacity={0.8}
                  >
                    <ShoppingCart color={theme.colors.primary} size={15} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* CUSTOM ALERT */}
      <Modal visible={customAlert.visible} transparent animationType="fade">
        <View style={styles.customAlertOverlay}>
          <View style={[styles.customAlertBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.customAlertIconContainer, { backgroundColor: customAlert.type === 'success' ? '#ECFDF5' : '#FEF2F2' }]}>
              {customAlert.type === 'success' ? <CheckCircle2 color="#10B981" size={32} /> : <XCircle color="#EF4444" size={32} />}
            </View>
            <Text style={[styles.customAlertTitle, { color: theme.colors.textMain }]}>{customAlert.title}</Text>
            <Text style={[styles.customAlertMessage, { color: theme.colors.textMuted }]}>{customAlert.message}</Text>
            <TouchableOpacity style={[styles.customAlertConfirmBtn, { backgroundColor: theme.colors.primary }]} onPress={hideAlert}>
              <Text style={styles.customAlertConfirmText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  headerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 16,
    gap: 12
  },
  titleContainer: {
    flex: 1,
  },
  sectionTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  sectionSub: { fontSize: 13, marginTop: 4, fontWeight: '500' },
  browseBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 12,
    gap: 4
  },
  browseBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  
  // Category Pills
  pillsContainer: { paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  pill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 1, 
  },
  pillActive: {
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 10,
  },
  card: {
    width: 270,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  bookImage: {
    width: '80%',
    height: '90%',
  },
  bestSellerBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bestSellerText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  floatingActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    gap: 6,
  },
  floatingBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  langText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    marginBottom: 4,
  },
  authorText: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 12,
  },
  formatGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  formatCell: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
  },
  formatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  formatName: {
    fontSize: 9,
    fontWeight: '800',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  buyNowBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  addCartMini: {
    width: 40,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  customAlertBox: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  customAlertIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  customAlertTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  customAlertMessage: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  customAlertConfirmBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  customAlertConfirmText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
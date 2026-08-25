import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Share,
  Modal,
  FlatList
} from 'react-native';
import {
  Search,
  Globe,
  CornerUpRight,
  Heart,
  FileText,
  Book as BookIcon,
  ShoppingCart,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { Header } from '../home/Header';
import { ENDPOINTS, apiClient, BASE_URL } from '../../service/api.service';
import { useAuth } from '../../context/AuthContext';
import RatingBadge from '../../components/RatingBadge';
import BookSkeleton from '../../components/skeletons/BookSkeleton';
import { NotFound } from '../../components/NotFound';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { getImageUrl, DEFAULT_BOOK_PLACEHOLDER } from '../../utils/image.utils';

// --------------------------------------------------------
// 1. TYPES & FALLBACK DATA
// --------------------------------------------------------
const FILTERS = ['All Books', 'JEE', 'NEET', 'SSC', 'UPSC'];

const FALLBACK_BOOKS = [
  {
    _id: 'b1',
    category: { name: 'UPSC' },
    language: 'English',
    title: 'General Studies Vol 1: Indian Polity',
    author: 'MyEdudocs Editorial Team',
    digitalPrice: 200,
    digitalDiscountPercentage: 20,
    physicalPrice: 800,
    physicalDiscountPercentage: 10,
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80',
    isPopular: true,
  },
  {
    _id: 'b2',
    category: { name: 'Banking' },
    language: 'English',
    title: 'Advanced Quantitative Aptitude',
    author: 'Sarah Jenkins',
    digitalPrice: 150,
    digitalDiscountPercentage: 0,
    physicalPrice: 500,
    physicalDiscountPercentage: 0,
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
    isPopular: false,
  }
];

// --- CUSTOM ALERT TYPE ---
type AlertType = 'success' | 'error' | 'warning' | 'info';
interface CustomAlertConfig {
  visible: boolean; title: string; message: string; type: AlertType;
  onConfirm?: () => void; onCancel?: () => void; confirmText?: string; cancelText?: string;
}

// --------------------------------------------------------
// 2. HELPER FUNCTIONS
// --------------------------------------------------------
const getFinalPrice = (price?: number, discount?: number) => {
  if (!price || price <= 0) return 0;
  if (!discount || discount <= 0) return price;
  return Math.round(price - (price * discount) / 100);
};

const formatCurrency = (amount: number) => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

// --------------------------------------------------------
// 3. MAIN COMPONENT
// --------------------------------------------------------
export const Books = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth(); // Global Auth
  const { theme: themeData, isDarkMode } = useTheme();

  const [activeFilter, setActiveFilter] = useState('All Books');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track selected format per book: { 'bookId': 'digital' | 'physical' }
  const [selectedFormats, setSelectedFormats] = useState<Record<string, 'digital' | 'physical'>>({});

  // Wishlist State
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [wishlistLoadingId, setWishlistLoadingId] = useState<string | null>(null);

  // Custom Alert State
  const [customAlert, setCustomAlert] = useState<CustomAlertConfig>({ visible: false, title: '', message: '', type: 'info' });
  const triggerAlert = (title: string, message: string, type: AlertType = 'info', onConfirm?: () => void, onCancel?: () => void, confirmText = 'OK', cancelText?: string) => {
    setCustomAlert({ visible: true, title, message, type, onConfirm, onCancel, confirmText, cancelText });
  };
  const hideAlert = () => setCustomAlert(prev => ({ ...prev, visible: false }));

  // --- INITIALIZE DATA ---
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        // 1. Fetch All Books
        const json = await apiClient(ENDPOINTS.GET_POPULAR_BOOKS);
        const allBooks = json?.books || [];
        
        if (allBooks.length > 0) {
          setBooks(allBooks);
          
          // Set default selected format for each book based on availability
          const formatMap: Record<string, 'digital' | 'physical'> = {};
          allBooks.forEach((b: any) => {
            if (typeof b.physicalPrice === "number" && b.physicalPrice > 0) {
              formatMap[b._id] = "physical";
            } else if (typeof b.digitalPrice === "number" && b.digitalPrice > 0) {
              formatMap[b._id] = "digital";
            } else {
              formatMap[b._id] = "digital"; 
            }
          });
          setSelectedFormats(formatMap);

          // 2. Fetch Wishlist (if logged in)
          if (user?.token) {
            const wishlistRes = await fetch(`${BASE_URL}/wishlist/my`, {
              headers: { Authorization: `Bearer ${user.token}` }
            });
            const wishlistData = await wishlistRes.json();
            if (wishlistData?.data?.items) {
              const ids = new Set<string>();
              wishlistData.data.items.forEach((i: any) => {
                if (i.item_type === "book") ids.add(i.item_id);
              });
              setWishlistedIds(ids);
            }
          }

        } else {
          setBooks(FALLBACK_BOOKS);
          setSelectedFormats({ [FALLBACK_BOOKS[0]._id]: 'physical', [FALLBACK_BOOKS[1]._id]: 'physical' });
        }
      } catch (err) {
        console.error('Failed to load books', err);
        setBooks(FALLBACK_BOOKS);
        setSelectedFormats({ [FALLBACK_BOOKS[0]._id]: 'physical', [FALLBACK_BOOKS[1]._id]: 'physical' });
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [user]);

  // --- SHARE ACTION ---
  const handleShare = async (title: string, id: string) => {
    try {
      await Share.share({
        message: `Check out "${title}" on MyEduDocs!\nhttps://myedudocs.in/book-details/${id}`,
      });
    } catch (error) {
      console.log('Error sharing book:', error);
    }
  };

  // --- WISHLIST ACTION ---
  const toggleWishlist = async (book: any) => {
    if (!user?.token) {
      triggerAlert("Login Required", "Please login to use the wishlist ❤️", "info", () => { hideAlert(); navigation.navigate("Login"); }, hideAlert, "Login Now", "Cancel");
      return;
    }
    
    if (wishlistLoadingId) return; // Prevent double clicks
    
    setWishlistLoadingId(book._id);
    const isAlreadyWishlisted = wishlistedIds.has(book._id);

    try {
      const res = await fetch(`${BASE_URL}/wishlist/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({
          item_type: "book",
          item_id: book._id,
          snapshot: {
            title: book.title,
            author: book.author,
            coverImage: book.coverImage,
            price: book.digitalPrice || book.physicalPrice || 0,
            digitalPrice: book.digitalPrice,
            physicalPrice: book.physicalPrice,
            digitalDiscountPercentage: book.digitalDiscountPercentage,
            physicalDiscountPercentage: book.physicalDiscountPercentage,
            language: book.language,
            category: book.category?.name,
            rating: book.rating,
            reviews: book.reviews,
            isPopular: book.isPopular,
          }
        })
      });
      if (res.ok) {
        setWishlistedIds(prev => {
          const n = new Set(prev);
          isAlreadyWishlisted ? n.delete(book._id) : n.add(book._id);
          return n;
        });
        triggerAlert(isAlreadyWishlisted ? "Removed" : "Saved", isAlreadyWishlisted ? "Removed from wishlist" : "Added to wishlist ❤️", "success");
      }
    } catch (err) {
      triggerAlert("Error", "Failed to update wishlist", "error");
    } finally {
      setWishlistLoadingId(null);
    }
  };

  // --- CART ACTION ---
  const addBookToCart = async (book: any) => {
    const isEbook = selectedFormats[book._id] === "digital";
    
    // Safety check - we only add physical books to cart from here
    if (isEbook) {
      triggerAlert("Digital Book", "Ebooks cannot be added to the cart. Please purchase them directly using 'Buy Now'.", "info");
      return;
    }

    const cartKey = user?.id ? `myedudocs-cart-${user.id}` : "myedudocs-guest-cart";
    const bookType = "paperback";
    const basePrice = book.physicalPrice;
    const discount = book.physicalDiscountPercentage;

    if (!basePrice || basePrice <= 0) {
      triggerAlert("Error", "Invalid book price", "error");
      return;
    }

    const finalPrice = getFinalPrice(basePrice, discount);

    try {
      const cartStr = await AsyncStorage.getItem(cartKey);
      let cart: any[] = cartStr ? JSON.parse(cartStr) : [];

      const existing = cart.find(i => i.bookId === book._id && i.bookType === bookType);

      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          cartItemId: `${book._id}-${bookType}-${Date.now()}`,
          book_id: book._id,
          bookId: book._id, 
          bookType,         
          title: book.title,
          author: book.author,
          coverImage: book.coverImage,
          basePrice,
          discountPercentage: discount || 0,
          finalPrice,
          quantity: 1,
          addedAt: new Date().toISOString()
        });
      }

      await AsyncStorage.setItem(cartKey, JSON.stringify(cart));
      triggerAlert(
        "Added to Cart 🛒",
        `"${book.title}" (Hardcover) has been added to your cart.`,
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
      console.error(e);
      triggerAlert("Error", "Failed to add item to cart.", "error");
    }
  };

  // --- BUY NOW ACTION ---
  const handleBuyNow = (book: any) => {
    // Navigate directly to BookDetails for any format.
    navigation.navigate('BookDetails', { id: book._id }); 
  };

  // --- CLIENT-SIDE FILTERING & SEARCHING ---
  const filteredByCategory = activeFilter === 'All Books' 
    ? books 
    : books.filter(b => b.category?.name?.toUpperCase() === activeFilter.toUpperCase());

  const displayedBooks = filteredByCategory.filter(b => 
    b.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- RENDER ITEM ---
  const renderBookItem = useCallback(({ item: book }: { item: any }) => {
    const currentFormat = selectedFormats[book._id];
    const hasDigital = typeof book.digitalPrice === "number" && book.digitalPrice > 0;
    const hasPhysical = typeof book.physicalPrice === "number" && book.physicalPrice > 0;
    const isWishlisted = wishlistedIds.has(book._id);

    return (
      <View style={styles.card}>
        {/* Left Side: Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getImageUrl(book.coverImage || book.image || book.thumbnail) }}
            style={styles.bookImage}
            resizeMode="cover"
          />
          {book.isPopular && (
            <View style={styles.bestSellerBadge}>
              <Text style={styles.bestSellerText}>BEST SELLER</Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.shareButton} 
            activeOpacity={0.8}
            onPress={() => handleShare(book.title, book._id)}
          >
            <CornerUpRight color={themeData.colors.primary} size={14} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Right Side: Details */}
        <View style={styles.cardContent}>
          {/* Tags & Action Icons */}
          <View style={styles.tagsRow}>
            <View style={styles.leftTags}>
              <Text style={styles.categoryTag}>{book.category?.name || 'General'}</Text>
              <View style={styles.languageWrap}>
                <Globe color={themeData.colors.textMuted} size={12} strokeWidth={2} />
                <Text style={styles.langTag}>{book.language || 'English'}</Text>
              </View>
            </View>
            <View style={styles.actionIcons}>
              <TouchableOpacity 
                activeOpacity={0.7} 
                style={{ marginRight: 10 }}
                onPress={() => handleShare(book.title, book._id)}
              >
                <CornerUpRight color={themeData.colors.textMuted} size={16} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => toggleWishlist(book)}
                disabled={wishlistLoadingId === book._id}
              >
                {wishlistLoadingId === book._id ? (
                  <ActivityIndicator size="small" color={themeData.colors.danger} />
                ) : (
                  <Heart color={isWishlisted ? themeData.colors.danger : themeData.colors.textLight} fill={isWishlisted ? themeData.colors.danger : "transparent"} size={16} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Title & Author */}
          <Text style={styles.bookTitle} numberOfLines={2}>
            {book.title || 'Untitled Book'}
          </Text>
          <Text style={styles.authorText}>
            Author: {book.author || 'Unknown'}
          </Text>

          {/* ★ REAL RATING — book.rating is auto-updated by the review system */}
          <RatingBadge
            itemId={book._id}
            itemType="book"
            preloadedRating={book.rating}
            preloadedCount={book.reviews}
            size="sm"
            token={user?.token}
          />

          {/* Formats Selection */}
          <View style={styles.formatsRow}>
            {/* --- EBOOK --- */}
            {hasDigital && (
              <TouchableOpacity 
                style={currentFormat === 'digital' ? styles.formatBoxActive : styles.formatBoxInactive} 
                activeOpacity={0.9}
                onPress={() => {
                  if (book.digitalPrice) setSelectedFormats(p => ({...p, [book._id]: 'digital'}));
                }}
              >
                <View style={styles.formatTopRow}>
                  <FileText color={currentFormat === 'digital' ? "#6366F6" : "#94A3B8"} size={12} strokeWidth={2.5} />
                  <Text style={currentFormat === 'digital' ? styles.formatTextActive : styles.formatTextInactive}>Ebook</Text>
                </View>
                <View style={styles.formatBottomRow}>
                  {book.digitalPrice ? (
                    <>
                      {book.digitalDiscountPercentage > 0 && (
                        <Text style={styles.oldPrice}>{formatCurrency(book.digitalPrice)}</Text>
                      )}
                      <Text style={styles.newPrice}>
                        {formatCurrency(getFinalPrice(book.digitalPrice, book.digitalDiscountPercentage))}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.newPrice}>N/A</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}

            {/* --- HARDCOVER --- */}
            {hasPhysical && (
              <TouchableOpacity 
                style={currentFormat === 'physical' ? styles.formatBoxActive : styles.formatBoxInactive} 
                activeOpacity={0.8}
                onPress={() => {
                  if (book.physicalPrice) setSelectedFormats(p => ({...p, [book._id]: 'physical'}));
                }}
              >
                <View style={styles.formatTopRow}>
                  <BookIcon color={currentFormat === 'physical' ? "#6366F6" : "#94A3B8"} size={12} strokeWidth={2} />
                  <Text style={currentFormat === 'physical' ? styles.formatTextActive : styles.formatTextInactive}>Hardcover</Text>
                </View>
                <View style={styles.formatBottomRow}>
                  {book.physicalPrice ? (
                    <>
                      {book.physicalDiscountPercentage > 0 && (
                        <Text style={styles.oldPrice}>{formatCurrency(book.physicalPrice)}</Text>
                      )}
                      <Text style={styles.newPriceBlack}>
                        {formatCurrency(getFinalPrice(book.physicalPrice, book.physicalDiscountPercentage))}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.newPriceBlack}>N/A</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              style={[styles.buyNowBtn, currentFormat === 'digital' && { flex: 1 }]} 
              activeOpacity={0.8}
              onPress={() => handleBuyNow(book)} 
            >
              <Text style={styles.buyNowText}>Buy Now</Text>
            </TouchableOpacity>
            {currentFormat === 'physical' && (
              <TouchableOpacity 
                style={styles.addCartBtn} 
                activeOpacity={0.8}
                onPress={() => addBookToCart(book)}
              >
                <Text style={styles.addCartText}>Add</Text>
                <ShoppingCart color={themeData.colors.primary} size={14} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }, [selectedFormats, wishlistedIds, wishlistLoadingId, user?.token]);

  return (
    <ScreenContainer
      header={{ title: 'Books Store', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      scroll={false}
    >

        {/* --- BOOKS LIST (with search/filter as ListHeaderComponent) --- */}
        {loading ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {[1, 2, 3, 4].map((key) => <BookSkeleton key={key} />)}
          </ScrollView>
        ) : (
        <FlatList
          data={displayedBooks}
          keyExtractor={(item) => item._id}
          renderItem={renderBookItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListHeaderComponent={
            <View>
              {/* --- SEARCH BAR --- */}
              <View style={styles.searchContainer}>
                <Search color={themeData.colors.textLight} size={18} strokeWidth={2.5} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search books..."
                  placeholderTextColor={themeData.colors.textLight}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* --- HORIZONTAL FILTERS --- */}
              <View style={styles.filtersWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filtersScrollContent}
                >
                  {FILTERS.map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={[styles.filterPill, activeFilter === filter && styles.filterPillActive]}
                      onPress={() => setActiveFilter(filter)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                        {filter}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          }
          ListEmptyComponent={
            <NotFound
              type="search"
              title="No Books Found"
              subtitle={`We couldn't find any books matching "${searchQuery}" in ${activeFilter}.`}
              buttonText="Clear Filters"
              onButtonPress={() => { setSearchQuery(''); setActiveFilter('All Books'); }}
            />
          }
        />
        )}

        {/* ========================================================= */}
        {/* CUSTOM ALERT MODAL */}
        {/* ========================================================= */}
        <Modal visible={customAlert.visible} transparent={true} animationType="fade" onRequestClose={hideAlert}>
          <View style={styles.customAlertOverlay}>
            <View style={styles.customAlertBox}>
              <View style={[styles.customAlertIconContainer,
              customAlert.type === 'success' && { backgroundColor: '#ECFDF5' },
              customAlert.type === 'error' && { backgroundColor: '#FEF2F2' },
              customAlert.type === 'warning' && { backgroundColor: '#FFFBEB' },
              customAlert.type === 'info' && { backgroundColor: '#EEF2FF' },
            ]}>
              {customAlert.type === 'success' && <CheckCircle2 color={themeData.colors.success} size={32} />}
              {customAlert.type === 'error' && <XCircle color={themeData.colors.danger} size={32} />}
              {customAlert.type === 'warning' && <AlertTriangle color="#F59E0B" size={32} />}
              {customAlert.type === 'info' && <Info color={themeData.colors.primary} size={32} />}
            </View>
            <Text style={styles.customAlertTitle}>{customAlert.title}</Text>
            <Text style={styles.customAlertMessage}>{customAlert.message}</Text>
            <View style={styles.customAlertActionRow}>
              {customAlert.onCancel && (
                <TouchableOpacity style={styles.customAlertCancelBtn} onPress={customAlert.onCancel} activeOpacity={0.8}>
                  <Text style={styles.customAlertCancelText}>{customAlert.cancelText || 'Cancel'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.customAlertConfirmBtn, 
                  customAlert.type === 'error' && { backgroundColor: '#EF4444' },
                  customAlert.type === 'warning' && { backgroundColor: '#F59E0B' },
                  customAlert.type === 'success' && { backgroundColor: '#10B981' }
                ]} 
                onPress={customAlert.onConfirm || hideAlert} activeOpacity={0.8}
              >
                <Text style={styles.customAlertConfirmText}>{customAlert.confirmText || 'OK'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

// --------------------------------------------------------
// 4. EXACT STYLES (Unchanged)
// --------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: theme.colors.textMuted,
    fontSize: 14,
  },

  // --- SEARCH BAR ---
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textMain,
    height: '100%',
  },

  // --- HORIZONTAL FILTERS ---
  filtersWrapper: {
    marginBottom: 20,
  },
  filtersScrollContent: {
    gap: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primaryLight,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  filterTextActive: {
    color: theme.colors.primary,
  },

  // --- LIST CONTENT ---
  listContent: {
    paddingBottom: 120,
    gap: 16,
  },

  // --- BOOK CARD (HORIZONTAL LAYOUT) ---
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 12,
    backgroundColor: theme.colors.surface,
  },

  // Left Side: Image
  imageContainer: {
    width: 100,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#1E3A5F',
    position: 'relative',
    overflow: 'hidden',
  },
  bookImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bestSellerBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderBottomRightRadius: 8,
  },
  bestSellerText: {
    color: theme.colors.surface,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Right Side: Content
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  tagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  leftTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTag: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  languageWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  langTag: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  bookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMain,
    lineHeight: 18,
    marginBottom: 2,
  },
  authorText: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginBottom: 8,
  },

  // Formats Row (Ebook / Hardcover)
  formatsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  formatBoxActive: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 8,
    padding: 6,
  },
  formatBoxInactive: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 6,
  },
  formatTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  formatTextActive: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  formatTextInactive: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  formatBottomRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  oldPrice: {
    fontSize: 9,
    color: theme.colors.textLight,
    textDecorationLine: 'line-through',
  },
  newPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textMain,
  },
  newPriceBlack: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textMain,
  },

  // Buttons Row
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  buyNowBtn: {
    flex: 1.2,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowText: {
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  addCartBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCartText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // --- CUSTOM ALERT MODAL ---
  customAlertOverlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 20 },
  customAlertBox: { backgroundColor: theme.colors.surface, width: '100%', maxWidth: 380, borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  customAlertIconContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  customAlertTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.textMain, textAlign: 'center', marginBottom: 16 },
  customAlertMessage: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 10 },
  customAlertActionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  customAlertCancelBtn: { flex: 1, backgroundColor: theme.colors.border, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  customAlertCancelText: { color: theme.colors.textMain, fontSize: 14, fontWeight: '700' },
  customAlertConfirmBtn: { flex: 1, flexDirection: 'row', backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  customAlertConfirmText: { color: theme.colors.surface, fontSize: 14, fontWeight: '700' },
  shareButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primaryLight, marginLeft: 8 },
});
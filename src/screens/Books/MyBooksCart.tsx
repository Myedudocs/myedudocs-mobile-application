import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Check,
  Trash2,
  Minus,
  Plus,
  FileText,
  Book as BookIcon,
  ShoppingCart
} from 'lucide-react-native';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../service/api.service';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { theme as staticTheme } from '../../styles/theme';
import { getImageUrl } from '../../utils/image.utils';

// --------------------------------------------------------
// 1. TYPES 
// --------------------------------------------------------
interface CartItem {
  cartItemId: string;
  bookId: string;
  book_id?: string;
  bookType: 'pdftype' | 'paperback';
  title: string;
  author: string;
  coverImage: string;
  basePrice: number;
  discountPercentage: number;
  finalPrice: number;
  quantity: number;
  isChecked?: boolean; // Mobile UI specific
}

// --------------------------------------------------------
// 2. MAIN COMPONENT
// --------------------------------------------------------
export const Cart = () => {
  const navigation = useNavigation<any>(); 
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine Cart Key
  const getCartKey = () => {
    return user?.id ? `myedudocs-cart-${user.id}` : "myedudocs-guest-cart";
  };

  // --- FETCH CART ---
  const loadCart = async () => {
    try {
      setLoading(true);
      const cartKey = getCartKey();
      const storedCart = await AsyncStorage.getItem(cartKey);
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        // Ensure all items are checked by default for the mobile UI calculation
        const initializedCart = parsedCart.map((item: any) => ({
          ...item,
          isChecked: true
        }));
        setCartItems(initializedCart);
      }
    } catch (e) {
      console.error("Failed to load cart", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, [user]);

  const saveToStorage = async (updatedCart: CartItem[]) => {
    setCartItems(updatedCart);
    try {
      await AsyncStorage.setItem(getCartKey(), JSON.stringify(updatedCart));
    } catch (e) {
      console.error("Failed to save cart", e);
    }
  };

  // --- HANDLERS ---
  const toggleCheckbox = (id: string) => {
    setCartItems(prev => prev.map(item => 
      item.cartItemId === id ? { ...item, isChecked: !item.isChecked } : item
    ));
  };

  const updateQuantity = (id: string, delta: number) => {
    const updated = cartItems.map(item => {
      if (item.cartItemId === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    saveToStorage(updated);
  };

  const removeItem = (id: string) => {
    const updated = cartItems.filter(item => item.cartItemId !== id);
    saveToStorage(updated);
  };

  // --- CALCULATE TOTALS (Only for Checked items) ---
  const totalCurrentPrice = cartItems
    .filter(item => item.isChecked)
    .reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);

  const totalOldPrice = cartItems
    .filter(item => item.isChecked)
    .reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);

  // --- RENDER LOADING / EMPTY STATE ---
  if (loading) {
    return (
      <ScreenContainer header={{ title: 'My Cart', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }} scroll={false}>
        <View style={[styles.safeArea, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (cartItems.length === 0) {
    return (
      <ScreenContainer header={{ title: 'My Cart', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }} scroll={true}>
        <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 80 }}>
          <ShoppingCart color={theme.colors.textMuted} size={64} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.textMain, marginBottom: 8 }}>Your cart is empty</Text>
          <Text style={{ fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', marginBottom: 24 }}>Looks like you haven't added any books to your collection yet.</Text>
          <TouchableOpacity
            style={styles.checkoutBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Books')}
          >
            <Text style={styles.checkoutText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // --- RENDER MAIN CART ---
  return (
    <ScreenContainer header={{ title: 'My Cart', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }} scroll={false}>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* --- PAGE TITLE --- */}
        <View style={styles.titleSection}>
          <Text style={[styles.pageTitle, { color: theme.colors.textMain }]}>My Items</Text>
          <Text style={[styles.pageSubtitle, { color: theme.colors.textMuted }]}>Review your {cartItems.length} cart items</Text>
        </View>

        {/* --- CART LIST --- */}
        <View style={styles.cartList}>
          {cartItems.map((item) => (
            <View key={item.cartItemId} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>

              {/* Left Image & Checkbox */}
              <View style={styles.imageContainer}>
                <Image source={{ uri: getImageUrl(item.coverImage) }} style={styles.bookImage} />

                {/* Floating Checkbox */}
                <TouchableOpacity
                  style={[styles.checkbox, item.isChecked && styles.checkboxActive, { backgroundColor: isDarkMode && !item.isChecked ? theme.colors.border : theme.colors.surface }]}
                  activeOpacity={0.8}
                  onPress={() => toggleCheckbox(item.cartItemId)}
                >
                  {item.isChecked && <Check color={theme.colors.surface} size={12} strokeWidth={3} />}
                </TouchableOpacity>
              </View>

              {/* Right Content */}
              <View style={styles.cardContent}>

                {/* Title & Author */}
                <View>
                  <Text style={[styles.bookTitle, { color: theme.colors.textMain }]} numberOfLines={2}>{item.title}</Text>
                  <Text style={[styles.authorText, { color: theme.colors.textMuted }]}>Author: {item.author}</Text>
                </View>

                {/* Formats Selection */}
                <View style={styles.formatsRow}>
                  <View style={[styles.formatBox, styles.formatBoxActive, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.12)' : theme.colors.primaryLight }]}>
                    <View style={styles.formatTopRow}>
                      {item.bookType === 'pdftype' ? (
                        <>
                          <FileText color={theme.colors.primary} size={12} strokeWidth={2.5} />
                          <Text style={styles.formatTextActive}>Ebook</Text>
                        </>
                      ) : (
                        <>
                          <BookIcon color={theme.colors.primary} size={12} strokeWidth={2} />
                          <Text style={styles.formatTextActive}>Hardcover</Text>
                        </>
                      )}
                    </View>
                    <View style={styles.formatBottomRow}>
                      {item.discountPercentage > 0 && (
                        <Text style={styles.oldPrice}>₹{item.basePrice}</Text>
                      )}
                      <Text style={[styles.newPrice, { color: theme.colors.textMain }]}>₹{item.finalPrice}</Text>
                    </View>
                  </View>
                </View>

                {/* Action Row */}
                <View style={styles.actionRow}>
                  {item.bookType === 'pdftype' ? (
                    <Text style={[styles.deliveryText, { color: theme.colors.textMuted }]}>Instant Access</Text>
                  ) : (
                    <Text style={[styles.deliveryText, { color: theme.colors.textMuted }]}>Delivery 3-5 Days</Text>
                  )}

                  {item.bookType === 'pdftype' ? (
                    <TouchableOpacity onPress={() => removeItem(item.cartItemId)} activeOpacity={0.7} style={styles.iconBtn}>
                      <Trash2 color={theme.colors.textMuted} size={18} />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.quantityPill, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.15)' : theme.colors.primaryLight }]}>
                      <TouchableOpacity
                        onPress={() => removeItem(item.cartItemId)}
                        activeOpacity={0.7}
                        style={{ marginRight: 8 }}
                      >
                        <Trash2 color={theme.colors.danger} size={16} />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => updateQuantity(item.cartItemId, -1)} activeOpacity={0.7} disabled={item.quantity <= 1}>
                        <Minus color={item.quantity <= 1 ? theme.colors.textMuted : theme.colors.primary} size={14} strokeWidth={3} />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity onPress={() => updateQuantity(item.cartItemId, 1)} activeOpacity={0.7}>
                        <Plus color={theme.colors.primary} size={14} strokeWidth={3} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* --- FIXED BOTTOM FOOTER --- */}
      <View style={[styles.footerContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <View style={styles.priceWrap}>
          <Text style={[styles.footerPriceLabel, { color: theme.colors.textMuted }]}>TOTAL PRICE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.footerCurrentPrice, { color: theme.colors.textMain }]}>₹{totalCurrentPrice}</Text>
            {totalOldPrice > totalCurrentPrice && (
              <Text style={styles.footerOldPrice}>₹{totalOldPrice}</Text>
            )}
          </View>
        </View>

        {/* --- NAVIGATE TO CHECKOUT --- */}
        <TouchableOpacity
          style={[styles.checkoutBtn, totalCurrentPrice === 0 && { backgroundColor: theme.colors.textLight }]}
          activeOpacity={0.8}
          disabled={totalCurrentPrice === 0}
          onPress={() => navigation.navigate('BooksCheckout')}
        >
          <Text style={styles.checkoutText}>Check out</Text>
        </TouchableOpacity>
      </View>

    </ScreenContainer>
  );
};

// --------------------------------------------------------
// EXACT STYLES (Preserved 100%)
// --------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerIcon: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },

  scrollContent: { paddingBottom: 120 },

  // Title Section
  titleSection: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: staticTheme.colors.textMain,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: staticTheme.colors.textMuted,
    fontWeight: '500',
  },

  // Cart List
  cartList: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },

  // Left Image & Checkbox
  imageContainer: {
    width: 90,
    height: 130,
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
  checkbox: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: staticTheme.colors.surface,
    borderWidth: 1.5,
    borderColor: staticTheme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: staticTheme.colors.primary,
    borderColor: staticTheme.colors.primary,
  },

  // Right Content
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: staticTheme.colors.textMain,
    lineHeight: 18,
    marginBottom: 2,
  },
  authorText: {
    fontSize: 10,
    color: staticTheme.colors.textMuted,
    marginBottom: 8,
  },

  // Formats Row
  formatsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  formatBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: staticTheme.colors.border,
    borderRadius: 8,
    padding: 6,
  },
  formatBoxActive: {
    borderWidth: 1.5,
    borderColor: staticTheme.colors.primary,
    backgroundColor: staticTheme.colors.primaryLight,
  },
  formatTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  formatText: {
    fontSize: 10,
    fontWeight: '600',
    color: staticTheme.colors.textMuted,
  },
  formatTextActive: {
    fontWeight: '700',
    color: staticTheme.colors.primary,
  },
  formatBottomRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  oldPrice: {
    fontSize: 9,
    color: staticTheme.colors.textLight,
    textDecorationLine: 'line-through',
  },
  newPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: staticTheme.colors.textMain,
  },

  // Bottom Action Row
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: 11,
    color: staticTheme.colors.textMuted,
    fontWeight: '500',
  },
  iconBtn: {
    padding: 4,
  },
  quantityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 10,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '700',
    color: staticTheme.colors.primary,
  },

  // Fixed Footer
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  priceWrap: { flexDirection: 'column' },
  footerPriceLabel: { fontSize: 10, fontWeight: '700', marginBottom: 2, textTransform: 'uppercase' },
  footerCurrentPrice: { fontSize: 22, fontWeight: '800' },
  footerOldPrice: { fontSize: 13, color: staticTheme.colors.textLight, textDecorationLine: 'line-through' },
  checkoutBtn: { backgroundColor: staticTheme.colors.primary, paddingHorizontal: 36, paddingVertical: 14, borderRadius: 8 },
  checkoutText: { color: staticTheme.colors.surface, fontSize: 15, fontWeight: '700' },
});
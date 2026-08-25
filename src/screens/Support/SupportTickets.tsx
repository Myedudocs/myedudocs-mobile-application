import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { apiClient, ENDPOINTS } from '../../service/api.service';
import { Plus, ChevronRight, LifeBuoy } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { NotFound } from '../../components/NotFound';
import { DirectorySkeleton } from '../../components/skeletons/DirectorySkeleton';
import { ScreenContainer } from '../../components/common/ScreenContainer';

interface Ticket {
  _id: string;
  ticketId: string;
  subject: string;
  category: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'MEDIUM' | 'High' | 'Urgent';
  updatedAt: string;
  unreadCount?: number;
}

export const SupportTickets = () => {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const fetchTickets = async (isRefresh = false) => {
    if (!user?.token) return;
    try {
      if (!isRefresh) setLoading(true);
      const response = await apiClient(ENDPOINTS.GET_TICKETS, {
        headers: { Authorization: `Bearer ${user.token}` },
        bypassCache: true,
      });
      if (response && (response.success || Array.isArray(response) || response.tickets || response.data)) {
        const list = response.tickets || response.data?.tickets || (Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : []);
        setTickets(list);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return '#3B82F6';
      case 'In Progress': return '#F59E0B';
      case 'Resolved': return '#10B981';
      case 'Closed': return '#64748B';
      default: return theme.colors.primary;
    }
  };

  const renderItem = ({ item }: { item: Ticket }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={() => navigation.navigate('TicketChat', { id: item._id, subject: item.subject, ticketId: item.ticketId })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20', alignSelf: 'flex-start' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
          </View>
          <Text style={[styles.ticketId, { color: theme.colors.textMuted, marginTop: 4 }]}>{item.ticketId}</Text>
        </View>
        <Text style={[styles.dateText, { color: theme.colors.textLight }]}>
          {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
      </View>

      <Text style={[styles.subject, { color: theme.colors.textMain }]} numberOfLines={1}>
        {item.subject}
      </Text>

      <View style={[styles.cardFooter, { borderTopColor: theme.colors.border }]}>
        <View style={styles.categoryInfo}>
          <Text style={[styles.categoryLabel, { color: theme.colors.textMuted }]}>Category: </Text>
          <Text style={[styles.categoryValue, { color: theme.colors.textMain }]}>{item.category}</Text>
        </View>
        <ChevronRight size={18} color={theme.colors.textLight} />
      </View>

      {item.unreadCount && item.unreadCount > 0 ? (
        <View style={[styles.unreadBadge, { backgroundColor: theme.colors.danger }]}>
          <Text style={styles.unreadText}>{item.unreadCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <ScreenContainer
      header={{ title: 'Support Tickets', showBack: true, showThemeToggle: true, showCoins: false, showNotifications: false }}
      scroll={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.textMain }]}>Support Tickets</Text>
          <Text style={[styles.headerSub, { color: theme.colors.textMuted }]}>Need help? We're here for you.</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.list}>
          <DirectorySkeleton type="list" count={5} />
        </View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
          }
          ListEmptyComponent={
            <NotFound
              type="empty"
              fullScreen={false}
              title="No Tickets Yet"
              subtitle="Raise a ticket if you're facing any issues with courses or payments. We're here to help!"
              icon={LifeBuoy}
              buttonText="Create New Ticket"
              onButtonPress={() => navigation.navigate('CreateTicket')}
            />
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary, ...theme.shadows.deep }]}
        onPress={() => navigation.navigate('CreateTicket')}
      >
        <Plus color="#FFF" size={30} />
      </TouchableOpacity>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 5,
  },
  headerSub: {
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
  },
  ticketId: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  subject: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 13,
  },
  categoryValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
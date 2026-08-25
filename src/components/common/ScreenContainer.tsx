import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { GlobalSafeHeader, GlobalSafeHeaderProps } from './GlobalSafeHeader';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  refreshControl?: {
    refreshing: boolean;
    onRefresh: () => void;
  };
  contentStyle?: ViewStyle | ViewStyle[];
  /** Optional override - skip safe area handling for full-bleed screens */
  noSafeArea?: boolean;
  /** Optional header configuration - if provided, will render GlobalSafeHeader */
  header?: GlobalSafeHeaderProps;
  /** Background variant - 'screen' (default), 'surface', 'transparent' */
  bgVariant?: 'screen' | 'surface' | 'transparent';
  /** Edge-to-edge top padding behavior */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Bottom inset handling (e.g. for tab bars) */
  bottomInset?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scroll = false,
  refreshControl,
  contentStyle,
  noSafeArea = false,
  header,
  bgVariant = 'screen',
  edges,
  bottomInset = true,
}) => {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const bgColor =
    bgVariant === 'transparent'
      ? 'transparent'
      : bgVariant === 'surface'
      ? theme.colors.surface
      : theme.colors.background;

  // CRITICAL: If a header is provided, GlobalSafeHeader handles its OWN top
  // safe-area padding. The outer SafeAreaView must NOT also apply the top
  // inset — otherwise the header is pushed down by a double top margin.
  const resolvedEdges =
    edges ?? (header ? (['left', 'right'] as const) : (['top', 'left', 'right'] as const));

  const Wrapper = noSafeArea ? View : SafeAreaView;

  const wrapperProps = noSafeArea
    ? { style: [styles.flex, { backgroundColor: bgColor }] }
    : {
        style: [
          styles.flex,
          {
            backgroundColor: bgColor,
            paddingBottom: bottomInset ? 0 : 0,
          },
        ],
        edges: resolvedEdges,
      };

  const paddingBottom = bottomInset
    ? Math.max(insets.bottom, 16)
    : 16;

  // When the header is rendered, it already provides bottom padding
  // (paddingBottom: 12 inside GlobalSafeHeader). Don't add another 12 here.
  const contentPaddingTop = header ? 0 : 12;

  return (
    <Wrapper {...(wrapperProps as any)}>
      {!header && (
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent={true}
        />
      )}
      {header ? <GlobalSafeHeader {...header} /> : null}

      {scroll ? (
        <ScrollView
          style={[styles.flex, { backgroundColor: bgColor }]}
          contentContainerStyle={[
            {
              paddingHorizontal: 16,
              paddingTop: contentPaddingTop,
              paddingBottom,
            },
            contentStyle as any,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            refreshControl ? (
              <RefreshControl
                refreshing={refreshControl.refreshing}
                onRefresh={refreshControl.onRefresh}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.flex,
            {
              backgroundColor: bgColor,
              paddingHorizontal: 16,
              paddingTop: contentPaddingTop,
              paddingBottom,
            },
            contentStyle as any,
          ]}
        >
          {children}
        </View>
      )}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
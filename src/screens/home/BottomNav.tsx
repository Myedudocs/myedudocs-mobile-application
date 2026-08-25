import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  Compass,
  BookOpen,
  Award,
  Gift,
  User,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { useNavigation, useRoute } from "@react-navigation/native";

const tabs = [
  { 
    label: "Dashboard", 
    icon: Compass, 
    tabRoute: "DashboardTab", 
    stackRoute: "StudentDashboard" 
  },
  { 
    label: "My Learning", 
    icon: BookOpen, 
    tabRoute: "LearningTab", 
    stackRoute: "MyLearningHub" 
  },
  { 
    label: "Test Series", 
    icon: Award, 
    tabRoute: "TestSeriesTab", 
    stackRoute: "AllTestSeries" 
  },
  { 
    label: "Rewards", 
    icon: Gift, 
    tabRoute: "RewardsTab", 
    stackRoute: "Rewards" 
  },
  { 
    label: "Profile", 
    icon: User, 
    tabRoute: "ProfileTab", 
    stackRoute: "Profile" 
  },
];

const { width } = Dimensions.get("window");
const TAB_WIDTH = width / 5;

export const BottomNav = React.memo(() => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const currentRoute = useRoute();
  const { theme, isDarkMode } = useTheme();

  // Find active index based on tabRoute, stackRoute or label
  const activeTabIndex = tabs.findIndex(
    t => 
      t.tabRoute === currentRoute.name || 
      t.stackRoute === currentRoute.name ||
      t.label.toLowerCase() === currentRoute.name.toLowerCase()
  );
  const slidePos = useSharedValue(activeTabIndex !== -1 ? activeTabIndex : 0);

  React.useEffect(() => {
    if (activeTabIndex !== -1) {
      slidePos.value = withSpring(activeTabIndex, { damping: 20, stiffness: 120 });
    }
  }, [activeTabIndex]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: slidePos.value * TAB_WIDTH + (TAB_WIDTH - 32) / 2 }],
    };
  });

  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;
  const barHeight = 56 + bottomPadding;

  const handleTabPress = (tab: typeof tabs[0]) => {
    try {
      navigation.navigate("MainTabs", { screen: tab.tabRoute });
    } catch {
      navigation.navigate(tab.stackRoute);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDarkMode ? "#0B0F19" : "#FFFFFF",
            borderTopColor: isDarkMode ? "rgba(255,255,255,0.08)" : "#F1F5F9",
            height: barHeight,
            paddingBottom: bottomPadding,
          },
        ]}
      >
        {/* Sliding Indicator Bar */}
        <Animated.View
          style={[
            styles.activeIndicator,
            { backgroundColor: theme.colors.primary },
            animatedIndicatorStyle,
          ]}
        />

        {tabs.map((tab, index) => {
          const isActive = activeTabIndex === index;
          return (
            <TabItem
              key={index}
              tab={tab}
              isActive={isActive}
              onPress={() => handleTabPress(tab)}
              theme={theme}
            />
          );
        })}
      </View>
    </View>
  );
});

const TabItem = React.memo(({ tab, isActive, onPress, theme }: any) => {
  const scale = useSharedValue(isActive ? 1.05 : 1);
  const Icon = tab.icon;

  React.useEffect(() => {
    scale.value = withSpring(isActive ? 1.08 : 1, { damping: 12 });
  }, [isActive]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.tabButton}
      onPress={onPress}
    >
      <Animated.View style={[styles.iconWrap, animatedIconStyle]}>
        <Icon
          size={21}
          color={isActive ? theme.colors.primary : theme.colors.textLight}
          strokeWidth={isActive ? 2.3 : 1.8}
        />
      </Animated.View>
      <Text
        style={[
          styles.tabText,
          {
            color: isActive ? theme.colors.primary : theme.colors.textLight,
            fontWeight: isActive ? "700" : "500",
          },
        ]}
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    backgroundColor: "transparent",
  },
  container: {
    flexDirection: "row",
    borderTopWidth: 1,
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 6,
    elevation: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 32,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  iconWrap: {
    marginBottom: 3,
  },
  tabText: {
    fontSize: 10.5,
  },
});

export default BottomNav;

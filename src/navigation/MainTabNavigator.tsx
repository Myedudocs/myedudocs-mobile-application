import React from "react";
import { Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "../context/ThemeContext";
import {
  Compass,
  BookOpen,
  Award,
  Gift,
  User as UserIcon,
} from "lucide-react-native";

import { StudentDashboard } from "../screens/StudentDashboard/StudentDashboard";
import { MyLearningHubScreen } from "../screens/MyLearning/MyLearningHubScreen";
import { AllTestSeries } from "../screens/TestSeries/AllTestSeries";
import { RewardsScreen } from "../screens/Rewards/RewardsScreen";
import { Profile } from "../screens/profile/MyProfile";

const Tab = createBottomTabNavigator();

export const MainTabNavigator = () => {
  const { theme, isDarkMode } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: isDarkMode ? '#94A3B8' : '#64748B',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#0B0F19' : '#FFFFFF',
          borderTopColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 66,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
          elevation: 16,
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 14,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={StudentDashboard}
        options={{
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="LearningTab"
        component={MyLearningHubScreen}
        options={{
          tabBarLabel: "My Learning",
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="TestSeriesTab"
        component={AllTestSeries}
        options={{
          tabBarLabel: "Test Series",
          tabBarIcon: ({ color, size }) => <Award size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="RewardsTab"
        component={RewardsScreen}
        options={{
          tabBarLabel: "Rewards",
          tabBarIcon: ({ color, size }) => <Gift size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={Profile}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => <UserIcon size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

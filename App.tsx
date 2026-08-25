import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { I18nextProvider } from "react-i18next";

// --- IMPORT YOUR PROVIDERS ---
import { AuthProvider } from "./src/context/AuthContext";
import { AlertProvider } from "./src/context/AlertContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";

import AppNavigator from "./src/navigation/AppNavigator";
import { GlobalSearchModal } from "./src/components/search/GlobalSearchModal";

import { navigationRef } from "./src/navigation/navigationRef";
import i18n from "./src/i18n";

const AppContent = () => {
  const { theme, isDarkMode } = useTheme();

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />
      <AppNavigator />
      <GlobalSearchModal />
    </NavigationContainer>
  );
};

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider>
            <AuthProvider>
              <AlertProvider>
                <AppContent />
              </AlertProvider>
            </AuthProvider>
          </ThemeProvider>
        </I18nextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;

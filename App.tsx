import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator, MainNavigator } from './src/navigation/AppNavigator';
import { Usuario, Empresa } from './src/types';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Font Loading
import { 
  useFonts, 
  PlayfairDisplay_600SemiBold, 
  PlayfairDisplay_700Bold 
} from '@expo-google-fonts/playfair-display';
import { 
  PlusJakartaSans_400Regular, 
  PlusJakartaSans_600SemiBold, 
  PlusJakartaSans_700Bold 
} from '@expo-google-fonts/plus-jakarta-sans';

function AppContent() {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const { COLORS, isDark } = useTheme();

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) {
    // Returns nothing (renders system default splash) until fonts are ready
    return null;
  }

  const handleLoginSuccess = (user: Usuario, emp: Empresa) => {
    setCurrentUser(user);
    setEmpresa(emp);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEmpresa(null);
  };

  return (
    <NavigationContainer>
      <View style={[styles.container, { backgroundColor: COLORS.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        {currentUser && empresa ? (
          <MainNavigator
            currentUser={currentUser}
            empresa={empresa}
            onLogout={handleLogout}
          />
        ) : (
          <AuthNavigator onLoginSuccess={handleLoginSuccess} />
        )}
      </View>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

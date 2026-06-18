import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { COLORS } from './src/theme/colors';
import { AuthNavigator, MainNavigator } from './src/navigation/AppNavigator';
import { Usuario, Empresa } from './src/types';

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

export default function App() {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);

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
      <View style={styles.container}>
        <StatusBar style="dark" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

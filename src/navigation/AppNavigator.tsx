import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { Platform } from 'react-native';

// Importar ícones do Phosphor
import { Calendar, Users, Sparkle, TrendUp, Gear } from 'phosphor-react-native';

// Importar Ecrãs
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { SubscriptionExpiredScreen } from '../screens/SubscriptionExpiredScreen';

import { DashboardScreen } from '../screens/DashboardScreen'; // Agenda
import { ClientesScreen } from '../screens/ClientesScreen';
import { ServicosScreen } from '../screens/ServicosScreen';
import { FinancasScreen } from '../screens/FinancasScreen';

import { NewAppointmentScreen } from '../screens/NewAppointmentScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { NovoClienteScreen } from '../screens/NovoClienteScreen';
import { FichaClienteScreen } from '../screens/FichaClienteScreen';
import { DefinicoesScreen } from '../screens/DefinicoesScreen';
import { VouchersScreen } from '../screens/VouchersScreen';

import { Usuario, Empresa } from '../types';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Stack de Autenticação (Fluxo Não-Logado)
export function AuthNavigator({ onLoginSuccess }: { onLoginSuccess: (user: Usuario, empresa: Empresa) => void }) {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="Splash">
        {(props) => <SplashScreen {...props} onTimeout={() => props.navigation.navigate('Onboarding')} />}
      </Stack.Screen>
      <Stack.Screen name="Onboarding">
        {(props) => <OnboardingScreen {...props} onStartClick={() => props.navigation.navigate('Login')} />}
      </Stack.Screen>
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="SubscriptionExpired" component={SubscriptionExpiredScreen} />
    </Stack.Navigator>
  );
}

// Navegador por Abas (Área Logada Principal)
function TabNavigator({ 
  currentUser, 
  empresa, 
  onLogout 
}: { 
  currentUser: Usuario; 
  empresa: Empresa; 
  onLogout: () => void 
}) {
  // Nome comercial dinâmico com fallback (White-Label)
  const headerTitle = empresa?.nome_comercial || 'Zonno';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'AgendaTab') {
            return <Calendar size={size} color={color} weight="fill" />;
          } else if (route.name === 'ClientesTab') {
            return <Users size={size} color={color} weight="fill" />;
          } else if (route.name === 'ServicosTab') {
            return <Sparkle size={size} color={color} weight="fill" />;
          } else if (route.name === 'FinancasTab') {
            return <TrendUp size={size} color={color} weight="fill" />;
          } else if (route.name === 'DefinicoesTab') {
            return <Gear size={size} color={color} weight="fill" />;
          }
          return null;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
        },
        tabBarLabelStyle: {
          fontFamily: TYPOGRAPHY.fontFamily.sans,
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: COLORS.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        headerTitleStyle: {
          fontFamily: TYPOGRAPHY.fontFamily.serif,
          fontSize: 20,
          fontWeight: '700',
          color: COLORS.textPrimary,
        },
        headerTitle: headerTitle,
        headerTitleAlign: 'center',
      })}
    >
      <Tab.Screen name="AgendaTab" options={{ tabBarLabel: 'Agenda' }}>
        {(props) => (
          <DashboardScreen 
            {...props} 
            currentUser={currentUser} 
            onNavigateToClientes={() => props.navigation.navigate('ClientesTab')}
            onLogoutClick={onLogout}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="ClientesTab" options={{ tabBarLabel: 'Clientes' }}>
        {(props) => (
          <ClientesScreen
            {...props}
            currentUser={currentUser}
            onClienteClick={(id) => props.navigation.navigate('PerfilCliente', { clienteId: id })}
            onAddClienteClick={() => props.navigation.navigate('NovoCliente')}
            onNavigateToAgenda={() => props.navigation.navigate('AgendaTab')}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="ServicosTab" options={{ tabBarLabel: 'Serviços' }}>
        {(props) => (
          <ServicosScreen
            {...props}
            currentUser={currentUser}
            empresa={empresa}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="FinancasTab" options={{ tabBarLabel: 'Finanças' }}>
        {(props) => (
          <FinancasScreen
            {...props}
            currentUser={currentUser}
            empresa={empresa}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="DefinicoesTab" options={{ tabBarLabel: 'Definições' }}>
        {(props) => (
          <DefinicoesScreen
            {...props}
            currentUser={currentUser}
            empresa={empresa}
            onLogoutClick={onLogout}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Stack Principal (Contém as Abas + Telas Operacionais Auxiliares)
export function MainNavigator({ 
  currentUser, 
  empresa, 
  onLogout 
}: { 
  currentUser: Usuario; 
  empresa: Empresa; 
  onLogout: () => void 
}) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.background },
      }}
    >
      {/* Abas Principais */}
      <Stack.Screen name="HomeTabs">
        {(props) => (
          <TabNavigator 
            {...props} 
            currentUser={currentUser} 
            empresa={empresa} 
            onLogout={onLogout} 
          />
        )}
      </Stack.Screen>

      {/* Telas Operacionais */}
      <Stack.Screen name="NewAppointment">
        {(props) => (
          <NewAppointmentScreen
            {...props}
            currentUser={currentUser}
            empresa={empresa}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="NovoCliente">
        {(props) => (
          <NovoClienteScreen
            {...props}
            currentUser={currentUser}
            empresa={empresa}
            onBackClick={() => props.navigation.goBack()}
            onSuccess={() => props.navigation.goBack()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="PerfilCliente">
        {(props: any) => {
          const { clienteId } = props.route.params || { clienteId: '' };
          return (
            <FichaClienteScreen
              {...props}
              currentUser={currentUser}
              empresa={empresa}
              clienteId={clienteId}
              onBackClick={() => props.navigation.goBack()}
            />
          );
        }}
      </Stack.Screen>
      <Stack.Screen name="Vouchers">
        {(props) => (
          <VouchersScreen
            {...props}
            currentUser={currentUser}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

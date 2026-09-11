import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MessageSquare, FileText, Search, Clock, LayoutGrid } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme/ThemeContext';
import { Routes } from './routes';
import { BottomTabParamList } from './types';

// Screens
import { ChatHomeScreen } from '../../features/chat/screens/ChatHomeScreen';
import { ClaimsListScreen } from '../../features/claims/screens/ClaimsListScreen';
import { SearchScreen } from '../../features/search/screens/SearchScreen';
import { SessionHistoryScreen } from '../../features/sessions/screens/SessionHistoryScreen';
import { AllFeaturesDirectoryScreen } from '../../features/profile/screens/AllFeaturesDirectoryScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const TabNavigator = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          height: 56 + Math.max(insets.bottom, 6),
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name={Routes.ChatTab}
        component={ChatHomeScreen}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <MessageSquare size={size || 20} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name={Routes.ClaimsTab}
        component={ClaimsListScreen}
        options={{
          tabBarLabel: 'Claims',
          tabBarIcon: ({ color, size }) => (
            <FileText size={size || 20} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name={Routes.SearchTab}
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Search size={size || 20} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name={Routes.SessionsTab}
        component={SessionHistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => (
            <Clock size={size || 20} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name={Routes.AllFeaturesTab}
        component={AllFeaturesDirectoryScreen}
        options={{
          tabBarLabel: 'All',
          tabBarIcon: ({ color, size }) => (
            <LayoutGrid size={size || 20} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

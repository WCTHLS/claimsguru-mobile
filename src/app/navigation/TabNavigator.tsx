import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MessageSquare, FileText, Search, Clock } from 'lucide-react-native';
import { useTheme } from '../../core/theme/ThemeContext';
import { Routes } from './routes';
import { BottomTabParamList } from './types';

// Screens
import { ChatHomeScreen } from '../../features/chat/screens/ChatHomeScreen';
import { ClaimsListScreen } from '../../features/claims/screens/ClaimsListScreen';
import { SearchScreen } from '../../features/search/screens/SearchScreen';
import { SessionHistoryScreen } from '../../features/sessions/screens/SessionHistoryScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const TabNavigator = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen
        name={Routes.ChatTab}
        component={ChatHomeScreen}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name={Routes.ClaimsTab}
        component={ClaimsListScreen}
        options={{
          tabBarLabel: 'Claims',
          tabBarIcon: ({ color }) => <FileText color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name={Routes.SearchTab}
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color }) => <Search color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name={Routes.SessionsTab}
        component={SessionHistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => <Clock color={color} size={20} />,
        }}
      />
    </Tab.Navigator>
  );
};


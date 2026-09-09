import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessageSquare, FileText, Search, Clock, LayoutGrid } from 'lucide-react-native';
import { useTheme } from '../../core/theme/ThemeContext';
import { Routes } from './routes';

interface GlobalBottomTabBarProps {
  navigation: any;
  activeTab?: 'chat' | 'claims' | 'search' | 'history' | 'all';
}

export const GlobalBottomTabBar = ({ navigation, activeTab = 'claims' }: GlobalBottomTabBarProps) => {
  const { colors } = useTheme();

  const tabs = [
    {
      key: 'chat',
      label: 'Chat',
      icon: MessageSquare,
      onPress: () => navigation.navigate('MainTabs', { screen: Routes.ChatTab }),
    },
    {
      key: 'claims',
      label: 'Claims',
      icon: FileText,
      onPress: () => navigation.navigate('MainTabs', { screen: Routes.ClaimsTab }),
    },
    {
      key: 'search',
      label: 'Search',
      icon: Search,
      onPress: () => navigation.navigate('MainTabs', { screen: Routes.SearchTab }),
    },
    {
      key: 'history',
      label: 'History',
      icon: Clock,
      onPress: () => navigation.navigate('MainTabs', { screen: Routes.SessionsTab }),
    },
    {
      key: 'all',
      label: 'All',
      icon: LayoutGrid,
      onPress: () => navigation.navigate('MainTabs', { screen: Routes.AllFeaturesTab }),
    },
  ];

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        const IconComponent = tab.icon;
        const iconColor = isActive ? colors.brand : colors.muted;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabBtn}
            onPress={tab.onPress}
            activeOpacity={0.7}
          >
            <IconComponent size={20} color={iconColor} strokeWidth={isActive ? 2.4 : 1.8} />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: iconColor,
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 56,
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: 6,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: -0.1,
  },
});

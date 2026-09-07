import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../core/theme/ThemeContext';
import { Routes } from './routes';
import { RootStackParamList } from './types';

// Navigators & Screens
import { TabNavigator } from './TabNavigator';
import { BrainPreviewScreen } from '../../features/brain/screens/BrainPreviewScreen';
import { WorkflowPipelineScreen } from '../../features/workflow/screens/WorkflowPipelineScreen';
import { ProfileSettingsScreen } from '../../features/profile/screens/ProfileSettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { colors } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.ink,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen
          name={Routes.BrainPreview}
          component={BrainPreviewScreen}
          options={{ title: 'AI Brain Preview' }}
        />
        <Stack.Screen
          name={Routes.WorkflowPipeline}
          component={WorkflowPipelineScreen}
          options={{ title: 'Workflow Runner' }}
        />
        <Stack.Screen
          name={Routes.ProfileSettings}
          component={ProfileSettingsScreen}
          options={{ title: 'Profile & Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

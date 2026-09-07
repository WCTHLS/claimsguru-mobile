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
import { UploadPanelScreen } from '../../features/claims/screens/UploadPanelScreen';
import { ClaimDetailScreen } from '../../features/claims/screens/ClaimDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { colors } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen
          name={Routes.UploadPanel}
          component={UploadPanelScreen}
        />
        <Stack.Screen
          name={Routes.WorkflowPipeline}
          component={WorkflowPipelineScreen}
        />
        <Stack.Screen
          name={Routes.ClaimDetail}
          component={ClaimDetailScreen}
        />
        <Stack.Screen
          name={Routes.BrainPreview}
          component={BrainPreviewScreen}
          options={{
            headerShown: true,
            title: 'AI Brain Preview',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.ink,
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name={Routes.ProfileSettings}
          component={ProfileSettingsScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

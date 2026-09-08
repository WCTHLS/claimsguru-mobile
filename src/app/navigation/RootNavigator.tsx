import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../core/theme/ThemeContext';
import { Routes } from './routes';
import { RootStackParamList } from './types';

// Navigators & Screens
import { TabNavigator } from './TabNavigator';
import { BrainPreviewScreen } from '../../features/brain/screens/BrainPreviewScreen';
import { RiskDetailScreen } from '../../features/brain/screens/RiskDetailScreen';
import { FraudDetailScreen } from '../../features/brain/screens/FraudDetailScreen';
import { ValidationRulesScreen } from '../../features/brain/screens/ValidationRulesScreen';
import { MedicalCodingScreen } from '../../features/brain/screens/MedicalCodingScreen';
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
        />
        <Stack.Screen
          name={Routes.RiskDetail}
          component={RiskDetailScreen}
        />
        <Stack.Screen
          name={Routes.FraudDetail}
          component={FraudDetailScreen}
        />
        <Stack.Screen
          name={Routes.ValidationRules}
          component={ValidationRulesScreen}
        />
        <Stack.Screen
          name={Routes.MedicalCoding}
          component={MedicalCodingScreen}
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

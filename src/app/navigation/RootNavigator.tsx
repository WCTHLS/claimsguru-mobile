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
import { OcrParsedFieldsScreen } from '../../features/claims/screens/OcrParsedFieldsScreen';
import { ScanAnalyzerScreen } from '../../features/claims/screens/ScanAnalyzerScreen';
import { DocumentGridScreen } from '../../features/claims/screens/DocumentGridScreen';
import { PatientProfileScreen } from '../../features/claims/screens/PatientProfileScreen';
import { PatientActivityScreen } from '../../features/claims/screens/PatientActivityScreen';
import { SubmissionScreen } from '../../features/claims/screens/SubmissionScreen';
import { AuditTrailScreen } from '../../features/claims/screens/AuditTrailScreen';
import { OpsConsoleScreen } from '../../features/profile/screens/OpsConsoleScreen';
import { SignInScreen } from '../../features/auth/screens/SignInScreen';
import { SignUpScreen } from '../../features/auth/screens/SignUpScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { colors } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={Routes.SignIn}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name={Routes.SignIn} component={SignInScreen} />
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name={Routes.SignUp} component={SignUpScreen} />

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
          name={Routes.OcrParsedFields}
          component={OcrParsedFieldsScreen}
        />
        <Stack.Screen
          name={Routes.ScanAnalyzer}
          component={ScanAnalyzerScreen}
        />
        <Stack.Screen
          name={Routes.DocumentGrid}
          component={DocumentGridScreen}
        />
        <Stack.Screen
          name={Routes.PatientProfile}
          component={PatientProfileScreen}
        />
        <Stack.Screen
          name={Routes.PatientActivity}
          component={PatientActivityScreen}
        />
        <Stack.Screen
          name={Routes.Submission}
          component={SubmissionScreen}
        />
        <Stack.Screen
          name={Routes.AuditTrail}
          component={AuditTrailScreen}
        />
        <Stack.Screen
          name={Routes.ProfileSettings}
          component={ProfileSettingsScreen}
        />
        <Stack.Screen
          name={Routes.OpsConsole}
          component={OpsConsoleScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

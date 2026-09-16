import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../core/theme/ThemeContext';
import { useAuthStore } from '../../state/useAuthStore';
import { appStorage } from '../../core/storage/appStorage';
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
import { DocumentGridScreen } from '../../features/claims/screens/DocumentGridScreen';
import { PreviewDocumentsScreen } from '../../features/claims/screens/PreviewDocumentsScreen';
import { PatientProfileScreen } from '../../features/claims/screens/PatientProfileScreen';
import { PatientActivityScreen } from '../../features/claims/screens/PatientActivityScreen';
import { SubmissionScreen } from '../../features/claims/screens/SubmissionScreen';
import { OpsConsoleScreen } from '../../features/profile/screens/OpsConsoleScreen';
import { SignInScreen } from '../../features/auth/screens/SignInScreen';
import { SignUpScreen } from '../../features/auth/screens/SignUpScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const NAVIGATION_STATE_KEY = 'cg_nav_state';

const linking: any = {
  prefixes: ['claimsguru://', 'http://localhost', 'https://*'],
  config: {
    screens: {
      [Routes.SignIn]: 'signin',
      [Routes.SignUp]: 'signup',
      MainTabs: {
        screens: {
          [Routes.ChatTab]: 'chat',
          [Routes.ClaimsTab]: 'claims',
          [Routes.SearchTab]: 'search',
          [Routes.SessionsTab]: 'sessions',
          [Routes.AllFeaturesTab]: 'features',
        },
      },
      [Routes.ClaimDetail]: 'claims/:claimId',
      [Routes.Submission]: 'claims/:claimId/submission',
      [Routes.WorkflowPipeline]: 'claims/:claimId/pipeline',
      [Routes.UploadPanel]: 'upload',
      [Routes.DocumentGrid]: 'claims/documents',
      [Routes.PreviewDocuments]: 'claims/:claimId/preview-documents',
      [Routes.PatientProfile]: 'patient/:patientId',
      [Routes.PatientActivity]: 'claims/:claimId/activity',
      [Routes.BrainPreview]: 'claims/:claimId/brain',
      [Routes.RiskDetail]: 'claims/:claimId/risk',
      [Routes.FraudDetail]: 'claims/:claimId/fraud',
      [Routes.ValidationRules]: 'claims/:claimId/validation',
      [Routes.MedicalCoding]: 'claims/:claimId/coding',
      [Routes.ProfileSettings]: 'profile',
      [Routes.OpsConsole]: 'ops',
    },
  },
};

export const RootNavigator = () => {
  const { colors } = useTheme();
  const { isAuthenticated } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState<any>(undefined);

  useEffect(() => {
    let isMounted = true;

    const restoreState = async () => {
      try {
        const savedStateString = await appStorage.getItem(NAVIGATION_STATE_KEY);
        if (savedStateString) {
          const state = JSON.parse(savedStateString);
          if (isMounted && state && state.routes && state.routes.length > 0) {
            setInitialState(state);
          }
        }
      } catch (e) {
        console.warn('[RootNavigator] Failed to restore navigation state:', e);
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    restoreState();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStateChange = (state: any) => {
    if (state) {
      try {
        appStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state));
      } catch {}
    }
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <NavigationContainer
      linking={linking}
      initialState={initialState}
      onStateChange={handleStateChange}
    >
      <Stack.Navigator
        initialRouteName={isAuthenticated ? "MainTabs" : Routes.SignIn}
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
          name={Routes.DocumentGrid}
          component={DocumentGridScreen}
        />
        <Stack.Screen
          name={Routes.PreviewDocuments}
          component={PreviewDocumentsScreen}
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

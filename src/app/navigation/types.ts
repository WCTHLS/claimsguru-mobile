import { Routes } from './routes';

export type RootStackParamList = {
  [Routes.SignIn]: undefined;
  [Routes.SignUp]: undefined;
  MainTabs: undefined;

  [Routes.ClaimDetail]: { claimId: string };
  [Routes.UploadPanel]: undefined;
  [Routes.WorkflowPipeline]: undefined;
  [Routes.BrainPreview]: { claimId: string };
  [Routes.RiskDetail]: { claimId: string };
  [Routes.FraudDetail]: { claimId: string };
  [Routes.ValidationRules]: { claimId: string };
  [Routes.MedicalCoding]: { claimId: string };
  [Routes.OcrParsedFields]: { claimId: string; docKey?: string };
  [Routes.ScanAnalyzer]: { claimId: string };
  [Routes.DocumentGrid]: { claimId: string };
  [Routes.PatientProfile]: { claimId?: string; patientId?: string };
  [Routes.PatientActivity]: { patientId?: string };
  [Routes.Submission]: { claimId: string };
  [Routes.AuditTrail]: { claimId: string };
  [Routes.ProfileSettings]: undefined;
  [Routes.OpsConsole]: undefined;
};

export type BottomTabParamList = {
  [Routes.ChatTab]: undefined;
  [Routes.ClaimsTab]: undefined;
  [Routes.SearchTab]: undefined;
  [Routes.SessionsTab]: undefined;
  [Routes.AllFeaturesTab]: undefined;
};

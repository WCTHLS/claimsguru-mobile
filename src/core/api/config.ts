import { Platform } from 'react-native';

/**
 * ClaimGPT / ClaimsGuru API Gateway configuration
 * 
 * Default Gateway port is 8000.
 * In Android emulator, 10.0.2.2 maps to host machine localhost.
 * On real devices with 'adb reverse tcp:8000 tcp:8000', localhost:8000 works.
 */
const ENV_URL = process.env.EXPO_PUBLIC_API_URL;
const DEFAULT_HOST =
  ENV_URL ||
  Platform.select({
    android: 'http://10.0.2.2:8000',
    default: 'http://localhost:8000',
  });

export let API_BASE_URL = DEFAULT_HOST || 'http://localhost:8000';

export const setApiBaseUrl = (url: string) => {
  API_BASE_URL = url.replace(/\/+$/, '');
};

export const API_ENDPOINTS = {
  // Ingress Service (Claims & Documents)
  claims: () => `${API_BASE_URL}/ingress/claims`,
  claimsUpload: () => `${API_BASE_URL}/ingress/claims/`,
  claimDetail: (claimId: string) => `${API_BASE_URL}/ingress/claims/${claimId}`,
  claimStatus: (claimId: string) => `${API_BASE_URL}/ingress/claims/${claimId}/status`,
  claimProgress: (claimId: string) => `${API_BASE_URL}/ingress/claims/${claimId}/progress`,
  claimFile: (claimId: string) => `${API_BASE_URL}/ingress/claims/${claimId}/file`,
  claimDocumentFile: (claimId: string, docId: string) =>
    `${API_BASE_URL}/ingress/claims/${claimId}/documents/${docId}/file`,

  // Workflow Service
  workflowStart: (claimId: string) => `${API_BASE_URL}/workflow/start/${claimId}`,
  workflowJob: (jobId: string) => `${API_BASE_URL}/workflow/${jobId}`,
  workflowHealth: () => `${API_BASE_URL}/workflow/health`,

  // Search Service
  searchIndex: (claimId: string) => `${API_BASE_URL}/search/index/${claimId}`,

  // Submission & Preview Service
  claimPreview: (claimId: string) => `${API_BASE_URL}/submission/claims/${claimId}/preview`,

  // Validation & Prediction Services
  claimValidation: (claimId: string) => `${API_BASE_URL}/validator/validate/${claimId}`,
  claimPrediction: (claimId: string) => `${API_BASE_URL}/predictor/predict/${claimId}`,

  // Gateway Health
  health: () => `${API_BASE_URL}/health`,
};

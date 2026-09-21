import { apiClient } from '../../../core/api/client';
import { API_ENDPOINTS } from '../../../core/api/config';

export interface ClaimProgressResponse {
  status: string;
  step: string;
  percentage: number;
  is_complete: boolean;
  error?: string | null;
}

export interface ClaimStatusResponse {
  current_step: string | null;
  status: string | null;
  step_index: number;
  percentage: number;
}

export interface WorkflowJobResponse {
  job_id: string;
  claim_id: string;
  job_type: string;
  status: string;
  started_at?: string | null;
}

export const workflowApi = {
  startWorkflow: async (claimId: string): Promise<WorkflowJobResponse> => {
    return apiClient.post<WorkflowJobResponse>(API_ENDPOINTS.workflowStart(claimId));
  },

  getProgress: async (claimId: string): Promise<ClaimProgressResponse> => {
    return apiClient.get<ClaimProgressResponse>(API_ENDPOINTS.claimProgress(claimId));
  },

  getStatus: async (claimId: string): Promise<ClaimStatusResponse> => {
    return apiClient.get<ClaimStatusResponse>(API_ENDPOINTS.claimStatus(claimId));
  },

  checkHealth: async (): Promise<boolean> => {
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.workflowHealth());
      return res?.status === 'ok';
    } catch {
      return false;
    }
  },
};

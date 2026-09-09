import { hashPasswordForTransport, decodeJwtPayload } from '../utils/crypto';
import { getBackendCandidateUrls, getEntraMobileConfig, getEntraEndpoints } from '../config/authConfig';
import { setApiBaseUrl } from './config';
import { useAuthStore } from '../../state/useAuthStore';

export interface LoginParams {
  username: string;
  password?: string;
}

export interface RegisterPatientParams {
  username: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  policy?: string;
  sumInsured?: string | number;
}

export interface SyncEntraParams {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  subjectId?: string;
  phone?: string;
  policy?: string;
  sumInsured?: string | number;
}

export interface AuthResponse {
  success: boolean;
  user_id?: string;
  email: string;
  name?: string;
  role: string;
  access_token?: string;
  token?: string;
  message?: string;
}

/**
 * Execute request across candidate backend URLs with fallback.
 */
async function postToCandidateEndpoints(
  pathSuffixes: string[],
  body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; data: any; connectionError?: boolean }> {
  const candidateBases = getBackendCandidateUrls();
  const urlsToTry: string[] = [];

  for (const base of candidateBases) {
    for (const suffix of pathSuffixes) {
      const cleanBase = base.replace(/\/+$/, '');
      const cleanSuffix = suffix.startsWith('/') ? suffix : `/${suffix}`;
      urlsToTry.push(`${cleanBase}${cleanSuffix}`);
    }
  }

  const uniqueUrls = Array.from(new Set(urlsToTry));

  for (const url of uniqueUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status !== 404) {
        const data = await response.json().catch(() => ({}));
        return { ok: response.ok, status: response.status, data };
      }
    } catch {
      // Try next candidate endpoint
    }
  }

  return { ok: false, status: 0, data: null, connectionError: true };
}

/**
 * Authenticate with Username / Email and Password against MSSQL backend.
 * If authentication fails or backend cannot be reached, throws Error and prevents login.
 */
export async function loginWithPassword({ username, password = '' }: LoginParams): Promise<AuthResponse> {
  const cleanUsername = username.trim().toLowerCase();
  const passwordHash = password ? hashPasswordForTransport(password) : '';

  const payload = {
    username: cleanUsername,
    password_hash: passwordHash,
    password,
    role: 'submitter',
  };

  const res = await postToCandidateEndpoints(
    ['/auth/login', '/ingress/auth/login'],
    payload
  );

  if (res.data && res.ok) {
    const raw = res.data;
    let resolvedName =
      (raw.first_name || raw.last_name
        ? `${raw.first_name || ''} ${raw.last_name || ''}`.trim()
        : '') ||
      (raw.name && raw.name.toLowerCase() !== 'unknown' ? raw.name : '');

    if (!resolvedName || resolvedName.toLowerCase() === 'sample') {
      if (cleanUsername === 'sample@gmail.com' || cleanUsername.includes('sample')) {
        resolvedName = 'Jhon Doe';
      } else {
        resolvedName = cleanUsername.split('@')[0];
      }
    }

    const isSampleUser = cleanUsername === 'sample@gmail.com' || resolvedName.toLowerCase() === 'jhon doe';
    const effectiveUserId = raw.user_id || (isSampleUser ? 'ec78998a-0228-434a-84f4-e08b4b7417e2' : undefined);

    const sessionData: AuthResponse = {
      success: true,
      user_id: effectiveUserId,
      email: raw.email || cleanUsername,
      name: resolvedName,
      role: raw.role || 'submitter',
      access_token: raw.access_token || raw.token || `token-${Date.now()}`,
      message: raw.message || 'Login successful',
    };

    useAuthStore.getState().signIn(sessionData.email, sessionData.name, sessionData.access_token, {
      userId: sessionData.user_id,
      firstName: raw.first_name || (isSampleUser ? 'Jhon' : undefined),
      lastName: raw.last_name || (isSampleUser ? 'Doe' : undefined),
      phone: raw.phone,
      dob: raw.dob || (isSampleUser ? '2000-06-08' : undefined),
      gender: raw.gender || (isSampleUser ? 'Male' : undefined),
      policyNumber: raw.policy_number || (isSampleUser ? 'P-0007401' : undefined),
      sumInsured: raw.sum_insured || (isSampleUser ? 500000 : undefined),
      organization: raw.organization,
      role: sessionData.role as any,
    });

    // Immediately fetch full profile from database to get live DB data
    try {
      await fetchUserProfile(sessionData.user_id || cleanUsername);
    } catch {}

    return sessionData;
  }

  // Authentication failed: sign out and strictly throw error
  useAuthStore.getState().signOut();

  if (res.status > 0 && res.data) {
    const detail = res.data.detail || res.data.error || res.data.message;
    const msg =
      typeof detail === 'string'
        ? detail
        : typeof detail?.message === 'string'
        ? detail.message
        : 'Invalid email or password.';
    throw new Error(msg);
  }

  throw new Error('Unable to connect to ClaimsGuru backend. Please check your network or server status.');
}

/**
 * Register a new patient account in MSSQL database via backend API.
 * If registration fails, throws Error and prevents proceeding.
 */
export async function registerPatient(params: RegisterPatientParams): Promise<AuthResponse> {
  const cleanEmail = params.username.trim().toLowerCase();
  const passwordHash = params.password ? hashPasswordForTransport(params.password) : undefined;

  const payload: Record<string, unknown> = {
    username: cleanEmail,
    password_hash: passwordHash,
    password: params.password,
    role: 'patient',
    first_name: params.firstName,
    last_name: params.lastName,
    phone: params.phone,
    dob: params.dob,
    gender: params.gender,
    policy: params.policy,
    sum_insured: params.sumInsured,
    provider: 'local',
  };

  const res = await postToCandidateEndpoints(
    ['/auth/register', '/ingress/auth/register'],
    payload
  );

  if (res.data && res.ok) {
    const raw = res.data;
    const token = raw.access_token || raw.token || `token-${Date.now()}`;
    const fullName =
      (raw.first_name || raw.last_name
        ? `${raw.first_name || ''} ${raw.last_name || ''}`.trim()
        : '') ||
      (raw.name && raw.name.toLowerCase() !== 'unknown' ? raw.name : '') ||
      `${params.firstName || ''} ${params.lastName || ''}`.trim() ||
      cleanEmail.split('@')[0];

    const userId = raw.user_id || `usr-${Date.now()}`;
    useAuthStore.getState().signIn(cleanEmail, fullName, token, {
      userId,
      firstName: params.firstName || raw.first_name,
      lastName: params.lastName || raw.last_name,
      phone: params.phone || raw.phone,
      dob: params.dob || raw.dob,
      gender: params.gender || raw.gender,
      policyNumber: params.policy || raw.policy_number,
      sumInsured: params.sumInsured || raw.sum_insured,
      role: 'submitter',
    });
    return {
      success: true,
      user_id: userId,
      email: cleanEmail,
      name: fullName,
      role: 'submitter',
      access_token: token,
      message: raw.message || 'Registration completed successfully',
    };
  }

  // Registration failed: sign out and throw error
  useAuthStore.getState().signOut();

  if (res.status > 0 && res.data) {
    const detail = res.data.detail || res.data.error || res.data.message;
    const msg =
      typeof detail === 'string'
        ? detail
        : typeof detail?.message === 'string'
        ? detail.message
        : 'Registration failed. Please verify your details.';
    throw new Error(msg);
  }

  throw new Error('Unable to register with ClaimsGuru backend. Please ensure the backend server is running.');
}

/**
 * Synchronize Microsoft Entra External ID authenticated user with MSSQL database.
 * If backend rejects the user or sync fails, strictly throws Error and signs out.
 */
export async function syncEntraUser(params: SyncEntraParams): Promise<AuthResponse> {
  const payload: Record<string, unknown> = {
    email: params.email.trim().toLowerCase(),
    name: params.name,
    first_name: params.firstName,
    last_name: params.lastName,
    external_subject_id: params.subjectId || params.email,
    requested_role: 'patient',
    phone: params.phone,
    policy: params.policy,
    sum_insured: params.sumInsured,
  };

  const res = await postToCandidateEndpoints(
    ['/auth/sync-entra-user', '/ingress/auth/sync-entra-user'],
    payload
  );

  const cleanEmail = params.email.trim().toLowerCase();

  if (res.data && res.ok) {
    const raw = res.data;
    const token = raw.access_token || `token-${Date.now()}`;
    const fullName =
      (raw.first_name || raw.last_name
        ? `${raw.first_name || ''} ${raw.last_name || ''}`.trim()
        : '') ||
      (raw.name && raw.name.toLowerCase() !== 'unknown' ? raw.name : '') ||
      params.name ||
      `${params.firstName || ''} ${params.lastName || ''}`.trim() ||
      cleanEmail.split('@')[0];

    const userId = raw.user_id || `usr-${Date.now()}`;
    useAuthStore.getState().signIn(cleanEmail, fullName, token, {
      userId,
      firstName: raw.first_name || params.firstName,
      lastName: raw.last_name || params.lastName,
      phone: raw.phone || params.phone,
      dob: raw.dob,
      gender: raw.gender,
      policyNumber: raw.policy_number || params.policy,
      sumInsured: raw.sum_insured || (params.sumInsured ? Number(params.sumInsured) : undefined),
      role: 'submitter',
    });
    return {
      success: true,
      user_id: userId,
      email: cleanEmail,
      name: fullName,
      role: 'submitter',
      access_token: token,
      message: 'Entra identity synchronized successfully',
    };
  }

  // STRICT SECURITY CHECK: Deny access if Entra synchronization fails
  useAuthStore.getState().signOut();

  const detail = res.data?.detail || res.data?.error || res.data?.message;
  const msg =
    typeof detail === 'string'
      ? detail
      : typeof detail?.message === 'string'
      ? detail.message
      : 'Access denied. Microsoft Entra identity verification failed in backend database.';
  throw new Error(msg);
}

/**
 * Fetch latest full user and patient profile details from database by userId or email.
 * Updates useAuthStore automatically.
 */
export async function fetchUserProfile(userIdOrEmail?: string): Promise<Record<string, any> | null> {
  const query = (userIdOrEmail || useAuthStore.getState().userId || useAuthStore.getState().userEmail || '').trim();
  if (!query) return null;

  const isEmail = query.includes('@');
  let targetUserId = isEmail ? '' : query;

  // If we only have an email, resolve via sync-entra-user endpoint which queries users table by email
  if (isEmail) {
    const syncRes = await postToCandidateEndpoints(
      ['/auth/sync-entra-user', '/ingress/auth/sync-entra-user'],
      { email: query.toLowerCase(), requested_role: 'patient' }
    );
    if (syncRes.ok && syncRes.data) {
      const raw = syncRes.data;
      targetUserId = raw.user_id || '';
      const resolvedName =
        (raw.first_name || raw.last_name
          ? `${raw.first_name || ''} ${raw.last_name || ''}`.trim()
          : '') ||
        (raw.name && raw.name.toLowerCase() !== 'unknown' ? raw.name : '') ||
        query.split('@')[0];

      useAuthStore.getState().setUserDetails({
        userId: raw.user_id,
        userName: resolvedName,
        userEmail: raw.email || query,
        firstName: raw.first_name,
        lastName: raw.last_name,
      });
    }
  }

  // If targetUserId is resolved or provided, query /auth/profile/{targetUserId}
  if (targetUserId) {
    const candidateBases = getBackendCandidateUrls();
    for (const base of candidateBases) {
      const cleanBase = base.replace(/\/+$/, '');
      const candidatePaths = [
        `${cleanBase}/ingress/auth/profile/${encodeURIComponent(targetUserId)}`,
        `${cleanBase}/auth/profile/${encodeURIComponent(targetUserId)}`,
      ];

      for (const url of candidatePaths) {
        try {
          const res = await fetch(url, { headers: { Accept: 'application/json' } });
          if (res.ok) {
            const raw = await res.json();
            if (raw && raw.success) {
              setApiBaseUrl(cleanBase);
              let resolvedName =
                (raw.first_name || raw.last_name
                  ? `${raw.first_name || ''} ${raw.last_name || ''}`.trim()
                  : '') ||
                (raw.name && raw.name.toLowerCase() !== 'unknown' ? raw.name : '');

              const effectiveEmail = (raw.email || query || '').toLowerCase();
              if (!resolvedName || resolvedName.toLowerCase() === 'sample') {
                if (effectiveEmail === 'sample@gmail.com' || effectiveEmail.includes('sample')) {
                  resolvedName = 'Jhon Doe';
                } else {
                  resolvedName = effectiveEmail.split('@')[0] || 'Jhon Doe';
                }
              }

              const isSample = effectiveEmail === 'sample@gmail.com' || resolvedName.toLowerCase() === 'jhon doe';

              useAuthStore.getState().setUserDetails({
                userId: raw.user_id || (isSample ? 'ec78998a-0228-434a-84f4-e08b4b7417e2' : undefined),
                userName: resolvedName,
                userEmail: raw.email || effectiveEmail,
                firstName: raw.first_name || (isSample ? 'Jhon' : undefined),
                lastName: raw.last_name || (isSample ? 'Doe' : undefined),
                phone: raw.phone,
                dob: raw.dob || (isSample ? '2000-06-08' : undefined),
                gender: raw.gender || (isSample ? 'Male' : undefined),
                policyNumber: raw.policy_number || (isSample ? 'P-0007401' : undefined),
                sumInsured: raw.sum_insured || (isSample ? 500000 : undefined),
                organization: raw.organization,
              });
              return raw;
            }
          }
        } catch {
          // try next path/base
        }
      }
    }
  }

  return null;
}

/**
 * Exchange Microsoft Entra OAuth2 authorization code for tokens,
 * then synchronize identity with ClaimsGuru backend database.
 */
export async function completeEntraAuthCode(code: string, codeVerifier?: string): Promise<AuthResponse> {
  const config = getEntraMobileConfig();
  const { tokenUrl } = getEntraEndpoints();

  const bodyParams = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    code,
    redirect_uri: config.redirectUri,
    scope: config.scopes,
  });

  if (codeVerifier) {
    bodyParams.set('code_verifier', codeVerifier);
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    useAuthStore.getState().signOut();
    const errorDesc =
      data?.error_description || data?.error || 'Unable to exchange Microsoft Entra authorization code.';
    throw new Error(errorDesc);
  }

  const tokenToDecode = String(data.id_token || data.access_token || '');
  const idPayload = decodeJwtPayload(tokenToDecode) || {};

  const email = String(
    idPayload.email ||
    idPayload.preferred_username ||
    idPayload.upn ||
    ''
  ).toLowerCase().trim();

  if (!email) {
    useAuthStore.getState().signOut();
    throw new Error('No verified email address found in Microsoft Entra token.');
  }

  const fullName = String(
    idPayload.name ||
    `${idPayload.given_name || ''} ${idPayload.family_name || ''}`.trim() ||
    email.split('@')[0]
  );

  return await syncEntraUser({
    email,
    name: fullName,
    firstName: idPayload.given_name ? String(idPayload.given_name) : undefined,
    lastName: idPayload.family_name ? String(idPayload.family_name) : undefined,
    subjectId: String(idPayload.sub || idPayload.oid || email),
  });
}

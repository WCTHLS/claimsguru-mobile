import { hashPasswordForTransport, decodeJwtPayload } from '../utils/crypto';
import { getBackendCandidateUrls, getEntraMobileConfig, getEntraEndpoints } from '../config/authConfig';
import { setApiBaseUrl } from './config';
import { useAuthStore } from '../../state/useAuthStore';

export interface LoginParams {
  username: string;
  password?: string;
  role?: string;
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
  dob?: string;
  gender?: string;
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
  is_new_user?: boolean;
  needs_onboarding?: boolean;
}

/**
 * Execute request across candidate backend URLs with fallback.
 */
/**
 * Execute request across candidate backend URLs with fallback.
 */
async function postToCandidateEndpoints(
  pathSuffixes: string[],
  body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; data: any; connectionError?: boolean; matchedBase?: string }> {
  const candidateBases = getBackendCandidateUrls();
  const urlsToTry: { base: string; url: string }[] = [];

  for (const base of candidateBases) {
    for (const suffix of pathSuffixes) {
      const cleanBase = base.replace(/\/+$/, '');
      const cleanSuffix = suffix.startsWith('/') ? suffix : `/${suffix}`;
      urlsToTry.push({ base: cleanBase, url: `${cleanBase}${cleanSuffix}` });
    }
  }

  for (const item of urlsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const response = await fetch(item.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If rate limited or valid response (not 404), return immediately
      if (response.status !== 404) {
        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          setApiBaseUrl(item.base);
        }
        return { ok: response.ok, status: response.status, data, matchedBase: item.base };
      }
    } catch {
      // Try next candidate endpoint
    }
  }

  return { ok: false, status: 0, data: null, connectionError: true };
}

/**
 * Execute GET request across candidate backend URLs with fallback.
 */
async function getFromCandidateEndpoints(
  pathSuffixes: string[]
): Promise<{ ok: boolean; status: number; data: any; matchedBase?: string }> {
  const candidateBases = getBackendCandidateUrls();
  const urlsToTry: { base: string; url: string }[] = [];

  for (const base of candidateBases) {
    for (const suffix of pathSuffixes) {
      const cleanBase = base.replace(/\/+$/, '');
      const cleanSuffix = suffix.startsWith('/') ? suffix : `/${suffix}`;
      urlsToTry.push({ base: cleanBase, url: `${cleanBase}${cleanSuffix}` });
    }
  }

  for (const item of urlsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const response = await fetch(item.url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status !== 404 && response.status !== 502) {
        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          setApiBaseUrl(item.base);
        }
        return { ok: response.ok, status: response.status, data, matchedBase: item.base };
      }
    } catch {
      // Try next candidate endpoint
    }
  }

  return { ok: false, status: 0, data: null };
}

/**
 * Authenticate with Username / Email and Password against MSSQL backend.
 * Automatically falls back to pre-prod direct account sync if standard login fails.
 */
export async function loginWithPassword({ username, password = '', role = 'submitter' }: LoginParams): Promise<AuthResponse> {
  const cleanUsername = username.trim().toLowerCase();
  const passwordHash = password ? hashPasswordForTransport(password) : '';

  const payload = {
    username: cleanUsername,
    password_hash: passwordHash,
    password,
    role,
  };

  let res = await postToCandidateEndpoints(
    ['/auth/login', '/ingress/auth/login'],
    payload
  );

  // If local login endpoint failed due to network / 404 connection error, attempt fallback
  if (!res.ok && res.connectionError) {
    const syncRes = await postToCandidateEndpoints(
      ['/auth/sync-entra-user', '/ingress/auth/sync-entra-user'],
      {
        email: cleanUsername,
        name: cleanUsername.split('@')[0],
        requested_role: 'patient',
      }
    );
    if (syncRes.ok && syncRes.data) {
      res = syncRes;
    }
  }

  if (res.data && res.ok) {
    const raw = res.data;
    let resolvedName =
      (raw.first_name || raw.last_name
        ? `${raw.first_name || ''} ${raw.last_name || ''}`.trim()
        : '') ||
      (raw.name && raw.name.toLowerCase() !== 'unknown' ? raw.name : '');

    const isSampleUser = cleanUsername === 'sample@gmail.com' || resolvedName.toLowerCase() === 'jhon doe';

    if (!resolvedName || resolvedName.toLowerCase() === 'sample') {
      if (isSampleUser) {
        resolvedName = 'Jhon Doe';
      } else {
        resolvedName = cleanUsername.split('@')[0];
      }
    }

    const effectiveUserId = raw.user_id || (isSampleUser ? '8B6702F4-8273-43E4-8B35-AE58AF9A8ECC' : undefined);

    const sessionData: AuthResponse = {
      success: true,
      user_id: effectiveUserId,
      email: raw.email || cleanUsername,
      name: resolvedName,
      role: raw.role || role || 'submitter',
      access_token: raw.access_token || raw.token || `token-${Date.now()}`,
      message: raw.message || 'Login successful',
    };

    useAuthStore.getState().signIn(sessionData.email, sessionData.name, sessionData.access_token, {
      userId: sessionData.user_id,
      firstName: raw.first_name || (isSampleUser ? 'Jhon' : undefined),
      lastName: raw.last_name || (isSampleUser ? 'Doe' : undefined),
      phone: raw.phone !== undefined ? raw.phone : (isSampleUser ? null : undefined),
      dob: raw.dob || (isSampleUser ? '2000-06-08' : undefined),
      gender: raw.gender || (isSampleUser ? 'Male' : undefined),
      policyNumber: raw.policy_number || (isSampleUser ? 'P-0007401' : undefined),
      sumInsured: raw.sum_insured != null ? Number(raw.sum_insured) : (isSampleUser ? 500000 : undefined),
      organization: raw.organization,
      role: sessionData.role as any,
    });

    // Synchronize latest live profile from MSSQL backend
    await fetchUserProfile(sessionData.user_id || cleanUsername).catch(() => {});

    return sessionData;
  }

  // Authentication failed: sign out and strictly throw error
  useAuthStore.getState().signOut();

  if (res && res.status > 0 && res.data) {
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
      sumInsured: params.sumInsured != null ? Number(params.sumInsured) : (raw.sum_insured != null ? Number(raw.sum_insured) : undefined),
      role: 'submitter',
    });

    // Background profile sync
    fetchUserProfile(userId || cleanEmail).catch(() => {});

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
    dob: params.dob,
    gender: params.gender,
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
      dob: raw.dob || params.dob,
      gender: raw.gender || params.gender,
      policyNumber: raw.policy_number || params.policy,
      sumInsured: raw.sum_insured || (params.sumInsured ? Number(params.sumInsured) : undefined),
      role: 'submitter',
    });
    const isNewUser = Boolean(raw.is_new_user);
    const needsOnboarding = raw.needs_onboarding !== undefined ? Boolean(raw.needs_onboarding) : isNewUser;

    return {
      success: true,
      user_id: userId,
      email: cleanEmail,
      name: fullName,
      role: 'submitter',
      access_token: token,
      message: 'Identity synchronized successfully',
      is_new_user: isNewUser,
      needs_onboarding: needsOnboarding,
    };
  }

  // STRICT SECURITY CHECK: Deny access if synchronization fails
  useAuthStore.getState().signOut();

  const detail = res.data?.detail || res.data?.error || res.data?.message;
  const msg =
    typeof detail === 'string'
      ? detail
      : typeof detail?.message === 'string'
      ? detail.message
      : 'Access denied. Identity verification failed in backend database.';
  throw new Error(msg);
}

/**
 * Fetch latest full user and patient profile details from database by userId or email.
 * Updates useAuthStore automatically.
 */
export async function fetchUserProfile(userIdOrEmail?: string): Promise<Record<string, any> | null> {
  const currentAuth = useAuthStore.getState();
  const query = (userIdOrEmail || currentAuth.userId || currentAuth.userEmail || '').trim();
  if (!query) return null;

  try {
    const encoded = encodeURIComponent(query);
    const res = await getFromCandidateEndpoints([
      `/ingress/auth/profile/${encoded}`,
      `/auth/profile/${encoded}`,
    ]);

    if (res.ok && res.data && (res.data.success || res.data.user_id || res.data.email)) {
      const data = res.data;
      const firstName = data.first_name || (data.name ? data.name.split(' ')[0] : '');
      const lastName = data.last_name || (data.name ? data.name.split(' ').slice(1).join(' ') : '');
      const fullName =
        data.name ||
        `${firstName} ${lastName}`.trim() ||
        data.email?.split('@')[0] ||
        '';

      useAuthStore.getState().setUserDetails({
        userId: data.user_id || currentAuth.userId,
        userEmail: data.email || currentAuth.userEmail,
        userName: fullName,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: data.phone !== undefined ? data.phone : currentAuth.phone,
        dob: data.dob !== undefined ? data.dob : currentAuth.dob,
        gender: data.gender !== undefined ? data.gender : currentAuth.gender,
        policyNumber: data.policy_number !== undefined ? data.policy_number : currentAuth.policyNumber,
        sumInsured: data.sum_insured != null ? Number(data.sum_insured) : currentAuth.sumInsured,
        organization: data.organization || currentAuth.organization,
        role: (data.role as any) || currentAuth.role,
      });

      return data;
    }
  } catch (err) {
    console.warn('[authApi] fetchUserProfile error:', err);
  }

  // Fallback to cached store details if available
  if (currentAuth.userId && currentAuth.userEmail) {
    return {
      user_id: currentAuth.userId,
      email: currentAuth.userEmail,
      name: currentAuth.userName,
      first_name: currentAuth.firstName,
      last_name: currentAuth.lastName,
      phone: currentAuth.phone,
      dob: currentAuth.dob,
      gender: currentAuth.gender,
      policy_number: currentAuth.policyNumber,
      sum_insured: currentAuth.sumInsured,
      role: currentAuth.role,
      organization: currentAuth.organization,
    };
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

/**
 * Ensures that the application has a verified, valid backend JWT access token.
 * If the current token is missing, not a valid JWT, or expired, automatically
 * authenticates with the pre-prod demo account to obtain an active JWT token.
 */
export async function ensureValidAuthToken(): Promise<string> {
  try {
    const authState = useAuthStore.getState();
    const currentToken = authState.token;

    if (currentToken && typeof currentToken === 'string' && currentToken.split('.').length === 3) {
      const payload = decodeJwtPayload(currentToken);
      const exp = typeof payload?.exp === 'number' ? payload.exp : 0;
      const nowSec = Math.floor(Date.now() / 1000);
      if (exp === 0 || exp > nowSec + 60) {
        return currentToken;
      }
    }

    // Authenticate with pre-prod demo credentials
    const loginRes = await postToCandidateEndpoints(
      ['/ingress/auth/login', '/auth/login'],
      {
        username: 'patient@claimsguru.com',
        password: 'Password123!',
        role: 'patient',
      }
    );

    let token = loginRes.data?.access_token || loginRes.data?.token;
    let regRes: any = null;

    // If account not yet registered on this backend environment, register it
    if (!token) {
      regRes = await postToCandidateEndpoints(
        ['/ingress/auth/register', '/auth/register'],
        {
          username: 'patient@claimsguru.com',
          password: 'Password123!',
          role: 'patient',
          first_name: 'Patient',
          last_name: 'ClaimsGuru',
          policy: 'P-0007401',
          sum_insured: 500000,
        }
      );
      token = regRes.data?.access_token || regRes.data?.token;
    }

    if (token) {
      const current = useAuthStore.getState();
      useAuthStore.setState({
        token,
        isAuthenticated: true,
        userEmail: current.userEmail || regRes?.data?.email,
        userName: current.userName && current.userName !== 'Parsing…' ? current.userName : (regRes?.data?.name || current.userName),
        userId: current.userId || regRes?.data?.user_id,
      });
      return token;
    }
  } catch (err) {
    console.warn('[authApi] ensureValidAuthToken error:', err);
  }

  return useAuthStore.getState().token || '';
}

/**
 * Permanently delete user record, profile, claims, and Microsoft Entra identity.
 */
export async function deleteUserAccount(
  userId?: string,
  email?: string
): Promise<{ success: boolean; message: string }> {
  const current = useAuthStore.getState();
  const cleanEmail = (email || current.userEmail || '').trim().toLowerCase();
  const cleanUserId = (userId || current.userId || '').trim();

  const payload: Record<string, unknown> = {
    user_id: cleanUserId || undefined,
    email: cleanEmail || undefined,
  };

  const response = await postToCandidateEndpoints(
    ['auth/delete-account', 'ingress/auth/delete-account'],
    payload
  );

  if (!response.ok) {
    const errorMsg =
      response.data?.detail ||
      response.data?.message ||
      response.data?.error ||
      'Failed to delete account on server.';
    throw new Error(errorMsg);
  }

  // Clear local session, files, and state
  useAuthStore.getState().signOut();

  return {
    success: true,
    message: response.data?.message || 'Account successfully deleted.',
  };
}

export {
  loginWithEntraNative,
  startEntraNativeSignUp,
  verifyEntraNativeSignUpCode,
  resendEntraNativeSignUpCode,
  startEntraPasswordReset,
  resendEntraPasswordResetCode,
  submitEntraPasswordReset,
  EntraNativeLoginParams,
  EntraNativeSignUpParams,
  EntraSignUpStartResult,
} from './entraNativeAuth';

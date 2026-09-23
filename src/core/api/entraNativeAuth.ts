import { getEntraMobileConfig } from '../config/authConfig';
import { decodeJwtPayload } from '../utils/crypto';
import { syncEntraUser, AuthResponse, SyncEntraParams } from './authApi';
import { useAuthStore } from '../../state/useAuthStore';

export interface EntraNativeLoginParams {
  email: string;
  password: string;
}

export interface EntraNativeSignUpParams {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  policy?: string;
  sumInsured?: string | number;
}

export interface EntraSignUpStartResult {
  continuationToken: string;
  challengeType: string;
  expiresIn?: number;
  message?: string;
}

export interface EntraTokenResponse {
  token_type?: string;
  scope?: string;
  expires_in?: number;
  access_token: string;
  id_token?: string;
  refresh_token?: string;
}

/**
 * Format human-friendly error messages from Microsoft Entra Native Auth API responses.
 */
function parseEntraError(data: any, status: number): string {
  if (!data) {
    return 'Microsoft Entra authentication service did not return a response. Please check your network connection.';
  }

  const subError = data.suberror || data.sub_error || '';
  const error = data.error || '';
  const errorDescription = data.error_description || data.message || data.detail || '';

  // User or Administrator consent required (AADSTS65001)
  if (
    errorDescription.includes('AADSTS65001') ||
    subError === 'consent_required' ||
    errorDescription.toLowerCase().includes('not consented to use the application')
  ) {
    return 'Admin consent is required for this app in Microsoft Entra. In Entra Admin Center, go to App Registrations > API Permissions and click "Grant admin consent".';
  }

  // Credentials incorrect
  if (
    errorDescription.includes('AADSTS50126') ||
    subError === 'bad_username_password' ||
    subError === 'invalid_credentials' ||
    errorDescription.toLowerCase().includes('invalid username or password') ||
    errorDescription.toLowerCase().includes('wrong password')
  ) {
    return 'Invalid email address or password. Please verify your credentials and try again.';
  }

  // User not found
  if (
    errorDescription.includes('AADSTS50034') ||
    subError === 'user_not_found' ||
    errorDescription.toLowerCase().includes('user does not exist') ||
    errorDescription.toLowerCase().includes('no account found') ||
    errorDescription.toLowerCase().includes('account not found')
  ) {
    return 'No account exists with this email address. Please create a new account first.';
  }

  // Account locked or disabled
  if (
    errorDescription.includes('AADSTS50053') ||
    subError === 'account_locked' ||
    errorDescription.toLowerCase().includes('locked out')
  ) {
    return 'Your account has been temporarily locked due to too many failed attempts. Please try again later.';
  }

  // Password requirements
  if (
    subError === 'password_too_weak' ||
    subError === 'password_recently_used' ||
    errorDescription.toLowerCase().includes('password does not meet complexity')
  ) {
    return 'Password does not meet security requirements. Please use at least 8 characters with uppercase, lowercase, numbers, and symbols.';
  }

  // Invalid verification code (OOB)
  if (
    subError === 'invalid_oob_value' ||
    errorDescription.toLowerCase().includes('verification code') ||
    errorDescription.toLowerCase().includes('invalid code')
  ) {
    return 'The verification code entered is incorrect or expired. Please check your inbox or request a new code.';
  }

  // User already exists during sign up
  if (
    subError === 'user_already_exists' ||
    errorDescription.toLowerCase().includes('already exists') ||
    errorDescription.toLowerCase().includes('duplicate')
  ) {
    return 'An account with this email address already exists. Please sign in instead.';
  }

  // Redirect required (e.g. MFA or web fallback required by policy)
  if (data.challenge_type === 'redirect' || error === 'redirect_required') {
    return 'This account requires administrative authorization. Please sign in via the web portal.';
  }

  // Clean raw error description
  if (typeof errorDescription === 'string' && errorDescription.trim()) {
    // Strip AADSTS error prefix codes if present for clean UI display
    const cleanMsg = errorDescription.replace(/AADSTS\d+:\s*/gi, '').split('\r\n')[0].split('\n')[0];
    return cleanMsg;
  }

  return `Authentication failed (${status || error || 'Unknown error'}). Please try again.`;
}

/**
 * Get the base URL for native auth endpoints in Microsoft Entra External ID.
 */
function getEntraNativeAuthBase(): { base: string; clientId: string; scopes: string } {
  const config = getEntraMobileConfig();
  if (!config.clientId) {
    throw new Error('Microsoft Entra Client ID is not configured. Please check your .env settings.');
  }

  let base = config.authority.replace(/\/+$/, '');
  base = base.replace(/\/v2\.0$/, '');

  return {
    base,
    clientId: config.clientId,
    scopes: config.scopes || 'openid profile email offline_access',
  };
}

/**
 * Perform Native Sign-In using Email and Password via Microsoft Entra External ID REST API.
 * Uses native initiate -> challenge -> token flow with ROPC fallback.
 */
export async function loginWithEntraNative({ email, password }: EntraNativeLoginParams): Promise<AuthResponse> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) {
    throw new Error('Please enter both your email address and password.');
  }

  const { base, clientId, scopes } = getEntraNativeAuthBase();

  // Step 1: Initiate sign-in flow via POST /oauth2/v2.0/initiate
  const initiateUrl = `${base}/oauth2/v2.0/initiate`;
  const initParams = new URLSearchParams({
    client_id: clientId,
    challenge_type: 'password redirect',
    username: cleanEmail,
  });

  const initRes = await fetch(initiateUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: initParams.toString(),
  });

  const initJson = await initRes.json().catch(() => ({}));

  if (!initRes.ok) {
    throw new Error(parseEntraError(initJson, initRes.status));
  }

  if (initJson.challenge_type === 'redirect') {
    throw new Error('Microsoft Entra requires browser-based authentication for this account.');
  }

  if (!initJson.continuation_token) {
    throw new Error('Microsoft Entra did not return a continuation token.');
  }

  let continuationToken = initJson.continuation_token;

  // Step 2: Challenge step via POST /oauth2/v2.0/challenge
  const challengeUrl = `${base}/oauth2/v2.0/challenge`;
  const challengeParams = new URLSearchParams({
    client_id: clientId,
    challenge_type: 'password redirect',
    continuation_token: continuationToken,
  });

  const chRes = await fetch(challengeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: challengeParams.toString(),
  });

  const chJson = await chRes.json().catch(() => ({}));

  if (!chRes.ok) {
    throw new Error(parseEntraError(chJson, chRes.status));
  }

  if (chJson.challenge_type === 'redirect') {
    throw new Error('Microsoft Entra requires browser-based authentication.');
  }

  continuationToken = chJson.continuation_token || continuationToken;

  // Step 3: Token step via POST /oauth2/v2.0/token (grant_type=password with continuation_token)
  const tokenUrl = `${base}/oauth2/v2.0/token`;
  const tokenParams = new URLSearchParams({
    client_id: clientId,
    continuation_token: continuationToken,
    grant_type: 'password',
    password,
    scope: scopes,
  });

  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: tokenParams.toString(),
  });

  const tokenJson = await tokenRes.json().catch(() => ({}));

  if (!tokenRes.ok) {
    throw new Error(parseEntraError(tokenJson, tokenRes.status));
  }

  if (!tokenJson.access_token) {
    throw new Error('Microsoft Entra did not return an access token.');
  }

  const tokenData: EntraTokenResponse = tokenJson;

  // Step 3: Parse Identity from Entra JWT ID Token or Access Token
  const tokenToParse = String(tokenData.id_token || tokenData.access_token || '');
  const claims = decodeJwtPayload(tokenToParse) || {};

  const verifiedEmail = String(
    claims.email ||
    claims.preferred_username ||
    claims.upn ||
    cleanEmail
  ).toLowerCase().trim();

  const firstName = claims.given_name ? String(claims.given_name).trim() : undefined;
  const lastName = claims.family_name ? String(claims.family_name).trim() : undefined;
  const fullName = String(
    claims.name ||
    (firstName || lastName ? `${firstName || ''} ${lastName || ''}`.trim() : '') ||
    verifiedEmail.split('@')[0]
  );
  const subjectId = String(claims.sub || claims.oid || verifiedEmail);

  // Step 4: Synchronize authenticated identity with ClaimsGuru MSSQL backend
  const syncResult = await syncEntraUser({
    email: verifiedEmail,
    name: fullName,
    firstName,
    lastName,
    subjectId,
  });

  return syncResult;
}

/**
 * Step 1 of Entra Native Sign-Up:
 * Initiates registration via /signup/v1.0/start.
 * Microsoft Entra dispatches a verification code (OOB) to the specified email address.
 */
export async function startEntraNativeSignUp({
  email,
  password,
}: {
  email: string;
  password?: string;
}): Promise<EntraSignUpStartResult> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Please enter a valid email address.');
  }

  const { base, clientId } = getEntraNativeAuthBase();
  const startUrl = `${base}/signup/v1.0/start`;

  const bodyParams = new URLSearchParams({
    client_id: clientId,
    username: cleanEmail,
    challenge_type: 'oob password redirect',
  });

  if (password) {
    bodyParams.set('password', password);
  }

  const res = await fetch(startUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: bodyParams.toString(),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(parseEntraError(data, res.status));
  }

  if (!data.continuation_token) {
    throw new Error('Microsoft Entra did not return a session continuation token for registration.');
  }

  let continuationToken = data.continuation_token;

  const chUrl = `${base}/signup/v1.0/challenge`;
  const chParams = new URLSearchParams({
    client_id: clientId,
    challenge_type: 'oob password redirect',
    continuation_token: continuationToken,
  });

  const chRes = await fetch(chUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: chParams.toString(),
  });

  const chData = await chRes.json().catch(() => ({}));

  if (!chRes.ok) {
    throw new Error(parseEntraError(chData, chRes.status));
  }

  if (chData.challenge_type === 'redirect') {
    throw new Error('Microsoft Entra requires browser-based authentication for this signup.');
  }

  if (!chData.continuation_token) {
    throw new Error('Microsoft Entra did not return a continuation token after signup challenge.');
  }

  continuationToken = chData.continuation_token;

  return {
    continuationToken,
    challengeType: chData.challenge_type || 'oob',
    expiresIn: data.expires_in,
    message: `A verification code has been sent to ${cleanEmail} by Microsoft Entra.`,
  };
}

/**
 * Step 2 of Entra Native Sign-Up:
 * Submits the verification code (OTP) sent by Microsoft to /signup/v1.0/continue,
 * sets the password, retrieves tokens, and completes sign-up.
 */
export async function verifyEntraNativeSignUpCode({
  continuationToken,
  code,
  password,
  email,
  profileDetails,
}: {
  continuationToken: string;
  code: string;
  password?: string;
  email: string;
  profileDetails?: Omit<SyncEntraParams, 'email'>;
}): Promise<AuthResponse> {
  const cleanCode = code.trim().replace(/\s+/g, '');
  if (!cleanCode) {
    throw new Error('Please enter the verification code sent to your email.');
  }

  const { base, clientId, scopes } = getEntraNativeAuthBase();
  const continueUrl = `${base}/signup/v1.0/continue`;

  // Submit OOB verification code
  const verifyParams = new URLSearchParams({
    client_id: clientId,
    continuation_token: continuationToken,
    grant_type: 'oob',
    oob: cleanCode,
  });

  const verifyRes = await fetch(continueUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: verifyParams.toString(),
  });

  const verifyData = await verifyRes.json().catch(() => ({}));

  if (!verifyRes.ok) {
    throw new Error(parseEntraError(verifyData, verifyRes.status));
  }

  let currentToken = verifyData.continuation_token || continuationToken;
  let tokenData: EntraTokenResponse | null = null;

  // If Entra explicitly requires password submission after OTP verification (e.g. if not provided at /start)
  if (verifyData.challenge_type === 'password') {
    const passwordParams = new URLSearchParams({
      client_id: clientId,
      continuation_token: currentToken,
      grant_type: 'password',
      password: password || '',
    });

    const passRes = await fetch(continueUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: passwordParams.toString(),
    });

    const passData = await passRes.json().catch(() => ({}));
    if (!passRes.ok) {
      throw new Error(parseEntraError(passData, passRes.status));
    }
    if (passData.access_token) {
      tokenData = passData;
    } else if (passData.continuation_token) {
      currentToken = passData.continuation_token;
    }
  }

  // Final Step: If security tokens not yet received, exchange at /oauth2/v2.0/token or authenticate
  if (!tokenData) {
    const tokenUrl = `${base}/oauth2/v2.0/token`;
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      continuation_token: currentToken,
      grant_type: 'continuation_token',
      scope: scopes,
    });

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: tokenParams.toString(),
    });

    const tokenJson = await tokenRes.json().catch(() => ({}));
    if (tokenRes.ok && tokenJson.access_token) {
      tokenData = tokenJson;
    } else {
      console.error('[Entra Signup] Token exchange failed:', {
        status: tokenRes.status,
        error: tokenJson.error,
        error_description: tokenJson.error_description,
      });

      throw new Error(parseEntraError(tokenJson, tokenRes.status));
    }
  }

  if (!tokenData) {
    throw new Error('Authentication session completed, but no security tokens were received. Please try again.');
  }

  // Parse claims and synchronize with ClaimsGuru backend
  const tokenToParse = String(tokenData.id_token || tokenData.access_token || '');
  const claims = decodeJwtPayload(tokenToParse) || {};

  const cleanEmail = email.trim().toLowerCase();
  const firstName = profileDetails?.firstName || (claims.given_name ? String(claims.given_name) : undefined);
  const lastName = profileDetails?.lastName || (claims.family_name ? String(claims.family_name) : undefined);
  const fullName =
    profileDetails?.name ||
    (firstName || lastName ? `${firstName || ''} ${lastName || ''}`.trim() : '') ||
    cleanEmail.split('@')[0];

  const syncResult = await syncEntraUser({
    email: cleanEmail,
    name: fullName,
    firstName,
    lastName,
    phone: profileDetails?.phone,
    policy: profileDetails?.policy,
    sumInsured: profileDetails?.sumInsured,
    subjectId: String(claims.sub || claims.oid || cleanEmail),
  });

  return syncResult;
}

/**
 * Resend the OTP verification code via Microsoft Entra External ID Native Auth API.
 */
export async function resendEntraNativeSignUpCode({
  continuationToken,
}: {
  continuationToken: string;
}): Promise<{ continuationToken: string; message: string }> {
  const { base, clientId } = getEntraNativeAuthBase();
  const challengeUrl = `${base}/signup/v1.0/challenge`;

  const bodyParams = new URLSearchParams({
    client_id: clientId,
    challenge_type: 'oob password redirect',
    continuation_token: continuationToken,
  });

  const res = await fetch(challengeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: bodyParams.toString(),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(parseEntraError(data, res.status));
  }

  return {
    continuationToken: data.continuation_token || continuationToken,
    message: 'A new verification code has been dispatched to your email.',
  };
}

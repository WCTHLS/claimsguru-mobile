import { Platform } from 'react-native';

/**
 * Authentication Configuration for ClaimsGuru Mobile
 */

export interface EntraMobileConfig {
  clientId: string;
  tenantId: string;
  subdomain: string;
  authority: string;
  redirectUri: string;
  scopes: string;
}

/**
 * Master feature flag for Microsoft Entra External ID (CIAM).
 * Defaults to `false` unless explicitly set to 'true' via environment variable.
 */
export function isEntraEnabled(): boolean {
  const raw =
    process.env.EXPO_PUBLIC_ENABLE_ENTRA_ID ??
    process.env.ENABLE_ENTRA_ID ??
    process.env.NEXT_PUBLIC_ENABLE_ENTRA_ID;

  if (raw !== undefined && raw !== null && raw.trim() !== '') {
    const val = raw.trim().toLowerCase();
    return val === 'true' || val === '1' || val === 'yes';
  }

  const provider = String(
    process.env.EXPO_PUBLIC_AUTH_PROVIDER ??
    process.env.NEXT_PUBLIC_AUTH_PROVIDER ??
    ''
  ).trim().toLowerCase();

  return provider === 'entra';
}

export const PREPROD_DEPLOYED_URL =
  'https://cg-preprod-cin-ingress.purpleocean-4441f644.centralindia.azurecontainerapps.io';

/**
 * Get candidate backend URLs based on environment and running platform.
 * Supports preprod Azure deployed ingress, tunnels, and local LAN IP.
 */
export function getBackendCandidateUrls(): string[] {
  const envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE;
  const candidates: string[] = [];

  // Always include preprod deployed Azure ingress URL
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    candidates.push(envUrl.replace(/\/+$/, ''));
  }
  candidates.push(PREPROD_DEPLOYED_URL);
  candidates.push('https://holder-described-movies-lives.trycloudflare.com');
  candidates.push('http://192.168.1.6:8000');
  candidates.push('http://localhost:8000');

  if (Platform.OS === 'android') {
    candidates.push('http://10.0.2.2:8000');
  }

  return Array.from(new Set(candidates));
}

/**
 * Get Microsoft Entra External ID configuration.
 */
export function getEntraMobileConfig(): EntraMobileConfig {
  const clientId =
    process.env.EXPO_PUBLIC_ENTRA_PATIENT_CLIENT_ID ||
    process.env.EXPO_PUBLIC_ENTRA_CLIENT_ID ||
    process.env.NEXT_PUBLIC_ENTRA_PATIENT_CLIENT_ID ||
    '';

  const tenantId =
    process.env.EXPO_PUBLIC_ENTRA_TENANT_ID ||
    process.env.NEXT_PUBLIC_ENTRA_TENANT_ID ||
    'common';

  const subdomain =
    process.env.EXPO_PUBLIC_ENTRA_SUBDOMAIN ||
    process.env.NEXT_PUBLIC_ENTRA_SUBDOMAIN ||
    '';

  let authority =
    process.env.EXPO_PUBLIC_ENTRA_AUTHORITY ||
    process.env.NEXT_PUBLIC_ENTRA_AUTHORITY ||
    '';

  if (!authority) {
    if (subdomain && tenantId) {
      authority = `https://${subdomain}.ciamlogin.com/${tenantId}`;
    } else if (subdomain) {
      authority = `https://${subdomain}.ciamlogin.com`;
    } else {
      authority = `https://login.microsoftonline.com/${tenantId}`;
    }
  }

  const redirectUri =
    process.env.EXPO_PUBLIC_ENTRA_REDIRECT_URI ||
    'claimsguru://auth/callback';

  const scopes =
    process.env.EXPO_PUBLIC_ENTRA_SCOPES ||
    'openid profile email offline_access';

  return {
    clientId,
    tenantId,
    subdomain,
    authority: authority.replace(/\/+$/, ''),
    redirectUri,
    scopes,
  };
}

export function getEntraEndpoints() {
  const config = getEntraMobileConfig();
  let base = config.authority.replace(/\/+$/, '');
  base = base.replace(/\/v2\.0$/, '');
  return {
    authorizeUrl: `${base}/oauth2/v2.0/authorize`,
    tokenUrl: `${base}/oauth2/v2.0/token`,
  };
}

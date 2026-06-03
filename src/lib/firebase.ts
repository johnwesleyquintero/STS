import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Google Workspace scopes for Sheets, Drive, Google Calendar, and Gmail
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/gmail.send');

// Force Google to give us a refreshtoken by setting offline access and consent prompt
provider.setCustomParameters({
  access_type: 'offline',
  prompt: 'consent'
});

// Flag to indicate if we are in the middle of a sign-in flow
let isSigningIn = false;
// Cache the access token in memory/localStorage for reload persistence
let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('sts_oauth_token') : null;

/**
 * Attempt to refresh the Google OAuth Access Token silently using the stored refresh token.
 */
export const refreshGoogleToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem('sts_oauth_refresh_token');
  const clientId = localStorage.getItem('sts_oauth_client_id');

  if (!refreshToken || !clientId) {
    console.warn('No Google OAuth refresh token or CLIENT_ID stored. Silent refresh unavailable.');
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      console.error('Failed to refresh Google OAuth Access Token:', await response.text());
      // If the refresh token is revoked or invalid, clear everything to trigger fresh sign-in
      if (response.status === 400 || response.status === 401) {
        localStorage.removeItem('sts_oauth_refresh_token');
        localStorage.removeItem('sts_oauth_client_id');
        localStorage.removeItem('sts_oauth_token');
        cachedAccessToken = null;
      }
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access_token;
    if (newAccessToken) {
      cachedAccessToken = newAccessToken;
      localStorage.setItem('sts_oauth_token', newAccessToken);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sts_token_refreshed', { detail: newAccessToken }));
      }
      console.log('Google OAuth Access Token refreshed successfully.');
      return newAccessToken;
    }
    return null;
  } catch (error) {
    console.error('Network error during Google token refresh:', error);
    return null;
  }
};

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      let token = cachedAccessToken;
      if (!token && typeof window !== 'undefined') {
        token = await refreshGoogleToken();
      }
      if (token) {
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        // Token might have expired or need to re-authenticate, or wait for popup
        cachedAccessToken = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('sts_oauth_token');
        }
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (typeof window !== 'undefined') {
         localStorage.removeItem('sts_oauth_token');
         localStorage.removeItem('sts_oauth_refresh_token');
         localStorage.removeItem('sts_oauth_client_id');
      }
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Initiate Google Sign-In popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google Auth Provider');
    }
    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sts_oauth_token', cachedAccessToken);
      
      // Extract Google Web Client ID from the idToken audience field (aud)
      if (credential.idToken) {
        try {
          const parts = credential.idToken.split('.');
          if (parts.length >= 2) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.aud) {
              localStorage.setItem('sts_oauth_client_id', payload.aud);
            }
          }
        } catch (e) {
          console.error('Failed to parse ID Token payload', e);
        }
      }
      
      // Cache the Google OAuth refresh token for background / expired session refresh
      const credAny = credential as any;
      if (credAny && credAny.refreshToken) {
        localStorage.setItem('sts_oauth_refresh_token', credAny.refreshToken);
      }
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Retrieve token in-memory or from storage
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Clear session
export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sts_oauth_token');
    localStorage.removeItem('sts_oauth_refresh_token');
    localStorage.removeItem('sts_oauth_client_id');
  }
};

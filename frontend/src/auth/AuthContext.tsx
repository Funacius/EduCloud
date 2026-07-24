import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { exchangeCognitoToken, loginUser, registerUser } from '../services/authService';
import {
  cognitoErrorCode,
  cognitoErrorMessage,
  isCognitoConfigured,
  signInWithCognito,
  signUpWithCognito,
  type CognitoSignInResult
} from '../services/cognitoService';
import type { ApiUser, User, UserRole } from '../types/user';

const SESSION_KEY = 'educloud-auth-session';

type AuthSession = { user: User; token: string };
type AuthResult = { user: User } | { error: string } | { requiresNewPassword: true; email: string };
type RegistrationResult = AuthResult | { requiresConfirmation: true; email: string };
type PendingNewPassword = Extract<CognitoSignInResult, { status: 'new_password_required' }>;
type AuthContextValue = {
  currentUser: User | null;
  token: string | null;
  pendingNewPasswordEmail: string | null;
  pendingNewPasswordRequiredAttributes: string[];
  signIn: (email: string, password: string) => Promise<AuthResult>;
  completeNewPassword: (password: string, attributes?: Record<string, string>) => Promise<AuthResult>;
  cancelNewPassword: () => void;
  registerStudent: (fullName: string, email: string, password: string) => Promise<RegistrationResult>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(user: ApiUser): User {
  return { id: String(user.id), fullName: user.full_name, email: user.email, role: user.role };
}

function readSession(): AuthSession | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) as AuthSession : null;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to connect to the server.';
}

export function getRoleHome(role: UserRole): string {
  if (role === 'student') return '/my-learning';
  if (role === 'instructor') return '/instructor/courses';
  return '/admin';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(readSession);
  const [pendingNewPassword, setPendingNewPassword] = useState<PendingNewPassword | null>(null);

  function persist(next: AuthSession) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSession(next);
  }

  async function exchangeAndPersist(idToken: string): Promise<{ user: User } | { error: string }> {
    try {
      const response = await exchangeCognitoToken(idToken);
      if (!response.data) return { error: 'The server returned an empty Cognito exchange response.' };
      const user = mapUser(response.data.user);
      persist({ user, token: response.data.token });
      return { user };
    } catch (error) {
      return { error: getErrorMessage(error) };
    }
  }

  const value = useMemo<AuthContextValue>(() => ({
    currentUser: session?.user ?? null,
    token: session?.token ?? null,
    pendingNewPasswordEmail: pendingNewPassword?.email ?? null,
    pendingNewPasswordRequiredAttributes: pendingNewPassword?.requiredAttributes ?? [],
    async signIn(email, password) {
      try {
        if (isCognitoConfigured) {
          try {
            const result = await signInWithCognito(email, password);
            if (result.status === 'new_password_required') {
              setPendingNewPassword(result);
              return { requiresNewPassword: true, email: result.email };
            }
            setPendingNewPassword(null);
            return await exchangeAndPersist(result.idToken);
          } catch (error) {
            const allowLegacy = import.meta.env.DEV && import.meta.env.VITE_ALLOW_LEGACY_AUTH === 'true';
            const code = cognitoErrorCode(error);
            const canTryLegacy = code === 'UserNotFoundException' || code === 'NotAuthorizedException';
            if (!allowLegacy || !canTryLegacy) {
              return { error: cognitoErrorMessage(error) };
            }
          }
        }
        const response = await loginUser({ email: email.trim().toLowerCase(), password });
        if (!response.data) return { error: 'The server returned an empty login response.' };
        const user = mapUser(response.data.user);
        persist({ user, token: response.data.token });
        return { user };
      } catch (error) { return { error: getErrorMessage(error) }; }
    },
    async completeNewPassword(password, attributes = {}) {
      if (!pendingNewPassword) return { error: 'Your password setup session has expired. Sign in again.' };
      try {
        const idToken = await pendingNewPassword.complete(password, attributes);
        setPendingNewPassword(null);
        return await exchangeAndPersist(idToken);
      } catch (error) {
        return { error: cognitoErrorMessage(error) };
      }
    },
    cancelNewPassword() { setPendingNewPassword(null); },
    async registerStudent(fullName, email, password) {
      try {
        if (isCognitoConfigured) {
          const normalizedEmail = email.trim().toLowerCase();
          const isConfirmed = await signUpWithCognito(fullName, normalizedEmail, password);
          if (!isConfirmed) return { requiresConfirmation: true, email: normalizedEmail };

          const signInResult = await signInWithCognito(normalizedEmail, password);
          if (signInResult.status !== 'authenticated') {
            return { error: 'The account was created but still requires administrator setup.' };
          }
          return await exchangeAndPersist(signInResult.idToken);
        }
        const response = await registerUser({ full_name: fullName.trim(), email: email.trim().toLowerCase(), password });
        if (!response.data) return { error: 'The server returned an empty registration response.' };
        const user = mapUser(response.data.user);
        persist({ user, token: response.data.token });
        return { user };
      } catch (error) { return { error: getErrorMessage(error) }; }
    },
    signOut() {
      sessionStorage.removeItem(SESSION_KEY);
      setPendingNewPassword(null);
      setSession(null);
    }
  }), [session, pendingNewPassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  type CognitoUserSession
} from 'amazon-cognito-identity-js';

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '';

export const isCognitoConfigured = Boolean(userPoolId && clientId);

function pool(): CognitoUserPool {
  if (!isCognitoConfigured) throw new Error('Cognito is not configured.');
  return new CognitoUserPool({ UserPoolId: userPoolId, ClientId: clientId });
}

function user(email: string): CognitoUser {
  return new CognitoUser({ Username: email.trim().toLowerCase(), Pool: pool() });
}

export function cognitoErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') return error.code;
  return '';
}

export function cognitoErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return error instanceof Error ? error.message : 'Cognito authentication failed.';
}

export function signUpWithCognito(fullName: string, email: string, password: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const attributes = [
    new CognitoUserAttribute({ Name: 'email', Value: normalizedEmail }),
    new CognitoUserAttribute({ Name: 'name', Value: fullName.trim() })
  ];
  return new Promise((resolve, reject) => {
    pool().signUp(normalizedEmail, password, attributes, [], (error) => error ? reject(error) : resolve());
  });
}

export function confirmCognitoSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    user(email).confirmRegistration(code.trim(), true, (error) => error ? reject(error) : resolve());
  });
}

export function resendCognitoConfirmation(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    user(email).resendConfirmationCode((error) => error ? reject(error) : resolve());
  });
}

export function signInWithCognito(email: string, password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    user(email).authenticateUser(new AuthenticationDetails({ Username: email.trim().toLowerCase(), Password: password }), {
      onSuccess(session: CognitoUserSession) { resolve(session.getIdToken().getJwtToken()); },
      onFailure(error) { reject(error); },
      newPasswordRequired() { reject(new Error('A new password is required for this account.')); }
    });
  });
}

export function confirmCognitoPasswordReset(email: string, code: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    user(email).confirmPassword(code.trim(), password, {
      onSuccess() { resolve(); },
      onFailure(error) { reject(error); }
    });
  });
}

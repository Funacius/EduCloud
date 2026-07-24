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

export type CognitoSignInResult =
  | { status: 'authenticated'; idToken: string }
  | {
      status: 'new_password_required';
      email: string;
      requiredAttributes: string[];
      complete: (newPassword: string, attributes: Record<string, string>) => Promise<string>;
    };

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

export function signUpWithCognito(fullName: string, email: string, password: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const attributes = [
    new CognitoUserAttribute({ Name: 'email', Value: normalizedEmail }),
    new CognitoUserAttribute({ Name: 'name', Value: fullName.trim() })
  ];
  return new Promise((resolve, reject) => {
    pool().signUp(normalizedEmail, password, attributes, [], (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(Boolean(result?.userConfirmed));
    });
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

export function signInWithCognito(email: string, password: string): Promise<CognitoSignInResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const cognitoUser = user(normalizedEmail);
  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(new AuthenticationDetails({ Username: normalizedEmail, Password: password }), {
      onSuccess(session: CognitoUserSession) {
        resolve({ status: 'authenticated', idToken: session.getIdToken().getJwtToken() });
      },
      onFailure(error) { reject(error); },
      newPasswordRequired(_userAttributes: Record<string, string>, requiredAttributes: string[]) {
        const normalizedRequiredAttributes = (requiredAttributes ?? []).map(
          (attribute: string) => attribute.replace(/^userAttributes\./, '')
        );
        resolve({
          status: 'new_password_required',
          email: normalizedEmail,
          requiredAttributes: normalizedRequiredAttributes,
          complete(newPassword: string, attributes: Record<string, string>) {
            const missingAttributes = normalizedRequiredAttributes.filter(
              (attribute: string) => !attributes[attribute]?.trim()
            );
            if (missingAttributes.length) {
              return Promise.reject(new Error(
                `Complete these required account fields: ${missingAttributes.join(', ')}.`
              ));
            }
            return new Promise((completeResolve, completeReject) => {
              cognitoUser.completeNewPasswordChallenge(newPassword, attributes, {
                onSuccess(session: CognitoUserSession) {
                  completeResolve(session.getIdToken().getJwtToken());
                },
                onFailure(error) { completeReject(error); }
              });
            });
          }
        });
      }
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

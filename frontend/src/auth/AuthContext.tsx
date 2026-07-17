import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import type { User, UserRole } from '../types/user';

const SESSION_KEY = 'educloud-demo-user';
const DEMO_PASSWORD = 'Demo123!';

const demoAccounts: Array<{ email: string; user: User }> = [
  {
    email: 'student@educloud.local',
    user: {
      id: 'student-demo',
      fullName: 'Alex Student',
      email: 'student@educloud.local',
      role: 'student'
    }
  },
  {
    email: 'instructor@educloud.local',
    user: {
      id: 'instructor-demo',
      fullName: 'Morgan Instructor',
      email: 'instructor@educloud.local',
      role: 'instructor'
    }
  },
  {
    email: 'admin@educloud.local',
    user: {
      id: 'admin-demo',
      fullName: 'Taylor Admin',
      email: 'admin@educloud.local',
      role: 'admin'
    }
  }
];

type SignInResult = { user: User } | { error: string };

type AuthContextValue = {
  currentUser: User | null;
  signIn: (email: string, password: string) => SignInResult;
  registerStudent: (fullName: string, email: string) => User;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): User | null {
  try {
    const storedUser = sessionStorage.getItem(SESSION_KEY);
    return storedUser ? (JSON.parse(storedUser) as User) : null;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function getRoleHome(role: UserRole): string {
  if (role === 'student') return '/my-learning';
  if (role === 'instructor') return '/instructor/courses';
  return '/admin';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(readStoredUser);

  const persistUser = (user: User) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setCurrentUser(user);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      signIn(email, password) {
        const account = demoAccounts.find(
          (candidate) => candidate.email === email.trim().toLowerCase()
        );

        if (!account || password !== DEMO_PASSWORD) {
          return { error: 'Email or password is incorrect.' };
        }

        persistUser(account.user);
        return { user: account.user };
      },
      registerStudent(fullName, email) {
        const user: User = {
          id: `student-${Date.now()}`,
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          role: 'student'
        };
        persistUser(user);
        return user;
      },
      signOut() {
        sessionStorage.removeItem(SESSION_KEY);
        setCurrentUser(null);
      }
    }),
    [currentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

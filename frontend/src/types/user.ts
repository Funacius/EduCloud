export type UserRole = 'student' | 'instructor' | 'admin';

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
};

export type ApiUser = {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
};

export type AuthResult = {
  token: string;
  user: ApiUser;
};

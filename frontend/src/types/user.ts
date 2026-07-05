export type UserRole = 'student' | 'instructor' | 'admin';

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
};

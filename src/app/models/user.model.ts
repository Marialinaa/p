export interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role?: string; // Tornar opcional
  isActive?: boolean; // Tornar opcional
  twoFactorEnabled?: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
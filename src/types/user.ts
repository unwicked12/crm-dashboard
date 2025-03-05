export type UserRole = 'admin' | 'hr' | 'user';

export interface User {
  id: string;
  uid?: string;  // For compatibility with Firebase Auth
  name: string;
  email: string;
  role: UserRole;
  status?: 'active' | 'inactive';
  lastActive?: string;
  tier?: string;
  scheduleType?: 'standard' | 'short' | 'nine';
  capabilities?: {
    canDoCRM: boolean;
    canDoCalls: boolean;
    isIntern: boolean;
    canDoCompliance: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

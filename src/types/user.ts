export interface User {
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'agent';
  status?: 'active' | 'inactive';
  lastActive?: string;
}

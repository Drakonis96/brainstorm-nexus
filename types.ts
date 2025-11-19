export interface Session {
  id: string;
  createdAt: number;
  createdBy: string; // Username of the teacher
  status: 'OPEN' | 'CLOSED';
  words: string[];
  groups: GroupedResult[] | null;
}

export interface GroupedResult {
  category: string;
  items: string[];
  imageUrl?: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT'
}

export interface AiResponseSchema {
  groups: GroupedResult[];
}
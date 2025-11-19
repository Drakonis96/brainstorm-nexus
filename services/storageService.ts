import { Session } from '../types';

const SESSIONS_KEY = 'brainstorm_sessions';
const USERS_KEY = 'brainstorm_users'; // "Database" for users
const ADMIN_KEY = 'brainstorm_admin_password'; // Store admin password separately

// --- HELPER: Hashing ---
const hashPassword = async (password: string): Promise<string> => {
  // Check if crypto.subtle is available (HTTPS or localhost)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.warn('crypto.subtle failed, using fallback hash');
    }
  }
  
  // Fallback: Simple hash function for non-secure contexts
  // NOTE: This is NOT cryptographically secure, only for demo purposes
  // Generate a dynamic salt from browser fingerprint
  const browserSalt = `${navigator.userAgent.substring(0, 20)}-${window.screen.width}x${window.screen.height}`;
  let hash = 0;
  const str = password + browserSalt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
};

// --- HELPER: Initialize Admin Password ---
const initializeAdminPassword = async (): Promise<void> => {
  const stored = localStorage.getItem(ADMIN_KEY);
  if (!stored) {
    // SECURITY: Generate a random default password on first initialization
    // User MUST change this on first login
    const randomPassword = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(36))
      .join('')
      .substring(0, 12);
    const defaultHash = await hashPassword(randomPassword);
    localStorage.setItem(ADMIN_KEY, defaultHash);
    console.warn('⚠️ SECURITY: Random admin password generated. Please change it immediately.');
    console.warn('First login password:', randomPassword);
  }
};

// --- HELPER: Get Admin Password Hash ---
const getAdminPasswordHash = async (): Promise<string> => {
  await initializeAdminPassword();
  return localStorage.getItem(ADMIN_KEY) || '';
};

// --- HELPER: Session Code Generator ---
export const generateSessionCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomStr = (length: number) => 
    Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `${randomStr(3)}-${randomStr(3)}`;
};

// --- SESSION MANAGEMENT (Backend API) ---
const API_BASE = '/api';

export const getSessions = async (): Promise<Record<string, Session>> => {
  // This method is deprecated - use getUserSessions instead
  return {};
};

// Get sessions only for a specific user
export const getUserSessions = async (username: string): Promise<Session[]> => {
  try {
    const response = await fetch(`${API_BASE}/sessions/${username}`);
    if (!response.ok) throw new Error('Failed to fetch sessions');
    return await response.json();
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return [];
  }
};

export const getSession = async (id: string): Promise<Session | null> => {
  try {
    const response = await fetch(`${API_BASE}/session/${id}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch session');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
};

export const createSession = async (username: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    if (!response.ok) throw new Error('Failed to create session');
    const session = await response.json();
    window.dispatchEvent(new Event('storage'));
    return session.id;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

export const deleteSession = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/session/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete session');
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};

export const addWordToSession = async (sessionId: string, word: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/session/${sessionId}/word`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word }),
    });
    if (!response.ok) throw new Error('Failed to add word');
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('Error adding word:', error);
    throw error;
  }
};

export const updateSessionGroups = async (sessionId: string, groups: any[]): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/session/${sessionId}/groups`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groups }),
    });
    if (!response.ok) throw new Error('Failed to update groups');
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('Error updating groups:', error);
    throw error;
  }
};

// --- AUTHENTICATION SERVICES (User Database) ---

interface UserDB {
  [username: string]: string; // username: password
}

const getUsers = (): UserDB => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : {};
};

export const registerUser = async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
  // Registration is temporarily disabled
  return { success: false, message: 'Registration is temporarily closed. Coming Soon.' };
};

export const loginUser = async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
  const cleanUser = username.trim().toLowerCase();

  // Strict check: Only 'admin' is allowed
  if (cleanUser === 'admin') {
    try {
      const inputHash = await hashPassword(password);
      const expectedHash = await getAdminPasswordHash();

      if (inputHash === expectedHash) {
        return { success: true, message: 'Login successful.' };
      } else {
        return { success: false, message: 'Incorrect password.' };
      }
    } catch (error) {
      console.error("Hashing error", error);
      return { success: false, message: 'Security error during login.' };
    }
  }

  // All other users are blocked
  return { success: false, message: 'Only admin access is currently enabled.' };
};

export const changeUserPassword = async (username: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  const cleanUser = username.trim().toLowerCase();

  if (cleanUser === 'admin') {
    try {
      // Verify old password
      const oldHash = await hashPassword(oldPassword);
      const currentHash = await getAdminPasswordHash();

      if (oldHash !== currentHash) {
        return { success: false, message: 'Current password is incorrect.' };
      }

      // Validate new password
      if (!newPassword || newPassword.length < 6) {
        return { success: false, message: 'New password must be at least 6 characters long.' };
      }

      // Set new password
      const newHash = await hashPassword(newPassword);
      localStorage.setItem(ADMIN_KEY, newHash);
      
      return { success: true, message: 'Password changed successfully.' };
    } catch (error) {
      console.error("Error changing password", error);
      return { success: false, message: 'Error changing password.' };
    }
  }

  // All other users are blocked
  return { success: false, message: 'Only admin can change password.' };
};

// --- REACT HOOKS ---

import { useState, useEffect } from 'react';

export const useSession = (sessionId: string) => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      const current = await getSession(sessionId);
      if (isMounted) {
        setSession(current);
      }
    };

    fetchSession();

    const handleStorageChange = () => {
      fetchSession();
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 2000);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [sessionId]);

  return session;
};
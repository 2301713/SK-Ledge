import { create } from "zustand";

// TYPES
export interface UserAccount {
  name: string;
  role_type: string;
  barangay: string;
  full_name: string;
  username: string;
  id: string;
}

interface AuthState {
  currentUser: UserAccount | null;
  isLoading: boolean;

  // ACTIONS
  setCurrentUser: (user: UserAccount | null) => void;
  setIsLoading: (loading: boolean) => void;
  clearSession: () => void;
}

// STORE
export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLoading: true, // Starts true so we don't flash the login screen on refresh

  setCurrentUser: (user) => set({ currentUser: user }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  clearSession: () => set({ currentUser: null, isLoading: false }),
}));

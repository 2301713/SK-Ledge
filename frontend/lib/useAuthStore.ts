import { create } from "zustand";
import { devtools } from "zustand/middleware";

// TYPES
export interface UserAccount {
  role_type: string;
  barangay: string;
  full_name: string;
  username: string;
  email: string;
  approval_status: string;
  id: string;
}

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  role_type: string;
  barangay: string;
  approval_status: string;
}

interface AuthState {
  // Auth State
  currentUser: UserAccount | null;
  isLoading: boolean;

  // Account Edit State
  isEditing: boolean;
  isSaving: boolean;
  error: string;
  successMsg: string;
  userProfile: UserProfile | null;

  // Modal State
  isModalOpen: boolean;

  // ACTIONS - Auth
  setCurrentUser: (user: UserAccount | null) => void;
  setIsLoading: (loading: boolean) => void;
  clearSession: () => void;

  // ACTIONS - Account Edit
  setIsEditing: (editing: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setError: (error: string) => void;
  setSuccessMsg: (msg: string) => void;
  setUserProfile: (profile: UserProfile | null) => void;

  // ACTIONS - Modal
  setIsModalOpen: (open: boolean) => void;
  toggleModalOpen: () => void;

  // ACTIONS - Combined
  resetAccountState: () => void;
  updateUserProfile: (profile: UserProfile) => void;
}

// STORE
export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      // Initial state
      currentUser: null,
      isLoading: true,
      isEditing: false,
      isSaving: false,
      error: "",
      successMsg: "",
      userProfile: null,
      isModalOpen: false,

      // Auth actions
      setCurrentUser: (user) => set({ currentUser: user }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      clearSession: () =>
        set({
          currentUser: null,
          isLoading: false,
          userProfile: null,
          isModalOpen: false,
          error: "",
          successMsg: "",
          isEditing: false,
          isSaving: false,
        }),

      // Account edit actions
      setIsEditing: (editing) => set({ isEditing: editing }),
      setIsSaving: (saving) => set({ isSaving: saving }),
      setError: (error) => set({ error }),
      setSuccessMsg: (msg) => set({ successMsg: msg }),
      setUserProfile: (profile) => set({ userProfile: profile }),

      // Modal actions
      setIsModalOpen: (open) => set({ isModalOpen: open }),
      toggleModalOpen: () =>
        set((state) => ({ isModalOpen: !state.isModalOpen })),

      // Combined actions
      resetAccountState: () =>
        set({
          isEditing: false,
          isSaving: false,
          error: "",
          successMsg: "",
        }),
      updateUserProfile: (profile) =>
        set((state) => ({
          userProfile: profile,
          currentUser: state.currentUser
            ? { ...state.currentUser, full_name: profile.full_name }
            : null,
        })),
    }),
    {
      name: "auth-store",
      enabled:
        typeof window !== "undefined" && process.env.NODE_ENV === "development",
    },
  ),
);

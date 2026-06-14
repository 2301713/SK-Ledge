import { create } from "zustand";
import { devtools } from "zustand/middleware";

// TYPES
export type Priority = "standard" | "urgent" | "event";
export type Audience = "all" | "chairpersons" | "treasurers" | "barangays";

export interface LoginForm {
  credentials: {
    email: string;
    password: string;
  };
  showPassword: boolean;
  error: string;
  isLoading: boolean;
}

export interface RegisterForm {
  formData: {
    full_name: string;
    barangay: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    role_type: string;
  };
  showPassword: boolean;
  error: string;
  isLoading: boolean;
}

export interface ProposeProjectForm {
  name: string;
  category: string;
  budget: string;
  description: string;
  isSubmitting: boolean;
  errors: { [key: string]: string };
}

export interface BroadcastMemoForm {
  title: string;
  content: string;
  priority: Priority;
  audience: Audience;
  requireAck: boolean;
}

interface FormState {
  // Login Form
  login: LoginForm;
  setLoginCredentials: (credentials: LoginForm["credentials"]) => void;
  setLoginShowPassword: (show: boolean) => void;
  setLoginError: (error: string) => void;
  setLoginIsLoading: (loading: boolean) => void;
  resetLoginForm: () => void;

  // Register Form
  register: RegisterForm;
  setRegisterFormData: (data: RegisterForm["formData"]) => void;
  setRegisterShowPassword: (show: boolean) => void;
  setRegisterError: (error: string) => void;
  setRegisterIsLoading: (loading: boolean) => void;
  resetRegisterForm: () => void;

  // Propose Project Modal
  proposeProject: ProposeProjectForm;
  setProposeProjectName: (name: string) => void;
  setProposeProjectCategory: (category: string) => void;
  setProposeProjectBudget: (budget: string) => void;
  setProposeProjectDescription: (description: string) => void;
  setProposeProjectIsSubmitting: (submitting: boolean) => void;
  setProposeProjectErrors: (errors: { [key: string]: string }) => void;
  resetProposeProjectForm: () => void;

  // Broadcast Memo Modal
  broadcastMemo: BroadcastMemoForm;
  setBroadcastMemoTitle: (title: string) => void;
  setBroadcastMemoContent: (content: string) => void;
  setBroadcastMemoPriority: (priority: Priority) => void;
  setBroadcastMemoAudience: (audience: Audience) => void;
  setBroadcastMemoRequireAck: (require: boolean) => void;
  setBroadcastMemoForm: (form: Partial<BroadcastMemoForm>) => void;
  resetBroadcastMemoForm: () => void;
}

// INITIAL STATE
const initialLoginForm: LoginForm = {
  credentials: { email: "", password: "" },
  showPassword: false,
  error: "",
  isLoading: false,
};

const initialRegisterForm: RegisterForm = {
  formData: {
    full_name: "",
    barangay: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role_type: "SK_Chairperson",
  },
  showPassword: false,
  error: "",
  isLoading: false,
};

const initialProposeProjectForm: ProposeProjectForm = {
  name: "",
  category: "",
  budget: "",
  description: "",
  isSubmitting: false,
  errors: {},
};

const initialBroadcastMemoForm: BroadcastMemoForm = {
  title: "",
  content: "",
  priority: "standard",
  audience: "all",
  requireAck: false,
};

// STORE
export const useFormStore = create<FormState>()(
  devtools(
    (set) => ({
      // LOGIN FORM
      login: initialLoginForm,
      setLoginCredentials: (credentials) =>
        set((state) => ({
          login: { ...state.login, credentials },
        })),
      setLoginShowPassword: (show) =>
        set((state) => ({
          login: { ...state.login, showPassword: show },
        })),
      setLoginError: (error) =>
        set((state) => ({
          login: { ...state.login, error },
        })),
      setLoginIsLoading: (loading) =>
        set((state) => ({
          login: { ...state.login, isLoading: loading },
        })),
      resetLoginForm: () => set({ login: initialLoginForm }),

      // REGISTER FORM
      register: initialRegisterForm,
      setRegisterFormData: (formData) =>
        set((state) => ({
          register: { ...state.register, formData },
        })),
      setRegisterShowPassword: (show) =>
        set((state) => ({
          register: { ...state.register, showPassword: show },
        })),
      setRegisterError: (error) =>
        set((state) => ({
          register: { ...state.register, error },
        })),
      setRegisterIsLoading: (loading) =>
        set((state) => ({
          register: { ...state.register, isLoading: loading },
        })),
      resetRegisterForm: () => set({ register: initialRegisterForm }),

      // PROPOSE PROJECT MODAL
      proposeProject: initialProposeProjectForm,
      setProposeProjectName: (name) =>
        set((state) => ({
          proposeProject: { ...state.proposeProject, name },
        })),
      setProposeProjectCategory: (category) =>
        set((state) => ({
          proposeProject: { ...state.proposeProject, category },
        })),
      setProposeProjectBudget: (budget) =>
        set((state) => ({
          proposeProject: { ...state.proposeProject, budget },
        })),
      setProposeProjectDescription: (description) =>
        set((state) => ({
          proposeProject: { ...state.proposeProject, description },
        })),
      setProposeProjectIsSubmitting: (submitting) =>
        set((state) => ({
          proposeProject: { ...state.proposeProject, isSubmitting: submitting },
        })),
      setProposeProjectErrors: (errors) =>
        set((state) => ({
          proposeProject: { ...state.proposeProject, errors },
        })),
      resetProposeProjectForm: () =>
        set({ proposeProject: initialProposeProjectForm }),

      // BROADCAST MEMO MODAL
      broadcastMemo: initialBroadcastMemoForm,
      setBroadcastMemoTitle: (title) =>
        set((state) => ({
          broadcastMemo: { ...state.broadcastMemo, title },
        })),
      setBroadcastMemoContent: (content) =>
        set((state) => ({
          broadcastMemo: { ...state.broadcastMemo, content },
        })),
      setBroadcastMemoPriority: (priority) =>
        set((state) => ({
          broadcastMemo: { ...state.broadcastMemo, priority },
        })),
      setBroadcastMemoAudience: (audience) =>
        set((state) => ({
          broadcastMemo: { ...state.broadcastMemo, audience },
        })),
      setBroadcastMemoRequireAck: (require) =>
        set((state) => ({
          broadcastMemo: { ...state.broadcastMemo, requireAck: require },
        })),
      setBroadcastMemoForm: (form) =>
        set((state) => ({
          broadcastMemo: { ...state.broadcastMemo, ...form },
        })),
      resetBroadcastMemoForm: () =>
        set({ broadcastMemo: initialBroadcastMemoForm }),
    }),
    {
      name: "form-store",
      enabled:
        typeof window !== "undefined" && process.env.NODE_ENV === "development",
    },
  ),
);

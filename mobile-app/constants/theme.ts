export const Colors = {
  primary: "#0138A8",
  primaryForeground: "#1E293B",
  secondary: "#F3F4F3",
  secondaryForeground: "#64748B",
  tertiary: "#FBD219",
  quaternary: "#CE1226",
  success: "#10B981",
  pending: "#F59E0B",
  danger: "#DC2626",
  information: "#3B82F6",
  ongoing: "#2563EB",
  border: "#E2E8F0",
  background: "#F1F5F9",
  white: "#FFFFFF",
};

export const Shadows = {
  light: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  brand: {
    shadowColor: "#0138A8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 12,
  },
} as const;

export const Typography = {
  eyebrow: {
    fontSize: 10,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.2,
  },
  heading: {
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
} as const;

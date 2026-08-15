/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#0138A8",
        "primary-foreground": "#1E293B",
        secondary: "#F3F4F3",
        "secondary-foreground": "#64748B",
        tertiary: "#FBD219",
        quaternary: "#CE1226",
        success: "#10B981",
        pending: "#F59E0B",
        danger: "#DC2626",
        information: "#3B82F6",
        ongoing: "#2563EB",
        border: "#E2E8F0",
        background: "#F1F5F9",
      },
      fontFamily: {
        inter: ["Inter_400Regular"],
        "inter-medium": ["Inter_500Medium"],
        "inter-semibold": ["Inter_600SemiBold"],
        "inter-bold": ["Inter_700Bold"],
        "inter-extrabold": ["Inter_800ExtraBold"],
        "inter-black": ["Inter_900Black"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};

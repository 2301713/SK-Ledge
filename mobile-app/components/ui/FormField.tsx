import { Eye, EyeOff, type LucideIcon } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type KeyboardTypeOptions,
} from "react-native";

export default function FormField({
  label,
  icon: Icon,
  value,
  onChangeText,
  placeholder,
  error,
  secure = false,
  showSecure = false,
  onToggleSecure,
  keyboardType,
  autoCapitalize = "sentences",
  autoCorrect = true,
  editable = true,
}: {
  label: string;
  icon: LucideIcon;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  secure?: boolean;
  showSecure?: boolean;
  onToggleSecure?: () => void;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  editable?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  return (
    <View>
      <Text className="font-inter-bold mb-2 ml-0.5 text-[10px] uppercase tracking-[0.16em] text-secondary-foreground">
        {label}
      </Text>
      <View
        className={`h-[52px] flex-row items-center rounded-xl border px-4 ${
          error
            ? "border-danger bg-white"
            : focused
              ? "border-primary bg-white"
              : "border-border bg-white"
        }`}
        // The focus glow uses shadow props, which on Android force a software
        // layer on the container. Re-applying it on focus makes Android drop
        // the TextInput's focus (taps then land on a neighbouring field), so
        // the glow stays iOS-only; Android relies on the primary border.
        style={
          Platform.OS === "ios" && focused && !error
            ? {
                shadowColor: "#0138A8",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
              }
            : undefined
        }
      >
        <Icon
          size={17}
          color={error ? "#DC2626" : focused ? "#0138A8" : "#94A3B8"}
        />
        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          className="font-inter-medium ml-3 flex-1 text-[15px] text-primary-foreground"
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secure && !showSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
        />
        {secure && onToggleSecure ? (
          <TouchableOpacity
            onPress={() => {
              onToggleSecure();
              // Toggling secureTextEntry re-commits the input; keep typing.
              inputRef.current?.focus();
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={
              showSecure ? "Hide password" : "Show password"
            }
            accessibilityState={{ selected: showSecure }}
          >
            {showSecure ? (
              <EyeOff size={17} color="#64748B" />
            ) : (
              <Eye size={17} color="#64748B" />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          className="font-inter-medium mt-1.5 ml-0.5 text-[11px] text-danger"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

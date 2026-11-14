import { Eye, EyeOff, type LucideIcon } from "lucide-react-native";
import React, { useState } from "react";
import {
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
        style={
          focused && !error
            ? {
                shadowColor: "#0138A8",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 1,
              }
            : undefined
        }
      >
        <Icon size={17} color={error ? "#DC2626" : focused ? "#0138A8" : "#94A3B8"} />
        <TextInput
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
          <TouchableOpacity onPress={onToggleSecure} hitSlop={10}>
            {showSecure ? (
              <EyeOff size={17} color="#64748B" />
            ) : (
              <Eye size={17} color="#64748B" />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <Text className="font-inter-medium mt-1.5 ml-0.5 text-[11px] text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

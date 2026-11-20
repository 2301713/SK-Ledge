import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { getErrorMessage } from "@/lib/errors";
import { KeyRound, Lock } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export const PASSWORD_MIN_LENGTH = 8;

type PasswordErrors = {
  password?: string;
  confirm?: string;
};

type Props = {
  /** Resolves once Supabase accepted the new password. */
  onChangePassword: (password: string) => Promise<void>;
  /** Called after a successful change so the screen can show its banner. */
  onSaved: () => void;
  /** Called with a user-facing message when the change fails. */
  onError: (message: string) => void;
  /** Called when the form is opened, e.g. to clear stale banners. */
  onOpen?: () => void;
};

export default function PasswordSecurityCard({
  onChangePassword,
  onSaved,
  onError,
  onOpen,
}: Props) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<PasswordErrors>({});

  const reset = () => {
    setPassword("");
    setConfirm("");
    setShowPassword(false);
    setErrors({});
  };

  const handleSave = async () => {
    const next: PasswordErrors = {};
    if (password.length < PASSWORD_MIN_LENGTH) {
      next.password = `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
    }
    if (password !== confirm) {
      next.confirm = "Passwords do not match.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await onChangePassword(password);
      setOpen(false);
      reset();
      onSaved();
    } catch (err) {
      onError(getErrorMessage(err, "Could not update your password."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="mt-4 rounded-2xl border border-border bg-white p-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="font-inter-bold text-[9px] uppercase tracking-[0.16em] text-primary">
            Password
          </Text>
          <Text className="font-inter-bold mt-1 text-[15px] tracking-tight text-primary-foreground">
            Sign-in security
          </Text>
        </View>
        <View className="h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-secondary">
          <KeyRound size={16} color="#0138A8" />
        </View>
      </View>

      {open ? (
        <View className="mt-4 gap-4">
          <FormField
            label="New password"
            icon={Lock}
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="At least 8 characters"
            secure
            showSecure={showPassword}
            onToggleSecure={() => setShowPassword((current) => !current)}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!saving}
            error={errors.password}
          />
          <FormField
            label="Confirm new password"
            icon={Lock}
            value={confirm}
            onChangeText={(value) => {
              setConfirm(value);
              setErrors((prev) => ({ ...prev, confirm: undefined }));
            }}
            placeholder="Repeat your new password"
            secure
            showSecure={showPassword}
            onToggleSecure={() => setShowPassword((current) => !current)}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!saving}
            error={errors.confirm}
          />

          <PrimaryButton onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : "Save password"}
          </PrimaryButton>

          <TouchableOpacity
            className="items-center py-1"
            onPress={() => {
              setOpen(false);
              reset();
            }}
            disabled={saving}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Cancel password change"
          >
            <Text className="font-inter-bold text-[10px] uppercase tracking-[0.14em] text-secondary-foreground">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text className="font-inter mt-2 text-[11px] leading-[17px] text-secondary-foreground">
            Change the password you use to sign in with email. Google sign-in is
            not affected.
          </Text>
          <TouchableOpacity
            className="mt-3 flex-row items-center justify-center gap-2 rounded-lg border border-primary/20 bg-secondary/40 py-2.5"
            onPress={() => {
              setErrors({});
              onOpen?.();
              setOpen(true);
            }}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Change password"
          >
            <Lock size={13} color="#0138A8" />
            <Text className="font-inter-bold text-[10px] uppercase tracking-[0.14em] text-primary">
              Change password
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

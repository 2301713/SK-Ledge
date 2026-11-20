import { CircleAlert, RotateCcw } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

/**
 * Catches render errors in any screen so a crash shows a recovery card instead
 * of a blank white app shell. Network and validation errors are handled by the
 * screens themselves; this is only for unexpected render failures.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.error("[app] render error:", error.message, info.componentStack);
    }
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <View className="w-full max-w-md rounded-3xl border border-border bg-white p-7">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl border border-danger/25 bg-danger/[0.06]">
            <CircleAlert size={26} color="#DC2626" />
          </View>

          <Text
            accessibilityRole="header"
            className="font-inter-black text-[24px] leading-[30px] tracking-tight text-primary-foreground"
          >
            Something went wrong
          </Text>
          <Text className="font-inter mt-2 text-[13px] leading-6 text-secondary-foreground">
            This screen stopped unexpectedly. Your saved data is safe — try
            again, and if it keeps happening, close and reopen the app.
          </Text>

          {typeof __DEV__ !== "undefined" && __DEV__ ? (
            <Text className="font-inter mt-3 text-[11px] leading-5 text-secondary-foreground/70">
              {error.message}
            </Text>
          ) : null}

          <TouchableOpacity
            className="mt-6 h-12 flex-row items-center justify-center gap-2 rounded-xl bg-primary px-5"
            activeOpacity={0.85}
            onPress={this.reset}
            accessibilityRole="button"
            accessibilityLabel="Try loading the screen again"
          >
            <RotateCcw size={15} color="#FFFFFF" />
            <Text className="font-inter-bold text-[11px] uppercase tracking-[0.14em] text-white">
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

import { fireEvent, render, screen } from "@testing-library/react";
import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import FormField from "./FormField";

vi.mock("lucide-react-native", () => {
  const Stub = () => null;
  return { Eye: Stub, EyeOff: Stub, Lock: Stub, Mail: Stub };
});

const NoopIcon = (() => null) as unknown as LucideIcon;

describe("FormField", () => {
  it("labels the input and reports edits", () => {
    const onChangeText = vi.fn();

    render(
      <FormField
        label="Email"
        icon={NoopIcon}
        value=""
        onChangeText={onChangeText}
        placeholder="vendor@example.com"
      />,
    );

    const input = screen.getByLabelText("Email");
    fireEvent.change(input, { target: { value: "vendor@example.com" } });

    expect(onChangeText).toHaveBeenCalledWith("vendor@example.com");
  });

  it("shows the validation message", () => {
    render(
      <FormField
        label="Password"
        icon={NoopIcon}
        value=""
        onChangeText={() => {}}
        error="Use at least 8 characters."
      />,
    );

    expect(screen.getByText("Use at least 8 characters.")).toBeTruthy();
  });

  it("toggles password visibility through the eye button", () => {
    const onToggleSecure = vi.fn();

    render(
      <FormField
        label="Password"
        icon={NoopIcon}
        value="secret"
        onChangeText={() => {}}
        secure
        showSecure={false}
        onToggleSecure={onToggleSecure}
      />,
    );

    fireEvent.click(screen.getByLabelText("Show password"));

    expect(onToggleSecure).toHaveBeenCalledTimes(1);
  });
});

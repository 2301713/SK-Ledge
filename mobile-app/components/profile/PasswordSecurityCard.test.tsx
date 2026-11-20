import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import PasswordSecurityCard from "./PasswordSecurityCard";

vi.mock("lucide-react-native", () => {
  const Stub = () => null;
  return { Eye: Stub, EyeOff: Stub, KeyRound: Stub, Lock: Stub };
});

const renderCard = (overrides: Partial<Parameters<typeof PasswordSecurityCard>[0]> = {}) => {
  const onChangePassword = vi.fn().mockResolvedValue(undefined);
  const onSaved = vi.fn();
  const onError = vi.fn();
  const onOpen = vi.fn();

  render(
    <PasswordSecurityCard
      onChangePassword={onChangePassword}
      onSaved={onSaved}
      onError={onError}
      onOpen={onOpen}
      {...overrides}
    />,
  );

  return { onChangePassword, onSaved, onError, onOpen };
};

const openForm = () => {
  fireEvent.click(screen.getByRole("button", { name: "Change password" }));
};

const typePassword = (value: string) => {
  fireEvent.change(screen.getByLabelText("New password"), {
    target: { value },
  });
};

const typeConfirm = (value: string) => {
  fireEvent.change(screen.getByLabelText("Confirm new password"), {
    target: { value },
  });
};

const submit = () => {
  fireEvent.click(screen.getByRole("button", { name: "Save password" }));
};

describe("PasswordSecurityCard", () => {
  it("starts collapsed and reveals the form when opened", () => {
    const { onOpen } = renderCard();

    expect(screen.getByText(/Google sign-in is not affected/)).toBeTruthy();
    expect(screen.queryByLabelText("New password")).toBeNull();

    openForm();

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("New password")).toBeTruthy();
    expect(screen.getByLabelText("Confirm new password")).toBeTruthy();
    expect(screen.queryByText(/Google sign-in is not affected/)).toBeNull();
  });

  it("rejects passwords shorter than 8 characters without calling the API", async () => {
    const { onChangePassword, onSaved } = renderCard();

    openForm();
    typePassword("short");
    typeConfirm("short");
    submit();

    expect(screen.getByText("Use at least 8 characters.")).toBeTruthy();
    expect(onChangePassword).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("rejects mismatched confirmation", () => {
    const { onChangePassword } = renderCard();

    openForm();
    typePassword("NewPass123!");
    typeConfirm("NewPass123?");
    submit();

    expect(screen.getByText("Passwords do not match.")).toBeTruthy();
    expect(onChangePassword).not.toHaveBeenCalled();
  });

  it("clears the mismatch error as soon as the field is edited", () => {
    renderCard();

    openForm();
    typePassword("NewPass123!");
    typeConfirm("NewPass123?");
    submit();

    expect(screen.getByText("Passwords do not match.")).toBeTruthy();

    typeConfirm("NewPass123!");

    expect(screen.queryByText("Passwords do not match.")).toBeNull();
  });

  it("submits a valid password, closes the form and reports success", async () => {
    const { onChangePassword, onSaved, onError } = renderCard();

    openForm();
    typePassword("NewPass123!");
    typeConfirm("NewPass123!");
    submit();

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(onChangePassword).toHaveBeenCalledWith("NewPass123!");
    expect(onError).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("New password")).toBeNull();
    expect(screen.getByRole("button", { name: "Change password" })).toBeTruthy();
  });

  it("keeps the form open and surfaces a server error", async () => {
    const onChangePassword = vi
      .fn()
      .mockRejectedValue(new Error("Password is too weak."));
    const { onSaved, onError } = renderCard({ onChangePassword });

    openForm();
    typePassword("NewPass123!");
    typeConfirm("NewPass123!");
    submit();

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith("Password is too weak."),
    );
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByLabelText("New password")).toBeTruthy();
  });

  it("falls back to a friendly message for non-Error failures", async () => {
    const onChangePassword = vi.fn().mockRejectedValue({});
    const { onError } = renderCard({ onChangePassword });

    openForm();
    typePassword("NewPass123!");
    typeConfirm("NewPass123!");
    submit();

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith("Could not update your password."),
    );
  });

  it("disables the submit button while the request is in flight", async () => {
    let resolveRequest: () => void = () => {};
    const onChangePassword = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const { onSaved } = renderCard({ onChangePassword });

    openForm();
    typePassword("NewPass123!");
    typeConfirm("NewPass123!");
    submit();

    // While saving, the button shows a spinner, so its label falls back to the
    // generic one from PrimaryButton.
    const savingButton = await screen.findByRole("button", {
      name: "Primary action",
    });
    expect(savingButton.getAttribute("aria-disabled")).toBe("true");

    fireEvent.click(savingButton);
    expect(onChangePassword).toHaveBeenCalledTimes(1);

    resolveRequest();
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  });

  it("cancels without calling the API and forgets what was typed", () => {
    const { onChangePassword } = renderCard();

    openForm();
    typePassword("NewPass123!");
    fireEvent.click(
      screen.getByRole("button", { name: "Cancel password change" }),
    );

    expect(onChangePassword).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("New password")).toBeNull();

    openForm();
    expect(
      (screen.getByLabelText("New password") as HTMLInputElement).value,
    ).toBe("");
  });

  it("toggles password visibility for both fields", () => {
    renderCard();

    openForm();
    typePassword("NewPass123!");

    const input = screen.getByLabelText("New password") as HTMLInputElement;
    expect(input.type).toBe("password");

    // Both fields share one visibility toggle state, and each has its own eye
    // button, so the first one is enough to flip both inputs.
    fireEvent.click(screen.getAllByLabelText("Show password")[0]);
    expect((screen.getByLabelText("New password") as HTMLInputElement).type).toBe(
      "text",
    );
    expect(
      (screen.getByLabelText("Confirm new password") as HTMLInputElement).type,
    ).toBe("text");

    fireEvent.click(screen.getAllByLabelText("Hide password")[0]);
    expect((screen.getByLabelText("New password") as HTMLInputElement).type).toBe(
      "password",
    );
  });
});

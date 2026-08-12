import { authClient } from "@/lib/auth-client";
import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignUpCredentialsForm } from "../app/auth/signup/sign-up-credentials-form";
import { setup } from "../test/setup";

describe("SignUpCredentialsForm", () => {
  beforeEach(() => {
    // Mock window.location
    Object.defineProperty(window, "location", {
      value: {
        origin: "http://localhost:3000",
        href: "http://localhost:3000/auth/signup",
      },
      writable: true,
    });

    // Mock successful signup response
    vi.mocked(authClient.signUp.email).mockResolvedValue({
      data: { success: true },
      error: null,
    });

    // Reset searchParams to default (empty)
    vi.mocked(useSearchParams).mockReturnValue(createTestSearchParams());
  });

  it("should render all form fields", async () => {
    setup(<SignUpCredentialsForm />);

    // Check all fields are rendered
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^mot de passe$/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/confirmer le mot de passe/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /créer mon compte/i }),
    ).toBeInTheDocument();
  });

  it("should show error when passwords don't match", async () => {
    const { user } = setup(<SignUpCredentialsForm />);

    // Fill the form with mismatched passwords
    await user.type(screen.getByLabelText(/nom/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/^mot de passe$/i), "password123");
    await user.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      "password456",
    );

    // Submit the form
    await user.click(screen.getByRole("button", { name: /créer mon compte/i }));

    // Should show error message via toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Les mots de passe ne correspondent pas",
      );
    });

    // Should not call signup API
    expect(authClient.signUp.email).not.toHaveBeenCalled();
  });

  it("should submit form and redirect on successful signup", async () => {
    const { user } = setup(<SignUpCredentialsForm />);

    // Fill all fields correctly
    await user.type(screen.getByLabelText(/nom/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/^mot de passe$/i), "password123");
    await user.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      "password123",
    );

    // Submit the form
    await user.click(screen.getByRole("button", { name: /créer mon compte/i }));

    // Verify API was called with correct data
    await waitFor(() => {
      expect(authClient.signUp.email).toHaveBeenCalledWith({
        email: "john@example.com",
        password: "password123",
        name: "John Doe",
        image: "",
      });
    });

    // Check if redirect happened
    expect(window.location.href).toBe("http://localhost:3000/job");
  });

  it("should use custom callback URL from searchParams", async () => {
    // Mock window.location.search with custom callback
    Object.defineProperty(window, "location", {
      value: {
        origin: "http://localhost:3000",
        href: "http://localhost:3000/auth/signup?callbackUrl=/dashboard",
        search: "?callbackUrl=/dashboard",
      },
      writable: true,
    });

    const { user } = setup(<SignUpCredentialsForm />);

    // Fill all fields correctly
    await user.type(screen.getByLabelText(/nom/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/^mot de passe$/i), "password123");
    await user.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      "password123",
    );

    // Submit the form
    await user.click(screen.getByRole("button", { name: /créer mon compte/i }));

    // Wait for submission to complete
    await waitFor(() => {
      expect(authClient.signUp.email).toHaveBeenCalled();
    });

    // Check if redirected to custom URL
    expect(window.location.href).toBe("http://localhost:3000/dashboard");
  });

  it("should ignore unsafe callback URL from searchParams", async () => {
    Object.defineProperty(window, "location", {
      value: {
        origin: "http://localhost:3000",
        href: "http://localhost:3000/auth/signup?callbackUrl=https://evil.com",
        search: "?callbackUrl=https://evil.com",
      },
      writable: true,
    });

    const { user } = setup(<SignUpCredentialsForm />);

    await user.type(screen.getByLabelText(/nom/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/^mot de passe$/i), "password123");
    await user.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      "password123",
    );

    await user.click(screen.getByRole("button", { name: /créer mon compte/i }));

    await waitFor(() => {
      expect(authClient.signUp.email).toHaveBeenCalled();
    });

    expect(window.location.href).toBe("http://localhost:3000/job");
  });
});

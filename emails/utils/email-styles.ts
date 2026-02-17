import type { CSSProperties } from "react";

export const emailStyles = {
  primaryButton: {
    backgroundColor: "#0891b2",
    color: "#ffffff",
    padding: "14px 28px",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    textDecoration: "none",
    display: "inline-block",
  } satisfies CSSProperties,

  dangerButton: {
    backgroundColor: "#EF4444",
    color: "#ffffff",
    padding: "14px 28px",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    textDecoration: "none",
    display: "inline-block",
  } satisfies CSSProperties,

  heading: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#0f172a",
    lineHeight: "32px",
  } satisfies CSSProperties,

  bodyText: {
    fontSize: "16px",
    color: "#334155",
    lineHeight: "26px",
  } satisfies CSSProperties,

  mutedText: {
    fontSize: "14px",
    color: "#64748B",
  } satisfies CSSProperties,

  card: {
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #e2e8f0",
  } satisfies CSSProperties,
};

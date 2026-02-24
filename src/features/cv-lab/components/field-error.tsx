"use client";

export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="text-destructive mt-0.5 text-xs">{message}</p>;
}

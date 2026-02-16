import type { CvCoachSnapshot } from "./cv-coach.schema";

/**
 * Get a value from a nested object using a dot-separated path.
 * @param obj - The object to traverse
 * @param path - Dot-separated path (e.g., "experiences.0.title", "identity.fullName")
 * @returns The value at the path, or undefined if not found
 */
function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current == null) return undefined;

    if (typeof current === "object") {
      const index = Number(part);
      if (!Number.isNaN(index)) {
        // Array index
        if (Array.isArray(current)) {
          current = current[index];
        } else {
          return undefined;
        }
      } else {
        // Object key
        current = (current as Record<string, unknown>)[part];
      }
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Set a value in a nested object using a dot-separated path.
 * @param obj - The object to modify (mutated)
 * @param path - Dot-separated path (e.g., "experiences.0.title", "identity.fullName")
 * @param value - The value to set
 * @returns true if successful, false if path is invalid
 */
function setNestedValue(obj: unknown, path: string, value: unknown): boolean {
  if (obj == null || typeof obj !== "object") return false;

  const parts = path.split(".");
  if (parts.length === 0) return false;

  let current: unknown = obj;

  // Navigate to the parent of the target
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];

    if (current == null || typeof current !== "object") return false;

    const index = Number(part);
    if (!Number.isNaN(index)) {
      // Array index
      if (Array.isArray(current)) {
        if (index < 0 || index >= current.length) return false;
        current = current[index];
      } else {
        return false;
      }
    } else {
      // Object key
      const obj = current as Record<string, unknown>;
      if (!(part in obj)) return false;
      current = obj[part];
    }
  }

  // Set the final value
  const lastPart = parts[parts.length - 1];
  if (current == null || typeof current !== "object") return false;

  const index = Number(lastPart);
  if (!Number.isNaN(index)) {
    // Array index
    if (Array.isArray(current)) {
      if (index < 0 || index >= current.length) return false;
      current[index] = value;
      return true;
    }
    return false;
  } else {
    // Object key
    (current as Record<string, unknown>)[lastPart] = value;
    return true;
  }
}

/**
 * Preserve locked field values when a new snapshot comes from AI extraction.
 * This function deep clones the new snapshot and restores values from the current
 * snapshot for all paths in the lockedPaths array.
 *
 * @param currentSnapshot - The current snapshot with locked values
 * @param newSnapshot - The new snapshot from AI extraction
 * @param lockedPaths - Array of dot-separated paths to preserve (e.g., ["identity.fullName", "experiences.0.title"])
 * @returns A new snapshot with locked field values preserved from currentSnapshot
 */
export function preserveLockedFields(
  currentSnapshot: CvCoachSnapshot,
  newSnapshot: CvCoachSnapshot,
  lockedPaths: string[],
): CvCoachSnapshot {
  // Deep clone the new snapshot
  const merged = structuredClone(newSnapshot);

  // Restore each locked field from the current snapshot
  for (const path of lockedPaths) {
    const value = getNestedValue(currentSnapshot, path);
    if (value !== undefined) {
      setNestedValue(merged, path, value);
    }
  }

  return merged;
}

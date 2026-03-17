import { CapsuleStatus } from "./types";

/**
 * Fix #8 — Single source of truth untuk logic lock/unlock status capsule.
 * Digunakan di dashboard, capsule detail, dan service layer.
 */
export function getCapsuleLockStatus(openDate: string): CapsuleStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const unlockDate = new Date(openDate);
  unlockDate.setHours(0, 0, 0, 0);
  return today < unlockDate ? "locked" : "unlocked";
}

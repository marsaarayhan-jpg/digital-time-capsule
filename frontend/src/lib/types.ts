/**
 * Shared TypeScript types for the Time Capsule application.
 */

export interface Capsule {
  id: string;
  title: string;
  message: string;
  sender_id: string;
  receiver_id: string | null;
  receiver_email: string;
  open_date: string;
  notified: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  capsule_id: string;
  user_id: string;
  comment: string;
  created_at: string;
}

export type CapsuleStatus = "locked" | "unlocked";
export type CapsuleType = "sent" | "received";

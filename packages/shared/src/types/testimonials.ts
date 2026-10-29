import type { TestimonialStatus } from '../constants/index.js';

/** A published testimonial, as the landing page shows it (no account details). */
export interface PublicTestimonial {
  id: string;
  /** "Name Surname". */
  authorName: string;
  text: string;
  /** 1 to 5 stars. */
  rating: number;
  createdAt: string;
  /** The author has a profile picture: it is served at `GET /testimonials/:id/avatar`. */
  hasAvatar: boolean;
}

/** One testimonial in the moderation list. */
export interface AdminTestimonial {
  id: string;
  status: TestimonialStatus;
  name: string;
  surname: string;
  /** How to reach the author. Only admins see it; the site never shows it. */
  email: string;
  /** `+380 98 938 55 85`, or `null` when the author left none. */
  phone: string | null;
  text: string;
  rating: number;
  /** The signed-in author; `null` for a guest or when the account is gone. */
  author: { id: string; email: string } | null;
  /** The profile picture of the author (opened at `/files/:id`); `null` for guests. */
  avatarFileId: string | null;
  createdAt: string;
  /** Set once an admin changed the text or the name. */
  editedAt: string | null;
  moderatedAt: string | null;
  moderatedBy: { id: string; name: string } | null;
}

export interface TestimonialCounts {
  pending: number;
  approved: number;
  rejected: number;
}

/** What the signed-in author sees of their own testimonials. */
export interface MyTestimonial {
  id: string;
  text: string;
  rating: number;
  status: TestimonialStatus;
  createdAt: string;
}

export interface SubmitTestimonialResult {
  id: string;
  status: TestimonialStatus;
}

export type PlatformTag = "web" | "mobile";

export interface RandomIdea {
  title: string;
  targetUser: string;
  description: string;
  platformTag: PlatformTag;
}

export interface Favorite extends RandomIdea {
  id: string;
  createdAt: string;
}

export interface MobileUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

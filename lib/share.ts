import { Share } from "react-native";
import type { RandomIdea } from "@/lib/types";

/** The system share sheet with the idea's title, who it's for and what it is. */
export function shareIdea(idea: RandomIdea) {
  Share.share({ message: `${idea.title}\n${idea.targetUser}\n\n${idea.description}` }).catch(() => {});
}

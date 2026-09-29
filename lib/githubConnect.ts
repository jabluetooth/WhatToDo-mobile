import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { githubConnectUrl } from "@/lib/api";

const MESSAGES: Record<string, string> = {
  repo_scope_missing: "GitHub didn't grant repo access, which pushing needs. Try again and keep “repo” ticked.",
  access_denied: "GitHub connection was cancelled.",
};

/**
 * The one-time "Connect GitHub" grant pushing needs (sign-in itself is read-only): the backend
 * hands back GitHub's authorize page, bound to this user, and returns here when done.
 * Resolves true when connected, false if the user backed out; throws with a readable message.
 */
export async function connectGithub(token: string): Promise<boolean> {
  const redirectUri = Linking.createURL("github-connected");
  const url = await githubConnectUrl(token, redirectUri);
  const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
  if (result.type !== "success" || !result.url) return false;

  const { queryParams } = Linking.parse(result.url);
  if (queryParams?.connected === "1") return true;
  const code = typeof queryParams?.error === "string" ? queryParams.error : "";
  throw new Error(MESSAGES[code] ?? "Couldn't connect GitHub. Please try again.");
}

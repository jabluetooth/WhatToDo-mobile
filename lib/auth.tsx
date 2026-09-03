import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchMe, githubStartUrl } from "@/lib/api";
import type { MobileUser } from "@/lib/types";

const TOKEN_KEY = "whattodo_mobile_token";

WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  token: string | null;
  user: MobileUser | null;
  loading: boolean;
  signingIn: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<MobileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (t: string) => {
    try {
      const me = await fetchMe(t);
      setUser(me);
    } catch {
      // Stored token is no longer valid (expired/revoked) — drop it and fall back to signed-out.
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (stored) {
        setToken(stored);
        await loadProfile(stored);
      }
      setLoading(false);
    })();
  }, [loadProfile]);

  const signIn = useCallback(async () => {
    setError(null);
    setSigningIn(true);
    try {
      const redirectUri = Linking.createURL("auth-callback");
      const result = await WebBrowser.openAuthSessionAsync(githubStartUrl(redirectUri), redirectUri);

      if (result.type !== "success" || !result.url) {
        if (result.type !== "cancel" && result.type !== "dismiss") {
          setError("Sign-in didn't complete. Please try again.");
        }
        return;
      }

      const { queryParams } = Linking.parse(result.url);
      const newToken = typeof queryParams?.token === "string" ? queryParams.token : null;
      const oauthError = typeof queryParams?.error === "string" ? queryParams.error : null;

      if (oauthError) {
        setError("GitHub sign-in was cancelled or denied.");
        return;
      }
      if (!newToken) {
        setError("Sign-in didn't return a valid session. Please try again.");
        return;
      }

      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      setToken(newToken);
      await loadProfile(newToken);
    } catch {
      setError("Something went wrong signing in. Please try again.");
    } finally {
      setSigningIn(false);
    }
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ token, user, loading, signingIn, error, signIn, signOut }),
    [token, user, loading, signingIn, error, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

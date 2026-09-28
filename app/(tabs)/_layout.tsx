import { useEffect } from "react";
import Feather from "@expo/vector-icons/Feather";
import { Redirect, Tabs, useRouter } from "expo-router";
import { DockTabBar } from "@/components/DockTabBar";
import { DiceIcon } from "@/components/fx";
import { ProfileSheet } from "@/components/ProfileSheet";
import { useAuth } from "@/lib/auth";
import { triggerIdeaGenerate } from "@/lib/ideaGenerate";
import { useFavorites } from "@/lib/stores/favorites";
import { useUi } from "@/lib/stores/ui";

export default function TabsLayout() {
  const { token, loading } = useAuth();
  const router = useRouter();
  const profileOpen = useUi((s) => s.profileOpen);
  const closeProfile = useUi((s) => s.closeProfile);

  // Favorites: show the cached list straight away, then refresh from the server.
  useEffect(() => {
    if (!token) return;
    const { hydrate, sync } = useFavorites.getState();
    hydrate().then(() => sync(token));
  }, [token]);

  if (!loading && !token) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <>
      <Tabs tabBar={(props) => <DockTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen
          name="index"
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              // Already on Roll: pressing it again rolls (the web's R key).
              if (navigation.isFocused()) {
                e.preventDefault();
                triggerIdeaGenerate();
              }
            },
          })}
          options={{
            title: "Roll",
            tabBarIcon: ({ color, size }) => <DiceIcon size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="write"
          listeners={{
            tabPress: (e) => {
              // Write opens the composer over everything; it isn't a place to stay.
              e.preventDefault();
              router.push("/compose");
            },
          }}
          options={{
            title: "Write",
            tabBarIcon: ({ color, size }) => <Feather name="edit-3" size={size - 1} color={color} />,
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: "Saved",
            tabBarIcon: ({ color, size }) => <Feather name="bookmark" size={size - 1} color={color} />,
          }}
        />
      </Tabs>
      <ProfileSheet visible={profileOpen} onClose={closeProfile} />
    </>
  );
}

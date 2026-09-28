import { useEffect, useState } from "react";
import { useFavorites } from "@/lib/stores/favorites";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, Tabs } from "expo-router";
import { Image, Text, View } from "react-native";
import { DockTabBar } from "@/components/DockTabBar";
import { DiceIcon } from "@/components/fx";
import { ProfileSheet } from "@/components/ProfileSheet";
import { getInitials } from "@/lib/avatarInitials";
import { useAuth } from "@/lib/auth";
import { triggerIdeaGenerate } from "@/lib/ideaGenerate";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  const { token, loading, user } = useAuth();
  const [profileVisible, setProfileVisible] = useState(false);

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
              // Tapping the already-active Ideas tab skips to the next idea instead of no-op'ing —
              // the dock's equivalent of MessageDock's sparkle/generate button.
              if (navigation.isFocused()) {
                e.preventDefault();
                triggerIdeaGenerate();
              }
            },
          })}
          options={{
            title: "Ideas",
            tabBarIcon: ({ color, size }) => <DiceIcon size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          listeners={{
            tabPress: (e) => {
              // Profile is a popup, not a real destination — keep the current tab focused.
              e.preventDefault();
              setProfileVisible(true);
            },
          }}
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) =>
              user?.image ? (
                <Image
                  source={{ uri: user.image }}
                  style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: 1,
                    borderColor: colors.borderStrong,
                  }}
                />
              ) : user?.name ? (
                <View
                  style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: 1,
                    borderColor: color,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontFamily: "Geist_700Bold", fontSize: size * 0.4, color }}>
                    {getInitials(user.name)}
                  </Text>
                </View>
              ) : (
                <Feather name="user" size={size} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: "Favorites",
            tabBarIcon: ({ color, size }) => <Ionicons name="star" size={size} color={color} />,
          }}
        />
      </Tabs>
      <ProfileSheet visible={profileVisible} onClose={() => setProfileVisible(false)} />
    </>
  );
}

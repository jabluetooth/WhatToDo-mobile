import { useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { BottomTabBarButtonProps } from "expo-router/js-tabs";
import { Redirect, Tabs } from "expo-router";
import { Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedTabIcon } from "@/components/AnimatedTabIcon";
import { DockGlow } from "@/components/DockGlow";
import { DockTabButton } from "@/components/DockTabButton";
import { ProfileSheet } from "@/components/ProfileSheet";
import { getInitials } from "@/lib/avatarInitials";
import { useAuth } from "@/lib/auth";
import { triggerIdeaGenerate } from "@/lib/ideaGenerate";
import { colors, radius, spacing } from "@/lib/theme";

export default function TabsLayout() {
  const { token, loading, user } = useAuth();
  const [profileVisible, setProfileVisible] = useState(false);
  const insets = useSafeAreaInsets();

  if (!loading && !token) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          // react-navigation 7.18's PlatformPressableProps types pressColor as `string`, but RN 0.86
          // widens ColorValue to include OpaqueColorValue — a type-only gap between the two libraries,
          // not a runtime concern (this app never reads pressColor).
          tabBarButton: (props) => <DockTabButton {...(props as BottomTabBarButtonProps)} />,
          tabBarBackground: () => <DockGlow />,
          tabBarStyle: {
            position: "absolute",
            left: spacing.xl,
            right: spacing.xl,
            bottom: insets.bottom + spacing.sm,
            height: 64,
            borderRadius: radius.full,
            backgroundColor: colors.surfaceElevated,
            borderWidth: 1,
            borderColor: colors.border,
            elevation: 8,
            shadowColor: "#000",
            shadowOpacity: 0.4,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 8 },
          },
          tabBarActiveTintColor: colors.foreground,
          tabBarInactiveTintColor: colors.foregroundMuted,
        }}
      >
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
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon focused={focused}>
                <Feather name="zap" size={size} color={color} />
              </AnimatedTabIcon>
            ),
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
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon focused={focused}>
                {user?.image ? (
                  <Image source={{ uri: user.image }} style={{ width: size, height: size, borderRadius: size / 2 }} />
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
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: size * 0.4, color }}>
                      {getInitials(user.name)}
                    </Text>
                  </View>
                ) : (
                  <Feather name="user" size={size} color={color} />
                )}
              </AnimatedTabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: "Favorites",
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon focused={focused}>
                <Ionicons name="star" size={size} color={color} />
              </AnimatedTabIcon>
            ),
          }}
        />
      </Tabs>
      <ProfileSheet visible={profileVisible} onClose={() => setProfileVisible(false)} />
    </>
  );
}

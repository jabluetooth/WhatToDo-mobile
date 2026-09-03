import { Redirect, Tabs } from "expo-router";
import { AnimatedTabIcon } from "@/components/AnimatedTabIcon";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  const { token, loading } = useAuth();

  if (!loading && !token) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Ideas",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="zap" size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="star" size={size} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

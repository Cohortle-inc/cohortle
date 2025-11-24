import { Cohortz, Community, Profile } from '@/assets/icons/ConvenerTabs';
import { Tabs, useSegments } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';

export default function TabLayout() {
  const segment = useSegments() as string[];

  const segmentsToHideTabBar: string[] = ['course', 'module'];

  const hideTabBar: boolean = segmentsToHideTabBar.some((seg) =>
    segment.includes(seg),
  );

  return (
    <Tabs
      tabBar={hideTabBar ? () => null : undefined}
      screenOptions={({
        route,
      }: {
        route: import('@react-navigation/native').RouteProp<
          Record<string, object | undefined>,
          string
        >;
      }) => ({
        headerShown: false,
        tabBarStyle: {
          paddingTop: 12,
          paddingBottom: 12,
          height: 68,
          backgroundColor: '#ffffff',
        },
        tabBarLabel: ({
          focused,
          children,
        }: {
          focused: boolean;
          children: React.ReactNode;
        }) => (
          <Text style={[styles.label, focused && styles.activeLabel]}>
            {children}
          </Text>
        ),
        tabBarIcon: ({ focused }: { focused: boolean }) => {
          // Common container style for all icons
          const iconContainerStyle = [
            styles.iconContainer,
            focused && styles.activeIconContainer,
          ];

          switch (route.name) {
            case 'community':
              return (
                <View style={iconContainerStyle}>
                  <Community fill={focused ? '#391D65' : 'gray'} />
                </View>
              );
            case '(cohorts)':
              return (
                <View style={iconContainerStyle}>
                  <Cohortz fill={focused ? '#391D65' : 'gray'} />
                </View>
              );
            case 'profile':
              return (
                <View style={iconContainerStyle}>
                  <Profile fill={focused ? '#391D65' : 'gray'} />
                </View>
              );
            default:
              return (
                <View style={iconContainerStyle}>
                  <Community fill={focused ? '#391D65' : 'gray'} />
                </View>
              );
          }
        },
      })}
    >
      <Tabs.Screen name="community" options={{ title: 'Community' }} />
      <Tabs.Screen name="cohorts" options={{ title: 'Cohortz' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    paddingVertical: 2.5,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  activeIconContainer: {
    backgroundColor: '#F8F1FF',
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'DMSansRegular',
    color: 'gray',
  },
  activeLabel: {
    fontFamily: 'DMSansSemiBold',
    color: '#391D65',
  },
});

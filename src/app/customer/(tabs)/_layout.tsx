import { Tabs } from 'expo-router';
import { Image } from 'react-native';

export default function CustomerTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#C58D24',
        tabBarInactiveTintColor: '#19191B',

        tabBarStyle: {
          height: 65,
          backgroundColor: '#FAF8F2',
          borderTopColor: '#DED8CC',
          paddingTop: 7,
          paddingBottom: 7,
        },

        tabBarLabelStyle: {
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',

          tabBarIcon: ({ color, size }) => (
            <Image
              source={require(
                '../../../../assets/icons/home.png'
              )}
              style={{
                width: size,
                height: size,
                resizeMode: 'contain',
                tintColor: color,
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',

          tabBarIcon: ({ color, size }) => (
            <Image
              source={require(
                '../../../../assets/icons/shop.png'
              )}
              style={{
                width: size,
                height: size,
                resizeMode: 'contain',
                tintColor: color,
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
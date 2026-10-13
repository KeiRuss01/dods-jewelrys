import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useRequireRole } from '@/hooks/use-require-role';

export default function AdminLayout() {
  const checking = useRequireRole('admin');

  if (checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#C58D24" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-product" />
      <Stack.Screen name="customers" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF8F2',
  },
});

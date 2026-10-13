import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useRequireRole } from '@/hooks/use-require-role';

export default function CustomerLayout() {
  const checking = useRequireRole('customer');

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
    />
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

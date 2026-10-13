import { router } from 'expo-router';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { logout } from '@/services/auth-service';

type AdminHeaderProps = {
  title?: string;
  showBack?: boolean;
  onNotifications?: () => void;
};

export function AdminHeader({
  title,
  showBack = false,
  onNotifications,
}: AdminHeaderProps) {
  function confirmLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/admin-login');
        },
      },
    ]);
  }

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {showBack ? (
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        ) : null}
        {title ? <Text style={styles.title}>{title}</Text> : null}
      </View>

      <View style={styles.actions}>
        <Text style={styles.adminText}>Admin</Text>
        <Pressable
          style={styles.iconButton}
          onPress={onNotifications ?? (() => Alert.alert('Notifications', 'There are no new notifications.'))}
          hitSlop={10}
        >
          <Image source={require('../../assets/icons/notification.png')} style={styles.icon} />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={confirmLogout} hitSlop={10}>
          <Image source={require('../../assets/icons/logout.png')} style={styles.icon} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backButton: { marginRight: 10, paddingRight: 4 },
  backText: { fontSize: 42, lineHeight: 42, fontWeight: '300', color: '#19191B' },
  title: { fontSize: 17, fontWeight: '700', color: '#19191B' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  adminText: { fontSize: 17, fontWeight: '700', color: '#19191B', marginRight: 3 },
  iconButton: { padding: 4 },
  icon: { width: 23, height: 23, resizeMode: 'contain', tintColor: '#19191B' },
});

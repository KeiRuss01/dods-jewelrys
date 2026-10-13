import {
  router,
  useFocusEffect,
} from 'expo-router';
import {
  useCallback,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { logout } from '@/services/auth-service';
import { getCurrentUserProfile } from '@/services/user-service';
import type { UserProfile } from '@/types/user';

const SUPPORT_EMAIL = 'owner@gmail.com';
const SUPPORT_PHONE = '09123456789';

export default function CustomerProfileScreen() {
  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setLoading(true);

      getCurrentUserProfile()
        .then((data) => {
          if (active) {
            setProfile(data);
          }
        })
        .catch((error) => {
          Alert.alert(
            'Unable to Load Profile',
            error instanceof Error
              ? error.message
              : 'Please try again.'
          );
        })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });

      return () => {
        active = false;
      };
    }, [])
  );

  function getInitials(name: string) {
    return (
      name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) =>
          word[0].toUpperCase()
        )
        .join('') || '?'
    );
  }

  async function openSupportUrl(
    url: string
  ) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'Unable to Open',
        'This device does not have a supported application.'
      );
    }
  }

  function handleSupport() {
    Alert.alert(
      'Help & Support',
      'How would you like to contact DOD’S Jewelry?',
      [
        {
          text: 'Email',
          onPress: () =>
            openSupportUrl(
              `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                'DOD’S Jewelry Support'
              )}`
            ),
        },
        {
          text: 'Call',
          onPress: () =>
            openSupportUrl(
              `tel:${SUPPORT_PHONE}`
            ),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }

  function handleLogout() {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/login');
            } catch (error) {
              Alert.alert(
                'Unable to Log Out',
                error instanceof Error
                  ? error.message
                  : 'Please try again.'
              );
            }
          },
        },
      ]
    );
  }

  const personalInformation = [
    {
      label: 'Full Name',
      value: profile?.full_name,
    },
    {
      label: 'Email',
      value: profile?.email,
    },
    {
      label: 'Mobile',
      value: profile?.mobile_number,
    },
    {
      label: 'Address',
      value: [
        profile?.address,
        profile?.city_province,
      ]
        .filter(Boolean)
        .join(', '),
    },
  ];

  const accountOptions = [
    {
      title: 'My Orders',
      description: 'View purchase history',
      onPress: () =>
        router.push('/customer/orders'),
    },
    {
      title: 'My Repairs',
      description: 'View repair requests',
      onPress: () =>
        router.push({
          pathname: '/customer/repairs',
          params: {
            mode: 'view',
          },
        }),
    },
    {
      title: 'Help & Support',
      description: "Contact DOD'S Jewelry",
      onPress: handleSupport,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Profile
          </Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() =>
                Alert.alert(
                  'Notifications',
                  'You have no new notifications.'
                )
              }
              activeOpacity={0.7}
            >
              <Image
                source={require(
                  '../../../../assets/icons/notification.png'
                )}
                style={styles.headerIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={() =>
                router.push('/customer/cart')
              }
              activeOpacity={0.7}
            >
              <Image
                source={require(
                  '../../../../assets/icons/cart.png'
                )}
                style={styles.headerIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.title}>
          My Profile
        </Text>

        {loading ? (
          <View
            style={styles.loadingContainer}
          >
            <ActivityIndicator
              size="large"
              color="#B77C14"
            />

            <Text style={styles.loadingText}>
              Loading profile...
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                {profile?.profile_photo_url ? (
                  <Image
                    source={{
                      uri: profile.profile_photo_url,
                    }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {getInitials(
                      profile?.full_name ?? ''
                    )}
                  </Text>
                )}
              </View>

              <View
                style={
                  styles.profileInformation
                }
              >
                <Text
                  style={styles.profileName}
                  numberOfLines={1}
                >
                  {profile?.full_name ||
                    'Customer'}
                </Text>

                <Text
                  style={styles.profileRole}
                >
                  Customer
                </Text>

                <Text
                  style={styles.profileEmail}
                  numberOfLines={1}
                >
                  {profile?.email}
                </Text>

                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() =>
                    router.push(
                      '/customer/edit-profile'
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={
                      styles.editButtonText
                    }
                  >
                    Edit Profile
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={styles.sectionHeader}
            >
              <Text
                style={styles.sectionTitle}
              >
                Personal Information
              </Text>
            </View>

            <View style={styles.card}>
              {personalInformation.map(
                (item) => (
                  <View
                    key={item.label}
                    style={styles.infoRow}
                  >
                    <Text
                      style={styles.infoLabel}
                    >
                      {item.label}
                    </Text>

                    <Text
                      style={styles.infoValue}
                    >
                      {item.value || '—'}
                    </Text>
                  </View>
                )
              )}
            </View>

            <View
              style={styles.sectionHeader}
            >
              <Text
                style={styles.sectionTitle}
              >
                Account
              </Text>
            </View>

            <View style={styles.card}>
              {accountOptions.map(
                (option) => (
                  <TouchableOpacity
                    key={option.title}
                    style={styles.optionRow}
                    onPress={option.onPress}
                    activeOpacity={0.7}
                  >
                    <View>
                      <Text
                        style={
                          styles.optionTitle
                        }
                      >
                        {option.title}
                      </Text>

                      <Text
                        style={
                          styles.optionDescription
                        }
                      >
                        {option.description}
                      </Text>
                    </View>

                    <Text
                      style={styles.chevron}
                    >
                      ›
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.logoutButtonText
                }
              >
                Log Out
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 30,
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
    resizeMode: 'cover',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitle: {
    color: '#19191B',
    fontSize: 16,
    fontWeight: 'bold',
  },

  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  headerButton: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    tintColor: '#19191B',
  },

  title: {
    color: '#19191B',
    fontSize: 23,
    fontWeight: 'bold',
    marginTop: 18,
  },

  loadingContainer: {
    alignItems: 'center',
    marginTop: 70,
  },

  loadingText: {
    color: '#77736D',
    fontSize: 12,
    marginTop: 12,
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DDD3',
    borderRadius: 18,
    padding: 16,
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#19191B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },

  profileInformation: {
    flex: 1,
    marginLeft: 16,
  },

  profileName: {
    color: '#19191B',
    fontSize: 15,
    fontWeight: 'bold',
  },

  profileRole: {
    color: '#77736D',
    fontSize: 11,
    marginTop: 4,
  },

  profileEmail: {
    color: '#8A857E',
    fontSize: 9,
    marginTop: 4,
  },

  editButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#C58D24',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 7,
    marginTop: 10,
  },

  editButtonText: {
    color: '#19191B',
    fontSize: 10,
    fontWeight: '600',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 10,
  },

  sectionTitle: {
    color: '#19191B',
    fontSize: 15,
    fontWeight: 'bold',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DDD3',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },

  infoLabel: {
    width: 100,
    color: '#77736D',
    fontSize: 10,
  },

  infoValue: {
    flex: 1,
    color: '#19191B',
    fontSize: 10,
    fontWeight: 'bold',
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },

  optionTitle: {
    color: '#19191B',
    fontSize: 11,
    fontWeight: 'bold',
  },

  optionDescription: {
    color: '#8A857E',
    fontSize: 8,
    marginTop: 2,
  },

  chevron: {
    color: '#C58D24',
    fontSize: 20,
  },

  logoutButton: {
    height: 46,
    backgroundColor: '#050505',
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },

  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

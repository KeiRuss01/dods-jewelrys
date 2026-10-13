import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { requestPasswordReset } from '@/services/auth-service';
import {
  getCurrentUserProfile,
  updateCurrentProfilePhoto,
  updateCurrentUserProfile,
} from '@/services/user-service';

export default function CustomerEditProfileScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [cityProvince, setCityProvince] =
    useState('');

  const [photoUrl, setPhotoUrl] = useState('');
  const [selectedPhoto, setSelectedPhoto] =
    useState<ImagePicker.ImagePickerAsset | null>(
      null
    );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] =
    useState(false);

  useEffect(() => {
    let active = true;

    getCurrentUserProfile()
      .then((profile) => {
        if (!active) {
          return;
        }

        setFullName(profile.full_name);
        setEmail(profile.email);
        setMobile(profile.mobile_number ?? '');
        setAddress(profile.address ?? '');
        setCityProvince(
          profile.city_province ?? ''
        );
        setPhotoUrl(
          profile.profile_photo_url ?? ''
        );
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
  }, []);

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

  async function handleChangePhoto() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photos.'
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (!result.canceled) {
        setSelectedPhoto(result.assets[0]);
        setPhotoUrl(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(
        'Unable to Select Photo',
        error instanceof Error
          ? error.message
          : 'Please try again.'
      );
    }
  }

  async function handleChangePassword() {
    if (!email || sendingReset) {
      return;
    }

    try {
      setSendingReset(true);

      await requestPasswordReset(email);

      Alert.alert(
        'Password Reset Email Sent',
        `A password reset link was sent to ${email}.`
      );
    } catch (error) {
      Alert.alert(
        'Unable to Send Email',
        error instanceof Error
          ? error.message
          : 'Please try again.'
      );
    } finally {
      setSendingReset(false);
    }
  }

  async function handleSave() {
    if (!fullName.trim()) {
      Alert.alert(
        'Missing Information',
        'Please enter your full name.'
      );
      return;
    }

    if (
      mobile.trim() &&
      !/^[0-9+\-\s]{7,15}$/.test(
        mobile.trim()
      )
    ) {
      Alert.alert(
        'Invalid Mobile Number',
        'Please enter a valid mobile number.'
      );
      return;
    }

    try {
      setSaving(true);

      await updateCurrentUserProfile({
        full_name: fullName.trim(),
        mobile_number: mobile.trim(),
        address: address.trim(),
        city_province:
          cityProvince.trim(),
      });

      if (selectedPhoto) {
        const uploadedPhoto =
          await updateCurrentProfilePhoto(
            selectedPhoto
          );

        setPhotoUrl(
          uploadedPhoto.profile_photo_url
        );
        setSelectedPhoto(null);
      }

      Alert.alert(
        'Profile Updated',
        'Your profile changes have been saved.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Unable to Save',
        error instanceof Error
          ? error.message
          : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (selectedPhoto) {
      Alert.alert(
        'Discard Changes?',
        'Your selected profile photo has not been saved.',
        [
          {
            text: 'Continue Editing',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );

      return;
    }

    router.back();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.backIcon}>
                ‹
              </Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              Profile
            </Text>
          </View>

          <Text style={styles.title}>
            Edit Profile
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
              <TouchableOpacity
                style={styles.avatar}
                onPress={handleChangePhoto}
                activeOpacity={0.8}
              >
                {photoUrl ? (
                  <Image
                    source={{ uri: photoUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {getInitials(fullName)}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.photoRow}>
                <Text style={styles.photoLabel}>
                  Profile Photo
                </Text>

                <TouchableOpacity
                  onPress={handleChangePhoto}
                  disabled={saving}
                >
                  <Text
                    style={styles.changePhoto}
                  >
                    {selectedPhoto
                      ? 'Change selected photo'
                      : 'Change photo'}
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedPhoto && (
                <Text
                  style={styles.photoPendingText}
                >
                  Press Save Changes to upload your
                  new photo.
                </Text>
              )}

              <View style={styles.card}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>
                    Full Name
                  </Text>

                  <TextInput
                    style={styles.fieldInput}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Full name"
                    placeholderTextColor="#99958F"
                    editable={!saving}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>
                    Email
                  </Text>

                  <TextInput
                    style={[
                      styles.fieldInput,
                      styles.disabledInput,
                    ]}
                    value={email}
                    editable={false}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>
                    Mobile
                  </Text>

                  <TextInput
                    style={styles.fieldInput}
                    value={mobile}
                    onChangeText={setMobile}
                    placeholder="Mobile number"
                    placeholderTextColor="#99958F"
                    keyboardType="phone-pad"
                    editable={!saving}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>
                    Address
                  </Text>

                  <TextInput
                    style={styles.fieldInput}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Address"
                    placeholderTextColor="#99958F"
                    editable={!saving}
                  />
                </View>

                <View
                  style={[
                    styles.field,
                    styles.lastField,
                  ]}
                >
                  <Text style={styles.fieldLabel}>
                    City / Province
                  </Text>

                  <TextInput
                    style={styles.fieldInput}
                    value={cityProvince}
                    onChangeText={setCityProvince}
                    placeholder="City / Province"
                    placeholderTextColor="#99958F"
                    editable={!saving}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  saving &&
                    styles.disabledButton,
                ]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <View style={styles.savingRow}>
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.saveButtonText
                      }
                    >
                      Saving...
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <View
                style={styles.sectionHeader}
              >
                <Text
                  style={styles.sectionTitle}
                >
                  Account Security
                </Text>
              </View>

              <TouchableOpacity
                style={styles.securityButton}
                onPress={
                  handleChangePassword
                }
                disabled={
                  sendingReset || saving
                }
                activeOpacity={0.8}
              >
                <Text
                  style={styles.securityText}
                >
                  {sendingReset
                    ? 'Sending reset email...'
                    : 'Change Password'}
                </Text>

                {sendingReset ? (
                  <ActivityIndicator
                    size="small"
                    color="#C58D24"
                  />
                ) : (
                  <Text
                    style={styles.chevron}
                  >
                    ›
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
    resizeMode: 'cover',
  },

  photoPendingText: {
    color: '#A8751F',
    fontSize: 9,
    textAlign: 'right',
    marginTop: -5,
    marginBottom: 9,
  },

  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 30,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 35,
    height: 35,
    justifyContent: 'center',
  },

  backIcon: {
    color: '#19191B',
    fontSize: 36,
    lineHeight: 38,
  },

  headerTitle: {
    color: '#19191B',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#19191B',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 24,
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },

  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 10,
  },

  photoLabel: {
    color: '#77736D',
    fontSize: 11,
  },

  changePhoto: {
    color: '#C58D24',
    fontSize: 11,
    fontWeight: '600',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DDD3',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2DDD3',
  },

  lastField: {
    borderBottomWidth: 0,
  },

  fieldLabel: {
    width: 100,
    color: '#77736D',
    fontSize: 10,
  },

  fieldInput: {
    flex: 1,
    color: '#19191B',
    fontSize: 10,
    fontWeight: 'bold',
    paddingVertical: 17,
  },

  disabledInput: {
    color: '#8A857E',
  },

  saveButton: {
    height: 42,
    backgroundColor: '#19191B',
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  cancelButton: {
    height: 42,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C58D24',
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  cancelButtonText: {
    color: '#19191B',
    fontSize: 11,
    fontWeight: 'bold',
  },

  sectionHeader: {
    marginTop: 24,
    marginBottom: 10,
  },

  sectionTitle: {
    color: '#19191B',
    fontSize: 15,
    fontWeight: 'bold',
  },

  securityButton: {
    height: 38,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DDD3',
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },

  securityText: {
    color: '#19191B',
    fontSize: 10,
    fontWeight: 'bold',
  },

  chevron: {
    color: '#C58D24',
    fontSize: 20,
  },
});
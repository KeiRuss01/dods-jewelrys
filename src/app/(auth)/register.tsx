import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { readableAuthError, registerCustomer } from '@/services/auth-service';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const [loading, setLoading] = useState(false);

  async function handleCreateAccount() {
    if (
      fullName.trim() === '' ||
      email.trim() === '' ||
      mobileNumber.trim() === '' ||
      password === ''
    ) {
      Alert.alert(
        'Missing Information',
        'Please complete all fields.'
      );
      return;
    }

    if (!email.includes('@')) {
      Alert.alert(
        'Invalid Email',
        'Please enter a valid email address.'
      );
      return;
    }

    if (password.length < 8 || !/[0-9]/.test(password)) {
      Alert.alert(
        'Invalid Password',
        'Password must contain at least 8 characters and a number.'
      );
      return;
    }

    try {
      setLoading(true);
      await registerCustomer({ fullName, email, mobileNumber, password });
      Alert.alert(
        'Account Created',
        'Your customer account was created successfully. You can now log in.',
        [
          {
            text: 'Continue to Login',
            onPress: () => router.replace('/login'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Unable to Create Account', readableAuthError(error));
    } finally {
      setLoading(false);
    }
  }

  function handleSignIn() {
    router.replace('/login');
  }

  function handleBack() {
    router.back();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Create your account</Text>

            <Text style={styles.subtitle}>
              Register to shop, book services, and track repairs.
            </Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full name</Text>

                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your complete name"
                  placeholderTextColor="#99958F"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email address</Text>

                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor="#99958F"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile number</Text>

                <TextInput
                  style={styles.input}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  placeholder="+63 9XX XXX XXXX"
                  placeholderTextColor="#99958F"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>

                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a strong password"
                  placeholderTextColor="#99958F"
                  secureTextEntry
                  autoCapitalize="none"
                />

                <Text style={styles.passwordHint}>
                  Use at least 8 characters with a number.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.createButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleCreateAccount}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleSignIn}
              activeOpacity={0.7}
            >
              <Text style={styles.signInText}>
                Already have an account?
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FAF8F2',
  },

  card: {
    flex: 1,
    backgroundColor: '#FAF8F2',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 35,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#D9D4CA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backArrow: {
    color: '#1A1A1C',
    fontSize: 23,
    lineHeight: 25,
  },

  title: {
    color: '#1B1B1D',
    fontSize: 27,
    fontWeight: 'bold',
    marginTop: 30,
  },

  disabledButton: {
    opacity: 0.6,
  },
  
  subtitle: {
    color: '#77736D',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },

  form: {
    marginTop: 30,
  },

  inputGroup: {
    marginBottom: 15,
  },

  label: {
    color: '#292826',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 7,
  },

  input: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCD6CB',
    borderRadius: 13,
    paddingHorizontal: 15,
    color: '#1B1B1D',
    fontSize: 13,
  },

  passwordHint: {
    color: '#96918A',
    fontSize: 10,
    marginTop: 6,
  },

  createButton: {
    height: 52,
    backgroundColor: '#171719',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 35,
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  signInButton: {
    alignSelf: 'center',
    marginTop: 52,
    padding: 10,
  },

  signInText: {
    color: '#77736D',
    fontSize: 12,
  },
});

import { router } from 'expo-router';
import { useState } from 'react';
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

import { loginAdmin, readableAuthError } from '@/services/auth-service';

export default function AdminLoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);

  async function handleAdminLogin() {
    if (email.trim() === '' || password === '') {
      Alert.alert(
        'Missing Information',
        'Please enter your email address and password.'
      );
      return;
    }

    try {
      setLoading(true);
      await loginAdmin(email, password);
      router.replace('/admin');
    } catch (error) {
      Alert.alert('Unable to Log In', readableAuthError(error));
    } finally {
      setLoading(false);
    }
  }

  function handleCustomerLogin() {
    router.replace('/login');
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
          {/* Dark header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/icons/logo.png')}
                style={styles.logoImage}
              />
            </View>

            <Text style={styles.brandName}>DOD’S JEWELRY</Text>
          </View>

          {/* Login form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Sign in to continue</Text>

            <Text style={styles.formSubtitle}>
              Enter your administrator credentials below.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email address</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your administrator email"
                placeholderTextColor="#A5A19A"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#A5A19A"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.showPassword}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleAdminLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>
                  Log In
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>CUSTOMER ACCESS</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.customerContainer}>
              <Text style={styles.customerText}>
                Not an administrator?{' '}
              </Text>

              <TouchableOpacity
                onPress={handleCustomerLogin}
                activeOpacity={0.7}
              >
                <Text style={styles.customerLink}>
                  Customer Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111113',
  },

  keyboardView: {
    flex: 1,
  },

  disabledButton: {
    opacity: 0.6,
  },

  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#111113',
  },

  header: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 38,
  },

  logoContainer: {
    width: 55,
    height: 55,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C99735',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  logoImage: {
    width: 42,
    height: 42,
    resizeMode: 'contain',
  },

  brandName: {
    color: '#D5A743',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    marginTop: 16,
    marginBottom: 5,
  },

  formContainer: {
    flex: 1,
    backgroundColor: '#FAF8F2',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 30,
  },

  formTitle: {
    color: '#19191B',
    fontSize: 22,
    fontWeight: 'bold',
  },

  formSubtitle: {
    color: '#77736D',
    fontSize: 13,
    marginTop: 6,
    marginBottom: 28,
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    color: '#2A2927',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },

  input: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED9CE',
    borderRadius: 15,
    paddingHorizontal: 16,
    color: '#1B1B1D',
    fontSize: 14,
  },

  passwordContainer: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED9CE',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  passwordInput: {
    flex: 1,
    color: '#1B1B1D',
    fontSize: 14,
  },

  showPassword: {
    color: '#B07D23',
    fontSize: 12,
    fontWeight: '600',
    paddingLeft: 10,
  },

  loginButton: {
    height: 56,
    backgroundColor: '#171719',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 18,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#DED9CE',
  },

  dividerText: {
    color: '#9A968F',
    fontSize: 9,
    letterSpacing: 1.5,
    marginHorizontal: 12,
  },

  customerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },

  customerText: {
    color: '#8A857E',
    fontSize: 12,
  },

  customerLink: {
    color: '#A8751F',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

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

import { signInForRole } from '@/services/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);

  async function handleLogin() {
    if (email.trim() === '' || password === '') {
      Alert.alert(
        'Missing Information',
        'Please enter your email address and password.'
      );
      return;
    }

    try {
      setLoading(true);

      const profile = await signInForRole(
        email.trim().toLowerCase(),
        password,
        'customer'
      );

      Alert.alert(
        'Login Successful',
        `Welcome, ${profile.full_name}!`,
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/customer'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Login Failed',
        error instanceof Error
          ? error.message
          : 'Incorrect email address or password.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCreateAccount() {
    router.push('/register');
  }

  function handleForgotPassword() {
    Alert.alert(
      'Forgot Password',
      'The password recovery screen will be added later.'
    );
  }

  function handleAdminLogin() {
    router.push('/admin-login');
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
            <Text style={styles.formTitle}>Customer Login</Text>

            <Text style={styles.formSubtitle}>
              Enter your account details below.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email address</Text>

              <TextInput
                style={styles.input}
                placeholder="example@email.com"
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

              <TouchableOpacity
                style={styles.forgotButton}
                onPress={handleForgotPassword}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotText}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>
                  Log in
                </Text>
              )}
            </TouchableOpacity>

            {/* Registration is shown as a link instead of another button */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerQuestion}>
                New to DOD’S Jewelry?
              </Text>

              <TouchableOpacity
                onPress={handleCreateAccount}
                activeOpacity={0.7}
              >
                <Text style={styles.registerLink}>
                  Create an account
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>STAFF ACCESS</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.adminLoginContainer}>
              <Text style={styles.adminLoginText}>
                Are you an administrator?{' '}
              </Text>

              <TouchableOpacity
                onPress={handleAdminLogin}
                activeOpacity={0.7}
              >
                <Text style={styles.adminLoginLink}>Admin Login</Text>
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
    paddingTop: 30,
    paddingBottom: 42,
  },

  logoContainer: {
    width: 55,
    height: 55,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C99735',
    alignItems: 'center',
    justifyContent: 'center',
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
  },

  formContainer: {
    flex: 1,
    backgroundColor: '#FAF8F2',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 25,
    paddingTop: 32,
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

  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },

  forgotText: {
    color: '#77736D',
    fontSize: 12,
  },

  loginButton: {
    height: 56,
    backgroundColor: '#171719',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 22,
  },

  registerQuestion: {
    color: '#77736D',
    fontSize: 13,
    marginRight: 5,
  },

  registerLink: {
    color: '#A8751F',
    fontSize: 13,
    fontWeight: 'bold',
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

  adminLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },

  adminLoginText: {
    color: '#8A857E',
    fontSize: 12,
  },

  adminLoginLink: {
    color: '#A8751F',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

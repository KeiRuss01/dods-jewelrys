import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreen() {
  // Starts the loading line at zero
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadingAnimation = Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    });

    loadingAnimation.start(({ finished }) => {
      if (finished) {
        // Opens the home screen when loading finishes
        router.replace('/onboarding');
      }
    });

    return () => {
      loadingAnimation.stop();
    };
  }, [progress]);

  // Changes the loading-line width from 0% to 100%
  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/icons/logo.png')}
            style={styles.logoImage}
          />
        </View>

        <Text style={styles.brandName}>DOD’S</Text>
        <Text style={styles.brandType}>JEWELRY</Text>

        <Text style={styles.tagline}>
          Timeless pieces. Trusted care.
        </Text>
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.progressBackground}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth,
              },
            ]}
          />
        </View>

        <Text style={styles.footerText}>
          REPAIR • SALES • APPOINTMENTS
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0C0D',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 70,
  },

  logoContainer: {
    width: 150,
    height: 135,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  logoImage: {
    width: 135,
    height: 135,
    resizeMode: 'contain',
  },

  brandName: {
    color: '#F4F1EB',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 3,
  },

  brandType: {
    color: '#D6A93D',
    fontSize: 9,
    letterSpacing: 4,
    marginTop: 5,
  },

  tagline: {
    color: '#A9A9A9',
    fontSize: 10,
    marginTop: 20,
  },

  bottomContainer: {
    alignItems: 'center',
    paddingBottom: 30,
  },

  progressBackground: {
    width: 95,
    height: 2,
    backgroundColor: '#343434',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#D6A93D',
  },

  footerText: {
    color: '#777777',
    fontSize: 7,
    letterSpacing: 1,
    marginTop: 14,
  },
});

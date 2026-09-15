import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type OnboardingItem = {
  image: ImageSourcePropType;
  title: string;
  description: string;
};

// The information shown on the three onboarding pages
const onboardingData: OnboardingItem[] = [
  {
    image: require('../../../assets/icons/on-shop.png'),
    title: 'Find your next\ntimeless piece.',
    description:
      'Browse our jewelry collection, discover pieces you love, and shop with confidence from wherever you are.',
  },
  {
    image: require('../../../assets/icons/on-repair.png'),
    title: 'Track every\nrepair update.',
    description:
      'Book a repair, approve quotations, make payments, and follow your jewelry until it is ready to claim.',
  },
  {
    image: require('../../../assets/icons/on-trust.png'),
    title: 'Trusted service,\nalways within reach.',
    description:
      'Shop, schedule services, and stay connected with DOD’S Jewelry—all in one convenient place.',
  },
];

export default function OnboardingScreen() {
  // Keeps track of the currently displayed page
  const [currentPage, setCurrentPage] = useState<number>(0);

  const currentItem = onboardingData[currentPage];
  const isLastPage = currentPage === onboardingData.length - 1;

  function handleNext() {
    if (isLastPage) {
      router.replace('/login');
    } else {
      setCurrentPage(currentPage + 1);
    }
  }

  function handleSkip() {
    router.replace('/login');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Image
          source={currentItem.image}
          style={styles.onboardingImage}
        />

        <Text style={styles.title}>{currentItem.title}</Text>

        <Text style={styles.description}>
          {currentItem.description}
        </Text>

        {/* Page indicators */}
        <View style={styles.indicatorContainer}>
          {onboardingData.map((item, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentPage === index
                  ? styles.activeIndicator
                  : styles.inactiveIndicator,
              ]}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleNext}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {isLastPage ? 'Get Started' : 'Next'}
        </Text>

        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F7F1',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  header: {
    height: 50,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  skipText: {
    color: '#555555',
    fontSize: 14,
  },

  content: {
    flex: 1,
  },

  onboardingImage: {
    width: '100%',
    height: 290,
    backgroundColor: '#171719',
    borderRadius: 24,
    marginTop: 10,
    resizeMode: 'cover',
  },

  title: {
    color: '#1B1B1D',
    fontSize: 30,
    fontWeight: 'bold',
    lineHeight: 37,
    marginTop: 32,
  },

  description: {
    color: '#747474',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 14,
  },

  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
    gap: 6,
  },

  indicator: {
    height: 7,
    borderRadius: 10,
  },

  activeIndicator: {
    width: 20,
    backgroundColor: '#C99635',
  },

  inactiveIndicator: {
    width: 7,
    backgroundColor: '#D2CEC3',
  },

  button: {
    height: 55,
    backgroundColor: '#171719',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  arrow: {
    color: '#FFFFFF',
    fontSize: 20,
    marginLeft: 10,
  },
});

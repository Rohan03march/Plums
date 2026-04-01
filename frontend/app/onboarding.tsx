import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  FadeInDown,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Video Discovery',
    description: 'Meet interesting people from around the world through high-quality video calls.',
    image: require('../assets/images/onboarding_1.png'),
    tag: 'Step 01',
  },
  {
    id: '2',
    title: 'Global Connections',
    description: 'Experience instant discovery and live conversations with diverse communities.',
    image: require('../assets/images/onboarding_2.png'),
    tag: 'Step 02',
  },
  {
    id: '3',
    title: 'Safe & Secure',
    description: 'Your privacy is our top priority. Enjoy secure, end-to-end encrypted interactions.',
    image: require('../assets/images/onboarding_3.png'),
    tag: 'Step 03',
  },
];

const Slide = ({ item, index, scrollX }: { item: any; index: number; scrollX: any }) => {
  const { colors, isDark } = useTheme();

  // Parallax animation for the image
  const imageAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [-width * 0.25, 0, width * 0.25],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [1.1, 1, 1.1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX }, { scale }],
    };
  });

  return (
    <View style={styles.slide}>
      <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
        <Image source={item.image} style={styles.image} />
      </Animated.View>

      <LinearGradient
        colors={[
          'transparent', 
          isDark ? 'rgba(15,15,19,0.2)' : 'rgba(248, 249, 250, 0.2)',
          isDark ? 'rgba(15,15,19,0.8)' : 'rgba(248, 249, 250, 0.8)',
          isDark ? 'rgba(15,15,19,1)' : 'rgba(248, 249, 250, 1)',
          colors.bg
        ]}
        style={styles.slideGradient}
        locations={[0, 0.2, 0.5, 0.8, 1]}
      />

      <View style={styles.textContainer}>
        <Animated.View 
          entering={FadeInDown.delay(200).duration(800).springify()}
          style={styles.tagContainer}
        >
          <Text style={[styles.tagText, { color: colors.primary }]}>{item.tag}</Text>
        </Animated.View>
        
        <Animated.Text
          entering={FadeInDown.delay(400).duration(600).springify()}
          style={[styles.title, { color: colors.text }]}
        >
          {item.title}
        </Animated.Text>
        
        <Animated.Text
          entering={FadeInDown.delay(600).duration(600).springify()}
          style={[styles.description, { color: colors.subText }]}
        >
          {item.description}
        </Animated.Text>
      </View>
    </View>
  );
};

const PaginationBar = ({ index, scrollX }: { index: number; scrollX: any }) => {
  const { colors } = useTheme();
  const animatedBarStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const barWidth = interpolate(
      scrollX.value,
      inputRange,
      [10, 30, 10],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP
    );

    return {
      width: barWidth,
      opacity,
      backgroundColor: colors.primary,
    };
  });

  return <Animated.View style={[styles.paginationBar, animatedBarStyle]} />;
};

export default function Onboarding() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef<FlatList>(null);

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/login');
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      router.replace('/login');
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Animated.FlatList
        data={SLIDES}
        renderItem={({ item, index }) => <Slide item={item} index={index} scrollX={scrollX} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />

      <View style={styles.footer}>
        <View style={styles.paginationContainer}>
          {SLIDES.map((_, i) => (
            <PaginationBar key={i.toString()} index={i} scrollX={scrollX} />
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.button, { shadowColor: colors.primary }]} 
          onPress={handleGetStarted} 
          activeOpacity={0.93}
        >
          <LinearGradient 
            colors={['#FF4D67', '#FF8A9B']} 
            style={styles.buttonGradient} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width,
    height: height,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  imageContainer: {
    width: width,
    height: height * 0.7,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  slideGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: height * 0.25,
    height: height * 0.55,
  },
  textContainer: {
    position: 'absolute',
    bottom: height * 0.25,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
  },
  tagContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 77, 103, 0.12)',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 103, 0.2)',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2.5,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 44,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 28,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 28,
    paddingBottom: 56,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  paginationBar: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 5,
  },
  button: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

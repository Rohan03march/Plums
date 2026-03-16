import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedScrollHandler, 
  useSharedValue, 
  FadeInDown, 
  FadeInRight,
  useAnimatedStyle,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Connect Instantly',
    description: 'Find online friends and start a conversation right away.',
    image: require('../assets/images/onboarding_1.png'),
  },
  {
    id: '2',
    title: 'High Quality Calls',
    description: 'Experience crystal clear audio and high definition video calls.',
    image: require('../assets/images/onboarding_2.png'),
  },
  {
    id: '3',
    title: 'Earn Rewards',
    description: 'Get platform coins and rewards for your time spent online.',
    image: require('../assets/images/onboarding_3.png'),
  },
];

const Slide = ({ item, index }: { item: any; index: number }) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.slide}>
      <Animated.Image 
        source={item.image}
        style={styles.image} 
        entering={FadeInRight.delay(100).duration(600).springify()}
      />
      <LinearGradient
        colors={['transparent', isDark ? 'rgba(15,15,19,0.8)' : 'rgba(248, 249, 250, 0.8)', colors.bg]}
        style={styles.gradient}
      />
      <View style={styles.textContainer}>
        <Animated.Text 
          entering={FadeInDown.delay(200).duration(600).springify()} 
          style={[styles.title, { color: colors.text }]}
        >
          {item.title}
        </Animated.Text>
        <Animated.Text 
          entering={FadeInDown.delay(300).duration(600).springify()} 
          style={[styles.description, { color: colors.subText }]}
        >
          {item.description}
        </Animated.Text>
      </View>
    </View>
  );
};

const PaginatorDot = ({ index, scrollX }: { index: number; scrollX: any }) => {
  const animatedDotStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    const dotWidth = interpolate(
      scrollX.value,
      inputRange,
      [10, 20, 10],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP
    );

    return {
      width: dotWidth,
      opacity,
    };
  });

  return <Animated.View style={[styles.dot, animatedDotStyle]} />;
};

export default function Onboarding() {
  const router = useRouter();
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const slidesRef = useRef(null);

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/login');
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
        renderItem={({ item, index }) => <Slide item={item} index={index} />}
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
        <View style={styles.paginator}>
          {SLIDES.map((_, i) => (
            <PaginatorDot key={i.toString()} index={i} scrollX={scrollX} />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleGetStarted} activeOpacity={0.8}>
          <LinearGradient colors={['#FF4D67', '#FF8A9B']} style={styles.buttonGradient} start={{x:0,y:0}} end={{x:1,y:0}}>
            <Text style={[styles.buttonText, { color: '#fff' }]}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f13',
  },
  slide: {
    width,
    height: height * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: height * 0.4,
  },
  textContainer: {
    position: 'absolute',
    bottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  footer: {
    height: height * 0.25,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  paginator: {
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4D67',
    marginHorizontal: 8,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

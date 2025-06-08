import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  ViewToken,
} from 'react-native';
import {
  Surface,
  Title,
  Paragraph,
  Button,
  useTheme,
} from 'react-native-paper';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Store
import { AppDispatch } from '../store';
import { setFirstLaunchCompleted } from '../store/slices/settingsSlice';

// Types
import { RootStackScreenProps } from '../types/navigation';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to FinSync360',
    description: 'Your complete ERP solution with seamless Tally integration for modern businesses.',
    icon: 'chart-line',
    color: '#2563eb',
  },
  {
    id: '2',
    title: 'Offline-First Design',
    description: 'Work anywhere, anytime. Your data syncs automatically when you\'re back online.',
    icon: 'cloud-sync',
    color: '#7c3aed',
  },
  {
    id: '3',
    title: 'Real-time Sync',
    description: 'Stay connected with your desktop and web applications. Changes sync instantly across all devices.',
    icon: 'sync',
    color: '#059669',
  },
  {
    id: '4',
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with biometric authentication and encrypted data storage.',
    icon: 'shield-check',
    color: '#dc2626',
  },
];

type Props = RootStackScreenProps<'Onboarding'>;

const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const flatListRef = useRef<FlatList>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = () => {
    dispatch(setFirstLaunchCompleted());
    // Navigation will be handled by AppNavigator based on auth state
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.slideContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
          <Icon
            name={item.icon}
            size={80}
            color={item.color}
          />
        </View>
        
        <Title style={[styles.title, { color: theme.colors.onSurface }]}>
          {item.title}
        </Title>
        
        <Paragraph style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          {item.description}
        </Paragraph>
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            {
              backgroundColor: index === currentIndex 
                ? theme.colors.primary 
                : theme.colors.outline,
              width: index === currentIndex ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      
      {renderPagination()}
      
      <Surface style={[styles.footer, { backgroundColor: theme.colors.surface }]} elevation={4}>
        <View style={styles.footerContent}>
          {currentIndex < slides.length - 1 ? (
            <>
              <Button
                mode="text"
                onPress={handleSkip}
                style={styles.skipButton}
              >
                Skip
              </Button>
              
              <Button
                mode="contained"
                onPress={handleNext}
                style={styles.nextButton}
                icon="arrow-right"
                contentStyle={styles.nextButtonContent}
              >
                Next
              </Button>
            </>
          ) : (
            <Button
              mode="contained"
              onPress={handleGetStarted}
              style={styles.getStartedButton}
              contentStyle={styles.getStartedButtonContent}
            >
              Get Started
            </Button>
          )}
        </View>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 120, // Space for footer
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s ease',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
    marginLeft: 16,
  },
  nextButtonContent: {
    height: 48,
    flexDirection: 'row-reverse',
  },
  getStartedButton: {
    flex: 1,
  },
  getStartedButtonContent: {
    height: 48,
  },
});

export default OnboardingScreen;

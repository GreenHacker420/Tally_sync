import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import {
  Title,
  Paragraph,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SplashScreen: React.FC = () => {
  const theme = useTheme();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Icon
          name="chart-line"
          size={100}
          color={theme.colors.onPrimary}
          style={styles.icon}
        />
        
        <Title style={[styles.title, { color: theme.colors.onPrimary }]}>
          FinSync360
        </Title>
        
        <Paragraph style={[styles.subtitle, { color: theme.colors.onPrimary }]}>
          ERP & Tally Integration
        </Paragraph>
      </Animated.View>
      
      <View style={styles.footer}>
        <Paragraph style={[styles.footerText, { color: theme.colors.onPrimary }]}>
          Powered by FinSync360 Team
        </Paragraph>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.9,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.8,
  },
});

export default SplashScreen;

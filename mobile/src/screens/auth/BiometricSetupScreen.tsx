import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { AuthStackScreenProps } from '../../types/navigation';

type Props = AuthStackScreenProps<'BiometricSetup'>;

const BiometricSetupScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Biometric Setup</Text>
      <Text variant="bodyLarge">Biometric setup screen - to be implemented</Text>
      <Button mode="contained" onPress={() => navigation.navigate('Login')}>
        Back to Login
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default BiometricSetupScreen;

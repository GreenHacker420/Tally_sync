import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Title, Paragraph, Button } from 'react-native-paper';
import { AuthStackScreenProps } from '../../types/navigation';

type Props = AuthStackScreenProps<'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Title>Register</Title>
      <Paragraph>Registration screen - to be implemented</Paragraph>
      <Button mode="contained" onPress={() => navigation.navigate('Login')}>
        Go to Login
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

export default RegisterScreen;

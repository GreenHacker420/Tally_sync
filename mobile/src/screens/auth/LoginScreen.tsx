import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Title,
  Paragraph,
  Checkbox,
  Surface,
  useTheme,
  HelperText,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Store
import { AppDispatch, RootState } from '../../store';
import { login, verifyBiometric, clearError } from '../../store/slices/authSlice';

// Services
import { authService } from '../../services';

// Types
import { AuthStackScreenProps } from '../../types/navigation';
import { LoginCredentials } from '../../types';

type Props = AuthStackScreenProps<'Login'>;

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginForm>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    checkBiometricAvailability();
    
    // Clear any previous errors
    dispatch(clearError());
  }, [dispatch]);

  const checkBiometricAvailability = async () => {
    const available = await authService.isBiometricAvailable();
    setBiometricAvailable(available);
  };

  const onSubmit = async (data: LoginForm) => {
    try {
      const credentials: LoginCredentials = {
        email: data.email.toLowerCase().trim(),
        password: data.password,
        rememberMe: data.rememberMe,
      };

      await dispatch(login(credentials)).unwrap();
    } catch (error: any) {
      Alert.alert('Login Failed', error || 'Please check your credentials and try again.');
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await dispatch(verifyBiometric()).unwrap();
      
      if (result.success && result.credentials) {
        await dispatch(login(result.credentials)).unwrap();
      }
    } catch (error: any) {
      Alert.alert('Biometric Login Failed', error || 'Please try again or use password login.');
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Icon
            name="account-circle"
            size={80}
            color={theme.colors.primary}
          />
          <Title style={styles.title}>Welcome Back</Title>
          <Paragraph style={styles.subtitle}>
            Sign in to your FinSync360 account
          </Paragraph>
        </View>

        <Surface style={styles.formContainer} elevation={2}>
          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={!!errors.email}
                  left={<TextInput.Icon icon="email" />}
                  style={styles.input}
                />
              )}
            />
            {errors.email && (
              <HelperText type="error" visible={!!errors.email}>
                {errors.email.message}
              </HelperText>
            )}

            <Controller
              control={control}
              name="password"
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  error={!!errors.password}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  style={styles.input}
                />
              )}
            />
            {errors.password && (
              <HelperText type="error" visible={!!errors.password}>
                {errors.password.message}
              </HelperText>
            )}

            <View style={styles.checkboxContainer}>
              <Controller
                control={control}
                name="rememberMe"
                render={({ field: { onChange, value } }) => (
                  <Checkbox.Item
                    label="Remember me"
                    status={value ? 'checked' : 'unchecked'}
                    onPress={() => onChange(!value)}
                    labelStyle={styles.checkboxLabel}
                  />
                )}
              />
            </View>

            {error && (
              <HelperText type="error" visible={!!error} style={styles.errorText}>
                {error}
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
            >
              Sign In
            </Button>

            {biometricAvailable && (
              <Button
                mode="outlined"
                onPress={handleBiometricLogin}
                disabled={isLoading}
                style={styles.biometricButton}
                contentStyle={styles.buttonContent}
                icon="fingerprint"
              >
                Use Biometric
              </Button>
            )}

            <Button
              mode="text"
              onPress={handleForgotPassword}
              disabled={isLoading}
              style={styles.forgotButton}
            >
              Forgot Password?
            </Button>
          </View>
        </Surface>

        <View style={styles.footer}>
          <Paragraph style={styles.footerText}>
            Don't have an account?{' '}
          </Paragraph>
          <Button
            mode="text"
            onPress={handleRegister}
            disabled={isLoading}
            compact
          >
            Sign Up
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  formContainer: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  checkboxContainer: {
    marginLeft: -8,
  },
  checkboxLabel: {
    fontSize: 14,
  },
  errorText: {
    textAlign: 'center',
    marginTop: -8,
  },
  loginButton: {
    marginTop: 8,
  },
  biometricButton: {
    marginTop: 8,
  },
  forgotButton: {
    marginTop: 8,
  },
  buttonContent: {
    height: 48,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
});

export default LoginScreen;

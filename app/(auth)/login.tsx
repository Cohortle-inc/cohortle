import {
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Text } from '@/theme/theme';
import { Button } from '@/components/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Eye, EyeOff } from 'lucide-react-native'; // or another icon library
import { useGetProfile } from '@/api/getProfile';

type Props = {};
const apiURL = process.env.EXPO_PUBLIC_API_URL;

const LoginScreen = (props: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // const { data: profileData } = useGetProfile()

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async () => {
    if (!email) {
      setError('Email is required.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${apiURL}/v1/api/auth/login`, {
        email,
        password,
      });

      const result = response.data;

      if (!result.error) {
        // Store token securely
        await AsyncStorage.setItem('authToken', result.token);
        console.log(result.token);

        const userRole = result.user.role;

        if (userRole === 'convener') {
          router.replace('/convener-screens/(cohorts)');
        } else {
          router.replace('/student-screens/cohorts');
        }
      } else {
        setError(result.message || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        const errorMessage =
          err.response?.data?.message || 'Login failed. Please try again.';
        setError(errorMessage);
        console.log('Login error:', err.response?.data);
      } else {
        console.error('Unexpected error:', err);
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <Text variant={'l'} style={styles.header}>
          Login
        </Text>
        <Text style={styles.subtitle}>
          Enter your email and password to continue
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            editable={!loading}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              editable={!loading}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color="#666" />
              ) : (
                <Eye size={20} color="#666" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.buttonContainer}>
          <Button
            text={loading ? 'Logging in...' : 'Login'}
            onPress={handleSubmit}
            disabled={loading}
          />
          {loading && (
            <ActivityIndicator style={styles.loader} color="#0000ff" />
          )}
        </View>

        <TouchableOpacity
          style={styles.signupLink}
          onPress={() => router.push('/(auth)/email-confirmation')}
        >
          <Text style={styles.signupText}>
            Don't have an account?{' '}
            <Text style={styles.signupHighlight}>Sign up</Text>
          </Text>
        </TouchableOpacity>
        <Text>0.1</Text>
      </View>
    </SafeAreaWrapper>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontWeight: 'bold',
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderRadius: 8,
    padding: 15,
    borderColor: '#ddd',
    borderWidth: 1,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  buttonContainer: {
    marginTop: 10,
    position: 'relative',
  },
  loader: {
    position: 'absolute',
    right: 20,
    top: 15,
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
  signupLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  signupText: {
    color: '#666',
  },
  signupHighlight: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

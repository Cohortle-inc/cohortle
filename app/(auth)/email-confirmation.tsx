import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Text } from '@/theme/theme';
import { Button } from '@/components/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors } from '@/utils/color';

type Props = {};
const apiURL = process.env.EXPO_PUBLIC_API_URL;

type EmailResponse = {
  error: boolean;
  message?: string;
  link: string;
};
const EmailConfirmation = (props: Props) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    if (!firstName || !lastName) {
      setError('First name and last name are required.');
      return;
    }
    if (!password || !confirmPassword) {
      setError('Password and confirm password are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${apiURL}/v1/api/auth/register-email`,
        { email, password, first_name: firstName, last_name: lastName },
      );
      if (!response.data.error) {
        router.navigate({
          pathname: '/(auth)/signUp',
          params: { 
            token: response.data.token,
            firstName: firstName,
            lastName: lastName
          },
        });
        console.log('sent!');
      } else {
        setError('Failed to send confirmation email. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.log(err, 'error');
      console.log(apiURL)
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <View style={{ alignItems: 'center', gap: 12, marginTop: 20 }}>

          <Text variant={'l'} style={styles.header}>
            Sign up for Cohortle
          </Text>

          <Text>Fill in the field to create an account</Text>
          {/* <Text>We'll send you a quick email to confirm your address.</Text> */}

        </View>
        <ScrollView style={{ gap: 5, marginTop: 40 }}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              placeholder="Enter your first name"
              placeholderTextColor="#999"
              editable={!loading}
              onChangeText={setFirstName}
              autoCapitalize="none"
              keyboardType='default'
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              placeholder="Enter your last name"
              placeholderTextColor="#999"
              editable={!loading}
              onChangeText={setLastName}
              // autoCapitalize="none"
              keyboardType="default"
            />
          </View>
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
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                placeholder="Confirm password"
                placeholderTextColor="#999"
                editable={!loading}
                onChangeText={setConfirmPassword}
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
        </ScrollView>
        <View style={{ marginTop: 36 }}>
          <Button
            disabled={loading}
            text={!loading ? 'Next' : 'Creating account...'}
            onPress={handleSubmit}
          />
        </View>
        {error && <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>}
      </View>
    </SafeAreaWrapper>
  );
};

export default EmailConfirmation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    fontWeight: 'bold',
    color: colors.primary,
  },

  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
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

  input: {
    borderRadius: 8,
    padding: 15,
    borderColor: '#ddd',
    borderWidth: 1,
    fontSize: 16,
  },
});

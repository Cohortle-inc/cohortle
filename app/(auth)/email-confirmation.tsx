import { StyleSheet, TextInput, View } from 'react-native';
import React from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Text } from '@/theme/theme';
import { Button } from '@/components/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import axios, { AxiosError } from 'axios';

type Props = {};
const apiURL = process.env.EXPO_PUBLIC_API_URL;

type EmailResponse = {
  error: boolean;
  message?: string;
  link: string
}
const EmailConfirmation = (props: Props) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async () => {
    if (!email) {
      setError("Email is required.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`http://172.20.10.3:3048/v1/api/auth/register-email`, 
        { email }
      );
      if (!response.data.error) {
        router.navigate({
          pathname: '/(auth)/check-email',
          params: { email }
        });
        console.log("sent!")
      } else {
        setError("Failed to send confirmation email. Please try again.");
      }
    }
     catch (err) {
        setError("An unexpected error occurred");
        console.log("9")
      
    } finally {
      setLoading(false);
    }
    
  }
  
  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <Text variant={'l'} style={styles.header}>Your email address</Text>
        <Text>We'll send you a quick email to confirm your address.</Text>
        <TextInput 
          style={styles.input}
          value={email}
          editable={!loading}
          onChangeText={setEmail}
        />
        <View style={{ marginTop: 36 }}>
          <Button
            text="Next"
            onPress={handleSubmit}
          />
        </View>
        {error && <Text style={{color: "red", marginTop: 10}}>{error}</Text>}
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
  input: {
    borderRadius: 5,
    paddingHorizontal: 4,
    borderColor: "black",
    borderWidth: 1
  },
  header: {
    fontWeight: "bold"
  },
});

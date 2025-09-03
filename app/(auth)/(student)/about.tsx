import { Pressable, StyleSheet, View, Alert } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { CustomCheckbox, DropdownInput, Input } from '@/components/Form';
import { Header } from '@/ui';
import { Text } from '@/theme/theme';
import { BackArrowIcon } from '@/assets/icons';
import { Link, router, useLocalSearchParams } from 'expo-router'; // Assuming you have an auth context
import axios from 'axios';

const About = () => {
  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
  });
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const token = useLocalSearchParams<{token: string}>(); // Get token from auth context
  const apiURl = process.env.EXPO_PUBLIC_API_URL;
  const handleUpdate = (field: string, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!isChecked) {
      Alert.alert('Please accept terms and conditions');
      return;
    }

    setLoading(true);
    console.log(token.token)
    try {
      const response = await axios.put(`${apiURl}/v1/api/profile`,
        {
          first_name: data.firstName,
          last_name: data.lastName,
          username: data.username, // should come from user data
          password: data.password, // should come from secure input
        },
        {
          headers: {
            Authorization: `Bearer ${token.token}`, // use token.token
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.data;

      if (!response.data.error) {
        router.push('/personal-info');
      }
      console.log(result);
    } catch (error) {
      console.log('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
        <Header number={1} total={2} />
        <View>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 18,
              fontFamily: 'DMSansMedium',
              marginBottom: 80,
            }}
          >
            Tell us about yourself 😄
          </Text>
        </View>
        
        <View style={{ gap: 24 }}>
          <Input
            label="First Name"
            placeholder="First name"
            value={data.firstName}
            onChangeText={(value: string) => handleUpdate('firstName', value)}
          />
          <Input
            label="Last Name"
            placeholder="Last name"
            value={data.lastName}
            onChangeText={(value: string) => handleUpdate('lastName', value)}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            alignContent: 'center',
            marginTop: 80,
          }}
        >
          <CustomCheckbox
            checked={isChecked}
            onToggle={() => setIsChecked(!isChecked)}
          />
          <Text>
            I agree to the{' '}
            <Text style={{ textDecorationLine: 'underline', color: '#391D65' }}>
              terms{' '}
            </Text>
            and{' '}
            <Text style={{ textDecorationLine: 'underline', color: '#391D65' }}>
              read
            </Text>{' '}
            the privacy policy.
          </Text>
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={{
            borderWidth: 1,
            borderColor: '#F8F1FF',
            paddingVertical: 14,
            alignItems: 'center',
            borderRadius: 32,
            marginTop: 48,
            backgroundColor: loading ? '#cccccc' : '#391D65',
          }}
        >
          <Text style={{ color: '#fff' }}>{loading ? 'Processing...' : 'Next'}</Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={{
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 32,
            flexDirection: 'row',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          <BackArrowIcon />
          <Text style={{ color: '#391D65' }}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaWrapper>
  );
};

export default About;

const styles = StyleSheet.create({});
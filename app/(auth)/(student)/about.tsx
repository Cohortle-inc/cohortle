import { Pressable, StyleSheet, View } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { CustomCheckbox, DropdownInput, Input } from '@/components/Form';
import { Header } from '@/ui';
import { Text } from '@/theme/theme';
import { BackArrowIcon } from '@/assets/icons';
import { Link } from 'expo-router';

const About = () => {
  const [isChecked, setIsChecked] = useState(false);
  return (
    <SafeAreaWrapper>
      <View style={{ marginTop: 24 }}>
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
          <Input label="Full Name" placeholder="Full name" />
          <Input label="Password" placeholder="Password" />
          <Input label="Re-type Password" placeholder="Password" />
        </View>
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
      <Link asChild href="/personal-info">
        <Pressable
          style={{
            borderWidth: 1,
            borderColor: '#F8F1FF',
            paddingVertical: 14,
            alignItems: 'center',
            borderRadius: 32,
            marginTop: 48,
            backgroundColor: '#391D65',
          }}
        >
          <Text style={{ color: '#fff' }}>next</Text>
        </Pressable>
      </Link>
      <Pressable
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
    </SafeAreaWrapper>
  );
};

export default About;

const styles = StyleSheet.create({});

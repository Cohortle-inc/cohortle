import { Pressable, StyleSheet, View } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { DropdownInput, Input } from '@/components/Form';
import { Header } from '@/ui';
import { Text } from '@/theme/theme';
import { BackArrowIcon } from '@/assets/icons';
import { Link } from 'expo-router';

const MoreInfo = () => {
  return (
    <SafeAreaWrapper>
      <View style={{ marginTop: 24 }}>
        <Header number={3} />
        <View>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 18,
              fontFamily: 'DMSansMedium',
              marginBottom: 8,
              color: '#B085EF',
            }}
          >
            We want to know more...
          </Text>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 14,
              fontFamily: 'DMSansMedium',
              marginBottom: 32,
              color: '#B085EF',
            }}
          >
            We’d love to give you the best onboarding experience!
          </Text>
        </View>
        <View style={{ gap: 24 }}>
          <DropdownInput />
          <DropdownInput />
          <Input label="Community URL" placeholder="muhammads-community" />
        </View>
      </View>

      <Link asChild href="/convener-screens">
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

export default MoreInfo;

const styles = StyleSheet.create({});

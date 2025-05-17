import { Back, Plus } from '@/assets/icons';
import { SafeAreaWrapper } from '@/HOC';
import { useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Text, View } from 'react-native';

type Props = {};

const Index = (props: Props) => {
  const router = useRouter();
  return (
    <SafeAreaWrapper>
      <View style={{ backgroundColor: 'white', marginVertical: 16 }}>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Back />
          </TouchableOpacity>
          <Text
            style={{
              color: '#391D65',
              fontFamily: 'DMSansSemiBold',
              marginLeft: 16,
            }}
          >
            Branding & Branding Design
          </Text>
          <TouchableOpacity style={{ marginLeft: 'auto' }}>
            <Plus />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text
          style={{
            color: '#1F1F1F',
            fontSize: 20,
            fontFamily: 'DMSansSemiBold',
            marginBottom: 8,
          }}
        >
          No lessons yet
        </Text>
        <Text style={{ color: '#1F1F1F', textAlign: 'center', fontSize: 14 }}>
          Create lessons and let the discussion begin. Create lessons for
          different topics to help members connect and engage.
        </Text>
        <TouchableOpacity
          style={{
            borderWidth: 1,
            borderColor: '#F8F1FF',
            paddingVertical: 14,
            alignItems: 'center',
            borderRadius: 24,
            marginTop: 24,
            backgroundColor: '#391D65',
            width: 200,
          }}
        >
          <Text style={{ color: '#fff', fontFamily: 'DMSansSemiBold' }}>
            Create a lesson
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaWrapper>
  );
};

export default Index;

import {
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Text } from '@/theme/theme';
import { Plus } from '@/assets/icons';
import { useRouter } from 'expo-router';

const Community = () => {
  return (
    <SafeAreaWrapper>
      <View style={{ flex: 1, backgroundColor: 'white', marginVertical: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: '#B085EF' }}>Cohortly</Text>
          <Pressable>
            <Plus />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={{
            alignContent: 'center',
            paddingVertical: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Course />
          <Course />
          <Course />
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
};

export default Community;

const Course = () => {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push('/student-screens/cohorts/course')}
      style={{
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ECDCFF',
        padding: 16,
        borderRadius: 8,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            backgroundColor: '#353FCC',
            width: 24,
            height: 24,
            borderRadius: 8,
          }}
        ></View>
        <Text
          style={{
            fontSize: 10,
            fontWeight: '600',
            color: '#1F1F1F',
          }}
        >
          Sadiq Bilyamin
        </Text>
      </View>
      <View>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#1F1F1F',
            marginTop: 8,
          }}
        >
          Name of course
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={{ color: '#1F1F1F', fontSize: 10, marginTop: 4 }}>
            Module 2/5
          </Text>
          <Text
            style={{
              color: '#1F1F1F',
              fontSize: 15,
            }}
          >
            ~
          </Text>

          <Text style={{ color: '#1F1F1F', fontSize: 10, marginTop: 4 }}>
            32%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({});

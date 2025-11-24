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
import { useGetLearnerCohorts } from '@/api/learners/cohortsJoined';
import { CommunityType } from '@/api/communities/postCommunity';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CommunityData {
  id: string;
  cohort_id: number;
  community_owner: number;
  created_at: string;
  description: string;
  first_name: string;
  last_name: string;
  module_count: number;
  name: string;
  status: string;
  sub_type: string;
  thumbnail: string | null;
  type: string;
  updated_at: string;
}

const Community = () => {
  const {data: communityData, isLoading: communityLoading} = useGetLearnerCohorts()
  // const {data}
  console.log("KKK: ", communityData)
  return (
    <SafeAreaWrapper>
      <View style={{ flex: 1, backgroundColor: 'white', marginVertical: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: '#B085EF' }}>Cohortle</Text>
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
          {!communityLoading && communityData && (
            <View>
              {communityData.map((data: any, index: number) => (
                <View key={data.id || index} style={{}}>
                  <Course {...data} />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
};

export default Community;

const Course = (community: CommunityData) => {
  const router = useRouter();
  const handlePress = async () => {
    await AsyncStorage.setItem("communityID", String(community.id))
    await AsyncStorage.setItem("communityaName", String(community.name))
    // await AsyncStorage.setItem("communityID", String(community.id))
    router.navigate('/student-screens/cohorts/course')
    // await AsyncStorage.setItem()
  }
  return (
    <TouchableOpacity
      onPress={() => {handlePress()}}
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
          {community.first_name} {community.last_name}
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
          {community.name}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={{ color: '#1F1F1F', fontSize: 10, marginTop: 4 }}>
            Modules: {community.module_count}
          </Text>
          <Text
            style={{
              color: '#1F1F1F',
              fontSize: 15,
            }}
          >
            ~
          </Text>

          {/* <Text style={{ color: '#1F1F1F', fontSize: 10, marginTop: 4 }}>
            0%
          </Text> */}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({});

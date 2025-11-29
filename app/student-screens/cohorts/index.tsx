import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Text } from '@/theme/theme';
import { Plus } from '@/assets/icons';
import { useRouter } from 'expo-router';
import { useGetLearnerCohorts } from '@/api/learners/cohortsJoined';
import { CommunityType } from '@/api/communities/postCommunity';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/utils/color';
import { useJoinCohort } from '@/api/cohorts/joinCohorts';

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
  const { data: communityData, isLoading: communityLoading } =
    useGetLearnerCohorts();
  // const {data}
  console.log('KKK: ', communityData);
  const [code, setCode] = useState('');
  const { mutate: joinMutation, isPending: joinPending } = useJoinCohort();

  const handleJoin = () => {
    if (!code.trim()) {
      Alert.alert('Invalid Code', 'Please enter a valid join code.');
      return;
    }

    joinMutation(code.trim());
  };
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
          {communityLoading ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <ActivityIndicator size="large" color="#391D65" />
              <Text
                style={{
                  color: '#666',
                  fontSize: 16,
                  fontFamily: 'DMSansMedium',
                }}
              >
                Loading your cohorts...
              </Text>
            </View>
          ) : communityData.length > 0 ? (
            <View>
              {communityData.map((data: any, index: number) => (
                <View key={data.id || index}>
                  <Course {...data} />
                </View>
              ))}
            </View>
          ) : (
            // Optional: Handle empty state when not loading and no data
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: '#666',
                  fontSize: 16,
                  fontFamily: 'DMSansMedium',
                }}
              >
                No cohorts found.
              </Text>
              <View style={{ width: '100%', gap: 5 }}>
                <Text style={{ textAlign: 'center' }}>
                  Enter a Cohort Code to get Started
                </Text>
                <TextInput
                  placeholder="Enter Join Code"
                  value={code}
                  onChangeText={setCode}
                  style={{
                    borderWidth: 2,
                    borderRadius: 5,
                    borderColor: colors.purpleShade,
                    fontSize: 16,
                    padding: 5,
                  }}
                />
                <Pressable
                  onPress={handleJoin}
                  style={{
                    width: '100%',
                    paddingVertical: 10,
                    backgroundColor: colors.primary,
                    borderRadius: 5,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white' }}>
                    {joinPending ? 'Joining...' : 'Join Cohort'}
                  </Text>
                </Pressable>
              </View>
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
    await AsyncStorage.setItem('communityID', String(community.id));
    await AsyncStorage.setItem('communityName', String(community.name));
    await AsyncStorage.setItem(
      'description',
      String(community.description),
    );
    await AsyncStorage.setItem(
      'convenerName',
      `${community.first_name} ${community.last_name}`,
    );
    router.navigate('/student-screens/cohorts/course');
    // await AsyncStorage.setItem()
  };
  return (
    <TouchableOpacity
      onPress={() => {
        handlePress();
      }}
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

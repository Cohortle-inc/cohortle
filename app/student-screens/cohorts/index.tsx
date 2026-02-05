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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/utils/color';
import { useJoinCommunity } from '@/hooks/api/useJoinCommunity';

interface CommunityData {
  id: string;
  name: string;
  type: string;
  description: string;
  thumbnail: string | null;
  status: string;
  unique_code: string;
  member_role: string;
  joined_at: string;
  programme_count: number;
}

const Community = () => {
  const { data: communityData, isLoading: communityLoading } = useGetLearnerCohorts();
  console.log(communityData);
  const [code, setCode] = useState('');
  const { mutate: joinCommunity, isPending: joinPending } = useJoinCommunity();

  const handleJoin = () => {
    if (!code.trim()) {
      Alert.alert('Invalid Code', 'Please enter a valid join code.');
      return;
    }
    joinCommunity(code);
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
          ) : communityData && communityData.length > 0 ? (
            <View>
              {communityData.map((data: CommunityData, index: number) => (
                <View key={data.id || index}>
                  <Course {...data} />
                </View>
              ))}
            </View>
          ) : (
            // Optional: Handle empty state when not loading and no data
            <View style={{ display: 'flex', height: '100vh' }}>
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
                  No communities found.
                </Text>
                <View style={{ width: '100%', gap: 5 }}>
                  <Text style={{ textAlign: 'center' }}>
                    Enter a Community Code to get Started
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
                    disabled={joinPending}
                  >
                    <Text style={{ color: 'white' }}>
                      {joinPending ? 'Joining...' : 'Join Cohort'}
                    </Text>
                  </Pressable>
                </View>
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
    router.push({
      pathname: '/student-screens/cohorts/programmes',
      params: { communityID: community.id },
    });
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
          <Text
            style={{
              color: '#1F1F1F',
              fontSize: 15,
            }}
          >
            ~ {community.programme_count} Programmes
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

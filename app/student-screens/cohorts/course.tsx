import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Back, Check, Close, Options, RedDoor } from '@/assets/icons';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import { BottomSheet } from '@/components/ui';
// import { CheckBox } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useGetModules from '@/api/communities/modules/getModules';
import { useGetLessons } from '@/api/communities/lessons/getLessons';
import { useGetPublishedLessons } from '@/api/communities/lessons/publishedLessons';
import { colors } from '@/utils/color';
import { useProgrammeMembership } from '@/hooks/useProgrammeMembership';
import CohortSelection from '@/components/cohorts/CohortSelection';
import AssignmentIndicator from '@/components/assignments/AssignmentIndicator';

type ModuleType = {
  id: number;
  title: string;
  status: string;
  order_number: number;
  community_id: number;
  created_at: string;
  updated_at: string;
};

const Course = () => {
  const { programmeID } = useLocalSearchParams<{ programmeID: string }>();
  const [activeTab, setActiveTab] = useState('Home');
  const numbers = Array.from({ length: 20 }, (_, i) => i + 1);
  const [isSheetVisible, setSheetVisible] = useState(false);
  const [communityId, setCommunityId] = useState<string | null>(null);
  const { title } = useLocalSearchParams<{ title: string }>();
  const { description } = useLocalSearchParams<{ description: string }>();
  const { type } = useLocalSearchParams<{ type: string }>();

  // Check membership
  const {
    data: membershipData,
    isLoading: isLoadingMembership,
    refetch: refetchMembership
  } = useProgrammeMembership(Number(programmeID));

  useEffect(() => {
    if (membershipData?.cohortId) {
      AsyncStorage.setItem('currentCohortID', String(membershipData.cohortId));
    }
  }, [membershipData?.cohortId]);

  const isMember = membershipData?.isMember;

  const { data: moduleData = [] } = useGetModules(isMember ? Number(programmeID) : null);
  const [module, setModule] = useState<number | null>(null);
  const cohortIdNum = membershipData?.cohortId ? Number(membershipData.cohortId) : null;
  const { data: lessonData = [] } = useGetPublishedLessons(module, cohortIdNum);

  console.log(lessonData);

  useEffect(() => {
    if (moduleData && moduleData.length > 0) {
      setModule(moduleData[1]?.id || moduleData[0].id);
    }
  }, [moduleData]);

  if (isLoadingMembership) {
    return (
      <SafeAreaWrapper>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 24,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Back />
        </TouchableOpacity>
        <Text style={{ fontSize: 10, fontWeight: 'semibold' }}>{title}</Text>
        <TouchableOpacity onPress={() => setSheetVisible(true)}>
          <Options />
        </TouchableOpacity>
      </View>
      <View>
        <Text
          style={{
            fontSize: 32,
            fontWeight: '600',
            marginBottom: 4,
          }}
        >
          {title}
        </Text>
        <Text style={{ color: colors.primary }} onPress={() => { }}>{type}</Text>
      </View>
      <View style={{ flex: 1 }}>
        {/* Tab Bar */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab('Home')}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}
          >
            <Text
              style={{
                borderBottomWidth: activeTab === 'Home' ? 3 : 0,
                borderColor: activeTab === 'Home' ? '#000' : '#ccc',
                paddingBottom: 6,
                fontWeight: activeTab === 'Home' ? 'bold' : 'normal',
              }}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('Info')}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}
          >
            <Text
              style={{
                borderBottomWidth: activeTab === 'Info' ? 3 : 0,
                borderColor: activeTab === 'Info' ? '#000' : '#ccc',
                paddingBottom: 6,
                fontWeight: activeTab === 'Info' ? 'bold' : 'normal',
              }}
            >
              Info
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View>
          {activeTab === 'Home' ? (
            <View>
              {!isMember ? (
                <CohortSelection
                  programmeId={Number(programmeID)}
                  onJoinSuccess={refetchMembership}
                />
              ) : (
                <View>
                  <Text>Modules</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {moduleData
                      .slice()
                      .sort((a: ModuleType, b: ModuleType) => a.id - b.id)
                      .map((mod: ModuleType) => (
                        <TouchableOpacity
                          onPress={() => setModule(mod.id)}
                          key={mod.id}
                          style={[
                            mod.id === module && { backgroundColor: 'purple' },
                            {
                              flexDirection: 'row',
                              gap: 4,
                              borderWidth: 1,
                              borderColor: '#DABCFF',
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 12,
                              marginRight: 8,
                              marginTop: 8,
                              minWidth: 32,
                              alignItems: 'center',
                              justifyContent: 'center',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              mod.id === module && { color: '#DABCFF' },
                              { fontSize: 10 },
                            ]}
                          >
                            {mod.title}
                          </Text>
                          <Check color="#DABCFF" />
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                  <View style={{ marginTop: 16 }}>
                    {/* <Module />
                  <Module />
                  <Module /> */}
                    {lessonData
                      ?.filter(
                        (lesson: LessonProp) => lesson.status === 'published',
                      ) // Only published
                      .sort((a: LessonProp, b: LessonProp) => a.id - b.id) // Sort by order
                      .map((lesson: LessonProp) => (
                        <Lesson key={lesson.id} {...lesson} />
                      ))}
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View>
              <View></View>
              <Text style={{ fontWeight: 'bold' }}>Course Description</Text>
              <Text style={{ marginTop: 8, fontSize: 12, letterSpacing: 1 }}>
                {description}
              </Text>
            </View>
          )}
        </View>
      </View>
      <BottomSheet
        isVisible={isSheetVisible}
        onClose={() => setSheetVisible(false)}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 24,
          }}
        >
          <Text style={{ fontWeight: 'bold' }}>Options</Text>
          <TouchableOpacity onPress={() => setSheetVisible(false)}>
            <Close />
          </TouchableOpacity>
        </View>
        <View>
          <TouchableOpacity
            style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}
          >
            <RedDoor />
            <Text style={{ color: '#EE3D3E' }}>Unenroll from cohort</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={{
            marginTop: 24,
            borderWidth: 1,
            borderColor: '#ECDCFF',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
          }}
          onPress={() => setSheetVisible(false)}
        >
          <Text style={{ fontWeight: 'bold', color: '#211E8A' }}>Close</Text>
        </TouchableOpacity>
      </BottomSheet>
    </SafeAreaWrapper>
  );
};

interface LessonProp {
  id: number;
  description: string;
  module_id: string;
  name: string;
  media: string;
  order_number: string;
  status: string;
  text: string;
  completed?: boolean;
}
const Lesson = (lesson: LessonProp) => {
  const router = useRouter();
  const [checkedModule, setCheckedModule] = useState(false);

  const handlePress = async () => {
    console.log('leading');
    await AsyncStorage.setItem('media', lesson.media || '');
    console.log('leading');
    console.log(lesson.media);
    console.log('leading');
    await AsyncStorage.setItem('name', lesson.name || 'Untitled Lesson');
    await AsyncStorage.setItem('text', lesson.text || '');
    await AsyncStorage.setItem('lessonId', String(lesson.id));
    await AsyncStorage.setItem('lessonCompleted', String(lesson.completed || false));
    router.push({
      pathname: '/student-screens/cohorts/module',
      params: {
        lessonId: lesson.id,
        cohortId: await AsyncStorage.getItem('currentCohortID')
      }
    });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        width: '100%',
        marginBottom: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#ECDCFF',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '600' }}>{lesson.name}</Text>

        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          {lesson.media && lesson.text ? (

            <Text
              style={{
                borderWidth: 1,
                borderColor: '#ECDCFF',
                padding: 4,
                borderRadius: 4,
                fontSize: 10,
              }}
            >
              Video/Text
            </Text>
          ) : lesson.media ? (
            <Text
              style={{
                borderWidth: 1,
                borderColor: '#ECDCFF',
                padding: 4,
                borderRadius: 4,
                fontSize: 10,
              }}
            >
              Video
            </Text>

          ) : (

            <Text
              style={{
                borderWidth: 1,
                borderColor: '#ECDCFF',
                padding: 4,
                borderRadius: 4,
                fontSize: 10,
              }}
            >
              Text
            </Text>
          )}
          
          {/* Assignment Indicator */}
          <AssignmentIndicator lessonId={String(lesson.id)} isStudent={true} />
          {/* <Text
            style={{
              borderWidth: 1,
              borderColor: '#ECDCFF',
              padding: 4,
              borderRadius: 4,
              fontSize: 10,
            }}
          >
            2 min
          </Text> */}
        </View>
      </View>

      {lesson.completed && (
        <View style={{ marginLeft: 8 }}>
          <Check color={colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default Course;

const styles = StyleSheet.create({});

import { Back, Close, Options, Plus, PlusSmall } from '@/assets/icons';
import { Input } from '@/components/Form';
import { SafeAreaWrapper } from '@/HOC';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Text, View } from 'react-native';
import Modal from 'react-native-modal';
import { X } from 'lucide-react-native';
import { combine } from 'zustand/middleware';
import { usePostCommunity } from '@/api/communities/postCommunity';
import { CommunityType } from '@/api/communities/postCommunity';
import useGetCommunities from '@/api/communities/getCommunities';

interface CreateCommunityHandlerOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: unknown) => void;
}
interface CreateCommunityPayload {
  cohort_id: number;
  name: string;
  description: string;
  sub_type: string;
  // sub_type?: string;
}

interface CommunityResponse {
  id: number;
  name: string;
  description: string;
  sub_type: string;
  // Add other fields as returned by the API
}

type Props = {};
const courseOptions = [
  {
    key: 'self_paced',
    title: 'Self-paced',
    description: 'Learners can start immediately and learn at their own pace',
  },
  {
    key: 'structured',
    title: 'Structured',
    description: 'Learning follows a structured, guided path with milestones',
  },
  {
    key: 'scheduled',
    title: 'Scheduled',
    description: 'Courses run on a set schedule with live sessions',
  },
];
const getButtonStyle = (isActive: any) => ({
  width: 270, // fallback for string percentage, but better to use number below
  marginTop: 20,
  borderWidth: 1,
  backgroundColor: isActive ? '#EDE9FE' : 'white',
  padding: 12,
  borderRadius: 8,
  borderColor: isActive ? '#391D65' : 'black',
});
const Index = (props: Props) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sub_type: '',
  });

  const [courseType, setCourseType] = useState('self-paced');
  const [nextModal, setNextModal] = useState(false);
  const router = useRouter();
  const [isModalVisible, setModalVisible] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [step, setStep] = useState(1);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [cohortGroup, setCohortGroup] = useState('Branding & Branding Design');
  const [communityAccess, setCommunityAccess] = useState(false);
  const { id } = useLocalSearchParams<{ id: string }>(); // cohort id
  const numericId = Number(id);

  const apiURL = process.env.EXPO_PUBLIC_API_URL as string;

  console.log(apiURL);
  const { mutate: createCommunity } = usePostCommunity(numericId);
  const { data: communities = [] } = useGetCommunities(numericId);
  const handleStep = () => {
    setStep(step + 1);
  };

  console.log('Sol', communities);

  const createCommunityHandler = () => {
    // Validate required fields
    if (
      !formData.name.trim() ||
      !formData.description.trim() ||
      !formData.sub_type.trim()
    ) {
      alert('Please fill in all required fields');
      return;
    }

    const payload: CreateCommunityPayload = {
      cohort_id: numericId,
      name: formData.name,
      description: formData.description,
      sub_type: formData.sub_type,
      // Remove sub_type from payload
    };

    createCommunity(payload, {
      onSuccess: (data: any) => {
        console.log('Community created successfully:', data);
        // Close modal and reset form
        setModalVisible(false);
        setFormData({
          name: '',
          description: '',
          sub_type: 'structured',
        });
        setStep(1);
        // Optionally refresh communities list or navigate
        alert('Community created successfully!');
      },
      onError: (error: any) => {
        console.error('Error creating community:', error);
        // Show specific error message if available
        const errorMessage =
          error.response?.data?.message || 'Failed to create community';
        alert(`Error: ${errorMessage}`);
      },
    });
  };

  const handleSheetChanges = useCallback((index: number) => {
    // Update state based on the index value
    console.log(index);
    // If index is greater than -1, sheet is active
  }, []);
  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };
  const openBottomSheet = () => {
    bottomSheetRef.current?.expand();
  };

  const renderBackdrop = useCallback(
    (
      props: React.JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps,
    ) => <BottomSheetBackdrop {...props} opacity={0.7} />,
    [],
  );

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
          <TouchableOpacity
            onPress={toggleModal}
            style={{ marginLeft: 'auto' }}
          >
            <Plus />
          </TouchableOpacity>
        </View>
      </View>
      {communities.length > 0 ? (
        <ScrollView
          contentContainerStyle={{ paddingVertical: 16, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {communities.map((community: CommunityType) => (
            <Community {...community} onOpenBottomSheet={openBottomSheet} />
          ))}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginTop: 16,
            }}
            onPress={toggleModal}
          >
            <PlusSmall />
            <Text style={{ color: '#391D65', fontFamily: 'DMSansSemiBold' }}>
              Create Community
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text
            style={{
              color: '#1F1F1F',
              fontSize: 20,
              fontFamily: 'DMSansSemiBold',
              marginBottom: 8,
            }}
          >
            No communities yet
          </Text>
          <Text style={{ color: '#1F1F1F', textAlign: 'center', fontSize: 14 }}>
            Create communities and let the discussion begin. Create communities
            for different topics to help members connect and engage.
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
            onPress={toggleModal}
          >
            <Text style={{ color: '#fff', fontFamily: 'DMSansSemiBold' }}>
              Create community
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal isVisible={isModalVisible}>
        <View
          style={{
            backgroundColor: 'white',
            // height: 500,
            paddingBottom: 40,
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            onPress={toggleModal}
            style={{ alignItems: 'flex-end' }}
          >
            <Close />
          </TouchableOpacity>
          <Text
            style={{
              color: '#1F1F1F',
              fontFamily: 'DMSansSemiBold',
              fontSize: 20,
              textAlign: 'center',
            }}
          >
            {step === 1
              ? 'Choose community Type'
              : 'Choose community structure'}
          </Text>
          {/* {step == 1 && (
                <ScrollView>
                
                  <View style={{ gap: 16, marginTop: 26 }}>
                    <TouchableOpacity style={{backgroundColor: "whitesmoke", paddingHorizontal: 12, paddingVertical: 10, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10}}>
                      <Ionicons name='book' />
                      <Text>Course</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )} */}
          {step === 1 && (
            <View style={{}}>
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 12,
                }}
              >
                {courseOptions.map((option) => {
                  const isActive = formData.sub_type === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() =>
                        setFormData({ ...formData, sub_type: option.key })
                      }
                      style={getButtonStyle(isActive)}
                    >
                      <Text style={{ fontSize: 18 }}>{option.title}</Text>
                      <Text style={{ color: '#6B7280', marginTop: 5 }}>
                        {option.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
          {step === 2 && (
            <ScrollView contentContainerStyle={styles.container}>
              {/* Course name */}
              <Text style={styles.label}>Course name</Text>
              <TextInput
                placeholder="Your course name"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                style={styles.input}
                placeholderTextColor="#888"
              />

              {/* Cohort Description */}
              <Text style={styles.label}>Cohort Description</Text>
              <TextInput
                placeholder="Describe what your cohort is about..."
                style={[styles.input, styles.textarea]}
                placeholderTextColor="#888"
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                multiline
              />

              {/* Cohort group
                <Text style={styles.label}>Cohort group</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={cohortGroup}
                    onValueChange={(itemValue) => setCohortGroup(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Branding & Branding Design" value="Branding & Branding Design" />
                    <Picker.Item label="Other Cohort" value="Other Cohort" />
                    <Picker.Item label="Other cohort" value="Other cohort" />
                    <Picker.Item label="Other cohort" value="Other cohort2" />
                    <Picker.Item label="Other cohort" value="Other cohort3" />
                  </Picker>
                </View> */}

              {/* Community Access */}
              <View style={styles.switchRow}>
                <Text style={styles.label}>Community access</Text>
                <Switch
                  value={communityAccess}
                  onValueChange={setCommunityAccess}
                  thumbColor={'#f4f3f4'}
                  trackColor={{ false: '#d3d3d3', true: '#B085EF' }}
                />
              </View>

              <Text style={styles.hint}>Add members from this cohort</Text>

              {/* Info text */}
              <Text style={styles.info}>
                The Community will be created in draft mode and will not be
                visible to your learners. You can update access settings after
                you create the community.
              </Text>
            </ScrollView>
          )}
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: '#F8F1FF',
                paddingVertical: 14,
                alignItems: 'center',
                borderRadius: 32,
                marginTop: 32,
                backgroundColor: '#391D65',
                width: '70%',
              }}
              onPress={step < 2 ? handleStep : createCommunityHandler}
            >
              <Text style={{ color: '#fff' }}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* <Modal isVisible={typeModal}>
            <View
              style={{}}>
                <View style={{
                    backgroundColor: "#fff",
                    padding: 20,
                    borderRadius: 12,
                    }}>
                        <TouchableOpacity onPress={toggleModal} style={{alignSelf: "flex-end", borderWidth: 2, borderRadius: 50, padding: 2, borderColor: "black"}}>
                            <X size={16} color="black" />
                        </TouchableOpacity>
                        <Text style={{fontSize: 20, fontWeight: 700, textAlign: "center"}}>Choose course type</Text>
                      
                        {courseOptions.map((option) => {
                          const isActive = courseType === option.title;
                          return (
                            <TouchableOpacity
                              key={option.key}
                              onPress={() => setCourseType(option.title)}
                              style={getButtonStyle(isActive)}
                            >
                              <Text style={{ fontSize: 18 }}>{option.title}</Text>
                              <Text style={{ color: "#6B7280", marginTop: 5 }}>
                                {option.description}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                        
                </View>
            </View>
      </Modal> */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0} // Start fully collapsed
        snapPoints={[1, '27%', '27%']} // Adjust snap points
        onChange={handleSheetChanges}
        enablePanDownToClose // Allows swipe down to close
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={styles.contentContainer}>
          <View
            style={{
              marginTop: 24,
              flex: 1,
              gap: 16,
            }}
          >
            <TouchableOpacity
            // onPress={() => router.push('/convener-screens/edit-cohort')}s
            >
              <Text>Edit lesson</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text>View as a student</Text>
            </TouchableOpacity>
            <TouchableOpacity
            // onPress={() => router.push('/convener-screens/edit-cohort')}s
            >
              <Text>Unpublish lesson</Text>
            </TouchableOpacity>
            <TouchableOpacity
            // onPress={() => router.push('/convener-screens/edit-cohort')}s
            >
              <Text>Delete lesson</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaWrapper>
  );
};

export default Index;

type LessonProps = CommunityType & { onOpenBottomSheet: () => void };

const Community = ({ id, cohort_id, name, onOpenBottomSheet }: LessonProps) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      key={id}
      onPress={() =>
        router.navigate({
          pathname: '/convener-screens/community/(course)/[id]',
          params: { id, cohort_id },
        })
      }
      style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}
    >
      <View style={styles.profileImage} />
      <View>
        <Text
          style={{ fontFamily: 'DMSansMedium', fontSize: 12, color: '#1F1F1F' }}
        >
          {name}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <Text
            style={{
              color: '#8D9091',
              marginTop: 4,
              fontSize: 10,
              fontStyle: 'italic',
            }}
          >
            3 Modules
          </Text>
          <Text style={{ color: '#8D9091', marginTop: 4, fontSize: 10 }}>
            200 memebers
          </Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          gap: 16,
          marginLeft: 'auto',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity onPress={onOpenBottomSheet}>
          <Options />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  profileImage: {
    height: 40,
    width: 40,
    backgroundColor: '#F2750D',
    borderRadius: 8,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },

  container: {
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#000',
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  hint: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  info: {
    fontSize: 12,
    color: '#666',
    marginTop: 20,
    lineHeight: 18,
  },
});

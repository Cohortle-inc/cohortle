// import ModuleIcon from '../../../../assets/images/'
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
  ActivityIndicator,
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
import useGetModules from '@/api/communities/modules/getModules';
import { colors } from '@/utils/color';

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
  const [communityAccess, setCommunityAccess] = useState(false);
  const { id } = useLocalSearchParams<{ id: string }>(); // cohort id
  const { cohortName } = useLocalSearchParams<{ cohortName: string }>(); // cohort name
  const numericId = Number(id);

  const apiURL = process.env.EXPO_PUBLIC_API_URL as string;

  // console.log(apiURL);
  const { mutate: createCommunity, isPending } = usePostCommunity(numericId);
  const { data: communities = [], isLoading } = useGetCommunities(numericId);
  const handleStep = () => {
    setStep(step + 1);
  };


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
        // Close modal and reset form
        setModalVisible(false);
        setFormData({
          name: '',
          description: '',
          sub_type: 'structured',
        });
        setStep(1);
        // Optionally refresh communities list or navigate
        alert('Cohort created successfully!');
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
    setStep(1);
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
            {cohortName}
          </Text>
          {/* <TouchableOpacity
            onPress={toggleModal}
            style={{ marginLeft: 'auto' }}
          >
            <Plus />
          </TouchableOpacity> */}
        </View>
      </View>
      {isLoading ? (
        // Loading State
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
            style={{ color: '#666', fontSize: 16, fontFamily: 'DMSansMedium' }}
          >
            Loading cohorts...
          </Text>
        </View>
      ) : communities.length > 0 ? (
        // Has Communities
        <ScrollView
          contentContainerStyle={{ paddingVertical: 16, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {communities.map((community: CommunityType) => (
            <Community
              key={community.id}
              {...community}
              onOpenBottomSheet={openBottomSheet}
            />
          ))}

          {/* Show "Create Community" button only if less than 2 communities */}
          {communities.length < 1 && (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                marginTop: 24,
                paddingVertical: 16,
                backgroundColor: '#F8F1FF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#E8DDFD',
              }}
              onPress={toggleModal}
            >
              <PlusSmall />
              <Text
                style={{
                  color: '#391D65',
                  fontFamily: 'DMSansSemiBold',
                  fontSize: 16,
                }}
              >
                Create Cohort
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        // Empty State
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{
              color: '#1F1F1F',
              fontSize: 22,
              fontFamily: 'DMSansSemiBold',
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            No cohort yet!
          </Text>
          <Text
            style={{
              color: '#666',
              textAlign: 'center',
              fontSize: 15,
              lineHeight: 22,
              marginBottom: 32,
            }}
          >
            Create your first cohort and let the discussion begin. Group members
            by topics, courses, or interests.
          </Text>

          <TouchableOpacity
            style={{
              backgroundColor: '#391D65',
              paddingVertical: 16,
              paddingHorizontal: 32,
              borderRadius: 32,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              elevation: 4,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowOffset: { width: 0, height: 2 },
            }}
            onPress={toggleModal}
          >
            {/* <PlusSmall color="#fff" /> */}
            <Text
              style={{
                color: '#fff',
                fontFamily: 'DMSansSemiBold',
                fontSize: 16,
              }}
            >
              Create a cohort
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
          }}
        >
          <TouchableOpacity
            onPress={toggleModal}
            style={{
              alignItems: 'flex-end',
              position: 'relative',
              paddingVertical: 5,
            }}
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
            {step === 1 ? 'Choose cohort Type' : 'Choose cohort structure'}
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
              <Text style={styles.label}>Cohort title</Text>
              <TextInput
                placeholder="Introduction to HTML"
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
                placeholder="Beginner friendly course on HTML..."
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
              {/* <View style={styles.switchRow}>
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
              {/* <Text style={styles.info}>
                The Community will be created in draft mode and will not be
                visible to your learners. You can update access settings after
                you create the community.
              </Text> */}
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
                width: 155,
              }}
              onPress={step < 2 ? handleStep : createCommunityHandler}
            >
              <Text style={{ color: '#fff' }}>
                {!isPending ? 'Next' : 'Creating...'}
              </Text>
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
          params: { name, id, cohort_id },
        })
      }
      style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}
    >
      <Ionicons
        name="grid"
        size={20}
        color={colors.primary}
        style={{
          padding: 5,
          backgroundColor: colors.purpleShade,
          borderRadius: 8,
        }}
      />
      <View>
        <Text
          style={{ fontFamily: 'DMSansMedium', fontSize: 12, color: '#1F1F1F' }}
        >
          {name}
        </Text>
        {/* <View style={{ flexDirection: 'row', gap: 8 }}> */}
        {/* <Text
            style={{
              color: '#8D9091',
              marginTop: 4,
              fontSize: 10,
              fontStyle: 'italic',
            }}
          >
            3 Modules
          </Text> */}
        {/* <Text style={{ color: '#8D9091', marginTop: 4, fontSize: 10 }}>
            200 memebers
          </Text> */}
        {/* </View> */}
      </View>
      <View
        style={{
          flexDirection: 'row',
          gap: 16,
          marginLeft: 'auto',
          alignItems: 'center',
        }}
      >
        {/* <TouchableOpacity onPress={onOpenBottomSheet}>
          <Options />
        </TouchableOpacity> */}
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

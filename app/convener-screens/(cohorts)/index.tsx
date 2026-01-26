import {
  ActivityIndicator,
  Clipboard,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Text } from '@/theme/theme';
import { Close, Options, Pencil, Plus, PlusSmall } from '@/assets/icons';
import Modal from 'react-native-modal';
import { Input } from '@/components/Form';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { RelativePathString, useRouter } from 'expo-router';
import { useConvenersCohorts } from '@/api/cohorts/getConvenersCohorts';
import { useCreateCohort } from '@/api/cohorts/postCohort';
import { CohortType } from '@/types/cohortType';
import { showMessage } from 'react-native-flash-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useGetCommunities from '@/api/communities/getCommunities';
import { CommunityType, usePostCommunity } from '@/api/communities/postCommunity';
import { useGetProfile } from '@/api/getProfile';
import useJoinCommunity from '@/api/communities/joinCommunity';

const Cohorts = () => {
  const [cohortData, setCohortData] = useState({
    name: '',
    description: '',
    codePrefix: '',
    type: 'course',
  });
  const router = useRouter();
  const [isModalVisible, setModalVisible] = useState(false);
  /// Note: Instead of calling the communities withing a cohort, its the cohort that is being called in this case. a major oversight
  // const { data: cohortsResponse, isError } = useConvenersCohorts();
  const { data: communities = [], isLoading } = useGetCommunities();
  // const cohorts = cohortsResponse || [];
  // const { mutate: createCohort, isPending } = useCreateCohort();
  const { mutate: createCommunity, isPending: communityPending } = usePostCommunity();
  const { data: profile } = useGetProfile();
  const { mutate: joinCommunity, isPending: joinPending } = useJoinCommunity();

  const userRole = profile?.role || profile?.user?.role;
  const [joinCode, setJoinCode] = useState('');

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedCohort, setSelectedCohort] = useState<any>(null);
  const handleSheetChanges = useCallback((index: number) => {
    console.log(index);
    // If index is greater than -1, sheet is active
  }, []);
  console.log(profile)

  const handleCreateCommunity = () => {
    if (
      !cohortData.name.trim() ||
      !cohortData.description.trim() ||
      !cohortData.codePrefix.trim() ||
      !cohortData.type.trim()
    ) {
      showMessage({
        message: 'Validation Error',
        description: 'Please fill in all fields',
        type: 'warning',
        backgroundColor: '#FF9500',
        color: '#fff',
        icon: 'warning',
        duration: 3000,
      });
      return;
    }

    const payload: CommunityType = {
      name: cohortData.name.trim(),
      description: cohortData.description.trim(),
      codePrefix: cohortData.codePrefix.trim(),
      type: cohortData.type.trim(),
    };

    createCommunity(payload, {
      onSuccess: (data) => {
        // ✅ Reset form
        setCohortData({ name: '', description: '', codePrefix: '', type: 'course' });

        // ✅ Close modal
        setModalVisible(false);

        console.log('Community created:', data);
      },
      // onError is handled in the hook now
    });
  };

  const handleJoinCommunity = () => {
    if (!joinCode.trim()) {
      showMessage({
        message: 'Validation Error',
        description: 'Please enter a join code',
        type: 'warning',
        backgroundColor: '#FF9500',
        color: '#fff',
        icon: 'warning',
        duration: 3000,
      });
      return;
    }

    joinCommunity(
      { code: joinCode.trim() },
      {
        onSuccess: () => {
          setJoinCode('');
          setModalVisible(false);
          showMessage({
            message: 'Success',
            description: 'Joined community successfully',
            type: 'success',
            icon: 'success',
          });
        },
        onError: (error: any) => {
          showMessage({
            message: 'Error',
            description: error.message || 'Failed to join community',
            type: 'danger',
            icon: 'danger',
          });
        },
      }
    );
  };
  const updateCohortData = (field: string, value: string) => {
    setCohortData((prev) => ({ ...prev, [field]: value }));
  };
  const openBottomSheet = (id: number) => {
    const community = communities.find((community: CommunityType) => community.id === id);
    setSelectedCohort(community);
    // You can set the selected cohort to state if needed
    console.log('Opening bottom sheet for cohort ID:', community);
    bottomSheetRef.current?.expand();
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const handleCohortPress = (id: number, cohortName: string) => {
    router.navigate({
      pathname: `/convener-screens/(cohorts)/community/[id]`,
      params: { id, cohortName },
    });
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: '#B085EF', fontFamily: 'DMSansSemiBold' }}>
            Cohortle
          </Text>
          <Pressable onPress={toggleModal}>
            <Plus />
          </Pressable>
        </View>
      </View>
      {isLoading ? (
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
            Loading communities...
          </Text>
        </View>
      ) : communities.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            Welcome to Cohortle
          </Text>
          <Text
            style={{
              textAlign: 'center',
              color: '#666',
              lineHeight: 22,
              marginBottom: 40,
            }}
          >
            This is where you'll create, edit, and manage your communities and
            learners.
          </Text>
          <Pressable
            onPress={toggleModal}
            style={{
              backgroundColor: '#391D65',
              paddingVertical: 16,
              borderRadius: 32,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
              {/* {userRole === 'instructor' ? 'Join a community' : 'Create a community'} */}
              Create a community
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 15, paddingBottom: 20 }}>
          {communities.map((cohort: any) => (
            <Community
              key={cohort.id}
              name={cohort.name}
              onPress={() => handleCohortPress(cohort.id, cohort.name)}
              onOpenBottomSheet={() => openBottomSheet(cohort.id)}
            />
          ))}
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
          <Pressable onPress={toggleModal} style={{ alignItems: 'flex-end' }}>
            <Close />
          </Pressable>
          <View
            style={{
              color: '#1F1F1F',
              fontFamily: 'DMSansSemiBold',
              fontSize: 20,
              textAlign: 'center',
            }}
          >
            {/* {userRole === 'instructor' ? (
              <View>
                <Text
                  style={{
                    color: '#1F1F1F',
                    fontFamily: 'DMSansSemiBold',
                    fontSize: 20,
                    textAlign: 'center',
                  }}
                >
                  Join Community
                </Text>
                <View style={{ gap: 16, marginTop: 26 }}>
                  <Input
                    value={joinCode}
                    onChangeText={setJoinCode}
                    label="Community Join Code"
                    placeholder="Enter the code provided by your convener"
                  />
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Pressable
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
                    disabled={joinPending}
                    onPress={handleJoinCommunity}
                  >
                    <Text style={{ color: '#fff' }}>
                      {!joinPending ? 'Join' : 'Joining...'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : ( */}
            <View>
              <Text
                style={{
                  color: '#1F1F1F',
                  fontFamily: 'DMSansSemiBold',
                  fontSize: 20,
                  textAlign: 'center',
                }}
              >
                Create Community
              </Text>
              <View style={{ gap: 16, marginTop: 26 }}>
                <Input
                  value={cohortData.name}
                  onChangeText={(text: string) => updateCohortData('name', text)}
                  label="Community Name"
                  placeholder="Digital Marketing Simplified"
                />
                <Input
                  value={cohortData.description}
                  onChangeText={(text: string) =>
                    updateCohortData('description', text)
                  }
                  label="Description"
                  placeholder="Self-paced learning program"
                />
                {/* <Input
                  value={cohortData.type}
                  onChangeText={(text: string) => updateCohortData('type', text)}
                  label="Community Type"
                  placeholder="e.g., 'tech', 'marketing'"
                /> */}
                <Input
                  value={cohortData.codePrefix}
                  onChangeText={(text: string) =>
                    updateCohortData('codePrefix', text)
                  }
                  label="Community code (prefix)"
                  placeholder="Sal-Cohort"
                />
              </View>
              <View style={{ alignItems: 'center' }}>
                <Pressable
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
                  disabled={communityPending}
                  onPress={handleCreateCommunity}
                >
                  <Text style={{ color: '#fff' }}>
                    {!communityPending ? 'Create' : 'Creating community...'}
                  </Text>
                </Pressable>
              </View>
            </View>
            {/* )} */}
          </View>
        </View>
      </Modal>

      <BottomSheet
        ref={bottomSheetRef}
        index={0} // Start fully collapsed
        snapPoints={[1, '22%', '22%']} // Adjust snap points
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
            {/* <TouchableOpacity
            // onPress={() => router.push('/convener-screens/edit-cohort')}
            >
              <Text>See learners</Text>
            </TouchableOpacity> */}
            <TouchableOpacity
              onPress={() => {
                if (!selectedCohort?.unique_code) {
                  showMessage({
                    message: 'Error',
                    description: 'Invite link not available',
                    type: 'danger',
                    icon: 'danger',
                    backgroundColor: '#EE3D3E',
                  });
                  return;
                }

                // This is React Native's native Clipboard – no expo-clipboard needed
                Clipboard.setString(selectedCohort.unique_code);

                showMessage({
                  message: 'Copied!',
                  description: 'Invite code copied to clipboard',
                  type: 'success',
                  backgroundColor: '#391D65',
                  color: '#fff',
                  icon: 'success',
                  duration: 2500,
                  titleStyle: { fontFamily: 'DMSansSemiBold', fontSize: 16 },
                });

                bottomSheetRef.current?.close();
              }}
            >
              <Text>Add learners (copy join code)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                router.navigate({
                  pathname: `/convener-screens/(cohorts)/edit-community/[id]`,
                  params: { id: selectedCohort?.id, name: selectedCohort?.name },
                })
              }
            >
              <Text>Edit community {selectedCohort?.name} </Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaWrapper>
  );
};

export default Cohorts;

interface CommunityProps {
  id?: number;
  name: string;
  onOpenBottomSheet: () => void;
  onPress: () => void;
}
const Community = ({ name, onOpenBottomSheet, onPress }: CommunityProps) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        gap: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={styles.profileImage} />
        <View style={{}}>
          <Text
            style={{
              fontFamily: 'DMSansMedium',
              fontSize: 11,
              color: '#1F1F1F',
            }}
          >
            {name}
          </Text>
          {/* <Text style={{ color: '#8D9091', marginTop: 4, fontSize: 10 }}>
            15.8K Members
          </Text> */}
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <TouchableOpacity onPress={onOpenBottomSheet}>
          <Options />
        </TouchableOpacity>
        <TouchableOpacity>
          <PlusSmall />
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
});

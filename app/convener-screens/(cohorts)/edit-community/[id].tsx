import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useRef, useState } from 'react';
import { Header, SafeAreaWrapper } from '@/HOC';
import { Back, Close, Options } from '@/assets/icons';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import Modal from 'react-native-modal';
import { Input } from '@/components/Form';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useGetCommunity from '@/api/communities/getCommunity';
import { useRemoveCommunity } from '@/api/communities/deleteCommunity';
import { useGetCommunityMembers } from '@/api/communities/getMembers';
import { useRemoveCommunityMember } from '@/api/communities/removeMember';
import { useUpdateCommunity } from '@/api/communities/updateCommunity';
import { useGetProfile } from '@/api/getProfile';

const EditCohort = () => {
  const router = useRouter();

  const [name, setName] = useState('');
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleteCohortVisible, setDeleteCohortVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<any>(null);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: community } = useGetCommunity(id as any);
  const { data: communityMembers = [] } = useGetCommunityMembers(id);
  const [loading, setLoading] = useState(false);
  const removeCommunityMutation = useRemoveCommunity();
  const updateCommunityMutation = useUpdateCommunity();
  const removeMemberMutation = useRemoveCommunityMember();
  console.log(communityMembers)
  const { data: user } = useGetProfile();
  console.log("user: ", user)

  const handleRemoveMember = () => {
    if (!selectedLearner) return;

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${selectedLearner.first_name} from this community?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeMemberMutation.mutate(
              {
                communityId: Number(id),
                memberId: selectedLearner.id || selectedLearner.member_id, // Adjust based on actual data structure
              },
              {
                onSuccess: () => {
                  bottomSheetRef.current?.close();
                  setSelectedLearner(null);
                }
              }
            );
          },
        },
      ],
    );
  };

  const handleRemoveCommunity = async () => {
    if (!id) return;

    Alert.alert(
      'Remove Community',
      'Are you sure you want to remove this community?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeCommunityMutation.mutate(
              { id },
              {
                onSuccess: () => {
                  bottomSheetRef.current?.close();
                  router.replace('/convener-screens/(cohorts)');
                },
              },
            );
          },
        },
      ],
    );
  };
  const handleSheetChanges = useCallback((index: number) => {
    // Update state based on the index value
    console.log(index);
    // If index is greater than -1, sheet is active
  }, []);

  const CustomBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1} // Fully fade out when closed
      appearsOnIndex={0} // Start appearing from the first snap point
      opacity={0.75} // Darker for better focus
      pressBehavior="close" // Tap anywhere outside = close sheet
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.75)', // Deep black with strong overlay
      }}
    />
  );

  const openBottomSheetWithLearner = (learner: any) => {
    setSelectedLearner(learner);
    bottomSheetRef.current?.expand();
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
    console.log(22);
  };

  const renderBackdrop = useCallback(
    (
      props: React.JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps,
    ) => <BottomSheetBackdrop {...props} opacity={0.7} />,
    [],
  );

  /* useEffect(() => {
    if (community?.name) {
      setName(community.name);
    }
  }, [community]); */

  const handleUpdateCommunity = async () => {
    // Validate input
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a community name');
      return;
    }

    setLoading(true);
    console.log("id", id);
    try {
      await updateCommunityMutation.mutateAsync({
        id: Number(id),
        data: {
          name: name.trim(),
        },
      });

      Alert.alert('Success', 'Community updated successfully');
      router.back(); // or router.replace('/convener-screens/(cohorts)')
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err?.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'details' | 'members'>('details');

  return (
    <SafeAreaWrapper>
      <Header title="Edit Community" />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'details' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('details')}
        >
          <Text
            style={
              activeTab === 'details' ? styles.activeTabText : styles.tabText
            }
          >
            Details for {community?.name}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'members' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('members')}
        >
          <Text
            style={
              activeTab === 'members' ? styles.activeTabText : styles.tabText
            }
          >
            Members
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'details' ? (
        <View style={{ flex: 1, paddingVertical: 16 }}>
          <View>
            <Input
              value={name}
              onChangeText={setName}
              label="Community name"
              placeholder={community?.name}
            />
          </View>
            <View
              style={{
                marginTop: 'auto',
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 36,
              }}
            >
              <TouchableOpacity
                onPress={() => setDeleteCohortVisible(true)}
                style={{
                  borderWidth: 1,
                  borderColor: 'red',
                  flex: 1,
                  width: '100%',
                  borderRadius: 16,
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    paddingVertical: 6,
                    paddingHorizontal: 16,
                    color: 'red',
                  }}
                >
                  Delete
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#391D65',
                  flex: 1,
                  width: '100%',
                  borderRadius: 16,
                  opacity: (loading || !name.trim()) ? 0.7 : 1
                }}
                onPress={handleUpdateCommunity}
                disabled={loading || !name.trim()}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    paddingVertical: 6,
                    paddingHorizontal: 16,
                    color: '#fff',
                  }}
                >
                  {loading ? 'Saving...' : 'Save changes'}
                </Text>
              </TouchableOpacity>
            </View>
          
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { gap: 16, paddingBottom: 16 },
          ]}
        >
          {communityMembers && communityMembers.length > 0 ? (
            communityMembers.map((member: any) => (
              <LearnerItem
                key={member.membership_id}
                learner={member}
                onPressOptions={openBottomSheetWithLearner}
              />
            ))
          ) : (
            <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
              No learners yet.
            </Text>
          )}
        </ScrollView>
      )}
      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0} // Start fully collapsed
        snapPoints={[1, '30%', '30%']}
        enablePanDownToClose // Allows swipe down to close
        backdropComponent={renderBackdrop}
        onChange={(index) => index === -1 && setSelectedLearner(null)}
      >
        <BottomSheetView style={styles.contentContainer}>
          {selectedLearner ? (
            <View style={{ padding: 16, gap: 24 }}>
              <Text
                style={{ fontSize: 16, fontWeight: '600', textAlign: 'center' }}
              >
                {selectedLearner.first_name} {selectedLearner.last_name}
              </Text>

              <TouchableOpacity
                style={{ gap: 4 }}
                onPress={handleRemoveMember}
              >
                <Text style={{ color: '#EE3D3E', fontWeight: '500' }}>
                  Remove learner
                </Text>
                <Text style={{ color: '#8D9091', fontSize: 12 }}>
                  Learner will lose access to this community and its content.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setDeleteModalVisible(true);
                  bottomSheetRef.current?.close();
                }}
                style={{ gap: 4 }}
              >
                <Text style={{ color: '#8D9091', fontWeight: '500' }}>
                  Restrict learner
                </Text>
                <Text style={{ color: '#8D9091', fontSize: 12 }}>
                  Learner will be restricted from commenting and creating posts.
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={{ textAlign: 'center', color: '#666' }}>
              Select a learner
            </Text>
          )}
        </BottomSheetView>
      </BottomSheet>

      <Modal isVisible={isDeleteModalVisible}>
        <View
          style={{
            backgroundColor: 'white',
            // height: 500,
            paddingBottom: 24,
            padding: 16,
            borderRadius: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => setDeleteModalVisible(false)}
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
            Restrict learner
          </Text>
          <Text
            style={{ color: '#1F1F1F', textAlign: 'center', marginTop: 32 }}
          >
            Are you sure you want to restrict [insert username] from [Cohort
            name]?
          </Text>

          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              gap: 16,
              marginTop: 56,
            }}
          >
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: '#F8F1FF',
                paddingVertical: 6,
                alignItems: 'center',
                borderRadius: 32,
                width: '50%',
                flex: 1,
              }}
            >
              <Text style={{ color: '#391D65' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: '#F8F1FF',
                paddingVertical: 6,
                alignItems: 'center',
                borderRadius: 32,
                backgroundColor: '#EE3D3E',
                width: '50%',
                flex: 1,
              }}
            >
              <Text style={{ color: '#fff' }}>Restrict Learner</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal isVisible={isDeleteCohortVisible}>
        <View
          style={{
            backgroundColor: 'white',
            // height: 500,
            paddingBottom: 24,
            padding: 16,
            borderRadius: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => setDeleteCohortVisible(false)}
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
            Delete this Community?
          </Text>
          <View>
            <Text style={{ color: '#1F1F1F', marginTop: 16 }}>
              If you proceed, you will permanently lose ALL the data associated
              with it
            </Text>
            {/* <View>
              <TouchableOpacity
                onPress={() => setIsOpen(!isOpen)}
                style={{
                  gap: 8,
                  marginTop: 8,
                  backgroundColor: '#F8F1FF',
                  borderColor: '#ECDCFF',

                  borderWidth: 1,
                  borderRadius: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                    2 COMMUNITIES
                  </Text>
                  <View
                    style={{
                      transform: [{ rotate: isOpen ? '0deg' : '180deg' }],
                    }}
                  >
                    <Back />
                  </View>
                </View>

                {isOpen && (
                  <View
                    style={{
                      backgroundColor: 'white',
                      borderColor: '#ECDCFF',
                      borderBottomLeftRadius: 8,
                      borderBottomRightRadius: 8,
                      padding: 8,
                      borderTopWidth: 1,
                      borderBottomWidth: 1,
                    }}
                  >
                    <View
                      style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}
                    >
                      <Text>{'\u2022'}</Text>
                      <Text>Community A</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Text>{'\u2022'}</Text>
                      <Text>Community B</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </View> */}
          </View>
          <Text style={{ color: '#1F1F1F', marginTop: 16, marginBottom: 8 }}>
            To confirm, please type{' '}
            <Text style={{ fontWeight: 'bold' }}>Delete</Text> into the textbox
            below:
          </Text>
          <Input />

          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              gap: 16,
              marginTop: 56,
            }}
          >
            <TouchableOpacity
              onPress={() => setDeleteCohortVisible(false)}
              style={{
                borderWidth: 1,
                borderColor: '#F8F1FF',
                paddingVertical: 6,
                alignItems: 'center',
                borderRadius: 32,
                width: '50%',
                flex: 1,
              }}
            >
              <Text style={{ color: '#391D65' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRemoveCommunity}
              style={{
                borderWidth: 1,
                borderColor: '#F8F1FF',
                paddingVertical: 6,
                alignItems: 'center',
                borderRadius: 32,
                backgroundColor: '#EE3D3E',
                width: '50%',
                flex: 1,
              }}
              disabled={loading}
            >
              <Text style={{ color: '#fff' }}>
                {loading ? 'Deleting...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  activeTab: {
    borderColor: '#391D65',
  },
  tabText: {
    color: '#DABCFF',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#391D65',
    fontWeight: '700',
  },
  content: {
    paddingTop: 12,
  },
  contentContainer: {
    zIndex: 90,
    flex: 1,
    padding: 16,
  },
});

export default EditCohort;

const LearnerItem = ({
  learner,
  onPressOptions,
}: {
  learner: any;
  onPressOptions: (learner: any) => void;
}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomColor: '#D9D9D9',
      borderBottomWidth: 1,
      paddingBottom: 12,
      paddingHorizontal: 16,
    }}
  >
    {/* Avatar */}
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFC100',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>
        {learner.first_name[0]}
        {learner.last_name[0]}
      </Text>
    </View>

    {/* Name & Email */}
    <View style={{ marginLeft: 12, flex: 1 }}>
      <Text style={{ fontWeight: '600', fontSize: 15 }}>
        {learner.first_name} {learner.last_name}
      </Text>
      <Text style={{ fontSize: 13, color: '#666' }}>{learner.email}</Text>
    </View>
    {/* <Text>{learner}</Text> */}

    {/* Options */}
    <TouchableOpacity onPress={() => onPressOptions(learner)}>
      <Options width={24} height={24} />
    </TouchableOpacity>
  </View>
);

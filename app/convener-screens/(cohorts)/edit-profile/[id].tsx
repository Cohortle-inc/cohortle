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
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import Modal from 'react-native-modal';
import { Input } from '@/components/Form';
import { useGetCohort } from '@/api/cohorts/getCohort';
import { useUpdateCohort } from '@/api/updateCohorts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDeleteCohort } from '@/api/cohorts/deleteCohort';

const EditCohort = () => {
  const router = useRouter();

  const [name, setName] = useState('');
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleteCohortVisible, setDeleteCohortVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: cohort } = useGetCohort(id as any);
  const updateCohort = useUpdateCohort();
  const deleteCohort = useDeleteCohort();

  const handleSheetChanges = useCallback((index: number) => {
    // Update state based on the index value
    console.log(index);
    // If index is greater than -1, sheet is active
  }, []);

  const openBottomSheet = () => {
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

  const handleUpdateCohort = async () => {
    // Validate input
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a cohort name');
      return;
    }

    const token = await AsyncStorage.getItem('authToken');
    try {
      await updateCohort.mutateAsync({
        cohort_id: Number(id),
        token: String(token),
        data: {
          name,
        },
      });

      Alert.alert('Success', 'Cohort info updated successfully');
      console.log('Updated name:', name);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteCohort = async () => {
    try {
      await deleteCohort.mutateAsync(String(id));
      Alert.alert('Success', 'Cohort deleted successfully');
      router.push('/convener-screens/(cohorts)');
      // Navigate back or to another screen if necessary
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Delete failed');
    }
  };

  const [activeTab, setActiveTab] = useState<'details' | 'members'>('details');

  return (
    <SafeAreaWrapper>
      <Header title="Edit cohort group" />

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
            Detailsssss for {cohort?.name}
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
              label="Cohort name"
              placeholder={cohort?.name}
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
                borderColor: '#EE3D3E',
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
                  color: '#EE3D3E',
                }}
              >
                Delete Cohort
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#391D65',
                flex: 1,
                width: '100%',
                borderRadius: 16,
              }}
              onPress={handleUpdateCohort}
            >
              <Text
                style={{
                  textAlign: 'center',
                  paddingVertical: 6,
                  paddingHorizontal: 16,
                  color: '#fff',
                }}
              >
                Save changes
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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderBottomColor: '#D9D9D9',
              borderBottomWidth: 1,
              paddingBottom: 8,
              paddingHorizontal: 16,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 9999,
                backgroundColor: '#FFC100',
              }}
            ></View>
            <View style={{ marginLeft: 16 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 14 }}>
                Muhammad Umar
              </Text>
              <Text style={{ fontSize: 12 }}>iamumar01@gmail.com</Text>
            </View>
            <TouchableOpacity
              onPress={openBottomSheet}
              style={{ marginLeft: 'auto' }}
            >
              <Options />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
      <BottomSheet
        ref={bottomSheetRef}
        index={0} // Start fully collapsed
        snapPoints={[1, '30%', '30%']} // Adjust snap points
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
            <TouchableOpacity onPress={() => setDeleteModalVisible(true)}>
              <Text>Restrict learner</Text>
              <Text style={{ color: '#8D9091' }}>
                Restrict learner Learner is restricted from commenting on posts,
                and creating posts.
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
            // onPress={() => router.push('/convener-screens/edit-cohort')}
            >
              <Text>Remove learner</Text>
              <Text style={{ color: '#8D9091' }}>
                Learner will no longer hae access to your cohort and
                communities.
              </Text>
            </TouchableOpacity>
          </View>
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
            Delete this cohort group?
          </Text>
          <View>
            <Text style={{ color: '#1F1F1F', marginTop: 16 }}>
              If you proceed, you will permanently lose ALL the data associated
              with this cohort group. This includes:
            </Text>
            <View>
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
            </View>
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
              onPress={handleDeleteCohort}
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
              <Text style={{ color: '#fff' }}>Confirm</Text>
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
    flex: 1,
    padding: 16,
  },
});

export default EditCohort;

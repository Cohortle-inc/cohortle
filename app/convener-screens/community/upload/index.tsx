import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import { Link, useRouter } from 'expo-router';
import { SafeAreaWrapper } from '@/HOC';
import { Text } from '@/theme/theme';
import { useConvenersCohorts } from '@/api/cohorts/getConvenersCohorts';
import { Ionicons } from '@expo/vector-icons';
import { useCreatePost } from '@/api/posts/createPost';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useGetCommunities from '@/api/communities/getCommunities';
import { useFocusEffect } from 'expo-router';
import { useNavigation } from 'expo-router';
import { colors } from '@/utils/color';

const UploadPost = () => {
  const [text, setText] = useState('');
  const router = useRouter()
  const [audienceModal, setAudienceModal] = useState(false);
  const [replyModal, setReplyModal] = useState(false);
  const [selectedReplyOption, setSelectedReplyOption] = useState('Everyone');
  const [selectedAudience, setSelectedAudience] = useState('Everyone');
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(null);
  const { mutate: createPost } = useCreatePost();
  const navigation = useNavigation()
  useFocusEffect(
    useCallback(() => {
      const parentNavigator = navigation.getParent();
      if (parentNavigator) {
        parentNavigator.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }

      return () => {
        if (parentNavigator) {
          parentNavigator.setOptions({
            tabBarStyle: {
              paddingTop: 12,
              paddingBottom: 12,
              height: 68,
              backgroundColor: '#ffffff',
              display: 'flex',
            },
          });
        }
      };
    }, [navigation])
  );
  /// Note: Instead of calling the communities withing a cohort, its the cohort that is being called in this case. a major oversight
  const { data: myCommunities, isLoading: communitiesLoading, isError: communitiesError } = useGetCommunities();

  const toggleAudienceModal = () => setAudienceModal((prev) => !prev);
  const toggleReplyModal = () => setReplyModal((prev) => !prev);

  const handleReplyOptionSelect = (option: string) => {
    setSelectedReplyOption(option);
    toggleReplyModal();
  };
  const handleUpload = async () => {
    if (!text.trim()) {
      Alert.alert('Empty Post', 'Please enter something to post.');
      return;
    }

    createPost(
      {
        text,
        can_reply: selectedReplyOption.toLowerCase(),
        community_ids: selectedAudienceId || undefined,
      },
      {
        onSuccess: (data) => {
          Alert.alert('Success', data.message || 'Post created successfully!');
          setText('');
        },
        onError: (err: any) => {
          console.error(err);
          Alert.alert(
            'Error',
            err?.response?.data?.message || 'Failed to upload post.',
          );
        },
      },
    );
  };

  const handleAudienceSelect = (audience: string, id: string | null = null) => {
    setSelectedAudience(audience);
    setSelectedAudienceId(id);
    toggleAudienceModal();
  };

  return (
    <SafeAreaWrapper>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerLink}>
          <Ionicons name="chevron-back" size={24} color="#391D65" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          onPress={toggleAudienceModal}
          style={styles.audienceSelector}
        >
          <Text style={styles.audienceText}>{selectedAudience}</Text>
          <Ionicons name="chevron-down" size={16} color="#391D65" />
        </TouchableOpacity>

        <TextInput
          value={text}
          onChangeText={setText}
          numberOfLines={6}
          multiline
          textAlignVertical="top"
          placeholder="Write your post here"
          style={styles.textInput}
        />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={toggleReplyModal}>
          <Text style={styles.replyText}>
            {selectedReplyOption === 'Everyone' && 'Everyone can reply'}
            {selectedReplyOption === 'Nobody' && 'Nobody can reply'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleUpload} style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Post</Text>
        </TouchableOpacity>
      </View>

      {/* Audience Modal */}
      <Modal
        isVisible={audienceModal}
        onBackdropPress={toggleAudienceModal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={styles.modal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.swipeIndicator} />
          <Text style={styles.modalTitle}>Choose Audience</Text>

          <TouchableOpacity
            style={[styles.audienceOption]}
            onPress={() => handleAudienceSelect('Everyone', null)}
          >
            <Text style={styles.audienceOptionText}>Everyone</Text>
          </TouchableOpacity>

          <View style={styles.communitiesSection}>
            <Text style={styles.communitiesHeader}>My Communities</Text>

            {communitiesLoading ? (
              <ActivityIndicator size="small" color="#B085EF" />
            ) : communitiesError ? (
              <Text style={styles.errorText}>Error loading communities</Text>
            ) : (
              <View style={styles.communitiesList}>
                {/* Use optional chaining here since cohorts might be undefined */}
                {myCommunities?.map((community: any) => (
                  <TouchableOpacity
                    key={community.id}
                    style={[styles.communityItem]}
                    onPress={async () => {
                      await AsyncStorage.setItem('selectedCommunity', community.name.toString());
                      handleAudienceSelect(community.name, community.id.toString());
                    }}
                  >
                    <View style={styles.profileImage} />
                    <View style={styles.communityInfo}>
                      <Text style={styles.communityName}>{community?.name}</Text>
                      <Text style={styles.communityMembers}>
                        {community.memberCount || 0} members
                      </Text>
                    </View>
                    {selectedAudienceId === community.id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Reply Modal */}
      <Modal
        isVisible={replyModal}
        onBackdropPress={toggleReplyModal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={styles.modal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.swipeIndicator} />
          <Text style={styles.modalTitle}>Who can reply?</Text>
          <Text style={styles.modalSubtitle}>
            People mentioned can always reply
          </Text>

          <View style={styles.optionsContainer}>
            {['Everyone', 'Nobody'].map((option, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleReplyOptionSelect(option)}
                style={styles.replyOption}
              >
                <Text style={styles.replyOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper >
  );
};

export default UploadPost;

const styles = StyleSheet.create({
  header: {
    marginVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLink: {
    marginRight: 8,
  },
  headerClose: {
    fontSize: 26,
    color: '#B085EF',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B085EF',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  audienceSelector: {
    marginBottom: 16,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.primary,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  audienceText: {
    fontWeight: '600',
    color: '#391D65',
  },
  textInput: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 1,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ECDCFF',
  },
  replyText: {
    color: '#391D65',
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#E9D7FE',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  uploadButtonText: {
    fontWeight: '700',
    color: '#391D65',
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  swipeIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 5,
  },
  modalSubtitle: {
    color: '#555',
    marginBottom: 20,
  },
  audienceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  selectedAudience: {
    backgroundColor: '#E9D7FE',
    borderColor: '#B085EF',
    borderWidth: 1,
  },
  audienceOptionText: {
    fontWeight: '600',
    color: '#391D65',
    fontSize: 16,
  },
  communitiesSection: {
    marginTop: 16,
  },
  communitiesHeader: {
    fontWeight: '700',
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  communitiesList: {
    gap: 12,
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  selectedCommunity: {
    backgroundColor: '#E9D7FE',
    borderColor: '#B085EF',
    borderWidth: 1,
  },
  communityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  communityName: {
    fontWeight: '600',
    fontSize: 16,
  },
  communityMembers: {
    color: 'grey',
    fontSize: 12,
  },
  profileImage: {
    height: 40,
    width: 40,
    backgroundColor: '#F2750D',
    borderRadius: 8,
  },
  optionsContainer: {
    gap: 8,
  },
  replyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  replyOptionText: {
    fontWeight: '600',
    color: '#391D65',
    fontSize: 18,
  },
  checkmark: {
    color: '#391D65',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  },
});

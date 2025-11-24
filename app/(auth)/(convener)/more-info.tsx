import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaWrapper } from '@/HOC';
import { Header } from '@/ui';
import { Text } from '@/theme/theme';
import { BackArrowIcon } from '@/assets/icons';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import Modal from 'react-native-modal';
import { useUpdateCohort } from '@/api/updateCohorts';
import AsyncStorage from '@react-native-async-storage/async-storage';

// reusable modal dropdown
const ModalDropdown = ({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSelect = (option: string) => {
    onSelect(option);
    setIsModalVisible(false);
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setIsModalVisible(true)}
        style={styles.dropdownButton}
      >
        <Text style={{ color: selected ? '#391D65' : '#999' }}>
          {selected || 'Select option...'}
        </Text>
      </Pressable>

      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setIsModalVisible(false)}
        backdropOpacity={0.4}
        animationIn="fadeInUp"
        animationOut="fadeOutDown"
      >
        <View style={styles.modalContainer}>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.optionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
};

const MoreInfo = () => {
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [referral, setReferral] = useState('');

  const updateCohort = useUpdateCohort();
  const router = useRouter();
  const { cohort_id } = useLocalSearchParams();

  const handleNext = async () => {
    const token = await AsyncStorage.getItem('authToken');
    try {
      await updateCohort.mutateAsync({
        cohort_id: Number(cohort_id),
        token: String(token),
        data: {
          description,
          goal,
          referral,
          revenue: '', // optional
        },
      });

      Alert.alert('Success', 'Cohort info updated successfully');
      // ✅ Navigate to next step
      router.navigate({
        pathname: `/community-structure`,
        params: { cohort_id, token },
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Update failed');
    }
  };

  return (
    <SafeAreaWrapper>
      <View style={{ marginTop: 24 }}>
        <Header number={3} />

        <View>
          <Text style={styles.title}>We want to know more...</Text>
          <Text style={styles.subtitle}>
            We’d love to give you the best onboarding experience!
          </Text>
        </View>

        <View style={{ gap: 24 }}>
          <ModalDropdown
            label="Which of these sounds most like you?"
            options={[
              'I’m an entrepreneur',
              'I work for a company that sells a product or service',
              'I work for a membership-based business, organisation, or club',
              'Other',
            ]}
            selected={description}
            onSelect={setDescription}
          />

          <ModalDropdown
            label="What’s your goal with Cohortly?"
            options={[
              'Build a community',
              'Grow my business',
              'Network with professionals',
              'Find collaborations',
            ]}
            selected={goal}
            onSelect={setGoal}
          />

          <ModalDropdown
            label="How did you hear about Cohortly?"
            options={[
              'Social media',
              'Friend or colleague',
              'Search engine',
              'Advertisement',
              'Other',
            ]}
            selected={referral}
            onSelect={setReferral}
          />
        </View>
      </View>

      <Pressable
        style={[styles.nextButton, updateCohort.isPending && { opacity: 0.6 }]}
        onPress={handleNext}
        disabled={updateCohort.isPending}
      >
        {updateCohort.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff' }}>Next</Text>
        )}
      </Pressable>

      <Pressable style={styles.backButton}>
        <BackArrowIcon />
        <Text style={{ color: '#391D65' }}>Back</Text>
      </Pressable>
    </SafeAreaWrapper>
  );
};

export default MoreInfo;

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#391D65',
    marginBottom: 8,
  },
  dropdownButton: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  optionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    color: '#391D65',
    fontSize: 14,
  },
  nextButton: {
    borderWidth: 1,
    borderColor: '#F8F1FF',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 32,
    marginTop: 48,
    backgroundColor: '#391D65',
  },
  backButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'DMSansMedium',
    marginBottom: 8,
    color: '#B085EF',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'DMSansMedium',
    marginBottom: 32,
    color: '#B085EF',
  },
});

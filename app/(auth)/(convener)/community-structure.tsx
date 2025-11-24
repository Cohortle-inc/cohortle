import {
  Alert,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Header } from '@/ui';
import { Text } from '@/theme/theme';
import { BackArrowIcon } from '@/assets/icons';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@/utils/color';
import { useUpdateCohort } from '@/api/updateCohorts';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Structure = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const { cohort_id } = useLocalSearchParams<{
    cohort_id: string;
    token: string;
  }>();
  const updateCohort = useUpdateCohort();
  const router = useRouter();

  const handleSelected = (value: string) => {
    setSelected((prev) => (prev === value ? null : value));
  };

  const handleSave = async () => {
    const token = await AsyncStorage.getItem('authToken');
    try {
      await updateCohort.mutateAsync({
        cohort_id: Number(cohort_id),
        token: String(token),
        data: {
          community_structure: selected ?? undefined, // will be set on next screen
        },
      });
      console.log('Saved community structure:', selected);
      Alert.alert('Success', 'Cohort info updated successfully');
      // ✅ Navigate to next step
      router.push(`/(auth)/login`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Update failed');
    }
  };

  return (
    <SafeAreaWrapper>
      <View style={{ marginTop: 24 }}>
        <Header number={4} />

        <View>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 18,
              fontFamily: 'DMSansMedium',
              marginBottom: 8,
              color: '#B085EF',
            }}
          >
            Pick your community structure
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            onPress={() => handleSelected('course')}
            style={[
              styles.optionButton,
              selected === 'course' && styles.optionSelected,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                selected === 'course' && { color: '#fff' },
              ]}
            >
              Course
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSelected('basic')}
            style={[
              styles.optionButton,
              selected === 'basic' && styles.optionSelected,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                selected === 'basic' && { color: '#fff' },
              ]}
            >
              Basic
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Link asChild href="/convener-screens">
        <Pressable
          style={[
            styles.nextButton,
            { backgroundColor: selected ? '#391D65' : '#A59FB2' },
          ]}
          disabled={!selected}
        >
          <Text style={{ color: '#fff' }}>next</Text>
        </Pressable>
      </Link>
      <View
        style={{
          marginTop: 'auto',
          marginBottom: 20,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: 16,
        }}
      >
        <Pressable style={styles.backButton}>
          <Text style={{ color: '#391D65' }}>Skip</Text>
        </Pressable>
        <Pressable onPress={handleSave} style={styles.backButton}>
          <Text style={{ color: '#391D65' }}>Next</Text>
        </Pressable>
      </View>
    </SafeAreaWrapper>
  );
};

export default Structure;

const styles = StyleSheet.create({
  optionsContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 24,
  },
  optionButton: {
    width: 150,
    height: 52,
    borderWidth: 1,
    borderColor: '#F8F1FF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  optionSelected: {
    backgroundColor: '#391D65',
  },
  optionText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#391D65',
  },
  nextButton: {
    borderWidth: 1,
    borderColor: '#F8F1FF',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 32,
    marginTop: 48,
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    borderColor: colors.purpleShade,
  },
});

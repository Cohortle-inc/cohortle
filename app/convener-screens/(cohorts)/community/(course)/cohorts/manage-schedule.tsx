import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaWrapper } from '@/HOC';
import { NavHead } from '@/components/HeadRoute';
import { CohortScheduleManager } from './CohortScheduleManager';
import { View } from 'react-native';

const ManageSchedule = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cohortId = Number(id);

  return (
    <SafeAreaWrapper>
      <NavHead text="Schedule" />

      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <CohortScheduleManager cohortId={cohortId} />
      </View>
    </SafeAreaWrapper>
  );
};

export default ManageSchedule;
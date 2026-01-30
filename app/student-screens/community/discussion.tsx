import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { SafeAreaWrapper } from '@/HOC';
import { Text } from '@/theme/theme';

const DiscussionForum = () => {
  return (
    <SafeAreaWrapper>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Discussion Forum</Text>
        <TouchableOpacity>
          <Text>Back</Text>
        </TouchableOpacity>
        <View />
      </View>
    </SafeAreaWrapper>
  );
};

export default DiscussionForum;

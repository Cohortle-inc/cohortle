import { Pressable, StyleSheet, View } from 'react-native';
import React from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Text } from '@/theme/theme';
import { Plus } from '@/assets/icons';

const Community = () => {
  return (
    <SafeAreaWrapper>
      <View style={{ flex: 1, backgroundColor: 'white', marginVertical: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: '#B085EF' }}>Cohortly</Text>
          <Pressable>
            <Plus />
          </Pressable>
        </View>
      </View>
    </SafeAreaWrapper>
  );
};

export default Community;

const styles = StyleSheet.create({});

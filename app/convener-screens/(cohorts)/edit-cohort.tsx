import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import { Header, SafeAreaWrapper } from '@/HOC';
import { Options } from '@/assets/icons';

const EditCohort = () => {
  return (
    <SafeAreaWrapper>
      <Header title={'Edit cohort group'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingBottom: 16 }}
      >
        <Learner />
        <Learner />
        <Learner />
        <Learner />
        <Learner />
        <Learner />
        <Learner />
        <Learner />
        <Learner />
        <Learner />
        <Learner />
        <Learner />
        <Learner />
        <Learner />
        <Learner />
        <Learner />
        <Learner />
        <Learner />
        <Learner />
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const Learner = () => {
  return (
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
          width: 50,
          height: 50,
          borderRadius: 9999,
          backgroundColor: '#FFC100',
        }}
      ></View>
      <View style={{ marginLeft: 16 }}>
        <Text style={{ fontWeight: 'bold' }}>Muhammad Umar</Text>
        <Text>iamumar01@gmail.com</Text>
      </View>
      <TouchableOpacity style={{ marginLeft: 'auto' }}>
        <Options />
      </TouchableOpacity>
    </View>
  );
};

export default EditCohort;

const styles = StyleSheet.create({});

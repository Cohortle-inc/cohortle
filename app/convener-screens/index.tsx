import { Pressable, StyleSheet, View } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Text } from '@/theme/theme';
import { Close, Plus } from '@/assets/icons';
import Modal from 'react-native-modal';
import { Input } from '@/components/Form';

const Cohorts = () => {
  const [isModalVisible, setModalVisible] = useState(false);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };
  return (
    <SafeAreaWrapper>
      <View style={{ backgroundColor: 'white', marginVertical: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: '#B085EF', fontFamily: 'DMSansSemiBold' }}>
            Cohortz
          </Text>
          <Pressable>
            <Plus />
          </Pressable>
        </View>
      </View>
      <View style={{ marginVertical: 'auto' }}>
        <Text
          style={{
            color: '#000000',
            fontFamily: 'DMSansSemiBold',
            fontSize: 24,
            textAlign: 'center',
          }}
        >
          Welcome to your cohort
        </Text>
        <Text style={{ textAlign: 'center', marginTop: 8 }}>
          This is where you’ll (create, edit and delete) your communities and
          learners.
        </Text>
        <Pressable
          onPress={toggleModal}
          style={{
            borderWidth: 1,
            borderColor: '#F8F1FF',
            paddingVertical: 14,
            alignItems: 'center',
            borderRadius: 32,
            marginTop: 48,
            backgroundColor: '#391D65',
          }}
        >
          <Text style={{ color: '#fff', fontFamily: 'DMSansSemiBold' }}>
            Create first cohort
          </Text>
        </Pressable>
      </View>
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
          <Text
            style={{
              color: '#1F1F1F',
              fontFamily: 'DMSansSemiBold',
              fontSize: 20,
              textAlign: 'center',
            }}
          >
            Create Cohort
          </Text>
          <View style={{ gap: 16, marginTop: 26 }}>
            <Input label="Cohort Name" placeholder="Cohort title" />
            <Input
              label="Cohort Description"
              placeholder="Describe what your cohort is about..."
            />
            <Input label="Community Name" placeholder="Cohort title" />
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
            >
              <Text style={{ color: '#fff' }}>Create</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
};

export default Cohorts;

const styles = StyleSheet.create({});

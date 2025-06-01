import { Back, Close, Options, Plus, PlusSmall } from '@/assets/icons';
import { Input } from '@/components/Form';
import { SafeAreaWrapper } from '@/HOC';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from 'react-native';
import Modal from 'react-native-modal';

type Props = {};

const Index = (props: Props) => {
  const router = useRouter();
  const [isModalVisible, setModalVisible] = useState(false);
  const [lessons, setLessons] = useState([1, 1, 1, 2, 3, 4]);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const handleSheetChanges = useCallback((index: number) => {
    // Update state based on the index value
    console.log(index);
    // If index is greater than -1, sheet is active
  }, []);
  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };
  const openBottomSheet = () => {
    bottomSheetRef.current?.expand();
  };

  const renderBackdrop = useCallback(
    (
      props: React.JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps,
    ) => <BottomSheetBackdrop {...props} opacity={0.7} />,
    [],
  );

  return (
    <SafeAreaWrapper>
      <View style={{ backgroundColor: 'white', marginVertical: 16 }}>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Back />
          </TouchableOpacity>
          <Text
            style={{
              color: '#391D65',
              fontFamily: 'DMSansSemiBold',
              marginLeft: 16,
            }}
          >
            Branding & Branding Design
          </Text>
          <TouchableOpacity
            onPress={toggleModal}
            style={{ marginLeft: 'auto' }}
          >
            <Plus />
          </TouchableOpacity>
        </View>
      </View>
      {lessons.length > 0 ? (
        <ScrollView
          contentContainerStyle={{ paddingVertical: 16, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {lessons.map((lesson, index) => (
            <Lesson onOpenBottomSheet={openBottomSheet} key={index} />
          ))}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginTop: 16,
            }}
            onPress={toggleModal}
          >
            <PlusSmall />
            <Text style={{ color: '#391D65', fontFamily: 'DMSansSemiBold' }}>
              Create more lessons
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text
            style={{
              color: '#1F1F1F',
              fontSize: 20,
              fontFamily: 'DMSansSemiBold',
              marginBottom: 8,
            }}
          >
            No lessons yet
          </Text>
          <Text style={{ color: '#1F1F1F', textAlign: 'center', fontSize: 14 }}>
            Create lessons and let the discussion begin. Create lessons for
            different topics to help members connect and engage.
          </Text>
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: '#F8F1FF',
              paddingVertical: 14,
              alignItems: 'center',
              borderRadius: 24,
              marginTop: 24,
              backgroundColor: '#391D65',
              width: 200,
            }}
            onPress={toggleModal}
          >
            <Text style={{ color: '#fff', fontFamily: 'DMSansSemiBold' }}>
              Create lessons
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
          <TouchableOpacity
            onPress={toggleModal}
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
            Create Lesson
          </Text>
          <View style={{ gap: 16, marginTop: 26 }}>
            <Input label="Lesson Title" placeholder="Intro to Branding" />
            <Input
              label="Lesson Description"
              placeholder="Describe what your lesson is about..."
            />
          </View>
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity
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
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <BottomSheet
        ref={bottomSheetRef}
        index={0} // Start fully collapsed
        snapPoints={[1, '27%', '27%']} // Adjust snap points
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
            <TouchableOpacity
              onPress={() => router.push('/convener-screens/edit-cohort')}
            >
              <Text>Edit lesson</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text>View as a student</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/convener-screens/edit-cohort')}
            >
              <Text>Unpublish lesson</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/convener-screens/edit-cohort')}
            >
              <Text>Delete lesson</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaWrapper>
  );
};

export default Index;

const Lesson = ({ onOpenBottomSheet }: { onOpenBottomSheet: () => void }) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push('/convener-screens/lesson/create-module')}
      style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}
    >
      <View style={styles.profileImage} />
      <View>
        <Text
          style={{ fontFamily: 'DMSansMedium', fontSize: 12, color: '#1F1F1F' }}
        >
          Branding & Brand Design
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <Text
            style={{
              color: '#8D9091',
              marginTop: 4,
              fontSize: 10,
              fontStyle: 'italic',
            }}
          >
            Draft
          </Text>
          <Text style={{ color: '#8D9091', marginTop: 4, fontSize: 10 }}>
            1:30 min
          </Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          gap: 16,
          marginLeft: 'auto',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity onPress={onOpenBottomSheet}>
          <Options />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  profileImage: {
    height: 40,
    width: 40,
    backgroundColor: '#F2750D',
    borderRadius: 8,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
});

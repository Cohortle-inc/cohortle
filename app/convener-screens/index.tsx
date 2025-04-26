import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useRef, useState } from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Text } from '@/theme/theme';
import { Close, Options, Pencil, Plus, PlusSmall } from '@/assets/icons';
import Modal from 'react-native-modal';
import { Input } from '@/components/Form';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';

const Cohorts = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [createdCohorts, setCreatedCohorts] = useState([1]);

  const bottomSheetRef = useRef<BottomSheet>(null);
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: '#B085EF', fontFamily: 'DMSansSemiBold' }}>
            Cohortz
          </Text>
          <Pressable>
            <Plus />
          </Pressable>
        </View>
      </View>
      {createdCohorts.length === 0 && (
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
      )}
      {createdCohorts.length !== 0 && (
        <View style={{}}>
          <Cohort onOpenBottomSheet={openBottomSheet} />
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
            <TouchableOpacity>
              <Text>See learners</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text>Add learners (copy link)</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text>Edit community</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text>Paywall</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaWrapper>
  );
};

export default Cohorts;

const Cohort = ({ onOpenBottomSheet }: { onOpenBottomSheet: () => void }) => {
  return (
    <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
      <View style={styles.profileImage} />
      <View>
        <Text
          style={{ fontFamily: 'DMSansMedium', fontSize: 12, color: '#1F1F1F' }}
        >
          Branding & Brand Design
        </Text>
        <Text style={{ color: '#8D9091', marginTop: 4, fontSize: 10 }}>
          15.8K Members
        </Text>
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
        <TouchableOpacity>
          <PlusSmall />
        </TouchableOpacity>
      </View>
    </View>
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

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
import { RelativePathString, useRouter } from 'expo-router';
import { useConvenersCohorts } from '@/api/cohorts/getConvenersCohorts';
import { useCreateCohort } from '@/api/cohorts/postCohort';
import { CohortType } from '@/types/cohortType';

const Cohorts = () => {
  const [cohortData, setCohortData] = useState({
    name: '',
    description: '',
  });
  const router = useRouter();
  const [isModalVisible, setModalVisible] = useState(false);
  /// Note: Instead of calling the communities withing a cohort, its the cohort that is being called in this case. a major oversight
  const { data: cohorts = [], isLoading, isError } = useConvenersCohorts();
  const { mutate: createCohort } = useCreateCohort();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedCohort, setSelectedCohort] = useState<any>(null);
  const handleSheetChanges = useCallback((index: number) => {
    // Update state based on the index value
    console.log(index);
    // If index is greater than -1, sheet is active
  }, []);

  const handleCreateCohort = () => {
    if (!cohortData.name.trim() || !cohortData.description.trim()) {
      alert('Please fill in the field');
      return;
    }
    const payload: CohortType = {
      name: cohortData.name,
      description: cohortData.description,
    };

    createCohort(payload, {
      onSuccess: (data: any) => {
        setCohortData({
          name: '',
          description: '',
        });
        alert('Success!');
      },
      onError: (error: any) => {
        console.log('Not working');
      },
    });
  };
  const updateCohortData = (field: string, value: string) => {
    setCohortData((prev) => ({ ...prev, [field]: value }));
  };
  const openBottomSheet = (id: number) => {
    const cohort = cohorts.find((cohort: CohortProps) => cohort.id === id);
    setSelectedCohort(cohort);
    // You can set the selected cohort to state if needed
    console.log('Opening bottom sheet for cohort ID:', cohort);
    bottomSheetRef.current?.expand();
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const handleCohortPress = (id: number) => {
    router.navigate({
      pathname: `/convener-screens/(cohorts)/community/[id]`,
      params: { id },
    });
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
            Cohortle
          </Text>
          <Pressable onPress={toggleModal}>
            <Plus />
          </Pressable>
        </View>
      </View>
      {cohorts.length === 0 && (
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
      {cohorts.length !== 0 && (
        <View style={{ gap: 15 }}>
          {cohorts.map((cohort: any) => (
            <Cohort
              key={cohort.id}
              name={cohort.name}
              onPress={() => {
                handleCohortPress(cohort.id);
              }}
              onOpenBottomSheet={() => openBottomSheet(cohort.id)}
            />
          ))}
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
            <Input
              value={cohortData.name}
              onChangeText={(text: string) => updateCohortData('name', text)}
              label="Cohort Name"
              placeholder="Cohort title"
            />
            <Input
              value={cohortData.description}
              onChangeText={(text: string) =>
                updateCohortData('description', text)
              }
              label="Description"
              placeholder="Cohort description"
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
              onPress={handleCreateCohort}
            >
              <Text style={{ color: '#fff' }}>Create</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <BottomSheet
        ref={bottomSheetRef}
        index={0} // Start fully collapsed
        snapPoints={[1, '22%', '22%']} // Adjust snap points
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
            // onPress={() => router.push('/convener-screens/edit-cohort')}
            >
              <Text>See learners</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text>Add learners (copy link)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                router.navigate({
                  pathname: `/convener-screens/(cohorts)/edit-profile/[id]`,
                  params: { id: selectedCohort?.id },
                })
              }
            >
              <Text>Edit community {selectedCohort?.name} </Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaWrapper>
  );
};

export default Cohorts;

interface CohortProps {
  id?: number;
  name: string;
  onOpenBottomSheet: () => void;
  onPress: () => void;
}
const Cohort = ({ name, onOpenBottomSheet, onPress }: CohortProps) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        gap: 16,
        alignItems: 'flex-start',
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={styles.profileImage} />
        <View style={{}}>
          <Text
            style={{
              fontFamily: 'DMSansMedium',
              fontSize: 11,
              color: '#1F1F1F',
            }}
          >
            {name}
          </Text>
          <Text style={{ color: '#8D9091', marginTop: 4, fontSize: 10 }}>
            15.8K Members
          </Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          gap: 16,
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

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OptionModal } from '@/components/optionModal';
import { UnitTypeCard } from './UnitTypeCard';
import { UNIT_TYPE_CONFIGS, LessonUnitType } from '@/types/lessonTypes';
import { colors } from '@/utils/color';

interface UnitTypeSelectionModalProps {
  isVisible: boolean;
  onSelectType: (type: LessonUnitType) => void;
  onCancel: () => void;
}

export const UnitTypeSelectionModal: React.FC<UnitTypeSelectionModalProps> = ({
  isVisible,
  onSelectType,
  onCancel,
}) => {
  return (
    <OptionModal isVisible={isVisible} onBackdropPress={onCancel}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Lesson Type</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#666" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={UNIT_TYPE_CONFIGS}
          keyExtractor={(item) => item.type}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <UnitTypeCard
                icon={item.icon}
                label={item.label}
                onPress={() => onSelectType(item.type)}
              />
            </View>
          )}
        />
      </SafeAreaView>
    </OptionModal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  grid: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardWrapper: {
    flex: 1,
    marginHorizontal: 8,
  },
});

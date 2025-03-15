import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Text } from '@/theme/theme';

const DropdownInput = () => {
  const [selectedValue, setSelectedValue] = useState('');

  return (
    <View>
      <Text style={styles.label}>Select Age Group</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={(itemValue) => setSelectedValue(itemValue)}
          style={styles.picker}
          enabled={true} // Enable/disable dropdown
        >
          <Picker.Item label="Select an option" value="" />
          <Picker.Item label="5-7 years" value="5-7" />
          <Picker.Item label="8-10 years" value="8-10" />
          <Picker.Item label="11-15 years" value="11-15" />
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    color: '#391D65',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden', // Ensure rounded corners
  },
  picker: {
    height: 50,
    backgroundColor: '#fff',
  },
});

export default DropdownInput;

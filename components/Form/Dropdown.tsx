import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
import { Text } from '@/theme/theme';

const DropdownInput = () => {
  const [selectedValue, setSelectedValue] = useState('');

  return (
    <View>
      {/* <Text style={styles.label}></Text> */}
      <View style={styles.pickerContainer}>
        {/* <Picker
          selectedValue={selectedValue}
          onValueChange={(itemValue) => setSelectedValue(itemValue)}
          style={styles.picker}
          enabled={true} // Enable/disable dropdown
        >
          <Picker.Item
            style={{ fontSize: 14 }}
            label="Select an option"
            value=""
          />
            
          <Picker.Item value="Enterprenuer" label="Enterprenuer"/>
          <Picker.Item value="Enterprenuer" label="Enterprenuer"/>
        </Picker> */}
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
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden', // Ensure rounded corners
  },
  picker: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DropdownInput;

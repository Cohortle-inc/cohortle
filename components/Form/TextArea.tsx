import { Text } from '@/theme/theme';
import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

const TextAreaInput = ({ label, placeholder, numberOfLines = 4 }: any) => {
  const [value, setValue] = useState('');

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={setValue}
        editable={true}
        multiline={true}
        numberOfLines={numberOfLines}
        textAlignVertical="top" // keeps text starting at the top-left
      />
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    color: '#391D65',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#391D65',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 120, // You can adjust based on lines
    paddingTop: 12,
    paddingBottom: 12,
  },
});

export default TextAreaInput;

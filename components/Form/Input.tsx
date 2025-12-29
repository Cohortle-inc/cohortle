import { Text } from '@/theme/theme';
import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

const NormalInput = ({ label, placeholder, value, onChangeText, error }: any) => {
  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && { borderColor: 'red' }]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        editable={true} // Enable/disable input
      />
      {error && <Text style={{ color: 'red', marginTop: 4 }}>{error}</Text>}
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
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#391D65',
    backgroundColor: '#fff',
  },
});

export default NormalInput;

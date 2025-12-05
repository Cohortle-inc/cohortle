import { Text } from '@/theme/theme';
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

interface TextAreaProps {
  label: string;
  placeholder?: string;
  value: string;               // ← Required
  onChangeText: (text: string) => void;  // ← Required
  numberOfLines?: number;
  maxLength?: number;
  editable?: boolean;
}

const TextAreaInput: React.FC<TextAreaProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  numberOfLines = 4,
  maxLength,
  editable = true,
}) => {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}                    // ← Use parent's value
        onChangeText={onChangeText}      // ← Use parent's handler
        multiline={true}
        numberOfLines={numberOfLines}
        textAlignVertical="top"
        editable={editable}
        maxLength={maxLength}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    color: '#391D65',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0D6EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: '#391D65',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 120,
  },
});

export default TextAreaInput;
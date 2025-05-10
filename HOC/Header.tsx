import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Back } from '@/assets/icons';
import { useRouter } from 'expo-router';

const Header = ({ title }: { title: string }) => {
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
      }}
    >
      <TouchableOpacity onPress={() => router.back()}>
        <Back />
      </TouchableOpacity>
      <Text style={{ paddingLeft: 16, fontFamily: 'DMSans', fontSize: 16 }}>
        {title}
      </Text>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({});

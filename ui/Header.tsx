import { StyleSheet, View } from 'react-native';
import React from 'react';
import { Text } from '@/theme/theme';

const Header = ({ number }: any) => {
  const Block = ({ bg }: any) => {
    return (
      <View
        style={{
          height: 4,
          flex: 1,
          backgroundColor: bg ? '#B085EF' : '#EFEFEF',
          borderRadius: 8,
        }}
      />
    );
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Block bg={true} />
        <Block bg={number > 1} />
        <Block bg={number > 2} />
      </View>
      <View style={{ justifyContent: 'flex-end', alignItems: 'flex-end' }}>
        <Text
          style={{
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            marginTop: 16,
            fontSize: 14,
          }}
        >
          {number}
          <Text style={{ color: '#CCCCCC' }}>/3</Text>
        </Text>
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({});

import { StyleSheet, View } from 'react-native';
import React from 'react';
import { Text } from '@/theme/theme';

interface HeaderProps {
  number: number; // current active step (starts at 1)
  total?: number; // total number of steps, default 3
}

const Header = ({ number, total = 3 }: HeaderProps) => {
  // Make an array for the total steps, fill with index [0,1,2,...]
  const blocks = Array.from({ length: total });

  const Block = ({ active }: { active: boolean }) => (
    <View
      style={{
        height: 4,
        flex: 1,
        backgroundColor: active ? '#B085EF' : '#EFEFEF',
        borderRadius: 8,
      }}
    />
  );

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {blocks.map((_, i) => (
          <Block key={i} active={number > i} />
        ))}
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
          <Text style={{ color: '#CCCCCC' }}>/ {total}</Text>
        </Text>
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({});

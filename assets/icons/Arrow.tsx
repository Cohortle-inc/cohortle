import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

const BackArrowIcon = () => {
  return (
    <View style={styles.container}>
      <Svg width="23" height="22" viewBox="0 0 23 22" fill="none">
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10.1522 5.01386C10.4206 5.28235 10.4206 5.71765 10.1522 5.98614L5.82579 10.3125H18.8327C19.2124 10.3125 19.5202 10.6203 19.5202 11C19.5202 11.3797 19.2124 11.6875 18.8327 11.6875H5.82579L10.1522 16.0139C10.4206 16.2823 10.4206 16.7177 10.1522 16.9861C9.88367 17.2546 9.44837 17.2546 9.17988 16.9861L3.67988 11.4861C3.41139 11.2177 3.41139 10.7823 3.67988 10.5139L9.17988 5.01386C9.44837 4.74538 9.88367 4.74538 10.1522 5.01386Z"
          fill="#391D65"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BackArrowIcon;

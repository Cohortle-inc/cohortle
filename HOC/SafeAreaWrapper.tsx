import { Theme } from '@/theme/theme';
import { useTheme } from '@shopify/restyle';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import {
  SafeAreaView,
  SafeAreaView,
  // StyleProp,
  // ViewStyle,
} from 'react-native-safe-area-context';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>; // Optional style prop
};

const SafeAreaWrapper = ({ children, style }: Props) => {
  const theme = useTheme<Theme>();

  return (
    <SafeAreaView
      style={[
        {
          flex: 1,
          backgroundColor: theme.colors.lightBackground,
          paddingHorizontal: theme.spacing.m,
        },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
};

export default SafeAreaWrapper;

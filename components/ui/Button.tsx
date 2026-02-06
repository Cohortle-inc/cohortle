import { Pressable, StyleProp, TextStyle, ViewStyle } from 'react-native';
import React from 'react';
import { Text, Theme } from '@/theme/theme';
import { useTheme } from '@shopify/restyle';

type Props = {
  variant?: 'primary' | 'secondary' | 'outline';
  text: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>; // Optional style prop
  textStyle?: StyleProp<TextStyle>; // Optional style prop
  disabled?: boolean; // Optional disabled prop
};

const Button = ({
  text,
  onPress,
  style,
  variant = 'primary',
  disabled = false,
  textStyle,
}: Props) => {
  const theme = useTheme<Theme>();

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        {
          backgroundColor: disabled
            ? theme.colors.primaryLight
            : variant === 'secondary'
              ? pressed
                ? '#000000'
                : 'transparent'
              : variant === 'outline'
                ? 'transparent'
                : pressed
                  ? theme.colors.primaryDark
                  : theme.colors.primary,
          padding: theme.spacing.m,
          borderRadius: 40,
          alignItems: 'center',
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: disabled
            ? theme.colors.primaryLight
            : variant === 'outline'
              ? theme.colors.primary
              : 'transparent',
          opacity: disabled ? 0.6 : 1, // Reduce opacity if disabled
        },
        style,
      ]}
      disabled={disabled} // Disable button press
    >
      {({ pressed }) => (
        <Text
          variant={'button'}
          style={[
            {
              color: disabled
                ? '#ffffff'
                : variant === 'outline'
                  ? theme.colors.primary
                  : pressed || variant === 'primary'
                    ? 'white'
                    : theme.colors.primary,
            },
            textStyle,
          ]}
        >
          {text}
        </Text>
      )}
    </Pressable>
  );
};

export default Button;

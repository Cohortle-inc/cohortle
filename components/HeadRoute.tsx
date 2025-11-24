import { Back } from '@/assets/icons';
import { useRouter } from 'expo-router';
import React, { ReactNode } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';

type NavHeadProp = {
  text: string;
  onBackPress?: () => void;
  onIconPress?: () => void;
  icon?: ReactNode;
  backIcon?: ReactNode;
  textColor?: string;
};

export const NavHead = ({
  text,
  onIconPress,
  icon,
  textColor = '#391D65',
}: NavHeadProp) => {
  const router = useRouter();

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          onPress={handleBackPress}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Back />
        </TouchableOpacity>

        <Text style={[styles.title, { color: textColor }]}>{text}</Text>

        {icon && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={onIconPress}
            accessibilityLabel="Action button"
            accessibilityRole="button"
          >
            {icon}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'DMSansSemiBold',
    marginLeft: 16,
    flex: 1,
  },
  iconContainer: {
    marginLeft: 'auto',
  },
});

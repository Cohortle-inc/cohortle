import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import React, { useCallback, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { removeItem } from '@/utils/asyncStorage';
import Lottie from 'lottie-react-native';
import { Text, Theme } from '@/theme/theme';
import { PaddedView } from '@/HOC';
import { Button } from '@/components/ui';
import { useTheme } from '@shopify/restyle';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { Link } from 'expo-router';

const { width, height } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 20 : Constants.statusBarHeight;

type Props = {};

const Welcome = (props: Props) => {
  const theme = useTheme<Theme>();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleSheetChanges = useCallback((index: number) => {
    // Update state based on the index value
    console.log(index);
    // If index is greater than -1, sheet is active
  }, []);

  const handleBottomSheet = () => {};
  const openBottomSheet = () => {
    bottomSheetRef.current?.expand();
  };

  const handleClick = async () => {
    await removeItem('onboarded');
  };

  const renderBackdrop = useCallback(
    (
      props: React.JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps,
    ) => <BottomSheetBackdrop {...props} opacity={0.7} />,
    [],
  );

  return (
    <>
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.lightBackground },
        ]}
      >
        <PaddedView>
          <View style={styles.welcomeView}>
            <Text variant={'headerOne'} style={styles.header}>
              Welcome to Cohortle
            </Text>
            <Text style={styles.subHeader}>
              Let's embark on your learning adventure together.
            </Text>
          </View>
          <View>
            <Lottie
              style={styles.lottie}
              source={require('../../assets/images/lottie.json')}
              autoPlay
              loop
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button onPress={openBottomSheet} text="Get Started" />
            <Text
              style={{ textAlign: 'center', marginTop: 16 }}
              variant="subheading"
            >
              Invited to Cohortle?{' '}
              <Text
                style={{
                  textDecorationLine: 'underline',
                }}
              >
                Accept Invitation
              </Text>
            </Text>
          </View>
        </PaddedView>
        <BottomSheet
          ref={bottomSheetRef}
          index={0} // Start fully collapsed
          snapPoints={[1, '30%', '30%']} // Adjust snap points
          onChange={handleSheetChanges}
          enablePanDownToClose // Allows swipe down to close
          backdropComponent={renderBackdrop}
        >
          <BottomSheetView style={styles.contentContainer}>
            <Link href="/(auth)/login" asChild>
              <Button
                style={{ marginTop: 16, marginBottom: 16 }}
                onPress={openBottomSheet}
                text="Log in"
              />
            </Link>
            <Link asChild href={'/(auth)/email-confirmation'}>
              <Button
                variant="secondary"
                onPress={openBottomSheet}
                text="sign up"
              />
            </Link>
          </BottomSheetView>
        </BottomSheet>
      </View>
      <StatusBar style="dark" />
    </>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: STATUSBAR_HEIGHT, // Ensure content doesn't overlap with the status bar
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  welcomeView: {
    marginTop: height * 0.066,
  },
  header: {
    textAlign: 'center',
  },
  subHeader: {
    paddingTop: 12,
    fontSize: 18,
    textAlign: 'center',
  },
  lottie: {
    width: width * 0.95,
    height: width,
  },
  buttonContainer: {
    marginTop: 80,
  },
});

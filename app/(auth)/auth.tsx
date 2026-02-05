import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import React, { useCallback, useRef } from 'react';
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
import { router } from 'expo-router';
import OnboardFive from '../../assets/icons/onboarding/2.svg';

const { width, height } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 20 : Constants.statusBarHeight;

type Props = {};

const Welcome = (props: Props) => {
  const theme = useTheme<Theme>();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleSheetChanges = useCallback((index: number) => {
    // no-op
  }, []);

  const handleBottomSheet = () => { };
  const openBottomSheet = () => {
    bottomSheetRef.current?.expand();
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
          <View style={{ alignItems: 'center' }}>
            <OnboardFive width={320} height={320} />
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
          <View style={styles.footer}>
            <Text style={styles.footerText}>v0.5</Text>
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
            <Button
              style={{ marginTop: 16, marginBottom: 16 }}
              onPress={() => router.push('/(auth)/login')}
              text="Log in"
            />
            <Button
              variant="secondary"
              onPress={() => router.push('/(auth)/email-confirmation')}
              text="sign up"
            />
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
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#9A9A9A',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

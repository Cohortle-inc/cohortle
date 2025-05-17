import React from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Onboarding from 'react-native-onboarding-swiper';
import Lottie from 'lottie-react-native';
import { useRouter } from 'expo-router';
import { setItem } from '@/utils/asyncStorage';
import { Theme, Text } from '@/theme/theme';

const { width } = Dimensions.get('window');

const OnBoarding = () => {
  const router = useRouter();
  const theme = useTheme<Theme>();

  const handleDone = () => {
    router.replace('/(auth)/auth');
    setItem('onboarded', 'true');
  };

  const handleSkip = () => {
    router.replace('/(auth)/auth');
    setItem('onboarded', 'true');
  };

  const doneButton = ({ ...props }) => {
    return (
      <TouchableOpacity style={styles.doneButton} {...props}>
        <Text style={{ fontFamily: 'DMSansSemiBold' }}>Done</Text>
      </TouchableOpacity>
    );
  };

  const Skip = ({ ...props }) => {
    return (
      <TouchableOpacity {...props}>
        <Text style={styles.skipNext}>Skip</Text>
      </TouchableOpacity>
    );
  };

  const Next = ({ ...props }) => {
    return (
      <TouchableOpacity {...props}>
        <Text style={styles.skipNext}>Next</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Onboarding
        NextButtonComponent={Next}
        SkipButtonComponent={Skip}
        onSkip={handleSkip}
        onDone={handleDone}
        DoneButtonComponent={doneButton}
        bottomBarHighlight={false}
        containerStyles={{
          paddingHorizontal: theme.spacing.m,
          flex: 1,
        }}
        pages={[
          {
            backgroundColor: theme.colors.skyBlue,
            image: (
              <View>
                <Text style={[styles.header]} variant="headerTwo">
                  Learn and network at the same time!
                </Text>
                <Lottie
                  style={styles.lottie}
                  source={require('../../assets/images/lottie.json')}
                  autoPlay
                  loop
                />
                <Text style={styles.subHeading} variant="subheading">
                  Invited to Cohortly{' '}
                  <Text style={{ textDecorationLine: 'underline' }}>
                    Accept Invitation
                  </Text>
                </Text>
              </View>
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor: theme.colors.mintGreen,
            image: (
              <View>
                <Text style={styles.header} variant="headerTwo">
                  You can be a Convener
                </Text>
                <Lottie
                  style={styles.lottie}
                  source={require('../../assets/images/lottie.json')}
                  autoPlay
                  loop
                />
              </View>
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor: theme.colors.lightYellow,
            image: (
              <View>
                <Text style={styles.header} variant="headerTwo">
                  A Creator
                </Text>
                <Lottie
                  style={styles.lottie}
                  source={require('../../assets/images/lottie.json')}
                  autoPlay
                  loop
                />
              </View>
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor: theme.colors.lightGreen,
            title: '',
            image: (
              <View>
                <Text style={styles.header} variant="headerTwo">
                  Or a Student
                </Text>
                <Lottie
                  style={styles.lottie}
                  source={require('../../assets/images/lottie.json')}
                  autoPlay
                  loop
                />
              </View>
            ),
            subtitle: '',
          },
        ]}
      />
    </View>
  );
};

export default OnBoarding;

const styles = StyleSheet.create({
  header: {
    padding: 24,
    textAlign: 'center',
    marginTop: 150,
  },
  subHeading: {
    textAlign: 'center',
    // marginBottom: -360,
  },
  skipNext: {
    fontFamily: 'DMSansSemiBold',
    paddingLeft: 24,
    paddingRight: 24,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  lottie: {
    width: width * 0.95,
    height: width,
    marginBottom: 150,
  },
  doneButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    borderTopLeftRadius: 100,
    borderBottomLeftRadius: 100,
  },
});

import React, { useState } from 'react';
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Onboarding from 'react-native-onboarding-swiper';
import Lottie from 'lottie-react-native';
import { useRouter } from 'expo-router';
import { setItem } from '@/utils/asyncStorage';
import { Theme, Text } from '@/theme/theme';
import OnboardOne from '../../assets/icons/onboarding/1.svg'
import OnboardTwo from '../../assets/icons/onboarding/2.svg'
import OnboardFour from '../../assets/icons/onboarding/3.svg'
import OnboardThree from '../../assets/icons/onboarding/5.svg'

const { width } = Dimensions.get('window');

const OnBoarding = () => {
  const [role, setRole] = useState('');
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
            backgroundColor: 'white',
            image: (
              <View style={{alignItems: 'center'}}>
                <Text style={[styles.header]} variant="headerTwo">
                  Learning feels better with others
                </Text>
                <OnboardOne width={400} height={400} />
                {/* <Text style={styles.subHeading} variant="subheading">
                  Invited to Cohortle{' '}
                  <Text style={{ textDecorationLine: 'underline' }}>
                    Accept Invitation
                  </Text>
                </Text> */}
              </View>
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor: 'white',
            image: (
              <View>
                <Text style={styles.header} variant="headerTwo">
                  Create a space where people grow
                </Text>
                <OnboardTwo width={400} height={400} />
              </View>
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor: 'white',
            image: (
              <View >
                <Text style={styles.header} variant="headerTwo">
                  Share knowledge,
                    one lesson at a time
                </Text>
                <OnboardThree width={400} height={400} />
              </View>
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor: 'white',
            title: '',
            image: (
              <View>
                <Text style={styles.header} variant="headerTwo">
                  Stay motivated, finish what you start
                </Text>
                <OnboardFour width={400} height={400} />
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
    marginTop: 150
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

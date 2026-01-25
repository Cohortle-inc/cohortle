import React, { useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { SafeAreaWrapper } from '@/HOC';
import { Text, Theme } from '@/theme/theme';
import { Button } from '@/components/ui';
import { RadioButton } from '@/components/Form';
import { router } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import axios from 'axios';
import Constants from 'expo-constants';
import { useLocalSearchParams, useSearchParams } from 'expo-router/build/hooks';
import { setItem } from '@/utils/asyncStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from '@/ui';

const { width } = Dimensions.get('window');

// Enable layout animation on Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const convenerDefinition = [
  'The Convener is the organizer of each cohort. Setting the direction, curationg the learning path and moving the group forward'
];

const learnerDefinition = [
  'A Learner is an active menmber in a cohort, engaging with lessons, completing tasks and growing alongside the community'
];

const SignUp = () => {
  const theme = useTheme<Theme>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedRole, setSelectedRole] = useState<
    'convener' | 'learner' | 'instructor' | null
  >(null);
  const [mainRole, setMainRole] = useState<'convener' | 'learner' | null>(null);
  const [isNextButtonDisabled, setIsNextButtonDisabled] = useState(true);
  const [showDefinition, setShowDefinition] = useState(false);
  // Resolve API URL with fallback (handles preview builds where env may not be injected)
  const apiURL =
    process.env.EXPO_PUBLIC_API_URL

  const token = useLocalSearchParams<{ token: string }>();

  const handleRoleSelection = (role: 'convener' | 'learner') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (mainRole !== role) {
      setMainRole(role);
      setShowDefinition(true);

      if (role === 'learner') {
        setSelectedRole('learner');
        setIsNextButtonDisabled(false);
      } else {
        setSelectedRole(null);
        setIsNextButtonDisabled(true);
      }
    }
  };

  const handleSubRoleSelection = (role: 'convener' | 'instructor') => {
    setSelectedRole(role);
    console.log(role);
    setIsNextButtonDisabled(false);
  };

  const renderDefinition = (definition: string[]) => (
    <View style={styles.definitionContainer}>
      {definition.map((paragraph, index) => (
        <Text key={index} style={styles.definitionText}>
          {paragraph}
        </Text>
      ))}
    </View>
  );
  const handleRole = async () => {
    setLoading(true);
    setError('');

    console.log('[SignUp] apiURL:', apiURL);
    console.log('[SignUp] token param present:', !!token?.token);

    try {
      const response = await axios.patch(
        `${apiURL}/v1/api/profile/set-role`,
        { role: selectedRole },
        {
          headers: {
            Authorization: token?.token ? `Bearer ${token.token}` : undefined,
          },
        }
      );

      console.log(response.data);

      if (!response.data.error) {
        if (response.data.token) {
          await AsyncStorage.setItem('authToken', response.data.token);
        }

        setError('role set!');

        if (selectedRole !== 'learner') {
          router.navigate({
            pathname: '/(auth)/(convener)/programme-intent',
            params: { token: response.data.token },
          });
        } else {
          router.navigate({
            pathname: '/(student)/about',
            params: { token: response.data.token },
          });
        }
      }

    } catch (err: any) {
      console.error('[SignUp] Error setting role:', err.message || err);
      if (err.response) {
        console.error('status:', err.response.status);
        console.error('data:', err.response.data);
      }
      setError('error setting role: ' + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <Header number={1} total={4} />
        <Text variant={'headerTwo'} style={{ paddingBottom: 57 }}>
          Create an account as a{' '}
          {selectedRole || mainRole ? (
            <View>
              <Text variant={'headerTwo'} style={styles.selectedRoleText}>
                {selectedRole || mainRole}
              </Text>
              <View
                style={{
                  height: 2,
                  backgroundColor: theme.colors.primary, // Change to your desired color
                  marginTop: 0,
                }}
              />
            </View>
          ) : (
            '...'
          )}
        </Text>

        <View>
          <Button
            style={{ marginBottom: 24 }}
            textStyle={styles.buttonText}
            variant={
              mainRole === 'convener' && showDefinition ? 'primary' : 'outline'
            }
            text="Convener"
            onPress={() => handleRoleSelection('convener')}
          />
          {mainRole === 'convener' && showDefinition && (
            <View style={{ paddingHorizontal: 8, marginBottom: 24 }}>
              {renderDefinition(convenerDefinition)}

              <Text
                style={{
                  marginTop: 16,
                  marginBottom: 12,
                  fontFamily: 'DMSansMedium',
                }}
              >
                How will you use Cohortle?
              </Text>

              <RadioButton
                label="I run learning programmes"
                selected={selectedRole === 'convener'}
                onSelect={() => handleSubRoleSelection('convener')}
              />
              <RadioButton
                label="I support programmes (admin / ops)"
                selected={selectedRole === 'instructor'}
                onSelect={() => handleSubRoleSelection('convener')}
              />
            </View>
          )}

          <Button
            textStyle={styles.buttonText}
            variant={
              mainRole === 'learner' && showDefinition ? 'primary' : 'outline'
            }
            text="Learner"
            onPress={() => handleRoleSelection('learner')}
          />
          {mainRole === 'learner' &&
            showDefinition &&
            renderDefinition(learnerDefinition)}
        </View>

        <View style={{ marginTop: 120 }}>
          <Button
            disabled={isNextButtonDisabled}
            text="Next"
            onPress={handleRole}
          />
        </View>
      </View>
    </SafeAreaWrapper>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  buttonText: {
    textAlign: 'left',
  },
  definitionContainer: {
    paddingTop: 8,
  },
  definitionText: {
    marginBottom: 8,
  },
  selectedRoleText: {
    textTransform: 'capitalize',
  },
  underline: {
    height: 2,
    backgroundColor: 'yellow', // Change to your desired color
    marginTop: 2,
  },
});

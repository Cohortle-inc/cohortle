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
import { router } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import axios from 'axios';
import { useLocalSearchParams, useSearchParams } from 'expo-router/build/hooks';

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
    'convener' | 'learner' | null
  >(null);
  const [isNextButtonDisabled, setIsNextButtonDisabled] = useState(true);
  const [showDefinition, setShowDefinition] = useState(false);
  const apiURL = process.env.EXPO_PUBLIC_API_URL;
  const token = useLocalSearchParams<{ token: string }>();

  const handleRoleSelection = (role: 'convener' | 'learner') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (selectedRole !== role) {
      setSelectedRole(role);
      setShowDefinition(true);
      setIsNextButtonDisabled(false);
    }
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
    console.log(token);
    try {
      const response = await axios.patch(
        `${apiURL}/v1/api/profile/set-role`,
        { role: selectedRole },
        {
          headers: {
            Authorization: `Bearer ${token.token}`,
          },
        },
      );
      console.log(response.data);
      if (!response.data.error) {
        setError('role set!');
        setLoading(false);
        if (selectedRole === 'convener') {
          router.navigate({
            pathname: '/(convener)/about',
            params: { token: response.data.token },
          });
        } else if (selectedRole === 'learner') {
          router.navigate({
            pathname: '/(student)/about',
            params: { token: response.data.token },
          });
        }
        console.log(response.data.token);
      }
    } catch (err) {
      setError('error setting role: ' + err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <Text variant={'headerTwo'} style={{ paddingBottom: 57 }}>
          Create an account as a{' '}
          {selectedRole ? (
            <View>
              <Text variant={'headerTwo'} style={styles.selectedRoleText}>
                {selectedRole}
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
              selectedRole === 'convener' && showDefinition
                ? 'primary'
                : 'outline'
            }
            text="Convener"
            onPress={() => handleRoleSelection('convener')}
          />
          {selectedRole === 'convener' &&
            showDefinition &&
            renderDefinition(convenerDefinition)}

          <Button
            textStyle={styles.buttonText}
            variant={
              selectedRole === 'learner' && showDefinition
                ? 'primary'
                : 'outline'
            }
            text="Learner"
            onPress={() => handleRoleSelection('learner')}
          />
          {selectedRole === 'learner' &&
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

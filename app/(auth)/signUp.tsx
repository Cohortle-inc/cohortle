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
  'A convener is someone who takes the lead in organizing and bringing people together for a common purpose.',
  'They typically act as a facilitator in meetings or assemblies, ensuring that all voices are heard and that the gathering achieves its objectives.',
  'Conveners often work behind the scenes to coordinate logistics, communicate with participants, and set the agenda.',
];

const creatorDefinition = [
  'A creator is an individual who brings new ideas, content, or art into the world.',
  "They are often visionaries who use their skills and imagination to produce something unique, whether it's in the form of writing, art, digital content, or other media.",
  'Creators often have a passion for their craft and are driven by the desire to innovate and inspire others.',
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
            text="Student"
            onPress={() => handleRoleSelection('learner')}
          />
          {selectedRole === 'learner' &&
            showDefinition &&
            renderDefinition(creatorDefinition)}
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

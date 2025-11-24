import { Dimensions, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Text } from '@/theme/theme';
import { Button } from '@/components/ui';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import Lottie from 'lottie-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {};
const { width } = Dimensions.get('window');

const CheckEmail = (props: Props) => {
  const params = useLocalSearchParams();
  const initial_token = params.token as string;
  const email = params.email as string;
  const apiURL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  // const [token, setToken] = useState(initial_token);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const verify_token = async () => {
    setLoading(true);
    setError('');
    if (!initial_token) {
      setError('No token recieved. Contact the developers');
    }

    try {
      const response = await axios.post(`${apiURL}/v1/api/auth/verify-email`, {
        verify_token: initial_token,
      });
      if (!response.data.error) {
        console.log('verified!');
        router.navigate({
          pathname: '/(auth)/signUp',
          params: { token: response.data.token },
        });
        console.log('verified!');
        await AsyncStorage.setItem('authToken', response.data.token);
        console.log('saved');
      } else setError("Couldn't verify token. Contact the developers");
    } catch (err) {
      setError('An unexpected error occurred. Contact the developers');
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verify_token();
  }, []);

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <View>
          <Lottie
            style={styles.lottie}
            source={require('../../assets/images/lottie.json')}
            autoPlay
            loop
          />
        </View>
        <Text
          variant={'headerTwo'}
          style={{ textAlign: 'center', paddingBottom: 8 }}
        >
          Verifying your email!
        </Text>
        <Text style={{ textAlign: 'center' }}>
          This should only take a moment
          {/* Turn the text bellow bold */}
          <Text>...</Text>
        </Text>

        <View style={{ marginTop: 36 }}>
          <Button text="Next" onPress={() => {}} />
        </View>
      </View>
    </SafeAreaWrapper>
  );
};

export default CheckEmail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {},
  lottie: {
    width: width * 0.95,
    height: width,
  },
});

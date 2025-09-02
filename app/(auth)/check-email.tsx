import { Dimensions, StyleSheet, View } from 'react-native';
import React from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Text } from '@/theme/theme';
import { Button } from '@/components/ui';
import { router, useLocalSearchParams } from 'expo-router';
import Lottie from 'lottie-react-native';

type Props = {};
const { width } = Dimensions.get('window');

const CheckEmail = (props: Props) => {
  const { email } = useLocalSearchParams<{ email?: string }>();
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
          Check your email!
        </Text>
        <Text style={{ textAlign: 'center' }}>
          To confirm your email address, tap the button on the email we sent to
          {/* Turn the text bellow bold */}
          <Text> {email}</Text>
        </Text>

        <View style={{ marginTop: 36 }}>
          <Button
            text="Next"
            onPress={() => router.navigate('/(auth)/get-started')}
          />
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

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { removeItem } from '@/utils/asyncStorage';

type Props = {};

const Home = (props: Props) => {
  const handleClick = async () => {
    await removeItem('onboarded');
  };
  return (
    <View>
      <Text>
        lorem Lorem ipsum dolor sit amet, consectetur adipisicing elit.
        Consequatur provident quae fuga molestias quibusdam possimus veniam
        atque quos? Mollitia assumenda perspiciatis sapiente aspernatur aliquid,
        doloremque ducimus magnam quo vero veniam?
      </Text>
      <TouchableOpacity onPress={handleClick}>
        <Text>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({});

import { Pressable, StyleSheet, View } from 'react-native';
import React from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Input } from '@/components/Form';
import { Header } from '@/ui';
import { Text } from '@/theme/theme';
import { BackArrowIcon } from '@/assets/icons';
import { Link } from 'expo-router';
 
const CommunityInfo = () => {
  return (
    <SafeAreaWrapper style={{ display: "flex", flexDirection: "column", gap: 20}}>
      <View style={{ marginTop: 24, }}>
        <Header number={2} total={2} />
        <View>
          <Text
            style={styles.header}
          >
            What username do you want to use?
          </Text>
        </View>
        <View style={{ gap: 24 }}>
          <Input label="Username" placeholder="Username" />
        </View>
      </View>

      <View>
        <Text style={styles.header}>Set Password</Text>
        
        <View style={{ gap: 24 }}>
          <Input label="Password" placeholder="create a password" />
          <Input label="Re-type Password" placeholder="re-type your password" />
        </View>
      </View>

      <Link asChild href="/student-screens/cohorts">
        <Pressable
          style={{
            borderWidth: 1,
            borderColor: '#F8F1FF',
            paddingVertical: 14,
            alignItems: 'center',
            borderRadius: 32,
            backgroundColor: '#391D65',
          }}
        >
          <Text style={{ color: '#fff' }}>next</Text>
        </Pressable>
      </Link>
      <Pressable
        style={{
          paddingVertical: 14,
          alignItems: 'center',
          marginTop: 32,
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
        }}
      >
        <BackArrowIcon />
        <Text style={{ color: '#391D65' }}>Back</Text>
      </Pressable>
    </SafeAreaWrapper>
  );
};

export default CommunityInfo;

const styles = StyleSheet.create({
  header: {
    fontSize: 18,
    fontFamily: 'DMSansMedium',
    marginBottom: 18,
    marginTop: 16,
    color: '#B085EF',
  }
});

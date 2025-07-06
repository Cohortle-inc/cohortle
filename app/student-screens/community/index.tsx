import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Text } from '@/theme/theme';
import { Plus } from '@/assets/icons';
import { useRouter } from 'expo-router';
import { Placeholder } from '@/assets/images';

const Community = () => {
  const [activeTab, setActiveTab] = useState<'convener' | 'foryou'>('convener');

  return (
    <SafeAreaWrapper>
      <View style={{ marginVertical: 16 }}>
        <Text style={{ color: '#B085EF', fontSize: 18, fontWeight: '600' }}>
          Cohortle
        </Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TabButton
          label="Convener"
          active={activeTab === 'convener'}
          onPress={() => setActiveTab('convener')}
        />
        <TabButton
          label="For You"
          active={activeTab === 'foryou'}
          onPress={() => setActiveTab('foryou')}
        />
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'convener' ? (
          <>
            <Message />
            <Message />
            <Message />
            <Message />
            <Message />
            <Message />
            <Message />
          </>
        ) : (
          <>
            <Message withImg />
            <Message />
          </>
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

export default Community;

const TabButton = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.tabButton, active && styles.activeTab]}
  >
    <Text style={[styles.tabText, active && styles.activeTabText]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const Message = ({ withImg }: any) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={{
        marginBottom: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#ECDCFF',
        borderRadius: 8,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#40135B',
          }}
        ></View>
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          <Text>Sadiq</Text>
          <Text
            style={{
              color: '#fff',
              backgroundColor: '#391D65',
              borderRadius: 999,
              padding: 2,
              fontSize: 6,
              height: 12,
            }}
          >
            Convener
          </Text>
        </View>
      </View>
      <View style={{ marginTop: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>
          Web dev efficiency
        </Text>
        <Text style={{ fontSize: 14, marginTop: 16 }}>
          that aspects can't hide 💪🏽 that aspects can't hide 💪🏽 that
          aspects can't hide 💪🏽 that aspects can't hide 💪🏽
        </Text>
        <View
          style={{
            marginTop: 16,
            alignItems: 'center',
          }}
        >
          <Image source={Placeholder} />
        </View>
        <Text style={{ fontSize: 10, marginTop: 16 }}>
          4:38 PM • Sep 18, 2024
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    padding: 2,
    borderWidth: 1,
    borderColor: '#391D65',
    borderRadius: 8,
  },
  tabButton: {
    paddingVertical: 8,
    width: '50%',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#391D65',
  },
  tabText: {
    fontSize: 14,
    color: '#333',
  },
  activeTabText: {
    color: 'white',
    fontWeight: '600',
  },
});

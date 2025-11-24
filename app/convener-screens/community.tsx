import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaWrapper } from '@/HOC';
import { Text } from '@/theme/theme';
import { Plus } from '@/assets/icons';
import { Link, useRouter } from 'expo-router';
import { Placeholder } from '@/assets/images';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Posts } from '@/types/postTypes';
import Message from '@/components/Post/post';

const Community = () => {
  const [activeTab, setActiveTab] = useState<'convener' | 'foryou'>('convener');
  const [posts, setPosts] = useState<Posts[]>([]);
  const apiURL = process.env.EXPO_PUBLIC_API_URL;

  const fetchPosts = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await axios.get(`${apiURL}/v1/api/posts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (Array.isArray(response.data.posts)) {
      setPosts(response.data.posts); // ✅ correct
    } else {
      console.warn('Unexpected posts response:', response.data);
      setPosts([]); // fallback
    }
    return response.data.posts;
  };
  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <SafeAreaWrapper>
      <View style={{ marginVertical: 16 }}>
        <Link
          href="/(auth)/login"
          style={{ color: '#B085EF', fontSize: 18, fontWeight: '600' }}
        >
          Cohortle
        </Link>
        <View
        
          // href={'/convener-screens/(cohorts)/upload'}
          // href={'/convener-screens/(cohorts)/upload'}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            padding: 8,
            borderRadius: 8,
            backgroundColor: '#E9D7FE',
          }}
        >
          <Text style={{ fontWeight: 700 }}>Create Post</Text>
        </View>
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
       
          <View style={{width: '100%', height: 400, justifyContent: 'center', alignItems: 'center'}}>
            <Text>Comming Soon...</Text>
          </View>
        {/* {activeTab === 'convener' ? (
          <>
            {posts.map((post) => (
              <Message
                postMessage={{
                  id: post.id,
                  posted_by: post.posted_by,
                  text: post.text,
                }}
              />
            ))}
          </>
        ) : (
          <></>
        )} */}
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

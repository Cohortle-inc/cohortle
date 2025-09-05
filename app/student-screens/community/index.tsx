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

interface Posts {
  id: number;
  posted_by: {
    first_name: string;
    last_name: string;
    email: string;
  } | null; // allow null in case user lookup fails
  text: string;
}
const Community = () => {
  const [activeTab, setActiveTab] = useState<'convener' | 'foryou'>('convener');
  const [posts, setPosts] = useState<Posts[]>([])
  const apiURL = process.env.EXPO_PUBLIC_API_URL;
  
  const fetchPosts = async () => {
    const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${apiURL}/v1/api/posts`,
        { headers: {
          Authorization: `Bearer ${token}`,
        }
      });
        if (Array.isArray(response.data.posts)) {
          setPosts(response.data.posts); // ✅ correct
        } else {
          console.warn("Unexpected posts response:", response.data);
          setPosts([]); // fallback
        }
      return response.data.posts
      
  };
  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <SafeAreaWrapper>
      <View style={{ marginVertical: 16 }}>
        <Link href="/(auth)/login" style={{ color: '#B085EF', fontSize: 18, fontWeight: '600' }}>
          Cohortle
        </Link>
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
      {posts.map((post) => (
        <Message 
          key={post.id}
          postMessage={{
            id: post.id,
            posted_by: post.posted_by,
            text: post.text,
          }} 
        />
      ))}
    </>
        ) : (
          <>
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

interface PostMessageProps {
  withImg?: boolean;
  postMessage: Posts;
}
const Message: React.FC<PostMessageProps> = ({withImg, postMessage}) => {
  
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
      key={postMessage.id}
      onPress={() => router.push('/')}
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
          <Text>{postMessage.posted_by?.first_name} {postMessage.posted_by?.last_name}</Text>
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
        <Text style={{ fontSize: 14, marginTop: 16 }}>
          {postMessage.text}</Text>
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

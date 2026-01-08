import {
  ActivityIndicator,
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
import { useGetPosts } from '@/api/posts/getPosts';
import { colors } from '@/utils/color';

const Community = () => {
  const [activeTab, setActiveTab] = useState<'convener' | 'foryou'>('convener');
  // const [posts, setPosts] = useState<Posts[]>([]);
  const apiURL = process.env.EXPO_PUBLIC_API_URL;
  const { data: posts = [], isLoading, isError, refetch } = useGetPosts()

  if (isLoading) {
    return (
      <SafeAreaWrapper>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaWrapper>
    );
  }

  if (isError) {
    return (
      <SafeAreaWrapper>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'red', textAlign: 'center' }}>Failed to load posts. Please try again later.</Text>
          <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 10 }}>
            <Text style={{ color: colors.primary, fontFamily: 'DMSansSemiBold' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }


  return (
    <SafeAreaWrapper>
      <View style={{ marginVertical: 16 }}>
        <Link
          href="/(auth)/login"
          style={{ color: '#B085EF', fontSize: 18, fontWeight: '600' }}
        >
          Cohortle
        </Link>
        <Link
          // href={'/convener-screens/(cohorts)/upload'}
          href={'/convener-screens/community/upload'}
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
            {posts.map((post: Posts) => (
              <Message
                postMessage={{
                  id: post.id,
                  posted_by: post.posted_by,
                  text: post.text,
                  updated_at: post.updated_at,
                  community_names: post.community_names,
                }}
              />
            ))}
          </>
        ) : (
          <></>
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

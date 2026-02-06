import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
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
import { useGetLearnerCohorts } from '@/api/learners/cohortsJoined';
import { useGetCohortAnnouncements } from '@/api/announcements';
import { useGetDiscussions } from '@/api/discussions';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/utils/color';
import Modal from 'react-native-modal';

const Community = () => {
  const [activeTab, setActiveTab] = useState<'convener' | 'foryou'>('convener');
  const [posts, setPosts] = useState<Posts[]>([]);
  const apiURL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();

  const { data: joinedCohorts, isLoading: cohortsLoading } = useGetLearnerCohorts();

  const fetchPosts = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await axios.get(`${apiURL}/v1/api/posts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (Array.isArray(response.data.posts)) {
      setPosts(response.data.posts);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const openDiscussions = () => {
    router.push('/student-screens/community/discussions');
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
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {activeTab === 'foryou' ? (
          <View style={{ paddingBottom: 20 }}>
            {cohortsLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : joinedCohorts && joinedCohorts.length > 0 ? (
              joinedCohorts.map((cohort: any) => (
                <View key={cohort.id}>
                  <CohortAnnouncements cohortId={cohort.id} cohortName={cohort.name} />
                  <CohortDiscussions cohortId={cohort.id} cohortName={cohort.name} />
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Join a cohort to see announcements</Text>
            )}
          </View>
        ) : (
          <View style={{ paddingBottom: 20 }}>
            {posts.length > 0 ? (
              posts.map((post) => (
                <Message
                  key={post.id}
                  postMessage={{
                    id: post.id,
                    posted_by: post.posted_by,
                    text: post.text,
                    updated_at: post.updated_at,
                  }}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No posts yet. Start the conversation!</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

    </SafeAreaWrapper>
  );
};

const CohortAnnouncements = ({ cohortId, cohortName }: { cohortId: number, cohortName: string }) => {
  const { data: announcements, isLoading } = useGetCohortAnnouncements(cohortId);

  if (isLoading) return null;
  if (!announcements || announcements.length === 0) return null;

  return (
    <View style={styles.cohortSection}>
      <Text style={styles.cohortLabel}>{cohortName}</Text>
      {announcements.map((announcement) => (
        <View key={announcement.id} style={styles.announcementCard}>
          <View style={styles.announcementHeader}>
            <View style={[styles.priorityDot, { backgroundColor: announcement.priority === 'high' ? '#EF4444' : announcement.priority === 'medium' ? '#F59E0B' : '#10B981' }]} />
            <Text style={styles.announcementTitle}>{announcement.title}</Text>
          </View>
          <Text style={styles.announcementContent}>{announcement.content}</Text>
          <Text style={styles.announcementDate}>
            {announcement.first_name} {announcement.last_name} • {new Date(announcement.created_at).toLocaleDateString()}
          </Text>
        </View>
      ))}
    </View>
  );
};

const CohortDiscussions = ({ onPress, cohortId, cohortName }: { onPress: () => void, cohortId: number, cohortName: string }) => {
  const { data: discussions, isLoading } = useGetDiscussions({ cohort_id: cohortId });

  if (isLoading) return null;
  if (!discussions || discussions.length === 0) return null;

  return (
    <TouchableOpacity style={styles.cohortSection} onPress={onPress}>
      <Text style={[styles.cohortLabel, { color: '#391D65', opacity: 0.7 }]}>{cohortName} Discussions</Text>
      {discussions.slice(0, 3).map((discussion) => (
        <TouchableOpacity key={discussion.id} style={styles.discussionItem}>
          <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
          <Text style={styles.discussionTitle} numberOfLines={1}>{discussion.title}</Text>
          <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
        </TouchableOpacity>
      ))}
    </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginVertical: 12,
  },
  cohortSection: {
    marginBottom: 20,
  },
  cohortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  announcementCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  announcementContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  announcementDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
  },
  discussionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 10,
  },
  discussionTitle: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});

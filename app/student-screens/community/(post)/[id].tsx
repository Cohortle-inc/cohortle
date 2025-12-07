import { Link, useLocalSearchParams } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaWrapper } from '@/HOC';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Message from '@/components/Post/post';
import { Comment } from '@/components/Post/comments';
import { CommentInput } from '@/components/Post/input';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommentProp } from '@/types/commentType';
import { Ionicons } from '@expo/vector-icons';
import { Scale } from 'lucide-react-native';
import { colors } from '@/utils/color';

// Update the interface to match potential backend response
export interface Post {
  id: number;
  posted_by?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
  text?: string;
  // Add other fields that might come from backend
  created_at?: string;
  updated_at?: string;
}

export default function PostScreen() {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentProp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { id } = useLocalSearchParams<{ id: string }>();
  const apiURL = process.env.EXPO_PUBLIC_API_URL;

  const getPost = async () => {
    if (!id) {
      setError('Post ID is required');
      setLoading(false);
      return;
    }

    const apiURL = process.env.EXPO_PUBLIC_API_URL;
    const token = await AsyncStorage.getItem('authToken');
    try {
      const response = await axios.get(`${apiURL}/v1/posts/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Full response:', response.data);

      // Handle different response structures
      if (response.data.error === false && response.data.post) {
        const postData = Array.isArray(response.data.post)
          ? response.data.post[0]
          : response.data.post;
        setPost(postData);
      } else if (response.data.post) {
        // Some APIs might not have an error field
        setPost(response.data.post);
      } else {
        setError(response.data.message || 'Failed to fetch post');
      }
    } catch (err: any) {
      console.log('Error fetching post:', err);
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPost();
  }, [id]);

  const fetchComment = async () => {
    const token = await AsyncStorage.getItem('authToken');
    try {
      const response = await axios.get(`${apiURL}/v1/post/${id}/comments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (Array.isArray(response.data.comments)) {
        setComments(response.data.comments);
      } else {
        console.warn('Unexpected result', response.data);
        setComments([]);
      }
      console.log(response.data.comments);
    } catch (error) {
      console.error(error);
      console.log('fail');
    }
  };

  useEffect(() => {
    fetchComment();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#391D65" />
        </View>
      </SafeAreaWrapper>
    );
  }

  if (error) {
    return (
      <SafeAreaWrapper>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={getPost} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
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
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {post ? (
          <Message
            postMessage={{
              id: post.id?.toString() || id || '',
              posted_by: post.posted_by as any,
              text: post.text || 'No content available',
            }}
          />
        ) : (
          <Text>Post not found</Text>
        )}
        <>
          {comments.length !== 0 ? (
            comments.map((comment) => (
              <Comment
                key={comment.id} // Don't forget the key prop!
                prop={{
                  id: comment.id,
                  text: comment.text,
                  post_id: comment.post_id,
                  user: comment.user,
                }}
              />
            ))
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Ionicons
                name="chatbubble-ellipses"
                size={30}
                color={colors.purpleShade}
              />
              <Text style={{ fontWeight: 600, fontSize: 16 }}>
                Be the first to comment
              </Text>
            </View>
          )}
        </>
        <CommentInput postId={id} />
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#391D65',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
});

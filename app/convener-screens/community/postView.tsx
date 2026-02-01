import { useLocalSearchParams, useRouter, useNavigation, useFocusEffect } from 'expo-router';
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
import { useEffect, useState, useCallback } from 'react';
import Message from '@/components/Post/post';
import { Comment } from '@/components/Post/comments';
import { CommentInput } from '@/components/Post/input';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommentProp } from '@/types/commentType';
import { Ionicons } from '@expo/vector-icons';
import { Scale } from 'lucide-react-native';
import { colors } from '@/utils/color';
import { useGetComments, usePostComment } from '@/api/comment';
import { Posts } from '@/types/postTypes';

// Update the interface to match potential backend response

export default function PostScreen(): React.JSX.Element {
  const [post, setPost] = useState<Posts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const parentNavigator = navigation.getParent();
      if (parentNavigator) {
        parentNavigator.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }

      return () => {
        if (parentNavigator) {
          parentNavigator.setOptions({
            tabBarStyle: {
              paddingTop: 12,
              paddingBottom: 12,
              height: 68,
              backgroundColor: '#ffffff',
              display: 'flex',
            },
          });
        }
      };
    }, [navigation])
  );
  const apiURL = process.env.EXPO_PUBLIC_API_URL;
  const { mutate: postComment } = usePostComment(id);
  const { data: comments = [], isLoading, isError } = useGetComments(id);
  console.log(comments);
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

  const handlePostComment = (comment: CommentProp) => {
    postComment(comment);
  };



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
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#B085EF" />
          <Text style={{ color: '#B085EF', fontSize: 18, fontWeight: '600' }}>
            Cohortle
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {post ? (
          <Message
            postMessage={{
              id: post.id,
              posted_by: post.posted_by,
              text: post.text,
              updated_at: post.updated_at,
              community_names: post.community_names,
            }}
          />
        ) : (
          <Text>Post not found</Text>
        )}
        <>
          {isLoading && (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#391D65" />
            </View>
          )}
          {isError && (
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>Failed to load comments</Text>
            </View>
          )}
          {comments.length === 0 && (
            <View style={styles.centerContainer}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={24}
                color={colors.purpleShade}
                style={{
                  marginBottom: 8,
                }}
              />
              <Text style={{ color: colors.primary }}>Be the first to comment</Text>
            </View>
          )}
          {comments.map((comment: CommentProp) => (
            <Comment
              key={comment.id}
              prop={{
                id: comment.id,
                text: comment.text,
                post_id: comment.post_id,
                user: comment.user,
                updated_at: comment.updated_at,
              }}
            />
          ))}
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
    padding: 10,
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

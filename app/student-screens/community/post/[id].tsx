import { Link, useLocalSearchParams } from "expo-router";
import { 
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  View, 
  ActivityIndicator
} from "react-native";
import { SafeAreaWrapper } from '@/HOC';
import axios from "axios";
import { useEffect, useState } from "react";
import Message from "@/components/Post/post";

// Update the interface to match potential backend response
export interface Post {
  id: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const getPost = async () => {
    if (!id) {
      setError("Post ID is required");
      setLoading(false);
      return;
    }

    const apiURL = process.env.EXPO_PUBLIC_API_URL;
    try {
      const response = await axios.get(`${apiURL}/v1/posts/${id}`, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
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
        setError(response.data.message || "Failed to fetch post");
      }
    } catch (err: any) {
      console.log("Error fetching post:", err);
      setError(err.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getPost();
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
        <Link href="/(auth)/login" style={{ color: '#B085EF', fontSize: 18, fontWeight: '600' }}>
          Cohortle
        </Link>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {post ? (
          <Message
          postMessage={{
            id: post.id?.toString() || id || '',
            posted_by: post.posted_by,
            text: post.text || 'No content available',
          }}
          />
        ) : (
          <Text>Post not found</Text>
        )}
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
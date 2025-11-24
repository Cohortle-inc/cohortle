import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../ui';
import { useState } from 'react';
import { CommentProp } from '@/types/commentType';
import { createComment } from '@/api/comment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/utils/color';
interface FormProp {
  postId: string;
}
export const CommentInput = ({ postId }: FormProp) => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (commentData: CommentProp) => {
      const token = await AsyncStorage.getItem('authToken');
      return createComment(commentData, postId, token!);
    },
    onSuccess: () => {
      setText('');
      // Invalidate and refetch comments
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  const handleSubmit = () => {
    if (text.trim()) {
      mutation.mutate({
        text: text.trim(),
        post_id: postId,
      });
    }
  };
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 20,
        paddingHorizontal: 5,
      }}
    >
      <TextInput
        value={text}
        onChangeText={setText}
        style={{
          borderWidth: 1,
          borderRadius: 5,
          borderColor: '#B085EF',
          width: 275,
          padding: 5,
        }}
      />
      <TouchableOpacity
        style={{
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons
          onPress={handleSubmit}
          size={30}
          color={colors.primary}
          name="paper-plane-outline"
        />
      </TouchableOpacity>
    </View>
  );
};

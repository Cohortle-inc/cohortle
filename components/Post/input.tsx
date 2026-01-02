import { ActivityIndicator, Clipboard, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../ui';
import { useState } from 'react';
import { CommentProp } from '@/types/commentType';
import { createComment, usePostComment } from '@/api/comment';
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
  const { mutate: postComment, isPending } = usePostComment(postId);

  const handleSubmit = () => {
    console.log(text);
    postComment({
      text,
      post_id: postId,
    }, {
      onSuccess: () => {
        setText('');
      },
    });
    console.log(postComment);

  };
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 5,
        width: '100%',
      }}
    >
      <TextInput
        value={text}
        onChangeText={setText}
        style={{
          borderWidth: 1,
          borderRadius: 5,
          borderColor: '#B085EF',
          width: '90%',
          padding: 5,
        }}
      />
      <TouchableOpacity
        style={{
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isPending ? (
          <ActivityIndicator size={20} color={colors.primary} />
        ) : (
          <Ionicons
            onPress={handleSubmit}
            size={20}
            color={colors.primary}
            name="paper-plane-outline"
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

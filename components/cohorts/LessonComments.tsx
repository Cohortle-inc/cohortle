import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/utils/color';
import { useGetLessonComments, usePostLessonComment } from '@/api/lessons/comments';

interface LessonCommentsProps {
    lessonId: number;
    cohortId?: number;
}

export const LessonComments: React.FC<LessonCommentsProps> = ({ lessonId, cohortId }) => {
    const { data: commentsResponse, isLoading, isError } = useGetLessonComments(lessonId);
    const { mutate: postComment, isPending: isPosting } = usePostLessonComment(lessonId);

    const [newComment, setNewComment] = useState('');
    const comments = commentsResponse?.comments || [];

    const handlePostComment = () => {
        if (!newComment.trim()) return;
        postComment(
            { commentText: newComment },
            {
                onSuccess: () => setNewComment(''),
            }
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>Comments</Text>

            {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
            ) : isError ? (
                <Text style={styles.errorText}>Failed to load comments</Text>
            ) : (
                <View style={styles.listContainer}>
                    <FlatList
                        data={comments}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        renderItem={({ item }) => (
                            <View style={styles.commentItem}>
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>
                                        {item.user_first_name?.[0] || 'U'}{item.user_last_name?.[0] || ''}
                                    </Text>
                                </View>
                                <View style={styles.commentContent}>
                                    <View style={styles.commentHeader}>
                                        <Text style={styles.commentAuthor}>
                                            {item.user_first_name ? `${item.user_first_name} ${item.user_last_name || ''}` : 'Unknown User'}
                                        </Text>
                                        <Text style={styles.commentDate}>
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <Text style={styles.commentText}>{item.comment_text}</Text>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>No comments yet.</Text>
                        }
                    />
                </View>
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Write a comment..."
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendButton, (!newComment.trim() || isPosting) && styles.disabledButton]}
                    onPress={handlePostComment}
                    disabled={!newComment.trim() || isPosting}
                >
                    <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#1F1F1F',
    },
    listContainer: {
        marginBottom: 20,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginVertical: 10,
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 10,
        marginBottom: 20,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    avatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EDE9FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    commentContent: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 10,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    commentAuthor: {
        fontWeight: 'bold',
        color: '#1F1F1F',
        fontSize: 13,
    },
    commentDate: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    commentText: {
        color: '#4B5563',
        fontSize: 14,
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
    },
    input: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 14,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
});

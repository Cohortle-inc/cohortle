import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/utils/color';
import { useGetDiscussions, usePostDiscussion, useGetDiscussionComments, usePostDiscussionComment } from '@/api/discussions';
import { showMessage } from 'react-native-flash-message';
import { ScrollView } from 'react-native';

interface DiscussionSectionProps {
    programmeId?: number;
    cohortId?: number;
}

export const DiscussionSection: React.FC<DiscussionSectionProps> = ({ cohortId }) => {
    const { data: discussions, isLoading: discussionsLoading } = useGetDiscussions({ cohort_id: cohortId });
    const { mutate: createDiscussion, isPending: isCreatingDiscussion } = usePostDiscussion();

    const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [selectedDiscussionId, setSelectedDiscussionId] = useState<number | null>(null);

    const handleCreateDiscussion = () => {
        if (!newDiscussionTitle.trim()) return;
        createDiscussion(
            { cohort_id: cohortId, title: newDiscussionTitle, description: '' },
            {
                onSuccess: () => {
                    setNewDiscussionTitle('');
                    setShowCreate(false);
                },
            }
        );
    };

    if (selectedDiscussionId) {
        return (
            <CommentSection
                discussionId={selectedDiscussionId}
                onBack={() => setSelectedDiscussionId(null)}
                discussionTitle={discussions?.find(d => d.id === selectedDiscussionId)?.title || 'Discussion'}
            />
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Discussions</Text>
                <TouchableOpacity onPress={() => setShowCreate(!showCreate)}>
                    <Ionicons name={showCreate ? "close" : "add-circle"} size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {showCreate && (
                <View style={styles.createBox}>
                    <TextInput
                        style={styles.input}
                        placeholder="Start a new discussion topic..."
                        value={newDiscussionTitle}
                        onChangeText={setNewDiscussionTitle}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.postButton, (!newDiscussionTitle.trim() || isCreatingDiscussion) && { opacity: 0.5 }]}
                        onPress={handleCreateDiscussion}
                        disabled={!newDiscussionTitle.trim() || isCreatingDiscussion}
                    >
                        <Text style={styles.postButtonText}>{isCreatingDiscussion ? 'Posting...' : 'Post Topic'}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {discussionsLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
            ) : (
                <FlatList
                    data={discussions}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.topicItem} onPress={() => setSelectedDiscussionId(item.id)}>
                            <View style={styles.topicIcon}>
                                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.topicTitle}>{item.title}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                    <Text style={styles.topicMeta}>
                                        {item.user?.first_name || item.user?.last_name
                                            ? `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim()
                                            : 'Unknown Author'}
                                    </Text>
                                    <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#9CA3AF', marginHorizontal: 6 }} />
                                    <Text style={styles.topicMeta}>{new Date(item.created_at).toLocaleDateString()}</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>No discussions yet. Be the first to start one!</Text>}
                />
            )}
        </View>
    );
};

const CommentSection = ({ discussionId, onBack, discussionTitle }: { discussionId: number, onBack: () => void, discussionTitle: string }) => {
    const { data: comments, isLoading: commentsLoading, isError: commentsError } = useGetDiscussionComments(discussionId);
    const { mutate: postComment, isPending: isPostingComment } = usePostDiscussionComment(discussionId);
    const [newComment, setNewComment] = useState('');

    const handlePostComment = () => {
        if (!newComment.trim()) return;
        postComment(
            { comment_text: newComment },
            {
                onSuccess: () => setNewComment(''),
            }
        );
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Ionicons name="arrow-back" size={20} color={colors.primary} />
                <Text style={styles.backText}>All Topics</Text>
            </TouchableOpacity>

            <Text style={styles.activeTopicTitle}>{discussionTitle}</Text>
            {commentsError && <Text style={styles.errorText}>Failed to load comments</Text>}
            {commentsLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
            ) : (
                <ScrollView style={{ height: '100%' }}>
                    <FlatList
                        data={comments}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        renderItem={({ item }) => (
                            <View style={styles.commentItem}>
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>{item?.user?.first_name?.[0]}{item.user?.last_name?.[0]}</Text>
                                </View>
                                <View style={styles.commentContent}>
                                    <Text style={styles.commentAuthor}>
                                        {item.user?.first_name || item.user?.last_name
                                            ? `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim()
                                            : 'Unknown User'}
                                    </Text>
                                    <Text style={styles.commentText}>{item.comment_text}</Text>
                                    <Text style={styles.commentDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={<Text style={styles.emptyText}>No replies yet.</Text>}
                    />

                </ScrollView>
            )}
            <View style={styles.replyBox}>
                <TextInput
                    style={styles.replyInput}
                    placeholder="Write a reply..."
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                />
                <TouchableOpacity
                    onPress={handlePostComment}
                    disabled={!newComment.trim() || isPostingComment}
                    style={[styles.sendButton, (!newComment.trim() || isPostingComment) && { opacity: 0.5 }]}
                >
                    <Ionicons name="send" size={20} color={colors.white || '#fff'} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    errorText: {
        color: 'red',
        marginBottom: 16,
    },
    container: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        height: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
    },
    createBox: {
        marginBottom: 20,
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    input: {
        fontSize: 14,
        color: '#333',
        minHeight: 60,
        textAlignVertical: 'top',
    },
    postButton: {
        backgroundColor: colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    postButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    topicItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    topicIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    topicTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F1F1F',
    },
    topicMeta: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        marginTop: 20,
        fontSize: 14,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    backText: {
        marginLeft: 4,
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    activeTopicTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
        marginBottom: 16,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#EDE9FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
    },
    commentContent: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 10,
        borderRadius: 8,
    },
    commentAuthor: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1F1F1F',
        marginBottom: 2,
    },
    commentText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    commentDate: {
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 4,
    },
    replyBox: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    replyInput: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        fontSize: 14,
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: colors.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    }
});

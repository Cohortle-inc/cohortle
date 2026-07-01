'use client';

import { useState } from 'react';
import { useLessonComments, usePostComment, useUpdateComment, useDeleteComment } from '@/lib/hooks/useLessonComments';
import { useAuth } from '@/lib/contexts/AuthContext';
import { sanitizeName, sanitizeText } from '@/lib/utils/sanitize';

interface LessonCommentsProps {
  lessonId: string;
  cohortId: string;
}

export function LessonComments({ lessonId, cohortId }: LessonCommentsProps) {
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  
  const { user } = useAuth();
  const { data: comments, isLoading, error } = useLessonComments(lessonId, cohortId);
  const postCommentMutation = usePostComment();
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      return;
    }

    try {
      await postCommentMutation.mutateAsync({
        lessonId,
        cohortId,
        content: commentText.trim(),
      });
      
      // Clear the input after successful submission
      setCommentText('');
    } catch (error) {
      // Error is handled by the mutation
      console.error('Failed to post comment:', error);
    }
  };

  const handleEdit = (commentId: number, currentText: string) => {
    setEditingCommentId(commentId);
    setEditText(currentText);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const handleSaveEdit = async (commentId: number) => {
    if (!editText.trim()) {
      return;
    }

    try {
      await updateCommentMutation.mutateAsync({
        commentId,
        content: editText.trim(),
        lessonId,
        cohortId,
      });
      
      setEditingCommentId(null);
      setEditText('');
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await deleteCommentMutation.mutateAsync({
        commentId,
        lessonId,
        cohortId,
      });
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Discussion</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading comments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Discussion</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load comments. Please try again later.</p>
        </div>
      </div>
    );
  }

  const sortedComments = comments
    ? [...comments].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    : [];

  return (
    <div className="mt-8 p-6 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Discussion</h2>

      {/* Comments List */}
      <div className="space-y-4 mb-6">
        {sortedComments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No comments yet.</p>
            <p className="text-sm">Be the first to start the discussion!</p>
          </div>
        ) : (
          sortedComments.map((comment) => {
            const isOwnComment = user && comment.user_id === parseInt(user.id);
            const isEditing = editingCommentId === comment.id;

            return (
              <div
                key={comment.id}
                data-testid={`comment-${comment.id}`}
                data-timestamp={comment.created_at}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {sanitizeName(comment.author_name)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isOwnComment && !isEditing && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(comment.id, comment.content)}
                          className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                          disabled={updateCommentMutation.isPending || deleteCommentMutation.isPending}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          disabled={updateCommentMutation.isPending || deleteCommentMutation.isPending}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      disabled={updateCommentMutation.isPending}
                    />
                    {updateCommentMutation.isError && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-2">
                        <p className="text-sm text-red-800">
                          Failed to update comment. Please try again.
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={!editText.trim() || updateCommentMutation.isPending}
                        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {updateCommentMutation.isPending ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={updateCommentMutation.isPending}
                        className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">{sanitizeText(comment.content)}</p>
                )}

                {deleteCommentMutation.isPending && deleteCommentMutation.variables?.commentId === comment.id && (
                  <div className="mt-2 text-sm text-gray-500 italic">Deleting...</div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="comment" className="sr-only">
            Add a comment
          </label>
          <textarea
            id="comment"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={postCommentMutation.isPending}
          />
        </div>

        {postCommentMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">
              Failed to post comment. Please try again.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!commentText.trim() || postCommentMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {postCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}

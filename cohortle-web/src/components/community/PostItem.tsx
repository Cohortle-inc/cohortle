'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { sanitizeText, sanitizeName } from '@/lib/utils/sanitize';

interface PostComment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface Post {
  id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
  comments?: PostComment[];
}

interface PostItemProps {
  post: Post;
  currentUserId: string;
  onEdit: (postId: string, content: string) => Promise<void>;
  onDelete: (postId: string) => Promise<void>;
  onLike: (postId: string) => Promise<void>;
  onUnlike: (postId: string) => Promise<void>;
  onAddComment: (postId: string, content: string) => Promise<void>;
  isLoading?: boolean;
}

export function PostItem({
  post,
  currentUserId,
  onEdit,
  onDelete,
  onLike,
  onUnlike,
  onAddComment,
  isLoading = false,
}: PostItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');

  const isOwnPost = post.author_id === currentUserId;
  const isEdited = post.updated_at !== post.created_at;

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    
    await onEdit(post.id, editContent.trim());
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    await onDelete(post.id);
  };

  const handleLikeToggle = async () => {
    if (post.user_has_liked) {
      await onUnlike(post.id);
    } else {
      await onLike(post.id);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    
    await onAddComment(post.id, commentContent.trim());
    setCommentContent('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
            {post.author_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{sanitizeName(post.author_name)}</p>
            <p className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              {isEdited && <span className="ml-2 text-gray-400">(edited)</span>}
            </p>
          </div>
        </div>

        {isOwnPost && !isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 rounded hover:bg-blue-50 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Post Content */}
      {isEditing ? (
        <div className="mb-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            disabled={isLoading}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleEdit}
              disabled={!editContent.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(post.content);
              }}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-700 whitespace-pre-wrap mb-4">{sanitizeText(post.content)}</p>
      )}

      {/* Post Actions */}
      <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
        <button
          onClick={handleLikeToggle}
          disabled={isLoading}
          className={`flex items-center gap-2 text-sm transition-colors ${
            post.user_has_liked
              ? 'text-blue-600 font-medium'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <svg
            className="w-5 h-5"
            fill={post.user_has_liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
            />
          </svg>
          <span>{post.like_count}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span>{post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {/* Comment Form */}
          <form onSubmit={handleAddComment} className="mb-4">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              rows={2}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!commentContent.trim() || isLoading}
              className="mt-2 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Posting...' : 'Comment'}
            </button>
          </form>

          {/* Comments List */}
          {post.comments && post.comments.length > 0 && (
            <div className="space-y-3">
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {comment.author_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <p className="font-medium text-sm text-gray-900">{sanitizeName(comment.author_name)}</p>
                    <p className="text-sm text-gray-700 mt-1">{sanitizeText(comment.content)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

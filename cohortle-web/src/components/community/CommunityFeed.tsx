'use client';

import { useState, useEffect } from 'react';
import { Post as APIPost, getCohortPosts, createPost, updatePost, deletePost, likePost, unlikePost, addPostComment } from '@/lib/api/community';
import { PostForm } from './PostForm';
import { PostItem } from './PostItem';

// Transform API Post to PostItem format
interface PostItemData {
  id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
  comments: Array<{
    id: string;
    author_name: string;
    content: string;
    created_at: string;
  }>;
}

function transformPost(apiPost: APIPost): PostItemData {
  return {
    id: apiPost.id,
    author_id: apiPost.authorId,
    author_name: apiPost.authorName,
    content: apiPost.content,
    created_at: apiPost.createdAt,
    updated_at: apiPost.updatedAt || apiPost.createdAt,
    like_count: apiPost.likeCount,
    comment_count: apiPost.commentCount,
    user_has_liked: apiPost.isLikedByUser,
    comments: apiPost.comments.map(c => ({
      id: c.id,
      author_name: c.authorName,
      content: c.text,
      created_at: c.createdAt,
    })),
  };
}

interface CommunityFeedProps {
  cohortId: number;
  currentUserId: string;
}

export function CommunityFeed({ cohortId, currentUserId }: CommunityFeedProps) {
  const [posts, setPosts] = useState<PostItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getCohortPosts(cohortId, 1, 20);
        setPosts(data.posts.map(transformPost));
        setHasMore(data.hasMore);
        setPage(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [cohortId]);

  // Create post handler
  const handleCreatePost = async (content: string) => {
    try {
      const newPost = await createPost(cohortId, content);
      setPosts([transformPost(newPost), ...posts]);
    } catch (err) {
      throw err;
    }
  };

  // Edit post handler
  const handleEditPost = async (postId: string, content: string) => {
    try {
      const updatedPost = await updatePost(postId, content);
      setPosts(posts.map(p => p.id === postId ? transformPost(updatedPost) : p));
    } catch (err) {
      throw err;
    }
  };

  // Delete post handler
  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      throw err;
    }
  };

  // Like post handler
  const handleLikePost = async (postId: string) => {
    try {
      const likeCount = await likePost(postId);
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, user_has_liked: true, like_count: likeCount } 
          : p
      ));
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  // Unlike post handler
  const handleUnlikePost = async (postId: string) => {
    try {
      const likeCount = await unlikePost(postId);
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, user_has_liked: false, like_count: likeCount } 
          : p
      ));
    } catch (err) {
      console.error('Failed to unlike post:', err);
    }
  };

  // Add comment handler
  const handleAddComment = async (postId: string, content: string) => {
    try {
      const newComment = await addPostComment(postId, content);
      setPosts(posts.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              comments: [...p.comments, {
                id: newComment.id,
                author_name: newComment.authorName,
                content: newComment.text,
                created_at: newComment.createdAt,
              }],
              comment_count: p.comment_count + 1
            } 
          : p
      ));
    } catch (err) {
      throw err;
    }
  };

  // Load more posts
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      const data = await getCohortPosts(cohortId, nextPage, 20);
      setPosts([...posts, ...data.posts.map(transformPost)]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load more posts:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (isLoading) {
    return (
      <div 
        className="flex justify-center items-center py-12"
        role="status"
        aria-live="polite"
        aria-label="Loading posts"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="bg-red-50 border border-red-200 rounded-lg p-4 text-center"
        role="alert"
        aria-live="assertive"
      >
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Post creation form */}
      <section aria-labelledby="create-post-heading">
        <h2 id="create-post-heading" className="sr-only">Create a new post</h2>
        <div className="bg-white rounded-lg shadow p-4">
          <PostForm onSubmit={handleCreatePost} />
        </div>
      </section>

      {/* Posts list */}
      <section aria-labelledby="posts-heading">
        <h2 id="posts-heading" className="sr-only">Community posts</h2>
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <article key={post.id}>
                <PostItem
                  post={post}
                  currentUserId={currentUserId}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                  onLike={handleLikePost}
                  onUnlike={handleUnlikePost}
                  onAddComment={handleAddComment}
                />
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            aria-label="Load more posts"
          >
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}

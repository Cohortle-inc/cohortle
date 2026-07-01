'use client';

import { useState } from 'react';

interface PostFormProps {
  onSubmit: (content: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

const MAX_POST_LENGTH = 2000;

export function PostForm({ onSubmit, isLoading = false, error = null }: PostFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || content.length > MAX_POST_LENGTH) {
      return;
    }

    await onSubmit(content.trim());
    setContent('');
  };

  const remainingChars = MAX_POST_LENGTH - content.length;
  const isOverLimit = content.length > MAX_POST_LENGTH;
  const isEmpty = !content.trim();

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="mb-3">
        <label htmlFor="post-content" className="sr-only">
          Share your thoughts
        </label>
        <textarea
          id="post-content"
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Share your thoughts with the community..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
          aria-describedby="char-count"
        />
      </div>

      <div className="flex items-center justify-between">
        <span
          id="char-count"
          className={`text-sm ${
            isOverLimit ? 'text-red-600 font-medium' : 'text-gray-500'
          }`}
        >
          {remainingChars} characters remaining
        </span>

        <button
          type="submit"
          disabled={isEmpty || isOverLimit || isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Posting...' : 'Post'}
        </button>
      </div>

      {error && (
        <div 
          className="mt-3 bg-red-50 border border-red-200 rounded-md p-3"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </form>
  );
}

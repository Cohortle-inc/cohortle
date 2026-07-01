'use client';

import { useState } from 'react';

interface PostCommentFormProps {
  onSubmit: (text: string) => void;
  isLoading?: boolean;
}

export default function PostCommentForm({ onSubmit, isLoading = false }: PostCommentFormProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a comment..."
        disabled={isLoading}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        aria-label="Comment text"
      />
      <button
        type="submit"
        disabled={!text.trim() || isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        aria-label="Submit comment"
      >
        {isLoading ? 'Posting...' : 'Post'}
      </button>
    </form>
  );
}

'use client';

import { formatDistanceToNow } from 'date-fns';
import { PostComment } from '@/lib/api/community';
import { sanitizeName, sanitizeText } from '@/lib/utils/sanitize';

interface PostCommentItemProps {
  comment: PostComment;
}

export default function PostCommentItem({ comment }: PostCommentItemProps) {
  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className="flex gap-2 py-2">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
        {getInitial(comment.authorName)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-sm text-gray-900">{sanitizeName(comment.authorName)}</span>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-gray-700 mt-1 break-words">{sanitizeText(comment.text)}</p>
      </div>
    </div>
  );
}

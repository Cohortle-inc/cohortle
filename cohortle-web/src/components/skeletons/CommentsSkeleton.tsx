export function CommentsSkeleton() {
  return (
    <div className="mt-8 p-6 bg-gray-50 rounded-lg animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
      
      <div className="space-y-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Comment Form Skeleton */}
      <div className="space-y-3">
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="flex justify-end">
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    </div>
  );
}

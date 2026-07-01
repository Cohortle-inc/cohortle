export function LessonSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      {/* Content Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {/* Title */}
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
        
        {/* Content Area */}
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          <div className="h-64 bg-gray-200 rounded w-full mt-6"></div>
        </div>
      </div>

      {/* Completion Button */}
      <div className="mb-6">
        <div className="h-12 bg-gray-200 rounded w-48"></div>
      </div>

      {/* Navigation */}
      <div className="mb-6 flex gap-3">
        <div className="h-12 bg-gray-200 rounded w-32"></div>
        <div className="h-12 bg-gray-200 rounded w-40"></div>
      </div>

      {/* Comments Section */}
      <div className="p-6 bg-gray-50 rounded-lg">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

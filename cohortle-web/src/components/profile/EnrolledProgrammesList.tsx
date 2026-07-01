'use client';

import Link from 'next/link';
import ProgressIndicator from '../learning/ProgressIndicator';

interface EnrolledProgramme {
  id: number;
  name: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

interface EnrolledProgrammesListProps {
  programmes: EnrolledProgramme[];
}

export default function EnrolledProgrammesList({ programmes }: EnrolledProgrammesListProps) {
  if (programmes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Enrolled Programmes</h2>
        <p className="text-sm sm:text-base text-gray-500 text-center py-6 sm:py-8">
          You haven't enrolled in any programmes yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Enrolled Programmes</h2>
      <div className="space-y-3 sm:space-y-4">
        {programmes.map((programme) => (
          <Link
            key={programme.id}
            href={`/programmes/${programme.id}/learn`}
            className="block border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2 gap-2">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate flex-1">{programme.name}</h3>
              <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                {programme.completedLessons}/{programme.totalLessons} lessons
              </span>
            </div>
            <ProgressIndicator
              current={programme.completedLessons}
              total={programme.totalLessons}
              size="small"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

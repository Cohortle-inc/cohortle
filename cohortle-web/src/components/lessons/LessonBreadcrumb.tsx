'use client';

/**
 * Lesson Breadcrumb Component
 * Displays breadcrumb navigation: Dashboard > Programme > Week > Lesson
 */

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';

interface LessonBreadcrumbProps {
  lessonId: string;
  lessonName: string;
  moduleId: string;
  cohortId: string;
}

interface ModuleData {
  id: number;
  name: string;
  programme_id: number;
  week_id?: number;
}

interface ProgrammeData {
  id: number;
  name: string;
}

interface WeekData {
  id: number;
  name: string;
}

export function LessonBreadcrumb({ lessonId, lessonName, moduleId, cohortId }: LessonBreadcrumbProps) {
  // Fetch module data to get programme_id and week_id
  const { data: moduleData } = useQuery<ModuleData>({
    queryKey: ['module', moduleId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/modules/${moduleId}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch programme data
  const { data: programmeData } = useQuery<ProgrammeData>({
    queryKey: ['programme', moduleData?.programme_id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/programmes/${moduleData?.programme_id}`);
      return response.data;
    },
    enabled: !!moduleData?.programme_id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch week data if available
  const { data: weekData } = useQuery<WeekData>({
    queryKey: ['week', moduleData?.week_id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/weeks/${moduleData?.week_id}`);
      return response.data;
    },
    enabled: !!moduleData?.week_id,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm flex-wrap">
        {/* Dashboard */}
        <li>
          <Link
            href="/dashboard"
            className="text-gray-500 hover:text-gray-700 hover:underline"
          >
            Dashboard
          </Link>
        </li>

        {/* Programme */}
        {programmeData && (
          <>
            <li>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </li>
            <li>
              <Link
                href={`/programmes/${programmeData.id}`}
                className="text-gray-500 hover:text-gray-700 hover:underline"
              >
                {programmeData.name}
              </Link>
            </li>
          </>
        )}

        {/* Week (if available) */}
        {weekData && (
          <>
            <li>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </li>
            <li>
              <Link
                href={`/programmes/${programmeData?.id}?week=${weekData.id}`}
                className="text-gray-500 hover:text-gray-700 hover:underline"
              >
                {weekData.name}
              </Link>
            </li>
          </>
        )}

        {/* Module (if no week) */}
        {moduleData && !weekData && (
          <>
            <li>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </li>
            <li>
              <Link
                href={`/modules/${moduleData.id}`}
                className="text-gray-500 hover:text-gray-700 hover:underline"
              >
                {moduleData.name}
              </Link>
            </li>
          </>
        )}

        {/* Current Lesson */}
        <li>
          <svg
            className="w-4 h-4 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </li>
        <li>
          <span className="text-gray-900 font-medium">{lessonName}</span>
        </li>
      </ol>
    </nav>
  );
}

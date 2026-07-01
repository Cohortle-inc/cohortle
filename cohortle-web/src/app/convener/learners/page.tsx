'use client';

import React, { useState, useEffect } from 'react';
import { useConvenerAPI } from '@/lib/hooks/useConvenerAPI'; // Hypothetical hook
import LearnerTable from '@/components/convener/LearnerTable';
import LearnerFilters from '@/components/convener/LearnerFilters';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function LearnerDirectoryPage() {
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    programme_id: '',
    cohort_id: '',
    status: ''
  });

  const api = useConvenerAPI();

  const fetchLearners = async () => {
    setLoading(true);
    try {
      const data = await api.getLearners(filters);
      setLearners(data.learners);
      setError(null);
    } catch (err) {
      setError('Failed to load learners. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearners();
  }, [filters]);

  const handleStatusUpdate = async (enrollmentId, newStatus) => {
    try {
      await api.updateEnrollmentStatus(enrollmentId, newStatus);
      // Refresh local state
      setLearners(prev => prev.map(l =>
        l.enrollment_id === enrollmentId ? { ...l, status: newStatus } : l
      ));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Learner Directory</h1>
      </div>

      <LearnerFilters
        filters={filters}
        setFilters={setFilters}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      ) : (
        <LearnerTable
          learners={learners}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}

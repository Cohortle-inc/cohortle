'use client';

import React, { useEffect, useState } from 'react';
import { getMyProgrammes, getProgramme, Programme, Cohort } from '@/lib/api/convener';

export default function LearnerFilters({ filters, setFilters }) {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);

  useEffect(() => {
    const fetchProgrammes = async () => {
      try {
        const data = await getMyProgrammes();
        setProgrammes(data);
      } catch (err) {
        console.error('Failed to fetch programmes', err);
      }
    };
    fetchProgrammes();
  }, []);

  useEffect(() => {
    const fetchCohorts = async () => {
      if (!filters.programme_id) {
        setCohorts([]);
        return;
      }
      try {
        const data = await getProgramme(filters.programme_id);
        setCohorts(data.cohorts || []);
      } catch (err) {
        console.error('Failed to fetch cohorts', err);
      }
    };
    fetchCohorts();
  }, [filters.programme_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'programme_id' ? { cohort_id: '' } : {}),
    }));
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleChange}
          placeholder="Name or email..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">Programme</label>
        <select
          name="programme_id"
          value={filters.programme_id}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Programmes</option>
          {programmes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">Cohort</label>
        <select
          name="cohort_id"
          value={filters.cohort_id}
          onChange={handleChange}
          disabled={!filters.programme_id}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="">All Cohorts</option>
          {cohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="w-[150px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          name="status"
          value={filters.status}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Any Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="completed">Completed</option>
          <option value="removed">Removed</option>
        </select>
      </div>
    </div>
  );
}

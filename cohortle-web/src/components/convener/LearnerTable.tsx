import React from 'react';

export default function LearnerTable({ learners, onStatusUpdate }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'removed': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Learner</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programme / Cohort</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {learners.map((learner) => (
            <tr key={learner.enrollment_id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <img className="h-10 w-10 rounded-full" src={learner.profile_image || '/default-avatar.png'} alt="" />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{learner.name}</div>
                    <div className="text-sm text-gray-500">{learner.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{learner.programme_name}</div>
                <div className="text-sm text-gray-500">{learner.cohort_name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(learner.status)}`}>
                  {learner.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(learner.enrolled_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {learner.status === 'active' ? (
                  <button
                    onClick={() => onStatusUpdate(learner.enrollment_id, 'suspended')}
                    className="text-yellow-600 hover:text-yellow-900 mr-4"
                  >
                    Suspend
                  </button>
                ) : (
                  <button
                    onClick={() => onStatusUpdate(learner.enrollment_id, 'active')}
                    className="text-green-600 hover:text-green-900 mr-4"
                  >
                    Activate
                  </button>
                )}
                <button
                  onClick={() => onStatusUpdate(learner.enrollment_id, 'removed')}
                  className="text-red-600 hover:text-red-900"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {learners.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No learners found matching your criteria.
        </div>
      )}
    </div>
  );
}

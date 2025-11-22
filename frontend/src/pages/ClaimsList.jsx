import React, { useEffect, useState } from 'react';
import api from '../api';

const ClaimsList = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('All');
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchClaims();
  }, [page, search, riskLevel]);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const params = {
        skip: page * limit,
        limit: limit,
        search: search
      };

      if (riskLevel === 'Low') {
        params.min_score = 0;
        params.max_score = 25;
      } else if (riskLevel === 'Medium') {
        params.min_score = 26;
        params.max_score = 75;
      } else if (riskLevel === 'High') {
        params.min_score = 76;
        params.max_score = 100;
      }

      const res = await api.get('/claims', { params });
      setClaims(res.data);
    } catch (error) {
      console.error("Error fetching claims", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleRiskChange = (e) => {
    setRiskLevel(e.target.value);
    setPage(0);
  };

  const handleStatusChange = async (claimId, newStatus) => {
    try {
      await api.put(`/claims/${claimId}`, { status: newStatus });
      // Optimistic update
      setClaims(claims.map(c => 
        c.claim_id === claimId ? { ...c, status: newStatus } : c
      ));
    } catch (error) {
      console.error("Error updating status", error);
      alert("Failed to update status");
    }
  };

  const getScoreColor = (score) => {
    if (score <= 25) return 'bg-green-100 text-green-800';
    if (score <= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Claims Review</h1>

      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by Diagnosis, Patient ID, or Claim ID..."
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
            value={search}
            onChange={handleSearch}
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={riskLevel}
            onChange={handleRiskChange}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
          >
            <option value="All">All Risks</option>
            <option value="Low">Low Risk (0-25)</option>
            <option value="Medium">Medium Risk (26-75)</option>
            <option value="High">High Risk (76-100)</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Claim ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diagnosis
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gender
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fraud Score
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {claims.map((claim) => (
                    <tr key={claim.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {claim.claim_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {claim.patient_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {claim.diagnosis_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {claim.age}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {claim.gender}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {claim.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${claim.claim_amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getScoreColor(claim.fraud_score)}`}>
                          {claim.fraud_score}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <select
                          value={claim.status || 'New'}
                          onChange={(e) => handleStatusChange(claim.claim_id, e.target.value)}
                          className={`block w-full py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-xs ${
                            claim.status === 'Closed' ? 'text-gray-400' : 
                            claim.status === 'Under Review' ? 'text-orange-600 font-medium' : 'text-blue-600'
                          }`}
                        >
                          <option value="New">New</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setPage(page + 1)}
          disabled={claims.length < limit}
          className="bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ClaimsList;

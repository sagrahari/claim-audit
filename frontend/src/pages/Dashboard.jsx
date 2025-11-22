import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, distRes] = await Promise.all([
        api.get('/stats'),
        api.get('/distribution')
      ]);
      setStats(statsRes.data);
      setDistribution(distRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIngesting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/ingest', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Poll or wait a bit then refresh
      setTimeout(() => {
        fetchData();
        setIngesting(false);
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 2000);
    } catch (error) {
      console.error("Error uploading file", error);
      setIngesting(false);
    }
  };

  const onUploadClick = () => {
    fileInputRef.current.click();
  };

  if (loading && !stats) return <div className="text-center mt-10">Loading...</div>;

  const chartData = distribution ? [
    { name: 'Low (0-25)', count: distribution.low },
    { name: 'Medium (26-75)', count: distribution.medium },
    { name: 'High (76-100)', count: distribution.high },
  ] : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            style={{ display: 'none' }}
        />
        <button
          onClick={onUploadClick}
          disabled={ingesting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          {ingesting ? 'Uploading & Processing...' : 'Upload CSV Data'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Claims</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats?.total_claims}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Avg Claim Charge</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">${stats?.average_claim_amount}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Flagged Claims (&gt;75)</dt>
            <dd className="mt-1 text-3xl font-semibold text-red-600">
              {stats?.flagged_claims_count} ({stats?.flagged_claims_percentage}%)
            </dd>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Fraud Score Distribution</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

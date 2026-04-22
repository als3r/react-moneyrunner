import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Overview from './Overview';
import TransactionList from '../transactions/TransactionList';
import AccountList from '../accounts/AccountList';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'overview', name: 'Overview', component: Overview },
    { id: 'transactions', name: 'Transactions', component: TransactionList },
    { id: 'accounts', name: 'Accounts', component: AccountList },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || Overview;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Active Tab Content */}
        <div className="px-4 py-6 sm:px-0">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

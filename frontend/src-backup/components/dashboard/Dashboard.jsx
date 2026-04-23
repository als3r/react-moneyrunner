import React, { useState } from 'react';
import Layout from '../layout/Layout';
import Overview from './Overview';
import TransactionList from '../transactions/TransactionList';
import AccountList from '../accounts/AccountList';

const Dashboard = () => {
  const [activeMenu, setActiveMenu] = useState('overview');

  const renderContent = () => {
    switch (activeMenu) {
      case 'overview':
        return <Overview />;
      case 'transactions':
        return <TransactionList />;
      case 'accounts':
        return <AccountList />;
      case 'categories':
        return <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Categories</h2>
          <p className="text-gray-600">Categories management coming soon...</p>
        </div>;
      case 'reports':
        return <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Reports</h2>
          <p className="text-gray-600">Reports coming soon...</p>
        </div>;
      case 'settings':
        return <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
          <p className="text-gray-600">Settings coming soon...</p>
        </div>;
      default:
        return <Overview />;
    }
  };

  return (
    <Layout activeMenu={activeMenu} onMenuChange={setActiveMenu}>
      {renderContent()}
    </Layout>
  );
};

export default Dashboard;

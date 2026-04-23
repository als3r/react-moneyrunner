import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Sidebar, 
  Dropdown, 
  Navbar, 
  Avatar,
} from 'flowbite-react';
import { 
  HiHome, 
  HiCurrencyDollar, 
  HiCreditCard, 
  HiTag, 
  HiChartBar,
  HiCog,
  HiUser,
  HiLogout,
} from 'react-icons/hi';

const Layout = ({ children, activeMenu, onMenuChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'overview', name: 'Overview', icon: HiHome },
    { id: 'transactions', name: 'Transactions', icon: HiCurrencyDollar },
    { id: 'accounts', name: 'Accounts', icon: HiCreditCard },
    { id: 'categories', name: 'Categories', icon: HiTag },
    { id: 'reports', name: 'Reports', icon: HiChartBar },
    { id: 'settings', name: 'Settings', icon: HiCog },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        collapsed={collapsed}
        aria-label="Sidebar with multi-level dropdown example"
        className="fixed left-0 top-0 h-screen z-40"
      >
        <Sidebar.Logo
          href="#"
          className="flex items-center gap-3 px-6 py-4"
        >
          <HiCurrencyDollar className="h-6 w-6 text-indigo-600" />
          <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
            MoneyRunner
          </span>
        </Sidebar.Logo>
        <Sidebar.Items>
          <Sidebar.ItemGroup>
            {menuItems.map((item) => (
              <Sidebar.Item
                key={item.id}
                as="button"
                onClick={() => onMenuChange(item.id)}
                icon={item.icon}
                active={activeMenu === item.id}
              >
                {item.name}
              </Sidebar.Item>
            ))}
          </Sidebar.ItemGroup>
        </Sidebar.Items>
      </Sidebar>

      <div className="flex-1 ml-64">
        <Navbar fluid className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <Navbar.Toggle onClick={() => setCollapsed(!collapsed)} />
          <div className="flex md:order-2 gap-3 md:gap-0">
            <Dropdown
              arrowIcon={false}
              inline
              label={
                <Avatar 
                  alt="User settings" 
                  rounded 
                />
              }
            >
              <Dropdown.Header>
                <span className="block text-sm">{user?.name}</span>
                <span className="block truncate text-sm font-medium">{user?.email}</span>
              </Dropdown.Header>
              <Dropdown.Item icon={HiUser}>Profile</Dropdown.Item>
              <Dropdown.Item icon={HiCog}>Settings</Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item icon={HiLogout} onClick={handleLogout}>Sign out</Dropdown.Item>
            </Dropdown>
          </div>
        </Navbar>

        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CalendarView from './pages/CalendarView';
import Search from './pages/Search';
import ProductList from './pages/ProductList';
import SalesForm from './pages/SalesForm';
import CustomerList from './pages/CustomerList';
import Settings from './pages/Settings';
import CustomerHistory from './pages/CustomerHistory';
import SalesPoint from './pages/SalesPoint';
import Campaigns from './pages/Campaigns';
import NewsTab from './pages/NewsTab';

// Auth Guard
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('crm_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="search" element={<Search />} />
          <Route path="products" element={<ProductList />} />
          <Route path="sales" element={<SalesForm />} />
          <Route path="customers" element={<CustomerList />} />
          <Route path="history" element={<CustomerHistory />} />
          <Route path="sales-point" element={<SalesPoint />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="news" element={<NewsTab />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;

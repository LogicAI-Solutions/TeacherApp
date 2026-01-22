import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Classes } from './pages/Classes';
import { ClassDetails } from './pages/ClassDetails';
import { Students } from './pages/Students';
import { Payments } from './pages/Payments';
import Admin from './pages/Admin';
import { NotFound } from './pages/NotFound';
import { Layout } from './components/Layout';

import type { ReactNode } from 'react';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="classes" element={<Classes />} />
        <Route path="class/:id" element={<ClassDetails />} />
        <Route path="students" element={<Students />} />
        <Route path="payments" element={<Payments />} />
        <Route path="admin" element={<Admin />} /> {/* Added Admin route as a nested route */}
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

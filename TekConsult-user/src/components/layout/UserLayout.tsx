import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import Header from './Header';

const UserLayout = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'consultant') {
    return <Navigate to="/consultant/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar for Desktop */}
      <Sidebar variant="user" />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header remains common */}
        <Header variant="user" />

        {/* Main Content Area */}
        <main className="flex-1 relative">
          <div className="pb-20 lg:pb-6">
            <Outlet />
          </div>
        </main>

        {/* Bottom Nav for Mobile */}
        <div className="lg:hidden">
          <BottomNav variant="user" />
        </div>
      </div>
    </div>
  );
};

export default UserLayout;

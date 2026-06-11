import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import { Toaster } from "sonner";
import routes from "./route/SidebarRaoute";

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading Admin Panel...</p>
    </div>
  </div>
);

function App() {
  const { isLoggedIn, loading, admin, logout } = useAuth();

  if (loading) return <LoadingSpinner />;

  // If a non-admin role somehow persists, force logout
  const allowedRoles = ["superAdmin", "admin"];
  if (!loading && admin && !allowedRoles.includes(admin?.role)) {
    logout();
    return <Navigate to="/login" replace />;
  }

  // Filter allowed routes based on permissions
  const allowedRoutes = routes.flatMap(route => (route.children ? route.children : route)).filter(r => {
    if (admin?.role === 'superAdmin') return true;
    if (r.superAdminOnly) return false;
    if (!r.permission) return true;
    return admin?.permissions?.includes(r.permission);
  });

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Public */}
        <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />

        {/* Protected */}
        {isLoggedIn ? (
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to={allowedRoutes.some(r => r.path === '/dashboard') ? "/dashboard" : "/profile"} replace />} />
            {allowedRoutes.map(({ path, component: Component }) => (
              <Route
                key={path}
                path={path}
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Component />
                  </Suspense>
                }
              />
            ))}
            <Route path="*" element={<Navigate to={allowedRoutes.some(r => r.path === '/dashboard') ? "/dashboard" : "/profile"} replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
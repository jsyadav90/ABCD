/**
 * App Router
 * 
 * Logics:
 * - Routing:
 *   Public routes for login/register/404; protected routes wrap pages in ProtectedRoute and MainLayout.
 * - Auth Context:
 *   AuthProvider wraps entire route tree to provide user/session state.
 * - Navigation:
 *   Root redirects to /dashboard.
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./context/AuthContext";
import ScanningProvider from "./components/BarcodeScanner/ScanningProvider.jsx";
import MainLayout from "./layouts/MainLayout";
import { ProtectedRoute } from "./components";
import Loading from "./components/Loading/Loading.jsx";

// Pages: lazy loaded for faster first paint on slow networks
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const NotFound = lazy(() => import("./pages/NotFound/NotFound"));
const Login = lazy(() => import("./pages/Login/Login"));
const Users = lazy(() => import("./pages/users/UsersList/Users"));
const AddUser = lazy(() => import("./pages/users/AddUserPage/AddUser"));
const EditUser = lazy(() => import("./pages/users/EditUserPage/EditUser"));
const UserDetails = lazy(() => import("./pages/users/UserDetailsPage/UserDetails"));
const Setup = lazy(() => import("./pages/Setup/Setup"));
// @ts-ignore
const AssetPage = lazy(() => import("./pages/Assets/asset"));
// @ts-ignore
const AddAssetPage = lazy(() => import("./pages/Assets/addasset"));
// @ts-ignore
const AssetDetails = lazy(() => import("./pages/Assets/AssetDetails"));

function App() {
  return (
    <Router>
      <AuthProvider>
        <ScanningProvider>
        <Suspense fallback={<Loading fullScreen text="Loading..." />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/not-found" element={<NotFound />} />

          {/* Root redirect to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute 
// @ts-ignore
              children={undefined} requiredPermission={undefined}>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute requiredPermission="users:rows_buttons:view">
                <MainLayout>
                  <Users />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users/add"
            element={
              <ProtectedRoute requiredPermission="users:page_buttons:add">
                <MainLayout>
                  <AddUser />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users/edit/:id"
            element={
              <ProtectedRoute requiredPermission="users:rows_buttons:edit">
                <MainLayout>
                  <EditUser />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/user-detail/:id"
            element={
              <ProtectedRoute requiredPermission="users:rows_buttons:view">
                <MainLayout>
                  <UserDetails />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/setup"
            element={
              <ProtectedRoute requiredPermission="setup:access">
                <MainLayout>
                  <Setup />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets"
            element={
              <ProtectedRoute requiredPermission="assets:rows_buttons:view">
                <MainLayout>
                  <AssetPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets/add"
            element={
              <ProtectedRoute requiredPermission="assets:page_buttons:add">
                <MainLayout>
                  <AddAssetPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets/add/:type"
            element={
              <ProtectedRoute requiredPermission="assets:page_buttons:add">
                <MainLayout>
                  <AddAssetPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets/edit/:id"
            element={
              <ProtectedRoute requiredPermission="assets:rows_buttons:edit">
                <MainLayout>
                  <AddAssetPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets/:id"
            element={
              <ProtectedRoute requiredPermission="assets:rows_buttons:view">
                <MainLayout>
                  <AssetDetails />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </ScanningProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

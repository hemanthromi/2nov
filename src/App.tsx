import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import People from './pages/People';
import Import from './pages/Import';
import Access from './pages/Access';

export default function App() {
  const { session, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading...</div>
    );
  }

  if (!session) {
    return <Login />;
  }

  if (!profile || !profile.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">No access yet</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your Sampark account isn't set up for the BVP task tracker yet. Ask an admin to enable it.
          </p>
          <button
            onClick={signOut}
            className="mt-4 text-sm font-medium text-brand-700 hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/people" element={<People />} />
        <Route path="/import" element={<Import />} />
        <Route path="/access" element={<Access />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

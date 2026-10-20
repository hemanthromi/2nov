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
    return <div className="flex min-h-screen items-center justify-center bg-bg text-[13px] text-muted">Loading&hellip;</div>;
  }

  if (!session) {
    return <Login />;
  }

  if (!profile || !profile.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <div className="panel w-full max-w-sm p-6 text-center">
          <h1>No access yet</h1>
          <p className="page-sub mt-2">Your Sampark account isn't set up for the BVP task tracker yet. Ask an admin to enable it.</p>
          <button onClick={signOut} className="btn text mt-4">
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

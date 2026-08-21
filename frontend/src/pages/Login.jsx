import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../components/PageWrapper';

const roleHome = { admin: '/admin', owner: '/owner', doctor: '/doctor' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      navigate(roleHome[data.user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-10">
      <div className="card">
        <h1 className="text-xl font-extrabold text-ink-900">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-500">Log in as admin, hospital owner, or doctor.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

          <button className="btn-primary w-full" disabled={loading}>
            <LogIn size={16} /> {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-500">
          Hospital owner or doctor? <Link to="/register" className="font-semibold text-brand-600">Register here</Link>
        </p>
      </div>
    </PageWrapper>
  );
}

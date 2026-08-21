import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Building2, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../components/PageWrapper';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('owner');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ ...form, role });
      navigate(role === 'owner' ? '/owner' : '/doctor');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-10">
      <div className="card">
        <h1 className="text-xl font-extrabold text-ink-900">Create your account</h1>
        <p className="mt-1 text-sm text-ink-500">Register as a hospital owner or a doctor.</p>

        <div className="mt-5 flex gap-1 rounded-xl bg-ink-100 p-1">
          <button
            type="button"
            onClick={() => setRole('owner')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition ${
              role === 'owner' ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500'
            }`}
          >
            <Building2 size={15} /> Hospital Owner
          </button>
          <button
            type="button"
            onClick={() => setRole('doctor')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition ${
              role === 'doctor' ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500'
            }`}
          >
            <Stethoscope size={15} /> Doctor
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Full name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required minLength={6} className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          {role === 'owner' && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Owner accounts need admin approval before you can add a hospital.
            </p>
          )}

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

          <button className="btn-primary w-full" disabled={loading}>
            <UserPlus size={16} /> {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-500">
          Already registered? <Link to="/login" className="font-semibold text-brand-600">Log in</Link>
        </p>
      </div>
    </PageWrapper>
  );
}

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock3, PlusCircle, Zap, ZapOff, ChevronUp, Pencil, X } from 'lucide-react';
import api from '../api/axios';
import PageWrapper from '../components/PageWrapper';
import { Spinner } from '../components/Bits';

export default function DoctorDashboard() {
  const [profile, setProfile] = useState(undefined); // undefined = loading, null = no profile
  const [hospitals, setHospitals] = useState([]);

  const load = async () => {
    const { data } = await api.get('/doctor/profile');
    setProfile(data);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (profile === null || (profile && profile.requestStatus !== 'approved')) {
      api.get('/public/hospitals').then(({ data }) => setHospitals(data));
    }
  }, [profile]);

  if (profile === undefined) return <Spinner />;

  if (!profile) return <ProfileForm onSaved={load} />;

  if (profile.requestStatus === 'none') return <PickHospital hospitals={hospitals} onRequested={load} />;

  if (profile.requestStatus === 'pending') {
    return (
      <PageWrapper className="mx-auto max-w-md px-6 py-24 text-center">
        <div className="card">
          <Clock3 className="mx-auto mb-3 text-amber-500" size={32} />
          <h1 className="text-lg font-bold text-ink-900">Waiting for hospital approval</h1>
          <p className="mt-2 text-sm text-ink-500">
            Your request to join <strong>{profile.requestedHospital?.name}</strong> is pending
            review from the hospital owner.
          </p>
        </div>
      </PageWrapper>
    );
  }

  if (profile.requestStatus === 'rejected') {
    return <PickHospital hospitals={hospitals} onRequested={load} rejected />;
  }

  return <LiveControlPanel profile={profile} onUpdate={load} />;
}

function ProfileForm({ onSaved, initial, editMode, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      name: '',
      specialization: '',
      qualification: '',
      experienceYears: '',
      consultationFee: '',
      avgConsultMinutes: 10,
      bio: '',
    }
  );
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editMode) {
        await api.put('/doctor/profile', form);
      } else {
        await api.post('/doctor/profile', form);
      }
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  const body = (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label className="label">Full name</label>
        <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label className="label">Specialization</label>
        <input required className="input" placeholder="e.g. Cardiologist" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Qualification</label>
          <input className="input" placeholder="MBBS, MD" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
        </div>
        <div>
          <label className="label">Experience (yrs)</label>
          <input type="number" min="0" className="input" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Consultation fee (₹)</label>
          <input type="number" min="0" className="input" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} />
        </div>
        <div>
          <label className="label">Avg. time per patient (min)</label>
          <input type="number" min="1" className="input" value={form.avgConsultMinutes} onChange={(e) => setForm({ ...form, avgConsultMinutes: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">Short bio</label>
        <textarea className="input" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <button className="btn-primary flex-1" disabled={loading}>
          <PlusCircle size={16} /> {loading ? 'Saving...' : editMode ? 'Save changes' : 'Save profile'}
        </button>
        {editMode && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            <X size={16} /> Cancel
          </button>
        )}
      </div>
    </form>
  );

  if (editMode) return body; // rendered inline inside the live panel card

  return (
    <PageWrapper className="mx-auto max-w-xl px-6 py-10">
      <div className="card">
        <h1 className="text-xl font-extrabold text-ink-900">Create your doctor profile</h1>
        <p className="mt-1 text-sm text-ink-500">Patients will see this once a hospital approves you.</p>
        {body}
      </div>
    </PageWrapper>
  );
}

function PickHospital({ hospitals, onRequested, rejected }) {
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    try {
      await api.post('/doctor/request-hospital', { hospitalId: selected });
      onRequested();
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper className="mx-auto max-w-xl px-6 py-10">
      <div className="card">
        <h1 className="text-xl font-extrabold text-ink-900">Join a hospital</h1>
        {rejected && (
          <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            Your previous request was declined. You can request another hospital below — or the
            same one again.
          </p>
        )}
        <p className="mt-1 text-sm text-ink-500">
          Send a request to a hospital owner. Once they approve, you can start setting your live token.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <select required className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Select a hospital...</option>
            {hospitals.map((h) => (
              <option key={h._id} value={h._id}>{h.name} — {h.city}</option>
            ))}
          </select>
          {hospitals.length === 0 && (
            <p className="text-xs text-ink-400">No active hospitals available yet — check back later.</p>
          )}
          <button className="btn-primary w-full" disabled={loading || !selected}>
            {loading ? 'Sending...' : rejected ? 'Resubmit request' : 'Send request'}
          </button>
        </form>
      </div>
    </PageWrapper>
  );
}

function LiveControlPanel({ profile, onUpdate }) {
  const [live, setLive] = useState(profile.live);
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  const push = async (patch) => {
    setSaving(true);
    try {
      const { data } = await api.put('/doctor/live', patch);
      setLive(data.live);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">Dr. {profile.name}</h1>
          <p className="mt-1 text-sm text-ink-500">{profile.specialization} · {profile.hospital?.name}</p>
        </div>
        {!editingProfile && (
          <button onClick={() => setEditingProfile(true)} className="btn-secondary">
            <Pencil size={15} /> Edit Profile
          </button>
        )}
      </div>

      {editingProfile && (
        <div className="card mt-5">
          <h2 className="text-lg font-bold text-ink-900">Edit your profile</h2>
          <ProfileForm
            editMode
            initial={{
              name: profile.name,
              specialization: profile.specialization,
              qualification: profile.qualification || '',
              experienceYears: profile.experienceYears || '',
              consultationFee: profile.consultationFee || '',
              avgConsultMinutes: profile.avgConsultMinutes || 10,
              bio: profile.bio || '',
            }}
            onSaved={() => {
              setEditingProfile(false);
              onUpdate();
            }}
            onCancel={() => setEditingProfile(false)}
          />
        </div>
      )}

      <div className="card mt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink-500">Status</p>
            <p className={`text-lg font-bold ${live.isActive ? 'text-emerald-600' : 'text-ink-400'}`}>
              {live.isActive ? 'Live / Seeing patients' : 'Offline'}
            </p>
          </div>
          <button
            onClick={() => push({ isActive: !live.isActive })}
            disabled={saving}
            className={live.isActive ? 'btn-danger' : 'btn-primary'}
          >
            {live.isActive ? <><ZapOff size={16} /> Go offline</> : <><Zap size={16} /> Go live</>}
          </button>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl bg-ink-50 p-5 text-center">
            <p className="text-sm text-ink-500">Current Token</p>
            <motion.p key={live.currentToken} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="my-2 text-4xl font-extrabold text-brand-600">
              #{live.currentToken}
            </motion.p>
            <button onClick={() => push({ incrementToken: true })} disabled={saving || !live.isActive} className="btn-secondary mt-1 w-full">
              <ChevronUp size={15} /> Next patient
            </button>
          </div>

          <div className="rounded-xl bg-ink-50 p-5">
            <label className="label">Running late by (minutes)</label>
            <input
              type="number"
              min="0"
              className="input"
              value={live.delayMinutes}
              onChange={(e) => setLive({ ...live, delayMinutes: Number(e.target.value) })}
              onBlur={() => push({ delayMinutes: live.delayMinutes })}
              disabled={!live.isActive}
            />
            <p className="mt-2 text-xs text-ink-400">Shown to patients as how late you're running today.</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl bg-ink-50 px-5 py-3">
          <div>
            <label className="label mb-0">Manually set current token</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              className="input !w-24"
              value={live.currentToken}
              onChange={(e) => setLive({ ...live, currentToken: Number(e.target.value) })}
            />
            <button onClick={() => push({ currentToken: live.currentToken })} disabled={saving} className="btn-secondary">
              Set
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs text-ink-400">
          Total tokens issued today: {live.totalTokensToday} · Last updated {live.lastUpdated ? new Date(live.lastUpdated).toLocaleTimeString() : '—'}
        </p>
      </div>
    </PageWrapper>
  );
}

import { useEffect, useState } from 'react';
import { Plus, Send, Check, X, Clock3, Building2, Pencil } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../components/PageWrapper';
import { StatusBadge, Empty, Spinner } from '../components/Bits';

export default function OwnerDashboard() {
  const { user, refreshUser } = useAuth();

  if (user?.status === 'pending') {
    return (
      <PageWrapper className="mx-auto max-w-md px-6 py-24 text-center">
        <div className="card">
          <Clock3 className="mx-auto mb-3 text-amber-500" size={32} />
          <h1 className="text-lg font-bold text-ink-900">Awaiting admin approval</h1>
          <p className="mt-2 text-sm text-ink-500">
            Your hospital owner account is pending review. You'll be able to add hospitals once
            the admin authorizes your account.
          </p>
        </div>
      </PageWrapper>
    );
  }

  if (user?.status === 'rejected') {
    return <RejectedOwnerView user={user} onResubmitted={refreshUser} />;
  }

  return <ApprovedOwnerView />;
}

function RejectedOwnerView({ user, onResubmitted }) {
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '' });
  const [loading, setLoading] = useState(false);

  const resubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/owner/resubmit', form);
      await onResubmitted();
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper className="mx-auto max-w-md px-6 py-16">
      <div className="card">
        <X className="mb-3 text-rose-500" size={32} />
        <h1 className="text-lg font-bold text-ink-900">Account not approved</h1>
        <p className="mt-2 text-sm text-ink-500">
          Your owner account request was declined by the admin. Update your details below and
          resubmit for another review.
        </p>
        <form onSubmit={resubmit} className="mt-5 space-y-4">
          <div>
            <label className="label">Full name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            <Send size={15} /> {loading ? 'Resubmitting...' : 'Resubmit for approval'}
          </button>
        </form>
      </div>
    </PageWrapper>
  );
}

function ApprovedOwnerView() {
  const { user, refreshUser } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', address: '', city: '', phone: '', specialties: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [payingId, setPayingId] = useState(null);
  const [payRef, setPayRef] = useState('');
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const [h, r, d] = await Promise.all([
      api.get('/owner/hospitals'),
      api.get('/owner/doctor-requests'),
      api.get('/owner/doctors'),
    ]);
    setHospitals(h.data);
    setRequests(r.data);
    setDoctors(d.data);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const addHospital = async (e) => {
    e.preventDefault();
    await api.post('/owner/hospitals', addForm);
    setAddForm({ name: '', address: '', city: '', phone: '', specialties: '' });
    setShowAddForm(false);
    loadAll();
  };

  const startEdit = (h) => {
    setEditingId(h._id);
    setEditForm({
      name: h.name,
      address: h.address || '',
      city: h.city,
      phone: h.phone || '',
      specialties: (h.specialties || []).join(', '),
    });
  };

  const saveEdit = async (id) => {
    await api.put(`/owner/hospitals/${id}`, editForm);
    setEditingId(null);
    loadAll();
  };

  const startPay = (h) => {
    setPayingId(h._id);
    setPayRef(h.paymentReference || '');
  };

  const submitPayment = async (id) => {
    await api.put(`/owner/hospitals/${id}/submit-payment`, { paymentReference: payRef });
    setPayingId(null);
    setPayRef('');
    loadAll();
  };

  const respond = async (id, decision) => {
    await api.put(`/owner/doctor-requests/${id}`, { decision });
    loadAll();
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    await api.put('/auth/profile', profileForm);
    await refreshUser();
    setShowProfileEdit(false);
  };

  if (loading) return <Spinner />;

  return (
    <PageWrapper className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">Owner Dashboard</h1>
          <p className="mt-1 text-sm text-ink-500">Manage your hospitals and doctor affiliation requests.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowProfileEdit((s) => !s)} className="btn-secondary">
            <Pencil size={15} /> Edit Profile
          </button>
          <button onClick={() => setShowAddForm((s) => !s)} className="btn-primary">
            <Plus size={16} /> Add Hospital
          </button>
        </div>
      </div>

      {showProfileEdit && (
        <form onSubmit={saveProfile} className="card mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input required className="input" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary">Save changes</button>
          </div>
        </form>
      )}

      {showAddForm && (
        <form onSubmit={addHospital} className="card mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Hospital name</label>
            <input required className="input" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">City</label>
            <input required className="input" value={addForm.city} onChange={(e) => setAddForm({ ...addForm, city: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address</label>
            <input className="input" value={addForm.address} onChange={(e) => setAddForm({ ...addForm, address: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Specialties (comma separated)</label>
            <input className="input" placeholder="Cardiology, Pediatrics..." value={addForm.specialties} onChange={(e) => setAddForm({ ...addForm, specialties: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary">Create hospital</button>
          </div>
        </form>
      )}

      <h2 className="mt-8 mb-3 text-lg font-bold text-ink-900">Your Hospitals</h2>
      {hospitals.length === 0 ? (
        <Empty title="No hospitals yet" subtitle="Add your first hospital to get started." />
      ) : (
        <div className="space-y-3">
          {hospitals.map((h) => (
            <div key={h._id} className="card">
              {editingId === h._id ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Name</label>
                    <input className="input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">City</label>
                    <input className="input" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Address</label>
                    <input className="input" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input className="input" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Specialties</label>
                    <input className="input" value={editForm.specialties} onChange={(e) => setEditForm({ ...editForm, specialties: e.target.value })} />
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <button onClick={() => saveEdit(h._id)} className="btn-primary">Save</button>
                    <button onClick={() => setEditingId(null)} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Building2 size={18} /></span>
                      <div>
                        <p className="font-semibold text-ink-900">{h.name}</p>
                        <p className="text-sm text-ink-500">{h.city} {h.nextDueAt && `· next due ${new Date(h.nextDueAt).toLocaleDateString()}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={h.subscriptionStatus} />
                      <button onClick={() => startEdit(h)} className="btn-secondary !px-3 !py-2">
                        <Pencil size={14} /> Edit
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-ink-100 pt-4">
                    {h.subscriptionStatus === 'active' ? (
                      <p className="text-sm text-emerald-600">Subscription active. Paid until {h.nextDueAt ? new Date(h.nextDueAt).toLocaleDateString() : '—'}.</p>
                    ) : h.paymentStatus === 'pending' ? (
                      <p className="flex items-center gap-2 text-sm text-amber-600">
                        <Clock3 size={14} /> Payment request submitted — awaiting admin review.
                      </p>
                    ) : payingId === h._id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          className="input flex-1 min-w-[200px]"
                          placeholder="Payment reference / transaction ID"
                          value={payRef}
                          onChange={(e) => setPayRef(e.target.value)}
                        />
                        <button onClick={() => submitPayment(h._id)} className="btn-primary !bg-emerald-600 hover:!bg-emerald-700">
                          <Send size={15} /> Submit
                        </button>
                        <button onClick={() => setPayingId(null)} className="btn-secondary">Cancel</button>
                      </div>
                    ) : (
                      <div>
                        {h.paymentStatus === 'rejected' && (
                          <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
                            Payment request rejected{h.paymentRejectionReason ? `: ${h.paymentRejectionReason}` : ''}. Edit and resubmit below.
                          </p>
                        )}
                        <button onClick={() => startPay(h)} className="btn-primary">
                          <Send size={15} /> {h.paymentStatus === 'rejected' ? 'Resubmit payment' : `Submit ₹${h.feeAmount}/mo payment`}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-8 mb-3 text-lg font-bold text-ink-900">Pending Doctor Requests</h2>
      {requests.length === 0 ? (
        <Empty title="No pending requests" />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r._id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink-900">Dr. {r.user?.name} <span className="text-ink-400 font-normal">· {r.specialization}</span></p>
                <p className="text-sm text-ink-500">wants to join {r.requestedHospital?.name}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => respond(r._id, 'approved')} className="btn-primary !bg-emerald-600 hover:!bg-emerald-700">
                  <Check size={15} /> Approve
                </button>
                <button onClick={() => respond(r._id, 'rejected')} className="btn-danger">
                  <X size={15} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-8 mb-3 text-lg font-bold text-ink-900">Your Doctors</h2>
      {doctors.length === 0 ? (
        <Empty title="No confirmed doctors yet" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {doctors.map((d) => (
            <div key={d._id} className="card">
              <p className="font-semibold text-ink-900">Dr. {d.name}</p>
              <p className="text-sm text-ink-500">{d.specialization} · {d.hospital?.name}</p>
              <p className="mt-1 text-xs text-ink-400">{d.live?.isActive ? `Live · Token #${d.live.currentToken}` : 'Offline'}</p>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}

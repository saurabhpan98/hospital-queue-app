import { useEffect, useState } from 'react';
import { Users, Building2, Stethoscope, IndianRupee, Check, X, CreditCard } from 'lucide-react';
import api from '../api/axios';
import PageWrapper from '../components/PageWrapper';
import { StatCard, StatusBadge, Empty, Spinner } from '../components/Bits';

const TABS = ['Pending Owners', 'Payment Requests', 'Hospitals', 'Doctors'];

export default function AdminDashboard() {
  const [tab, setTab] = useState(TABS[0]);
  const [stats, setStats] = useState(null);
  const [owners, setOwners] = useState([]);
  const [payments, setPayments] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadAll = async () => {
    setLoading(true);
    const [s, o, p, h, d] = await Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/owners', { params: { status: 'pending' } }),
      api.get('/admin/payment-requests'),
      api.get('/admin/hospitals'),
      api.get('/admin/doctors'),
    ]);
    setStats(s.data);
    setOwners(o.data);
    setPayments(p.data);
    setHospitals(h.data);
    setDoctors(d.data);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const decideOwner = async (id, status, reason) => {
    await api.put(`/admin/owners/${id}/status`, { status, reason });
    setRejectingId(null);
    setRejectReason('');
    loadAll();
  };

  const decidePayment = async (id, decision, reason) => {
    await api.put(`/admin/payment-requests/${id}`, { decision, reason });
    setRejectingId(null);
    setRejectReason('');
    loadAll();
  };

  const overrideSub = async (id, subscriptionStatus) => {
    await api.put(`/admin/hospitals/${id}/subscription`, { subscriptionStatus });
    loadAll();
  };

  const openReject = (id) => {
    setRejectingId(id);
    setRejectReason('');
  };

  if (loading || !stats) return <Spinner />;

  return (
    <PageWrapper className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-ink-900">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-ink-500">Manage owners, hospitals, doctors and subscriptions.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Users} label="Pending Owners" value={stats.pendingOwners} tint="amber" />
        <StatCard icon={CreditCard} label="Pending Payments" value={stats.pendingPayments} tint="amber" />
        <StatCard icon={Building2} label="Total Hospitals" value={stats.totalHospitals} tint="brand" />
        <StatCard icon={Building2} label="Active Hospitals" value={stats.activeHospitals} tint="emerald" />
        <StatCard icon={Stethoscope} label="Approved Doctors" value={stats.approvedDoctors} tint="brand" />
        <StatCard icon={IndianRupee} label="Monthly Revenue" value={`₹${stats.monthlyRevenue}`} tint="emerald" />
      </div>

      <div className="mt-8 flex flex-wrap gap-1 rounded-xl bg-ink-100 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setRejectingId(null); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'Pending Owners' && (
          owners.length === 0 ? (
            <Empty title="No pending owner requests" />
          ) : (
            <div className="space-y-3">
              {owners.map((o) => (
                <div key={o._id} className="card">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-900">{o.name}</p>
                      <p className="text-sm text-ink-500">{o.email} {o.phone && `· ${o.phone}`}</p>
                    </div>
                    {rejectingId !== o._id && (
                      <div className="flex gap-2">
                        <button onClick={() => decideOwner(o._id, 'approved')} className="btn-primary !bg-emerald-600 hover:!bg-emerald-700">
                          <Check size={15} /> Approve
                        </button>
                        <button onClick={() => openReject(o._id)} className="btn-danger">
                          <X size={15} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                  {rejectingId === o._id && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
                      <input
                        className="input flex-1 min-w-[200px]"
                        placeholder="Reason for rejection (optional)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <button onClick={() => decideOwner(o._id, 'rejected', rejectReason)} className="btn-danger">Confirm Reject</button>
                      <button onClick={() => setRejectingId(null)} className="btn-secondary">Cancel</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'Payment Requests' && (
          payments.length === 0 ? (
            <Empty title="No pending payment requests" />
          ) : (
            <div className="space-y-3">
              {payments.map((h) => (
                <div key={h._id} className="card">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-900">{h.name} <span className="text-ink-400 font-normal">· {h.city}</span></p>
                      <p className="text-sm text-ink-500">Owner: {h.owner?.name} ({h.owner?.email})</p>
                      <p className="mt-1 text-sm text-ink-600">₹{h.feeAmount} · Ref: {h.paymentReference || '—'}</p>
                    </div>
                    {rejectingId !== h._id && (
                      <div className="flex gap-2">
                        <button onClick={() => decidePayment(h._id, 'approved')} className="btn-primary !bg-emerald-600 hover:!bg-emerald-700">
                          <Check size={15} /> Approve
                        </button>
                        <button onClick={() => openReject(h._id)} className="btn-danger">
                          <X size={15} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                  {rejectingId === h._id && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
                      <input
                        className="input flex-1 min-w-[200px]"
                        placeholder="Reason for rejection (e.g. invalid reference)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <button onClick={() => decidePayment(h._id, 'rejected', rejectReason)} className="btn-danger">Confirm Reject</button>
                      <button onClick={() => setRejectingId(null)} className="btn-secondary">Cancel</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'Hospitals' && (
          hospitals.length === 0 ? (
            <Empty title="No hospitals yet" />
          ) : (
            <div className="space-y-3">
              {hospitals.map((h) => (
                <div key={h._id} className="card flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-900">{h.name} <span className="text-ink-400 font-normal">· {h.city}</span></p>
                    <p className="text-sm text-ink-500">Owner: {h.owner?.name} ({h.owner?.email})</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={h.subscriptionStatus} />
                    <select
                      className="input !w-auto !py-1.5"
                      value=""
                      onChange={(e) => e.target.value && overrideSub(h._id, e.target.value)}
                    >
                      <option value="">Override...</option>
                      <option value="active">Set Active</option>
                      <option value="expired">Set Expired</option>
                      <option value="unpaid">Set Unpaid</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'Doctors' && (
          doctors.length === 0 ? (
            <Empty title="No doctors yet" />
          ) : (
            <div className="space-y-3">
              {doctors.map((d) => (
                <div key={d._id} className="card flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-900">Dr. {d.name} <span className="text-ink-400 font-normal">· {d.specialization}</span></p>
                    <p className="text-sm text-ink-500">
                      {d.hospital ? `${d.hospital.name}, ${d.hospital.city}` : d.requestedHospital ? `Requested: ${d.requestedHospital.name}` : 'No hospital yet'}
                    </p>
                  </div>
                  <StatusBadge status={d.requestStatus} />
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </PageWrapper>
  );
}

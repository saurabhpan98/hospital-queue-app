import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Calculator } from 'lucide-react';
import api from '../api/axios';
import PageWrapper from '../components/PageWrapper';
import LiveTokenBadge from '../components/LiveTokenBadge';
import { Spinner, Empty } from '../components/Bits';

const POLL_MS = 6000;

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function DoctorDetail() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myToken, setMyToken] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get(`/public/doctors/${id}`);
      setDoctor(data);
    } catch {
      setDoctor(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <Spinner />;
  if (!doctor) return <Empty title="Doctor not found" subtitle="Their profile may be inactive." />;

  const live = doctor.live || {};
  const runningLate = live.delayMinutes || 0;
  const avgInCabin = doctor.avgConsultMinutes || 10;

  // Patient-entered "estimated wait" calculator: given the token number printed
  // on their physical token, estimate people ahead + minutes until their turn.
  const parsedToken = Number(myToken);
  const hasValidToken = myToken !== '' && !Number.isNaN(parsedToken) && parsedToken >= 0;
  const peopleAhead = hasValidToken ? Math.max(0, parsedToken - (live.currentToken || 0)) : null;
  const estimatedWait = hasValidToken ? peopleAhead * avgInCabin + runningLate : null;

  return (
    <PageWrapper className="mx-auto max-w-2xl px-6 py-10">
      <Link to={`/hospitals/${doctor.hospital?._id}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand-600">
        <ArrowLeft size={15} /> Back to {doctor.hospital?.name}
      </Link>

      <div className="card">
        <h1 className="text-2xl font-extrabold text-ink-900">Dr. {doctor.name}</h1>
        <p className="text-brand-600">{doctor.specialization}</p>
        <p className="mt-1 text-sm text-ink-400">
          {doctor.qualification} {doctor.qualification && '·'} {doctor.experienceYears || 0} years experience
        </p>

        <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-500">
          <MapPin size={14} /> {doctor.hospital?.name}, {doctor.hospital?.city}
        </p>

        <div className="mt-6 rounded-xl bg-ink-50 p-5">
          <LiveTokenBadge doctor={doctor} />
          {live.isActive && (
            <div className="mt-3 space-y-1 text-sm text-ink-600">
              <p className="flex items-center gap-1.5">
                <Clock size={14} /> Doctor is running about {runningLate} min late today
              </p>
              <p className="flex items-center gap-1.5">
                <Clock size={14} /> Avg. time each patient spends inside the cabin: {avgInCabin} min
              </p>
            </div>
          )}
        </div>

        {live.isActive && (
          <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/40 p-5">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-800">
              <Calculator size={15} /> Estimate your wait
            </p>
            <p className="mt-1 text-xs text-ink-500">Enter the token number printed on your physical token.</p>
            <div className="mt-3 flex gap-2">
              <input
                type="number"
                min="0"
                className="input flex-1"
                placeholder="e.g. 42"
                value={myToken}
                onChange={(e) => setMyToken(e.target.value)}
              />
            </div>
            {hasValidToken && (
              <div className="mt-3 rounded-lg bg-white px-4 py-3 text-sm">
                <p className="text-ink-700">
                  <strong>{peopleAhead}</strong> patient{peopleAhead !== 1 && 's'} ahead of you
                </p>
                <p className="mt-1 text-ink-700">
                  Estimated wait: <strong>~{estimatedWait} min</strong>
                </p>
                <p className="mt-1 text-xs text-ink-400">
                  Based on avg. {avgInCabin} min/patient plus the doctor's current {runningLate} min delay.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-ink-400">Avg. consult time</p>
            <p className="font-semibold text-ink-800">{avgInCabin} min</p>
          </div>
          {doctor.consultationFee > 0 && (
            <div>
              <p className="text-ink-400">Consultation fee</p>
              <p className="font-semibold text-ink-800">₹{doctor.consultationFee}</p>
            </div>
          )}
        </div>

        {doctor.bio && <p className="mt-6 text-sm leading-relaxed text-ink-600">{doctor.bio}</p>}

        <p className="mt-6 text-xs text-ink-400">
          Token last updated {timeAgo(live.lastUpdated)} · refreshes every {POLL_MS / 1000}s
        </p>
      </div>
    </PageWrapper>
  );
}

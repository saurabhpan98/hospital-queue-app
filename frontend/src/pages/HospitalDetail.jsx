import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, ArrowLeft, Clock } from 'lucide-react';
import api from '../api/axios';
import PageWrapper from '../components/PageWrapper';
import LiveTokenBadge from '../components/LiveTokenBadge';
import { Spinner, Empty } from '../components/Bits';

const POLL_MS = 8000;

export default function HospitalDetail() {
  const { id } = useParams();
  const [hospital, setHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get(`/public/hospitals/${id}`);
      setHospital(data.hospital);
      setDoctors(data.doctors);
    } catch {
      setHospital(null);
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
  if (!hospital) return <Empty title="Hospital not found" subtitle="It may no longer be active." />;

  return (
    <PageWrapper className="mx-auto max-w-5xl px-6 py-10">
      <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand-600">
        <ArrowLeft size={15} /> Back to search
      </Link>

      <div className="card mb-8">
        <h1 className="text-2xl font-extrabold text-ink-900">{hospital.name}</h1>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-500">
          <span className="flex items-center gap-1.5"><MapPin size={14} /> {hospital.address ? `${hospital.address}, ` : ''}{hospital.city}</span>
          {hospital.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {hospital.phone}</span>}
        </div>
        {hospital.specialties?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {hospital.specialties.map((s) => (
              <span key={s} className="badge bg-brand-50 text-brand-700">{s}</span>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink-900">Doctors</h2>
        <span className="flex items-center gap-1.5 text-xs text-ink-400">
          <Clock size={13} /> auto-refreshing every {POLL_MS / 1000}s
        </span>
      </div>

      {doctors.length === 0 ? (
        <Empty title="No doctors listed yet" />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {doctors.map((d, i) => (
            <motion.div
              key={d._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/doctors/${d._id}`} className="card block h-full transition hover:shadow-lg hover:-translate-y-0.5">
                <h3 className="text-lg font-bold text-ink-900">Dr. {d.name}</h3>
                <p className="text-sm text-brand-600">{d.specialization}</p>
                {d.qualification && <p className="mt-1 text-xs text-ink-400">{d.qualification} · {d.experienceYears || 0} yrs exp</p>}
                <div className="mt-4">
                  <LiveTokenBadge doctor={d} />
                </div>
                <p className="mt-3 text-xs text-ink-400">Avg. time per patient in cabin: {d.avgConsultMinutes} min {d.consultationFee ? `· Fee: ₹${d.consultationFee}` : ''}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}

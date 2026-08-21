import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Stethoscope, Users } from 'lucide-react';
import api from '../api/axios';
import PageWrapper from '../components/PageWrapper';
import { Empty, Spinner } from '../components/Bits';

export default function Home() {
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [mode, setMode] = useState('hospitals'); // 'hospitals' | 'doctors'
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (mode === 'hospitals') {
        const { data } = await api.get('/public/hospitals', { params: { search, city } });
        setHospitals(data);
      } else {
        const { data } = await api.get('/public/doctors/search', { params: { query: search, specialization: city } });
        setDoctors(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <PageWrapper>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-ink-50 px-6 pb-16 pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl"
          >
            Skip the guesswork. <span className="text-brand-600">See the live queue.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-4 max-w-xl text-ink-500"
          >
            Search hospitals and doctors near you, check the current token number, and know how
            long the wait really is — before you leave home.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 rounded-2xl bg-white p-3 shadow-soft sm:flex-row"
          >
            <div className="flex gap-1 rounded-xl bg-ink-100 p-1">
              {['hospitals', 'doctors'].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                    mode === m ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <input
              className="input flex-1"
              placeholder={mode === 'hospitals' ? 'Hospital name...' : 'Doctor name...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              className="input sm:w-48"
              placeholder={mode === 'hospitals' ? 'City' : 'Specialization'}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <button className="btn-primary sm:w-auto">
              <Search size={16} /> Search
            </button>
          </motion.form>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        {loading ? (
          <Spinner />
        ) : mode === 'hospitals' ? (
          hospitals.length === 0 ? (
            <Empty title="No hospitals found" subtitle="Try a different name or city." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {hospitals.map((h, i) => (
                <HospitalCard key={h._id} hospital={h} index={i} />
              ))}
            </div>
          )
        ) : doctors.length === 0 ? (
          <Empty title="No doctors found" subtitle="Try a different name or specialization." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d, i) => (
              <DoctorSearchCard key={d._id} doctor={d} index={i} />
            ))}
          </div>
        )}
      </section>
    </PageWrapper>
  );
}

function HospitalCard({ hospital, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <Link to={`/hospitals/${hospital._id}`} className="card block h-full transition hover:shadow-lg hover:-translate-y-0.5">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-ink-900">{hospital.name}</h3>
          {hospital.liveCount > 0 && (
            <span className="badge bg-emerald-50 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-fast" />
              {hospital.liveCount} live
            </span>
          )}
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
          <MapPin size={14} /> {hospital.city}
        </p>
        {hospital.specialties?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {hospital.specialties.slice(0, 3).map((s) => (
              <span key={s} className="badge bg-ink-100 text-ink-600">{s}</span>
            ))}
          </div>
        )}
        <p className="mt-4 flex items-center gap-1.5 text-sm text-ink-400">
          <Stethoscope size={14} /> {hospital.doctorCount} doctor{hospital.doctorCount !== 1 && 's'}
        </p>
      </Link>
    </motion.div>
  );
}

function DoctorSearchCard({ doctor, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <Link to={`/doctors/${doctor._id}`} className="card block h-full transition hover:shadow-lg hover:-translate-y-0.5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink-900">Dr. {doctor.name}</h3>
            <p className="text-sm text-brand-600">{doctor.specialization}</p>
          </div>
          {doctor.live?.isActive && (
            <span className="badge bg-emerald-50 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-fast" />
              Live
            </span>
          )}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-500">
          <Users size={14} /> {doctor.hospital?.name}, {doctor.hospital?.city}
        </p>
        {doctor.live?.isActive && (
          <p className="mt-3 text-sm font-semibold text-ink-700">
            Token #{doctor.live.currentToken}
            {doctor.live.delayMinutes > 0 && (
              <span className="ml-2 font-normal text-amber-600">~{doctor.live.delayMinutes} min delay</span>
            )}
          </p>
        )}
      </Link>
    </motion.div>
  );
}

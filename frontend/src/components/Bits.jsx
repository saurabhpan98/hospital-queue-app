import { motion } from 'framer-motion';

const TINTS = {
  brand: 'bg-brand-50 text-brand-600',
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600',
  ink: 'bg-ink-100 text-ink-600',
};

export function StatCard({ icon: Icon, label, value, tint = 'brand' }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="card flex items-center gap-4"
    >
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${TINTS[tint] || TINTS.brand}`}>
        <Icon size={20} />
      </span>
      <div>
        <p className="text-2xl font-bold text-ink-900">{value}</p>
        <p className="text-sm text-ink-500">{label}</p>
      </div>
    </motion.div>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-emerald-50 text-emerald-700',
    active: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-rose-50 text-rose-700',
    expired: 'bg-rose-50 text-rose-700',
    unpaid: 'bg-amber-50 text-amber-700',
    none: 'bg-ink-100 text-ink-500',
  };
  return <span className={`badge capitalize ${styles[status] || 'bg-ink-100 text-ink-500'}`}>{status}</span>;
}

export function Empty({ title, subtitle }) {
  return (
    <div className="card grid place-items-center py-14 text-center">
      <p className="text-lg font-semibold text-ink-700">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-ink-400">{subtitle}</p>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="grid place-items-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  );
}

import { motion } from 'framer-motion';

export default function LiveTokenBadge({ doctor }) {
  const { isActive, currentToken, delayMinutes } = doctor.live || {};

  if (!isActive) {
    return (
      <span className="badge bg-ink-100 text-ink-500">
        <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />
        Currently offline
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="badge bg-emerald-50 text-emerald-700">
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-emerald-500"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
        />
        Live now
      </span>
      <span className="badge bg-brand-50 text-brand-700">
        Token&nbsp;<motion.span key={currentToken} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-bold">
          #{currentToken}
        </motion.span>
      </span>
      {delayMinutes > 0 && (
        <span className="badge bg-amber-50 text-amber-700">Running ~{delayMinutes} min late</span>
      )}
    </div>
  );
}

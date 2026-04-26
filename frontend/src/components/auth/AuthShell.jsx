import { motion } from "framer-motion";

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass w-full max-w-md rounded-3xl p-8"
      >
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">Patient Monitoring</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-100">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
        </div>
        {children}
        <p className="mt-6 text-center text-sm text-slate-400">{footer}</p>
      </motion.div>
    </main>
  );
}

export default AuthShell;


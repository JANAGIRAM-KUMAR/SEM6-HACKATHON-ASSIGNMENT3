import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell";
import { useAuthStore } from "../store/authStore";

function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await login(form);
      navigate("/");
    } catch {
      // Handled in auth store
    }
  };

  return (
    <AuthShell
      title="Clinician Sign In"
      subtitle="Access live telemetry and alert intelligence."
      footer={
        <>
          New here?{" "}
          <Link className="text-cyan-300 hover:text-cyan-200" to="/register">
            Create an account
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          required
          type="email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          placeholder="Email"
          className="w-full rounded-xl border border-slate-700/70 bg-slate-900/75 p-3 text-slate-100 outline-none focus:border-cyan-400"
        />
        <input
          required
          type="password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          placeholder="Password"
          className="w-full rounded-xl border border-slate-700/70 bg-slate-900/75 p-3 text-slate-100 outline-none focus:border-cyan-400"
        />
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button
          disabled={isLoading}
          className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-55"
          type="submit"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

export default LoginPage;


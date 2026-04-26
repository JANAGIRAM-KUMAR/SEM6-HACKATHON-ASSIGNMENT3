import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell";
import { useAuthStore } from "../store/authStore";

function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "DOCTOR",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await register(form);
      navigate("/");
    } catch {
      // Handled in auth store
    }
  };

  return (
    <AuthShell
      title="Create Account"
      subtitle="Start monitoring patient vitals in real time."
      footer={
        <>
          Already registered?{" "}
          <Link className="text-cyan-300 hover:text-cyan-200" to="/login">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          required
          type="text"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Full name"
          className="w-full rounded-xl border border-slate-700/70 bg-slate-900/75 p-3 text-slate-100 outline-none focus:border-cyan-400"
        />
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
          minLength={8}
          type="password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          placeholder="Password (min 8 chars)"
          className="w-full rounded-xl border border-slate-700/70 bg-slate-900/75 p-3 text-slate-100 outline-none focus:border-cyan-400"
        />
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button
          disabled={isLoading}
          className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-55"
          type="submit"
        >
          {isLoading ? "Creating..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}

export default RegisterPage;


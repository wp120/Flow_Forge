import { ArrowLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import { Button, Field } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <span className="eyebrow">WELCOME BACK</span>
        <h2>Sign in to FlowForge</h2>
        <p className="muted">Use your organization account to continue.</p>
        <form onSubmit={handleSubmit}>
          <Field label="Work email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </Field>
          <div className="form-row">
            <label className="check">
              <input type="checkbox" /> Remember me
            </label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          {error && <div className="error-banner">{error}</div>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"} <ChevronRight size={16} />
          </Button>
        </form>
        <div className="auth-switch">
          New to FlowForge? <Link to="/register">Register your organization</Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await register({ companyName, name, email, password });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your organization.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <Link to="/login" className="back-link">
          <ArrowLeft size={15} /> Back to sign in
        </Link>
        <span className="eyebrow">GET STARTED</span>
        <h2>Create your organization</h2>
        <p className="muted">You’ll become the initial organization admin.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <Field label="Your name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                required
              />
            </Field>
            <Field label="Work email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                required
              />
            </Field>
          </div>
          <Field label="Organization name">
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Northstar Studio"
              required
            />
          </Field>
          <Field label="Create password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </Field>
          {error && <div className="error-banner">{error}</div>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating organization…" : "Create organization"} <ChevronRight size={16} />
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}

export function ForgotPassword() {
  return (
    <AuthLayout>
      <div className="auth-card">
        <Link to="/login" className="back-link">
          <ArrowLeft size={15} /> Back to sign in
        </Link>
        <span className="eyebrow">ACCOUNT RECOVERY</span>
        <h2>Reset your password</h2>
        <p className="muted">
          Enter your email and we’ll send instructions to reset your password.
        </p>
        <form onSubmit={(e) => e.preventDefault()}>
          <Field label="Work email">
            <input type="email" placeholder="you@company.com" />
          </Field>
          <Button type="submit">
            Send reset link <ChevronRight size={16} />
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}

import { ArrowLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import { Button, Field } from "../components/ui";
export function Login() {
  return (
    <AuthLayout>
      <div className="auth-card">
        <span className="eyebrow">WELCOME BACK</span>
        <h2>Sign in to FlowForge</h2>
        <p className="muted">Use your organization account to continue.</p>
        <form onSubmit={(e) => e.preventDefault()}>
          <Field label="Work email">
            <input type="email" placeholder="you@company.com" />
          </Field>
          <Field label="Password">
            <input type="password" placeholder="Enter your password" />
          </Field>
          <div className="form-row">
            <label className="check">
              <input type="checkbox" /> Remember me
            </label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <Button type="submit">
            Sign in <ChevronRight size={16} />
          </Button>
        </form>
        <div className="auth-switch">
          New to FlowForge?{" "}
          <Link to="/register">Register your organization</Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export function Register() {
  return (
    <AuthLayout>
      <div className="auth-card">
        <Link to="/login" className="back-link">
          <ArrowLeft size={15} /> Back to sign in
        </Link>
        <span className="eyebrow">GET STARTED</span>
        <h2>Create your organization</h2>
        <p className="muted">You’ll become the initial organization admin.</p>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="form-grid">
            <Field label="Your name">
              <input placeholder="Alex Morgan" />
            </Field>
            <Field label="Work email">
              <input type="email" placeholder="alex@company.com" />
            </Field>
          </div>
          <Field label="Organization name">
            <input placeholder="Northstar Studio" />
          </Field>
          <Field label="Create password">
            <input type="password" placeholder="At least 8 characters" />
          </Field>
          <Button type="submit">
            Create organization <ChevronRight size={16} />
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

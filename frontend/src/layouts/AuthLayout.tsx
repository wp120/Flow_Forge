import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

export function Logo() {
  return (
    <Link to="/" className="logo">
      <span className="logo-mark">
        <Zap size={17} fill="currentColor" />
      </span>
      <span>flowforge</span>
    </Link>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout">
      <div className="auth-aside">
        <Logo />
        <div className="auth-intro">
          <span className="eyebrow">WORKFLOW OPERATING SYSTEM</span>
          <h1>Move work forward, with clarity.</h1>
          <p>
            One place to configure forms, route decisions, and keep every
            request moving.
          </p>
        </div>
        <div className="auth-quote">
          <span>“</span>
          <p>
            FlowForge gives our teams a shared language for getting work
            approved.
          </p>
          <strong>Operations team · Northstar</strong>
        </div>
      </div>
      <main className="auth-main">
        {children}
        <span className="auth-footnote">
          © 2026 FlowForge · Privacy · Terms
        </span>
      </main>
    </div>
  );
}

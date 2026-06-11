import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/api";
import { setAuth } from "../utils/auth";
import Button from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import Input from "../components/ui/input";
import Label from "../components/ui/label";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (event) => {
    event.preventDefault();
    setStatus("Creating account...");

    try {
      const auth = await apiRequest("/api/auth/register", {
        method: "POST",
        body: { name, email, password, role: "user" },
      });

      setAuth(auth);
      navigate("/dashboard");
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <div className="page-shell">
      <div className="grid min-h-[78vh] gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel rounded-[32px] p-8 md:p-10">
          <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
            New account
          </div>
          <h1 className="mt-6 text-4xl font-semibold md:text-5xl">Join the recovery network.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Create your account to report items, receive match alerts, and follow verified claim progress from a single dark workspace.
          </p>

          <div className="mt-8 grid gap-3">
            {[
              "Submit lost and found reports in minutes.",
              "Get stronger matching and cleaner status tracking.",
              "Stay informed with admin-reviewed notifications.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4 text-sm text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <Card className="p-2">
          <CardHeader>
            <h2 className="text-3xl font-semibold text-slate-100">Create account</h2>
            <p className="mt-2 text-sm text-slate-400">Use your campus email to get started.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="grid gap-5">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="you@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit">Create account</Button>
              {status && (
                <p className={`text-sm ${status.includes("...") ? "text-cyan-300" : "text-rose-300"}`}>
                  {status}
                </p>
              )}

              <div className="flex flex-wrap justify-between gap-3 pt-3 text-sm text-slate-400">
                <Link className="font-semibold text-slate-100" to="/login">
                  Already have an account?
                </Link>
                <Link className="font-semibold text-slate-100" to="/admin-login">
                  Admin login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Register;

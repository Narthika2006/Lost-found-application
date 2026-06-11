import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/api";
import { setAuth } from "../utils/auth";
import Button from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import Input from "../components/ui/input";
import Label from "../components/ui/label";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setStatus("Signing in...");

    try {
      const auth = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });

      if (auth.role !== "admin") {
        setStatus("This account does not have admin access.");
        return;
      }

      setAuth(auth);
      navigate("/admin");
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <div className="page-shell">
      <div className="grid min-h-[78vh] gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel rounded-[32px] p-8 md:p-10">
          <div className="inline-flex rounded-full border border-orange-400/20 bg-orange-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-orange-200">
            Admin portal
          </div>
          <h1 className="mt-6 text-4xl font-semibold md:text-5xl">Operational control for your campus desk.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Review matched items, approve claims, and manage high-confidence recoveries from one secure admin experience.
          </p>

          <div className="mt-8 grid gap-3">
            {[
              "Monitor reports and match quality in real time.",
              "Approve or reject claims with clearer states.",
              "Support trustworthy recovery across campus.",
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
            <h2 className="text-3xl font-semibold text-slate-100">Admin sign in</h2>
            <p className="mt-2 text-sm text-slate-400">Use an authorized admin account.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="grid gap-5">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="admin@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit">Sign in as admin</Button>
              {status && (
                <p className={`text-sm ${status.includes("...") ? "text-cyan-300" : "text-rose-300"}`}>
                  {status}
                </p>
              )}

              <div className="pt-3 text-sm text-slate-400">
                Need the regular portal?{" "}
                <Link className="font-semibold text-slate-100" to="/login">
                  Back to user login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminLogin;

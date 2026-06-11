import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../utils/api";
import Button from "../components/ui/button";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentItems, setRecentItems] = useState([]);
  const [status, setStatus] = useState("");

  const loadStats = async () => {
    try {
      const data = await apiRequest("/api/admin/stats", { auth: true });
      setStats(data);
      setStatus("");
    } catch (err) {
      setStatus(err.message);
    }
  };

  const loadRecentItems = async () => {
    try {
      const data = await apiRequest("/api/items?limit=30", { auth: true });
      const list = Array.isArray(data) ? data : data.items || [];
      setRecentItems(list.slice(0, 30));
      setStatus("");
    } catch (err) {
      setStatus(err.message);
    }
  };

  useEffect(() => {
    loadStats();
    loadRecentItems();
  }, []);

  const recentCount = useMemo(() => recentItems.length, [recentItems]);
  const recentActivity = useMemo(
    () =>
      recentItems.slice(0, 6).map((item) => ({
        id: item._id,
        message: `Item reported: ${item.title || "Untitled Item"} (${item.type || "unknown"})`,
        time: item.createdAt ? new Date(item.createdAt).toLocaleString() : "Unknown time",
      })),
    [recentItems]
  );

  return (
    <div className="page-shell">
      <section className="glass-panel rounded-[32px] p-8 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Admin overview</div>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">Platform control center.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">Review account growth, reporting volume, and pending operational work from one place.</p>
          </div>
          <Button variant="ghost" onClick={loadStats}>Refresh</Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stats ? (
            [
              { label: "Total users", value: stats.totalUsers },
              { label: "Total items", value: stats.totalItems },
              { label: "Lost items", value: stats.lostItems },
              { label: "Found items", value: stats.foundItems },
              { label: "Pending matches", value: stats.pendingMatches },
            ].map((card) => (
              <div key={card.label} className="rounded-[28px] border border-slate-800 bg-slate-950/60 px-5 py-5">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{card.label}</div>
                <div className="mt-3 text-4xl font-semibold text-slate-100">{card.value}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-400">Loading stats...</div>
          )}
        </div>
      </section>

      <section className="glass-panel mt-6 rounded-[32px] p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Recent items</h2>
            <p className="mt-2 text-sm text-slate-400">{recentCount} item(s)</p>
          </div>
          <Button variant="ghost" onClick={loadRecentItems}>Refresh</Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {recentItems.map((item) => (
            <div key={item._id} className="rounded-[28px] border border-slate-800 bg-slate-950/60 p-5">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-lg text-slate-100">{item.title || "Untitled Item"}</strong>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold capitalize text-slate-200">{item.status || "pending"}</span>
              </div>
              <div className="mt-3 text-sm text-slate-400">Type: {item.type} • {item.location || "Location unavailable"}</div>
              <div className="mt-2 text-xs text-slate-500">Category: {item.category || "N/A"}</div>
            </div>
          ))}

          {recentItems.length === 0 && <div className="rounded-[24px] border border-slate-800 bg-slate-950/55 px-4 py-4 text-sm text-slate-400">No recent items.</div>}
        </div>
      </section>

      <section className="glass-panel mt-6 rounded-[32px] p-8">
        <div>
          <h2 className="text-2xl font-semibold">Activity timeline</h2>
          <p className="mt-2 text-sm text-slate-400">Latest system updates for administrators.</p>
        </div>
        {recentActivity.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-slate-800 bg-slate-950/55 px-4 py-4 text-sm text-slate-400">No activity yet.</div>
        ) : (
          <div className="mt-6 grid gap-4">
            {recentActivity.map((entry) => (
              <div key={entry.id} className="flex gap-3">
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                <div>
                  <div className="text-sm font-semibold text-slate-100">{entry.message}</div>
                  <div className="text-xs text-slate-500">{entry.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {status && <p className="mt-4 text-sm text-rose-300">{status}</p>}
    </div>
  );
}

export default AdminDashboard;

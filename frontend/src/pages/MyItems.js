import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../utils/api";
import Button from "../components/ui/button";

const fieldClass =
  "rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400/60";

function MyItems() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const parseTags = (description = "") => {
    const match = description.match(/Tags:\s*(.+)$/i);
    if (!match) return [];
    return match[1]
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  };

  const stripTags = (description = "") =>
    description.replace(/\n?\n?Tags:\s*.+$/i, "").trim();

  const loadItems = async () => {
    const data = await apiRequest("/api/items/my-items", { auth: true });
    setItems(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadItems().catch((error) => setStatus(error.message));
  }, []);

  const handleDelete = async (itemId) => {
    try {
      await apiRequest(`/api/items/${itemId}`, {
        method: "DELETE",
        auth: true,
      });
      setStatus("Item deleted.");
      loadItems();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const filteredItems = useMemo(() => {
    const base =
      filter === "all" ? items : items.filter((item) => item.status === filter);

    if (!query.trim()) return base;

    const needle = query.trim().toLowerCase();

    return base.filter((item) => {
      const haystack = [item.title, item.category, item.location, item.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [items, query, filter]);

  const stats = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((item) => item.status === "pending").length,
      matched: items.filter((item) => item.status === "matched").length,
      approved: items.filter((item) => item.status === "approved").length,
    }),
    [items]
  );

  return (
    <div className="page-shell">
      <section className="glass-panel rounded-[32px] p-8">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Personal reports
            </div>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
              Manage your submitted items with a cleaner workflow.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Search faster, monitor statuses clearly, and keep every report in a
              balanced, professional layout.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            <div className="rounded-[28px] border border-slate-800 bg-slate-950/60 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Total reports
              </div>
              <div className="mt-3 text-3xl font-semibold text-slate-100">
                {stats.total}
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-800 bg-slate-950/60 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Pending review
              </div>
              <div className="mt-3 text-3xl font-semibold text-amber-200">
                {stats.pending}
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-800 bg-slate-950/60 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Matched
              </div>
              <div className="mt-3 text-3xl font-semibold text-cyan-200">
                {stats.matched}
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-800 bg-slate-950/60 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Approved
              </div>
              <div className="mt-3 text-3xl font-semibold text-emerald-200">
                {stats.approved}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[28px] border border-slate-800 bg-slate-950/45 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">
                Filter your reports
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Narrow the list by keywords or workflow status.
              </p>
            </div>
            <Button variant="ghost" onClick={loadItems}>
              Refresh
            </Button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[2fr_1fr]">
            <input
              type="text"
              placeholder="Search by title, category, or location"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={fieldClass}
            />
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className={fieldClass}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="matched">Matched</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
          <div className="rounded-[28px] border border-slate-800 bg-slate-950/55 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">
                  Report overview
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  A quick summary of your item reporting pipeline.
                </p>
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
                {filteredItems.length} visible
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  What this page does
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Review item status, search older reports, and remove outdated
                  submissions from one place.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Current focus
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {stats.pending > 0
                    ? `${stats.pending} report(s) still need review.`
                    : "No reports are waiting for review right now."}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Match activity
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {stats.matched > 0
                    ? `${stats.matched} report(s) have potential matches.`
                    : "No active match suggestions at the moment."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="rounded-[28px] border border-slate-800 bg-slate-950/60 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-slate-100">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    {item.location || "Location unavailable"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold capitalize text-slate-200">
                    {item.type}
                  </span>
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold capitalize text-slate-200">
                    {item.status}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                {stripTags(item.description) || "No description added yet."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
                  Category: {item.category || "N/A"}
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
                  Posted: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </div>

              {parseTags(item.description).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {parseTags(item.description).map((tag) => (
                    <span
                      key={`${item._id}-${tag}`}
                      className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {item.status === "matched" && (
                <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                  Auto-match found. Waiting for admin approval.
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="ghost" onClick={() => setDeleteTarget(item)}>
                  Delete report
                </Button>
              </div>
            </div>
          ))}
          </div>
        </div>

        {filteredItems.length === 0 && (
          <div className="mt-6 rounded-[24px] border border-slate-800 bg-slate-950/55 px-4 py-4 text-sm text-slate-400">
            No items match the current filters.
          </div>
        )}

        {status && <p className="mt-4 text-sm text-rose-300">{status}</p>}
      </section>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-6">
          <div className="glass-panel w-full max-w-md rounded-[28px] p-6">
            <h3 className="text-xl font-semibold">Delete item?</h3>
            <p className="mt-2 text-sm text-slate-400">
              This will permanently remove <strong>{deleteTarget.title}</strong>. This action cannot be undone.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleDelete(deleteTarget._id);
                  setDeleteTarget(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyItems;

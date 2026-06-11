import { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";
import Button from "../components/ui/button";

const fieldClass =
  "rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400/60";

function AdminMatches() {
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [status, setStatus] = useState("");
  const [manualMatch, setManualMatch] = useState({ lostId: "", foundId: "" });
  const [manualStatus, setManualStatus] = useState("");
  const [activity, setActivity] = useState([]);
  const [modal, setModal] = useState({ open: false, item: null, action: "" });

  const loadMatches = async () => {
    const data = await apiRequest("/api/admin/matches", { auth: true });
    setItems(Array.isArray(data) ? data : []);
  };

  const loadItems = async () => {
    const data = await apiRequest("/api/items", { auth: true });
    const list = Array.isArray(data) ? data : data.items || [];
    setAllItems(list);
  };

  useEffect(() => {
    loadMatches().catch((error) => setStatus(error.message));
    loadItems().catch((error) => setStatus(error.message));
  }, []);

  const handleDecision = async (id, action) => {
    try {
      await apiRequest(`/api/admin/matches/${id}/${action}`, { method: "PUT", auth: true });
      const label = action === "approve" ? "approved" : "rejected";
      setStatus(`Match ${label}.`);
      setItems((prev) => prev.map((item) => (item._id === id ? { ...item, status: label } : item)));
      setActivity((prev) => [{ message: `Match ${label} for item ${id}.`, time: new Date() }, ...prev]);
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleManualMatch = async (event) => {
    event.preventDefault();
    setManualStatus("");
    if (!manualMatch.lostId.trim() || !manualMatch.foundId.trim()) {
      setManualStatus("Select both a lost item and a found item.");
      return;
    }
    try {
      const created = await apiRequest("/api/admin/matches/manual", {
        method: "POST",
        auth: true,
        body: { lostId: manualMatch.lostId.trim(), foundId: manualMatch.foundId.trim() },
      });
      const createdId = created?.matchId || created?._id || manualMatch.lostId.trim();
      if (createdId) {
        await handleDecision(createdId, "approve");
        setManualStatus("Manual match created and approved.");
      } else {
        setManualStatus("Manual match created. Approve it below.");
      }
      setActivity((prev) => [{ message: `Manual match created for lost ${manualMatch.lostId} and found ${manualMatch.foundId}.`, time: new Date() }, ...prev]);
      setManualMatch({ lostId: "", foundId: "" });
      loadMatches();
    } catch (error) {
      setManualStatus(error.message);
    }
  };

  const parseTags = (desc = "") => {
    const match = desc.match(/Tags:\s*(.+)$/i);
    return match ? match[1].split(",").map((t) => t.trim()).filter(Boolean) : [];
  };

  const lostOptions = allItems.filter((item) => item.type === "lost" && item.status !== "approved" && item.status !== "rejected");
  const foundOptions = allItems.filter((item) => item.type === "found" && item.status !== "approved" && item.status !== "rejected");
  const selectedLost = lostOptions.find((item) => item._id === manualMatch.lostId);
  const suggestedMatches = selectedLost
    ? foundOptions
        .map((found) => {
          const lostTags = parseTags(selectedLost.description);
          const foundTags = parseTags(found.description);
          const tagHits = lostTags.filter((tag) => foundTags.some((f) => f.toLowerCase() === tag.toLowerCase()));
          const score = tagHits.length + (selectedLost.category && selectedLost.category === found.category ? 1 : 0);
          return { found, score };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
    : [];

  return (
    <div className="page-shell">
      <section className="glass-panel rounded-[32px] p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Match review</div>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">Moderate smart and manual matches.</h1>
          </div>
          <div className="flex items-center gap-3"><span className="text-sm text-slate-500">{items.length} pending</span><Button variant="ghost" onClick={loadMatches}>Refresh</Button></div>
        </div>

        <div className="mt-8 rounded-[28px] border border-slate-800 bg-slate-950/60 p-6">
          <h2 className="text-xl font-semibold">Quick match</h2>
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleManualMatch}>
            <label className="grid gap-2 text-sm font-semibold text-slate-300">Lost item<select value={manualMatch.lostId} onChange={(e) => setManualMatch((prev) => ({ ...prev, lostId: e.target.value }))} className={fieldClass}><option value="">Select lost item</option>{lostOptions.map((item) => <option key={item._id} value={item._id}>{item.title || "Untitled"} - {item.location || "Unknown"} - {new Date(item.createdAt).toLocaleDateString()}</option>)}</select></label>
            <label className="grid gap-2 text-sm font-semibold text-slate-300">Found item<select value={manualMatch.foundId} onChange={(e) => setManualMatch((prev) => ({ ...prev, foundId: e.target.value }))} className={fieldClass}><option value="">Select found item</option>{foundOptions.map((item) => <option key={item._id} value={item._id}>{item.title || "Untitled"} - {item.location || "Unknown"} - {new Date(item.createdAt).toLocaleDateString()}</option>)}</select></label>
            <div className="md:col-span-2"><Button type="submit">Create match</Button>{manualStatus && <p className="mt-2 text-sm text-rose-300">{manualStatus}</p>}</div>
          </form>

          {selectedLost && (
            <div className="mt-6 grid gap-3">
              <div className="flex items-center justify-between"><h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Suggested matches</h3><span className="text-xs text-slate-500">{suggestedMatches.length} suggestions</span></div>
              {suggestedMatches.length === 0 ? <div className="rounded-[24px] border border-slate-800 bg-slate-950/55 px-4 py-4 text-sm text-slate-400">No tag-based matches found.</div> : suggestedMatches.map((entry) => <div key={entry.found._id} className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-800 bg-slate-950/55 px-4 py-4"><div><strong className="text-sm text-slate-100">{entry.found.title || "Untitled"}</strong><div className="text-xs text-slate-500">{entry.found.location || "Unknown"} - {entry.found.category || "No category"}</div></div><div className="flex items-center gap-2"><span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-200">Score {entry.score}</span><Button type="button" variant="ghost" onClick={() => setManualMatch((prev) => ({ ...prev, foundId: entry.found._id }))}>Use match</Button></div></div>)}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-[28px] border border-slate-800 bg-slate-950/60 p-6">
          <h2 className="text-xl font-semibold">Match timeline</h2>
          {activity.length === 0 ? <div className="mt-4 rounded-[24px] border border-slate-800 bg-slate-950/55 px-4 py-4 text-sm text-slate-400">No recent match activity.</div> : <div className="mt-4 grid gap-3">{activity.slice(0, 6).map((entry, index) => <div key={`${entry.time.toISOString()}-${index}`} className="flex gap-3"><span className="mt-2 h-2.5 w-2.5 rounded-full bg-cyan-300" /><div><div className="text-sm font-semibold text-slate-100">{entry.message}</div><div className="text-xs text-slate-500">{entry.time.toLocaleString()}</div></div></div>)}</div>}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {items.length === 0 ? <div className="rounded-[24px] border border-slate-800 bg-slate-950/55 px-4 py-4 text-sm text-slate-400">No matched items awaiting review.</div> : items.map((item) => <div key={item._id} className="rounded-[28px] border border-slate-800 bg-slate-950/60 p-5"><div className="flex items-center justify-between gap-3"><strong className="text-lg text-slate-100">{item.title || "Untitled Item"}</strong><span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold capitalize text-slate-200">{item.status}</span></div><div className="mt-3 grid gap-3 text-sm text-slate-300"><div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-3"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">Lost item</div><div className="mt-2">Posted by: {item.postedBy?.name || "Unknown"}</div><div>Location: {item.location || "Location unavailable"}</div><div>Category: {item.category || "N/A"}</div></div><div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-3"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">Matched item</div><div className="mt-2">Title: {item.matchedItem?.title || "N/A"}</div><div>Posted by: {item.matchedItem?.postedBy?.name || "Unknown"}</div><div>Location: {item.matchedItem?.location || "Location unavailable"}</div></div></div><div className="mt-4 flex flex-wrap gap-3"><Button onClick={() => setModal({ open: true, item, action: "approve" })} disabled={!item.matchedItem}>Approve</Button><Button variant="ghost" onClick={() => setModal({ open: true, item, action: "reject" })}>Reject</Button></div></div>)}
        </div>

        {status && <p className="mt-4 text-sm text-rose-300">{status}</p>}
      </section>

      {modal.open && modal.item && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-6" onClick={() => setModal({ open: false, item: null, action: "" })}><div className="glass-panel w-full max-w-xl rounded-[28px] p-6" onClick={(e) => e.stopPropagation()}><h3 className="text-xl font-semibold">{modal.action === "approve" ? "Approve match" : "Reject match"}</h3><p className="mt-2 text-sm text-slate-400">Confirm this action before updating the record.</p><div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2"><div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-3"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">Lost item</div><div className="mt-2">Title: {modal.item.title || "Untitled Item"}</div><div>Location: {modal.item.location || "Location unavailable"}</div></div><div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-3"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">Matched item</div><div className="mt-2">Title: {modal.item.matchedItem?.title || "N/A"}</div><div>Location: {modal.item.matchedItem?.location || "Location unavailable"}</div></div></div><div className="mt-4 flex flex-wrap gap-3"><Button onClick={() => { handleDecision(modal.item._id, modal.action); setModal({ open: false, item: null, action: "" }); }}>{modal.action === "approve" ? "Approve match" : "Reject match"}</Button><Button variant="ghost" onClick={() => setModal({ open: false, item: null, action: "" })}>Cancel</Button></div></div></div>}
    </div>
  );
}

export default AdminMatches;


import { useEffect, useMemo, useState } from "react";
import { apiRequest, getApiBase } from "../utils/api";

function MyClaims() {
  const [claims, setClaims] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiRequest("/api/claims/my-claims", {
          auth: true,
        });
        setClaims(Array.isArray(response) ? response : []);
        setStatus("");
      } catch (error) {
        setStatus(error.message);
      }
    };

    fetchData();
  }, []);

  const stats = useMemo(
    () => ({
      total: claims.length,
      pending: claims.filter((claim) => claim.status === "pending").length,
      approved: claims.filter((claim) => claim.status === "approved").length,
      rejected: claims.filter((claim) => claim.status === "rejected").length,
    }),
    [claims]
  );

  return (
    <div className="page-shell">
      <section className="glass-panel rounded-[32px] p-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Claim tracking
            </div>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
              Track every submitted claim in one aligned workspace.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Follow proof submissions, review admin feedback, and see decisions
              without the page feeling crowded or uneven.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            <div className="rounded-[28px] border border-slate-800 bg-slate-950/60 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Total claims
              </div>
              <div className="mt-3 text-3xl font-semibold text-slate-100">
                {stats.total}
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-800 bg-slate-950/60 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Pending
              </div>
              <div className="mt-3 text-3xl font-semibold text-amber-200">
                {stats.pending}
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
            <div className="rounded-[28px] border border-slate-800 bg-slate-950/60 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Rejected
              </div>
              <div className="mt-3 text-3xl font-semibold text-rose-200">
                {stats.rejected}
              </div>
            </div>
          </div>
        </div>

        {claims.length === 0 && (
          <div className="mt-6 rounded-[24px] border border-slate-800 bg-slate-950/55 px-4 py-4 text-sm text-slate-400">
            No claims submitted yet.
          </div>
        )}

        <div className="mt-8 grid gap-4 xl:grid-cols-2">
          {claims.map((claim) => (
            <div
              key={claim._id}
              className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950/60"
            >
              {claim.proofImage ? (
                <img
                  src={`${getApiBase()}${claim.proofImage}`}
                  alt="Claim proof"
                  className="h-52 w-full object-cover"
                />
              ) : (
                <div className="grid h-52 place-items-center bg-slate-900 text-sm text-slate-500">
                  No proof image attached
                </div>
              )}

              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-100">
                      {claim.item?.title || "Untitled item"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-400">
                      {claim.item?.location || "Location unavailable"}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold capitalize text-slate-200">
                    {claim.status || "pending"}
                  </span>
                </div>

                {claim.proofText && (
                  <p className="mt-4 text-sm leading-6 text-slate-300">
                    {claim.proofText}
                  </p>
                )}

                {claim.adminRemark && (
                  <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
                    Admin note: {claim.adminRemark}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {status && <p className="mt-4 text-sm text-rose-300">{status}</p>}
      </section>
    </div>
  );
}

export default MyClaims;

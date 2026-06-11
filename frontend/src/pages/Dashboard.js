import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest, getApiBase } from "../utils/api";
import { getAuth } from "../utils/auth";
import { MapContainer, TileLayer, CircleMarker, Popup, Circle } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import Button from "../components/ui/button";
import "leaflet/dist/leaflet.css";

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const fieldClass =
  "rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400/60";

function Dashboard() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [filters, setFilters] = useState({ search: "", type: "", category: "", tags: "" });
  const [status, setStatus] = useState("");
  const [claimStatusById, setClaimStatusById] = useState({});
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [activeHotspotKey, setActiveHotspotKey] = useState("");
  const mapRef = useRef(null);

  const auth = getAuth();

  const loadItems = useCallback(async () => {
    const params = new URLSearchParams();
    ["search", "type", "category"].forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const data = await apiRequest(`/api/items?${params.toString()}`);
    setItems(data.items || []);
    setPagination(data.pagination || null);
  }, [filters]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation(null);
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => setUserLocation(null),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadItems()
      .catch((err) => setStatus(err.message))
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      loadItems().catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, [loadItems]);

  const handleFilterSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    loadItems()
      .catch((err) => setStatus(err.message))
      .finally(() => setLoading(false));
  };

  const handleClaim = async (itemId) => {
    try {
      await apiRequest("/api/claims", { method: "POST", auth: true, body: { itemId } });
      setClaimStatusById((prev) => ({
        ...prev,
        [itemId]: "Claim submitted successfully.",
      }));
    } catch (err) {
      setClaimStatusById((prev) => ({
        ...prev,
        [itemId]: err.message,
      }));
    }
  };

  const parseTags = (desc = "") => {
    const match = desc.match(/Tags:\s*(.+)$/i);
    return match ? match[1].split(",").map((tag) => tag.trim()).filter(Boolean) : [];
  };

  const stripTags = (desc = "") => desc.replace(/\n?\n?Tags:.*/i, "").trim();

  const activeTagFilters = useMemo(
    () =>
      filters.tags
        ? filters.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [],
    [filters.tags]
  );

  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        if (!activeTagFilters.length) return true;
        const itemTags = parseTags(item.description);
        return activeTagFilters.some((tag) =>
          itemTags.some((itemTag) => itemTag.toLowerCase() === tag.toLowerCase())
        );
      }),
    [items, activeTagFilters]
  );

  const lostItems = useMemo(
    () =>
      visibleItems
        .filter(
          (item) =>
            item.type === "lost" &&
            item.status !== "approved" &&
            item.status !== "rejected"
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [visibleItems]
  );

  const getBucketKey = (item) => {
    if (!item.locationLat || !item.locationLng) return "";
    return `${Number(item.locationLat).toFixed(3)},${Number(item.locationLng).toFixed(3)}`;
  };

  const displayedLostItems = useMemo(
    () =>
      activeHotspotKey
        ? lostItems.filter((item) => getBucketKey(item) === activeHotspotKey)
        : lostItems,
    [lostItems, activeHotspotKey]
  );

  const matchedCount = useMemo(
    () => items.filter((item) => item.status === "matched").length,
    [items]
  );

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === "pending").length,
    [items]
  );

  const mapItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.type === "lost" &&
          item.status !== "approved" &&
          item.status !== "rejected"
      ),
    [items]
  );

  const nearbyCount = useMemo(() => {
    if (!userLocation) return 0;
    return mapItems.filter(
      (item) =>
        item.locationLat &&
        item.locationLng &&
        getDistance(userLocation[0], userLocation[1], item.locationLat, item.locationLng) <= 5
    ).length;
  }, [mapItems, userLocation]);

  const hotspots = useMemo(() => {
    const buckets = new Map();

    mapItems.forEach((item) => {
      if (!item.locationLat || !item.locationLng) return;
      const lat = Number(item.locationLat);
      const lng = Number(item.locationLng);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
      const existing = buckets.get(key);

      if (existing) {
        existing.count += 1;
      } else {
        buckets.set(key, {
          key,
          lat: lat.toFixed(3),
          lng: lng.toFixed(3),
          location: item.location || "Unknown area",
          count: 1,
        });
      }
    });

    return Array.from(buckets.values()).sort((a, b) => b.count - a.count).slice(0, 3);
  }, [mapItems]);

  const formatDateTime = (value) => {
    if (!value) return "Unknown";
    return new Date(value).toLocaleString();
  };

  const defaultCenter = [20.5937, 78.9629];

  const metricCards = [
    { label: "Active lost", value: lostItems.length, tone: "text-cyan-200" },
    { label: "Matched", value: matchedCount, tone: "text-amber-200" },
    { label: "Pending", value: pendingCount, tone: "text-slate-200" },
    { label: "Nearby", value: userLocation ? nearbyCount : "—", tone: "text-emerald-200" },
  ];

  const clearHotspot = () => {
    setActiveHotspotKey("");
    mapRef.current?.setView(userLocation || defaultCenter, userLocation ? 16 : 5, {
      animate: true,
    });
  };

  return (
    <div className="page-shell">
      <section className="glass-panel rounded-[32px] p-8 md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              User dashboard
            </div>
            <h1 className="mt-3 text-3xl font-semibold md:text-5xl">
              Track reports with a cleaner operations view.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
              Search active reports, inspect hotspots, and claim relevant items from a more
              structured, professional workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="button" onClick={loadItems}>
                Refresh reports
              </Button>
              {pagination && (
                <span className="rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-xs font-semibold text-slate-300">
                  {pagination.total} total reports loaded
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {metricCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[28px] border border-slate-800 bg-slate-950/60 px-5 py-5"
              >
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{card.label}</div>
                <div className={`mt-3 text-4xl font-semibold ${card.tone}`}>{card.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-panel mt-6 rounded-[32px] p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Filter reports</h2>
            <p className="mt-2 text-sm text-slate-400">
              Narrow down the results by keywords, type, category, and tags.
            </p>
          </div>
          {loading && <span className="text-sm text-slate-400">Refreshing reports...</span>}
        </div>

        <form className="mt-6 grid gap-4 lg:grid-cols-4" onSubmit={handleFilterSubmit}>
          <label className="grid gap-2 text-sm font-semibold text-slate-300">
            Search
            <input
              className={fieldClass}
              placeholder="Search title or location"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-300">
            Type
            <select
              className={fieldClass}
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-300">
            Category
            <input
              className={fieldClass}
              placeholder="Wallet, phone, ID"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-300">
            Tags
            <input
              className={fieldClass}
              placeholder="black, leather"
              value={filters.tags}
              onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
            />
          </label>

          <div className="flex flex-wrap items-center gap-3 lg:col-span-4">
            <Button type="submit">Apply filters</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFilters({ search: "", type: "", category: "", tags: "" })}
            >
              Clear
            </Button>
            {status && <span className="text-sm text-rose-300">{status}</span>}
          </div>
        </form>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="glass-panel rounded-[32px] p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Active reports</h2>
              <p className="mt-2 text-sm text-slate-400">
                {displayedLostItems.length} visible item{displayedLostItems.length === 1 ? "" : "s"}
                {activeHotspotKey ? " in the selected hotspot" : ""}.
              </p>
            </div>
            {activeHotspotKey && (
              <Button type="button" variant="ghost" onClick={clearHotspot}>
                Clear hotspot
              </Button>
            )}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {displayedLostItems.map((item) => {
              const canClaim = auth?.token && item.postedBy?._id !== auth?._id;
              const itemTags = parseTags(item.description);
              const images = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
              const coverImage = images[0];
              const isExpanded = expandedItem === item._id;

              return (
                <article
                  key={item._id}
                  className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950/60"
                >
                  <button
                    type="button"
                    className="relative block w-full text-left"
                    onClick={() => setExpandedItem(isExpanded ? null : item._id)}
                  >
                    {coverImage ? (
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                        <img
                          src={`${getApiBase()}${coverImage}`}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-300"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent px-5 pb-4 pt-10">
                          <div className="flex items-center justify-between gap-3">
                            <strong className="text-lg text-slate-100">{item.title}</strong>
                            <span className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs font-semibold capitalize text-slate-200">
                              {item.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center bg-slate-900 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        No photo available
                      </div>
                    )}
                  </button>

                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto border-t border-slate-800 bg-slate-900/50 px-4 py-3">
                      {images.slice(0, 4).map((imagePath) => (
                        <img
                          key={imagePath}
                          src={`${getApiBase()}${imagePath}`}
                          alt={item.title}
                          className="h-14 w-14 flex-none rounded-xl object-cover"
                        />
                      ))}
                    </div>
                  )}

                  <div className="grid gap-4 px-5 py-5">
                    {!coverImage && (
                      <div className="flex items-center justify-between gap-3">
                        <strong className="text-lg text-slate-100">{item.title}</strong>
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold capitalize text-slate-200">
                          {item.status}
                        </span>
                      </div>
                    )}

                    <div className="grid gap-2 text-sm text-slate-400">
                      <div>{formatDateTime(item.createdAt)}</div>
                      <div>{item.location || "Unknown location"}</div>
                      <div>{item.category || "No category"}</div>
                    </div>

                    <p className="text-sm leading-6 text-slate-300">
                      {stripTags(item.description) || "No description available."}
                    </p>

                    {itemTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {itemTags.map((tag) => (
                          <span
                            key={`${item._id}-${tag}`}
                            className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {canClaim && (
                      <div className="flex flex-wrap items-center gap-3">
                        <Button type="button" onClick={() => handleClaim(item._id)}>
                          Claim item
                        </Button>
                        {claimStatusById[item._id] && (
                          <span className="text-xs text-cyan-200">{claimStatusById[item._id]}</span>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}

            {!displayedLostItems.length && (
              <div className="rounded-[24px] border border-slate-800 bg-slate-950/55 px-5 py-6 text-sm text-slate-400 lg:col-span-2">
                No active lost reports match the current filters.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <section className="glass-panel rounded-[32px] p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Map overview</h2>
                <p className="mt-2 text-sm text-slate-400">Live location view for active lost reports.</p>
              </div>
              <span className="text-sm text-slate-500">
                {userLocation ? `${nearbyCount} nearby` : `${items.length} reports`}
              </span>
            </div>

            <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-800">
              <MapContainer
                center={userLocation || defaultCenter}
                zoom={userLocation ? 16 : 5}
                style={{ height: "340px", width: "100%" }}
                whenCreated={(mapInstance) => {
                  mapRef.current = mapInstance;
                }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MarkerClusterGroup>
                  {mapItems.map((item) => {
                    if (!item.locationLat || !item.locationLng) return null;
                    const postedById = item.postedBy?._id || item.postedBy;
                    const canClaim = auth?.token && postedById && postedById !== auth?._id;
                    const isNearby =
                      userLocation &&
                      getDistance(userLocation[0], userLocation[1], item.locationLat, item.locationLng) <= 5;

                    return (
                      <CircleMarker
                        key={item._id}
                        center={[item.locationLat, item.locationLng]}
                        radius={12}
                        pathOptions={{ color: item.status === "matched" ? "#f59e0b" : "#38bdf8" }}
                        className={isNearby ? "blinking" : ""}
                      >
                        <Popup>
                          <div className="grid gap-2 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <strong>{item.title}</strong>
                              <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-300">
                                {item.status || "pending"}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400">{item.type} • {item.location}</div>
                            <div className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</div>
                            {item.images?.[0] && (
                              <img
                                src={`${getApiBase()}${item.images[0]}`}
                                alt={item.title}
                                className="max-h-32 w-full rounded-2xl object-cover"
                              />
                            )}
                            {canClaim && (
                              <button
                                className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-semibold text-slate-950"
                                type="button"
                                onClick={() => handleClaim(item._id)}
                              >
                                Quick claim
                              </button>
                            )}
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MarkerClusterGroup>

                {userLocation && (
                  <>
                    <CircleMarker center={userLocation} radius={14} pathOptions={{ color: "#2dd4bf" }}>
                      <Popup>You are here</Popup>
                    </CircleMarker>
                    <Circle center={userLocation} radius={5000} pathOptions={{ color: "#2dd4bf", fillOpacity: 0.08 }} />
                  </>
                )}
              </MapContainer>
            </div>
          </section>

          <section className="glass-panel rounded-[32px] p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Hotspots</h2>
                <p className="mt-2 text-sm text-slate-400">Areas with the highest concentration of active lost items.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {!hotspots.length && (
                <div className="rounded-[24px] border border-slate-800 bg-slate-950/55 px-4 py-5 text-sm text-slate-400">
                  No hotspot data yet.
                </div>
              )}

              {hotspots.map((spot, index) => (
                <button
                  type="button"
                  key={spot.key}
                  className={`flex w-full items-center justify-between rounded-[24px] border px-4 py-4 text-left transition ${
                    activeHotspotKey === spot.key
                      ? "border-cyan-400/30 bg-cyan-400/10"
                      : "border-slate-800 bg-slate-950/55"
                  }`}
                  onClick={() => {
                    setActiveHotspotKey(spot.key);
                    const lat = Number(spot.lat);
                    const lng = Number(spot.lng);
                    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                      mapRef.current?.setView([lat, lng], 17, { animate: true });
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-sm font-semibold text-cyan-200">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-100">{spot.location}</div>
                      <div className="text-xs text-slate-500">
                        {spot.lat}, {spot.lng}
                      </div>
                    </div>
                  </div>
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-200">
                    {spot.count} items
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>

      <style>{`
        .blinking {
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;

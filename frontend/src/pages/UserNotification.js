import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../utils/api";
import Button from "../components/ui/button";

const cardClass = "rounded-[28px] border border-slate-800 bg-slate-950/60 p-5";

function UserNotification() {
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [notifiedIds, setNotifiedIds] = useState([]);

  const matchRadiusKm = 5;

  const loadNotifications = async () => {
    try {
      const data = await apiRequest("/api/notifications", { auth: true });
      setNotifications(Array.isArray(data) ? data : []);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const data = await apiRequest("/api/items");
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {}
  };

  useEffect(() => {
    loadNotifications();
    loadItems();
    const interval = setInterval(loadNotifications, 15000);
    const handleVisibility = () => {
      if (!document.hidden) {
        loadNotifications();
        loadItems();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) =>
        setUserLocation([position.coords.latitude, position.coords.longitude]),
      () => setUserLocation(null),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!userLocation || !items.length) return;

    const [latitude, longitude] = userLocation;

    const getDistance = (lat1, lng1, lat2, lng2) => {
      const earthRadius = 6371;
      const deltaLat = (lat2 - lat1) * (Math.PI / 180);
      const deltaLng = (lng2 - lng1) * (Math.PI / 180);
      const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(deltaLng / 2) ** 2;

      return earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    const nearbyLostItems = items.filter(
      (item) =>
        item.type === "lost" &&
        item.status !== "rejected" &&
        item.status !== "approved" &&
        item.locationLat != null &&
        item.locationLng != null &&
        getDistance(latitude, longitude, item.locationLat, item.locationLng) <=
          matchRadiusKm &&
        !notifiedIds.includes(item._id)
    );

    if (!nearbyLostItems.length) return;

    const createNearbyNotifications = async () => {
      const createdIds = [];

      for (const item of nearbyLostItems) {
        try {
          await apiRequest("/api/notifications/nearby", {
            method: "POST",
            auth: true,
            body: {
              itemId: item._id,
              userLat: latitude,
              userLng: longitude,
              distanceKm: matchRadiusKm,
            },
          });
          createdIds.push(item._id);
        } catch (error) {}
      }

      if (createdIds.length) {
        setNotifiedIds((previous) => previous.concat(createdIds));
        loadNotifications();
      }
    };

    createNearbyNotifications();
  }, [items, userLocation, notifiedIds]);

  const markRead = async (id) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, {
        method: "PUT",
        auth: true,
      });
      setStatus("Notification marked as read.");
      loadNotifications();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const nearbyNotes = useMemo(
    () =>
      notifications.filter(
        (note) =>
          typeof note.message === "string" &&
          note.message.toLowerCase().startsWith("nearby alert:")
      ),
    [notifications]
  );

  const unreadNotes = useMemo(
    () => notifications.filter((note) => !note.isRead),
    [notifications]
  );

  const updates = useMemo(
    () =>
      notifications.filter(
        (note) =>
          !(
            typeof note.message === "string" &&
            note.message.toLowerCase().startsWith("nearby alert:")
          )
      ),
    [notifications]
  );

  const renderNotification = (note, variant = "default") => {
    const isAlert = variant === "alert";

    return (
      <div
        key={note._id}
        className={`overflow-hidden rounded-[28px] border p-5 ${
          isAlert
            ? "border-rose-400/30 bg-gradient-to-br from-rose-500/10 via-slate-950/80 to-slate-950/90"
            : "border-slate-800 bg-slate-950/60"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-11 w-11 place-items-center rounded-2xl text-sm font-semibold ${
                isAlert
                  ? "bg-rose-400/15 text-rose-200"
                  : "bg-cyan-400/12 text-cyan-200"
              }`}
            >
              {isAlert ? "!" : "i"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-100">
                  {isAlert ? "Nearby alert" : "Platform update"}
                </span>
                {!note.isRead && (
                  <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                    New
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {new Date(note.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isAlert
                ? "border border-rose-400/25 bg-rose-400/10 text-rose-200"
                : "border border-slate-700 bg-slate-900 text-slate-300"
            }`}
          >
            {note.isRead ? "Read" : "Action needed"}
          </span>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-300">{note.message}</p>

        {!note.isRead && (
          <div className="mt-5">
            <Button
              variant={isAlert ? "primary" : "ghost"}
              onClick={() => markRead(note._id)}
            >
              Mark as read
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-shell">
      <section className="glass-panel overflow-hidden rounded-[32px] p-8">
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[30px] border border-rose-400/20 bg-gradient-to-br from-rose-500/14 via-slate-950/75 to-slate-950/90 p-7">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-200/80">
              Alert center
            </div>
            <h1 className="mt-4 max-w-2xl text-3xl font-semibold md:text-4xl">
              Prioritize nearby alerts before they become missed opportunities.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              This page now highlights urgent notifications first, then keeps
              your routine updates in a separate aligned feed.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={loadNotifications}>Refresh alerts</Button>
              <Button variant="ghost" onClick={loadItems}>
                Refresh nearby scan
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className={cardClass}>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Nearby alerts
              </div>
              <div className="mt-3 text-3xl font-semibold text-rose-200">
                {nearbyNotes.length}
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Priority notices triggered by location-aware matching.
              </p>
            </div>
            <div className={cardClass}>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Unread updates
              </div>
              <div className="mt-3 text-3xl font-semibold text-cyan-200">
                {unreadNotes.length}
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Messages still waiting for your review.
              </p>
            </div>
            <div className={cardClass}>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Total notifications
              </div>
              <div className="mt-3 text-3xl font-semibold text-slate-100">
                {notifications.length}
              </div>
              <p className="mt-2 text-sm text-slate-400">
                All alerts, approvals, and platform updates together.
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-6 rounded-[24px] border border-slate-800 bg-slate-950/55 px-4 py-4 text-sm text-slate-400">
            Loading your alert center...
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="mt-6 rounded-[24px] border border-slate-800 bg-slate-950/55 px-4 py-4 text-sm text-slate-400">
            No notifications yet.
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-100">
                    Priority alerts
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    These should stand out first and never feel like a normal
                    page feed.
                  </p>
                </div>
                <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-200">
                  {nearbyNotes.length} active
                </span>
              </div>

              {nearbyNotes.length === 0 ? (
                <div className="rounded-[28px] border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-400">
                  No nearby alerts right now.
                </div>
              ) : (
                nearbyNotes.map((note) => renderNotification(note, "alert"))
              )}
            </div>

            <div className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-100">
                    General updates
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Approvals, matches, and quieter system messages.
                  </p>
                </div>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
                  {updates.length} messages
                </span>
              </div>

              {updates.length === 0 ? (
                <div className="rounded-[28px] border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-400">
                  No general updates at the moment.
                </div>
              ) : (
                updates.map((note) => renderNotification(note))
              )}
            </div>
          </div>
        )}

        {status && <p className="mt-4 text-sm text-rose-300">{status}</p>}
      </section>
    </div>
  );
}

export default UserNotification;

window.BusApp = (() => {
  const API_BASE = window.BUS_TRACKING_API_BASE || "http://127.0.0.1:5000/api";

  const buses = [
    { id: "BUS-101", number: "CB-101", route: "North Gate - Main Campus", currentStop: "Library Junction", nextStop: "CSE Block", eta: 6, speed: 32, status: "On Time", routeId: "R1", location: { x: 17, y: 54 }, progress: 62 },
    { id: "BUS-102", number: "CB-102", route: "Hostel Loop", currentStop: "Girls Hostel", nextStop: "Admin Block", eta: 9, speed: 24, status: "Delayed", routeId: "R2", location: { x: 34, y: 34 }, progress: 41 },
    { id: "BUS-103", number: "CB-103", route: "City Center Express", currentStop: "City Mall", nextStop: "College Gate", eta: 12, speed: 38, status: "Arriving", routeId: "R3", location: { x: 68, y: 42 }, progress: 57 },
    { id: "BUS-104", number: "CB-104", route: "Railway Station Shuttle", currentStop: "Railway Station", nextStop: "Sports Complex", eta: 5, speed: 29, status: "On Time", routeId: "R4", location: { x: 72, y: 70 }, progress: 76 },
    { id: "BUS-105", number: "CB-105", route: "South Campus Circular", currentStop: "Biotech Park", nextStop: "ECE Block", eta: 4, speed: 22, status: "Offline", routeId: "R1", location: { x: 46, y: 63 }, progress: 21 },
    { id: "BUS-106", number: "CB-106", route: "Library Special", currentStop: "Main Gate", nextStop: "Library Junction", eta: 8, speed: 26, status: "On Time", routeId: "R2", location: { x: 23, y: 22 }, progress: 33 },
  ];

  const routes = [
    { id: "R1", number: "Route 1", name: "North Gate - Main Campus", start: "North Gate", destination: "Main Campus", distance: "11.5 km", duration: "28 min", stops: ["North Gate", "Bus Stand", "Library Junction", "CSE Block", "Main Auditorium", "Main Campus"] },
    { id: "R2", number: "Route 2", name: "Hostel Loop", start: "Girls Hostel", destination: "Admin Block", distance: "7.8 km", duration: "21 min", stops: ["Girls Hostel", "Boys Hostel", "Canteen", "Library Junction", "Admin Block"] },
    { id: "R3", number: "Route 3", name: "City Center Express", start: "City Center", destination: "College Gate", distance: "16.2 km", duration: "34 min", stops: ["City Center", "City Mall", "Bus Depot", "College Gate"] },
    { id: "R4", number: "Route 4", name: "Railway Station Shuttle", start: "Railway Station", destination: "Sports Complex", distance: "9.1 km", duration: "24 min", stops: ["Railway Station", "Police Quarters", "Sports Complex", "ECE Block"] },
  ];

  const notifications = [
    { id: "N1", type: "Delay Alert", title: "Bus CB-102 is delayed by 8 minutes", description: "Route 2 traffic is slow near the library junction.", time: "2 min ago", read: false, tone: "delayed" },
    { id: "N2", type: "Arrival Alert", title: "Bus CB-104 will reach Sports Complex shortly", description: "The bus is approaching the campus zone.", time: "8 min ago", read: false, tone: "on-time" },
    { id: "N3", type: "Route Update", title: "Route 3 has a temporary stop change at City Mall", description: "The temporary stop is active for today.", time: "24 min ago", read: true, tone: "moving" },
    { id: "N4", type: "Announcement", title: "Extra college bus service available during exams", description: "Additional service is available during exam week.", time: "1 hour ago", read: true, tone: "announcement" },
    { id: "N5", type: "Delay Alert", title: "Bus CB-101 is slowing near Library Junction", description: "Expected wait time is under 10 minutes.", time: "1 hour ago", read: false, tone: "delayed" },
  ];

  const trafficFactors = { light: 0.9, moderate: 1, heavy: 1.22, "peak-hour": 1.35 };
  const trafficLabels = [
    ["light", "Light Traffic"],
    ["moderate", "Moderate Traffic"],
    ["heavy", "Heavy Traffic"],
    ["peak-hour", "Peak Hour"],
  ];
  const iconMap = {
    "Delay Alert": ["bi-exclamation-triangle", "delay"],
    "Arrival Alert": ["bi-bus-front", "arrival"],
    "Route Update": ["bi-signpost-split", "route"],
    Announcement: ["bi-megaphone", "announcement"],
  };

  let dashboardStats = {
    active_buses: 25,
    on_time_buses: 20,
    delayed_buses: 5,
    total_routes: 12,
    unread_notifications: 3,
  };

  function statusClass(status) {
    const key = String(status || "").toLowerCase();
    if (key.includes("delay")) return "status-delayed";
    if (key.includes("offline") || key.includes("idle")) return "status-offline";
    if (key.includes("arriv")) return "status-arriving";
    if (key.includes("move")) return "status-moving";
    return "status-on-time";
  }

  function statusLabel(status) {
    const key = String(status || "").toLowerCase();
    if (key.includes("delay")) return "Delayed";
    if (key.includes("offline") || key.includes("idle")) return "Offline";
    if (key.includes("arriv")) return "Arriving";
    if (key.includes("move")) return "Moving";
    return "On Time";
  }

  function hydrate(target, source) {
    target.splice(0, target.length, ...source);
  }

  async function api(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || `Request failed: ${response.status}`);
    }
    return data;
  }

  async function loadServerState() {
    try {
      const [dashboard, routesPayload, notificationsPayload] = await Promise.all([
        api("/dashboard"),
        api("/routes"),
        api("/notifications"),
      ]);
      if (dashboard.stats) dashboardStats = dashboard.stats;
      if (Array.isArray(dashboard.buses)) hydrate(buses, dashboard.buses);
      if (Array.isArray(routesPayload.routes)) hydrate(routes, routesPayload.routes);
      if (Array.isArray(notificationsPayload.notifications)) hydrate(notifications, notificationsPayload.notifications);
    } catch (error) {
      console.warn("Server load failed, using local fallback data.", error);
    }
  }

  function getBusById(id) {
    return buses.find((bus) => bus.id === id);
  }

  function getRouteById(id) {
    return routes.find((route) => route.id === id);
  }

  function routeStops(routeId) {
    const route = getRouteById(routeId);
    return route ? route.stops : [];
  }

  function countUnread() {
    return notifications.filter((item) => !item.read).length;
  }

  function toast(message, tone = "primary") {
    const container = document.querySelector(".toast-container");
    if (!container) return;
    const id = `toast-${Date.now()}`;
    const bg = { primary: "text-bg-primary", success: "text-bg-success", warning: "text-bg-warning", danger: "text-bg-danger", info: "text-bg-info" }[tone] || "text-bg-primary";
    container.insertAdjacentHTML(
      "beforeend",
      `<div id="${id}" class="toast align-items-center ${bg} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>`
    );
    const node = document.getElementById(id);
    const instance = bootstrap.Toast.getOrCreateInstance(node, { delay: 2400 });
    node.addEventListener("hidden.bs.toast", () => node.remove());
    instance.show();
  }

  function setActiveNav() {
    const page = document.body.dataset.page;
    document.querySelectorAll("[data-nav]").forEach((link) => {
      const active = link.dataset.nav === page;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function renderUnreadBadges() {
    const unread = countUnread();
    document.querySelectorAll("[data-unread-count]").forEach((node) => {
      node.textContent = unread;
      node.classList.toggle("d-none", unread === 0);
    });
  }

  function fillSelects() {
    document.querySelectorAll("[data-bus-select]").forEach((select) => {
      select.innerHTML = `<option value="">Select a bus</option>${buses.map((bus) => `<option value="${bus.id}">${bus.number} - ${bus.route}</option>`).join("")}`;
    });
    document.querySelectorAll("[data-route-select]").forEach((select) => {
      select.innerHTML = `<option value="">Select a route</option>${routes.map((route) => `<option value="${route.id}">${route.number} - ${route.name}</option>`).join("")}`;
    });
    document.querySelectorAll("[data-stop-select]").forEach((select) => {
      const busId = select.dataset.busId;
      const routeId = select.dataset.routeId;
      let list = [];
      if (busId && getBusById(busId)) list = routeStops(getBusById(busId).routeId || getBusById(busId).route_id);
      else if (routeId) list = routeStops(routeId);
      else list = [...new Set(routes.flatMap((route) => route.stops || []))];
      select.innerHTML = `<option value="">Select a stop</option>${list.map((stop) => `<option value="${stop}">${stop}</option>`).join("")}`;
    });
    document.querySelectorAll("[data-traffic-select]").forEach((select) => {
      select.innerHTML = trafficLabels.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
    });
  }

  function renderHomeStats() {
    const stats = [
      [`${dashboardStats.active_buses || buses.length}+`, "Active buses"],
      [`${dashboardStats.total_routes || routes.length}`, "Routes"],
      ["120+", "Daily trips"],
      ["98%", "On-time performance"],
    ];
    document.querySelectorAll("[data-home-stat]").forEach((node, index) => {
      const pair = stats[index];
      if (!pair) return;
      const value = node.querySelector(".value");
      const label = node.querySelector(".label");
      if (value) value.textContent = pair[0];
      if (label) label.textContent = pair[1];
    });
  }

  function renderDashboardStats() {
    const values = [dashboardStats.active_buses ?? 0, dashboardStats.on_time_buses ?? 0, dashboardStats.delayed_buses ?? 0, dashboardStats.total_routes ?? 0];
    document.querySelectorAll("[data-dashboard-stat]").forEach((node, index) => {
      node.textContent = values[index] ?? 0;
    });
  }

  function renderDashboardBuses(filterText = "") {
    const target = document.querySelector("[data-dashboard-buses]");
    const table = document.querySelector("[data-dashboard-table]");
    if (!target) return;
    const term = filterText.trim().toLowerCase();
    const filtered = buses.filter((bus) => !term || `${bus.number} ${bus.route} ${bus.currentStop} ${bus.nextStop} ${bus.status}`.toLowerCase().includes(term));

    target.innerHTML = filtered
      .map(
        (bus) => `
          <div class="bus-card position-relative p-3">
            <div class="position-absolute top-0 start-0 h-100" style="width:4px;background:linear-gradient(180deg,var(--primary),var(--accent));border-radius:22px 0 0 22px;"></div>
            <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 ps-2">
              <div>
                <div class="bus-tag ${statusClass(bus.status)} mb-2">${statusLabel(bus.status)}</div>
                <h5 class="mb-1 fw-bold">${bus.number}</h5>
                <div class="muted">${bus.route}</div>
              </div>
              <div class="text-end">
                <div class="small-note">ETA</div>
                <div class="fs-4 fw-bold text-primary">${bus.eta} min</div>
                <div class="small-note">Speed ${bus.speed} km/h</div>
              </div>
            </div>
            <hr class="my-3">
            <div class="row g-3 small ps-2">
              <div class="col-md-6"><div class="muted">Current Stop</div><div class="fw-semibold">${bus.currentStop}</div></div>
              <div class="col-md-6"><div class="muted">Next Stop</div><div class="fw-semibold">${bus.nextStop}</div></div>
            </div>
            <div class="progress mt-3 ms-2" style="height:9px;"><div class="progress-bar" style="width:${bus.progress}%"></div></div>
            <div class="d-flex justify-content-between small-note mt-2 ps-2"><span>${bus.progress}% route completed</span><span class="badge-soft ${statusClass(bus.status)}">${statusLabel(bus.status)}</span></div>
            <div class="d-flex flex-wrap gap-2 mt-3 ps-2">
              <button class="btn btn-sm btn-primary" data-open-bus-modal="${bus.id}">Track Bus</button>
              <button class="btn btn-sm btn-outline-primary" data-toast="Tracking request sent for ${bus.number}.">Quick notify</button>
            </div>
          </div>
        `
      )
      .join("");

    if (table) {
      table.innerHTML = `
        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th>Bus</th>
                <th>Route</th>
                <th>Current Stop</th>
                <th>ETA</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filtered
                .map(
                  (bus) => `
                    <tr>
                      <td class="fw-semibold">${bus.number}</td>
                      <td>${bus.route}</td>
                      <td>${bus.currentStop}</td>
                      <td>${bus.eta} min</td>
                      <td><span class="bus-tag ${statusClass(bus.status)}">${statusLabel(bus.status)}</span></td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    }

    document.querySelectorAll("[data-open-bus-modal]").forEach((button) => {
      button.addEventListener("click", () => {
        const bus = getBusById(button.dataset.openBusModal);
        const modal = document.getElementById("busModal");
        if (!bus || !modal) return;
        modal.querySelector("[data-modal-title]").textContent = bus.number;
        modal.querySelector("[data-modal-body]").innerHTML = `
          <div class="row g-3">
            <div class="col-md-6"><div class="stat-card p-3 h-100"><div class="small-note">Route</div><div class="fw-bold">${bus.route}</div></div></div>
            <div class="col-md-6"><div class="stat-card p-3 h-100"><div class="small-note">Current stop</div><div class="fw-bold">${bus.currentStop}</div></div></div>
            <div class="col-md-6"><div class="stat-card p-3 h-100"><div class="small-note">Next stop</div><div class="fw-bold">${bus.nextStop}</div></div></div>
            <div class="col-md-6"><div class="stat-card p-3 h-100"><div class="small-note">ETA</div><div class="fw-bold">${bus.eta} min</div></div></div>
            <div class="col-12">
              <div class="progress" style="height:10px;"><div class="progress-bar" style="width:${bus.progress}%"></div></div>
              <div class="d-flex justify-content-between small-note mt-2"><span>Speed ${bus.speed} km/h</span><span>${bus.progress}% complete</span></div>
            </div>
          </div>
        `;
        bootstrap.Modal.getOrCreateInstance(modal).show();
      });
    });
  }

  function initDashboardInteractions() {
    document.querySelector("[data-dashboard-search]")?.addEventListener("input", (event) => {
      renderDashboardBuses(event.target.value);
    });

    document.querySelector("[data-refresh-dashboard]")?.addEventListener("click", async () => {
      try {
        const data = await api("/dashboard");
        if (data.stats) dashboardStats = data.stats;
        if (Array.isArray(data.buses)) hydrate(buses, data.buses);
        renderDashboardStats();
        renderDashboardBuses(document.querySelector("[data-dashboard-search]")?.value || "");
        toast("Dashboard values refreshed from the API.", "info");
      } catch (error) {
        toast("Unable to refresh dashboard from the API.", "danger");
      }
    });
  }

  function renderRoutesPage() {
    const target = document.querySelector("[data-routes]");
    if (!target) return;
    const filter = document.querySelector("[data-route-filter]")?.value.trim().toLowerCase() || "";
    const modal = document.getElementById("routeModal");
    const filtered = routes.filter((route) => {
      const text = `${route.number} ${route.name} ${route.start} ${route.destination} ${route.distance} ${route.duration} ${(route.stops || []).join(" ")}`.toLowerCase();
      return !filter || text.includes(filter);
    });

    target.innerHTML = filtered
      .map(
        (route) => `
          <div class="route-card p-4 h-100">
            <div class="badge-soft status-moving mb-3">${route.number}</div>
            <h5 class="fw-bold">${route.name}</h5>
            <p class="small-note">${route.start} to ${route.destination}</p>
            <div class="d-flex flex-wrap gap-2 my-3">
              <span class="badge-soft status-moving"><i class="bi bi-geo-alt"></i> ${route.stops?.length || 0} stops</span>
              <span class="badge-soft status-on-time"><i class="bi bi-clock"></i> ${route.duration}</span>
              <span class="badge-soft status-arriving"><i class="bi bi-graph-up"></i> ${route.distance}</span>
            </div>
            <div class="route-line mb-3"></div>
            <div class="timeline">
              ${(route.stops || [])
                .map(
                  (stop, index, arr) => `
                    <div class="timeline-step">
                      <div class="fw-semibold">${stop}</div>
                      <div class="small-note">${index === 0 ? "Start point" : index === arr.length - 1 ? "Destination" : "Intermediate stop"}</div>
                    </div>
                  `
                )
                .join("")}
            </div>
            <div class="d-flex justify-content-end mt-3">
              <button class="btn btn-sm btn-primary" data-view-route="${route.id}">View Route</button>
            </div>
          </div>
        `
      )
      .join("");

    document.querySelectorAll("[data-view-route]").forEach((button) => {
      button.addEventListener("click", () => {
        const route = getRouteById(button.dataset.viewRoute);
        if (!route || !modal) return;
        modal.querySelector("[data-modal-title]").textContent = route.name;
        modal.querySelector("[data-modal-body]").innerHTML = `
          <div class="row g-3">
            <div class="col-md-6"><div class="stat-card p-3 h-100"><div class="small-note">Route Number</div><div class="fw-bold">${route.number}</div></div></div>
            <div class="col-md-6"><div class="stat-card p-3 h-100"><div class="small-note">Distance</div><div class="fw-bold">${route.distance}</div></div></div>
            <div class="col-md-6"><div class="stat-card p-3 h-100"><div class="small-note">Starting Point</div><div class="fw-bold">${route.start}</div></div></div>
            <div class="col-md-6"><div class="stat-card p-3 h-100"><div class="small-note">Destination</div><div class="fw-bold">${route.destination}</div></div></div>
            <div class="col-12">
              <div class="timeline">
                ${(route.stops || [])
                  .map(
                    (stop, index, arr) => `
                      <div class="timeline-step">
                        <div class="fw-semibold">${stop}</div>
                        <div class="small-note">${index === 0 ? "Start" : index === arr.length - 1 ? "Destination" : "Stop " + index}</div>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            </div>
          </div>
        `;
        bootstrap.Modal.getOrCreateInstance(modal).show();
      });
    });
  }

  function initRouteInteractions() {
    const filter = document.querySelector("[data-route-filter]");
    if (filter) filter.addEventListener("input", renderRoutesPage);
  }

  function renderNotificationsPage() {
    const target = document.querySelector("[data-notifications]");
    if (!target) return;
    target.innerHTML = notifications
      .map(
        (note) => `
          <div class="notification-card p-3 ${note.read ? "opacity-75" : "unread"}" data-notification="${note.id}">
            <div class="d-flex align-items-start gap-3">
              <div class="notification-icon ${iconMap[note.type]?.[1] || "route"}"><i class="bi ${iconMap[note.type]?.[0] || "bi-bell"}"></i></div>
              <div class="flex-grow-1">
                <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
                  <div>
                    <div class="badge-soft badge-${note.tone} mb-2">${note.type}</div>
                    <h6 class="fw-bold mb-1">${note.title}</h6>
                    <p class="small-note mb-1">${note.description}</p>
                    <div class="small-note">${note.time}</div>
                  </div>
                  <div class="text-end">
                    <span class="badge ${note.read ? "text-bg-light" : "text-bg-primary"}">${note.read ? "Read" : "Unread"}</span>
                  </div>
                </div>
                <div class="mt-3 d-flex justify-content-end gap-2">
                  <button class="btn btn-sm btn-outline-primary" data-mark-read="${note.id}" ${note.read ? "disabled" : ""}>Mark as read</button>
                  <button class="btn btn-sm btn-outline-danger" data-delete-notification="${note.id}">Delete</button>
                </div>
              </div>
            </div>
          </div>
        `
      )
      .join("");
    renderUnreadBadges();
    renderNotificationSummary();
    bindNotificationInteractions();
  }

  function renderNotificationSummary() {
    const values = [notifications.length, countUnread(), notifications.filter((note) => note.tone === "delayed").length, notifications.filter((note) => note.type === "Announcement").length];
    document.querySelectorAll("[data-notification-summary]").forEach((node, index) => {
      node.textContent = values[index] ?? 0;
    });
  }

  function bindNotificationInteractions() {
    document.querySelectorAll("[data-mark-read]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await api(`/notifications/${button.dataset.markRead}`, {
            method: "PUT",
            body: JSON.stringify({ read: true }),
          });
          const data = await api("/notifications");
          if (Array.isArray(data.notifications)) hydrate(notifications, data.notifications);
          renderNotificationsPage();
          toast("Notification marked as read.", "success");
        } catch (error) {
          toast("Unable to update notification.", "danger");
        }
      });
    });

    document.querySelectorAll("[data-delete-notification]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await api(`/notifications/${button.dataset.deleteNotification}`, { method: "DELETE" });
          const data = await api("/notifications");
          if (Array.isArray(data.notifications)) hydrate(notifications, data.notifications);
          renderNotificationsPage();
          toast("Notification deleted.", "info");
        } catch (error) {
          toast("Unable to delete notification.", "danger");
        }
      });
    });

    document.querySelector("[data-mark-all]")?.addEventListener("click", async () => {
      try {
        await api("/notifications/mark-all-read", { method: "POST" });
        const data = await api("/notifications");
        if (Array.isArray(data.notifications)) hydrate(notifications, data.notifications);
        renderNotificationsPage();
        toast("All notifications marked as read.", "success");
      } catch (error) {
        toast("Unable to update notifications.", "danger");
      }
    });
  }

  function initPredictionForm() {
    const form = document.querySelector("[data-prediction-form]");
    const result = document.querySelector("[data-prediction-result]");
    if (!form || !result) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const data = await api("/predict-eta", {
          method: "POST",
          body: JSON.stringify({
            bus_id: form.bus.value,
            stop: form.stop.value,
            current_speed: Number(form.speed.value || 28),
            traffic_condition: form.traffic.value || "moderate",
          }),
        });
        const bus = data.bus || getBusById(form.bus.value);
        const prediction = data.prediction || {};
        const confidence = prediction.confidence || 0;
        const expected = prediction.expected_arrival_time ? new Date(prediction.expected_arrival_time) : new Date();
        result.innerHTML = `
          <div class="prediction-result-card">
            <div class="d-flex flex-wrap gap-2 mb-3">
              <span class="badge-soft status-moving">Estimated arrival</span>
              <span class="badge-soft status-on-time">Rule-based demo</span>
            </div>
            <div class="row g-3 align-items-center">
              <div class="col-lg-7">
                <div class="display-6 fw-bold mb-1">${prediction.eta_minutes || 0} Minutes</div>
                <div class="small-note mb-4">Expected Time: <span class="fw-bold text-dark">${expected.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
                <div class="row g-3">
                  <div class="col-md-4"><div class="stat-card"><div class="small-note">Status</div><div class="fw-bold ${statusClass(prediction.status)}">${prediction.status || "On Time"}</div></div></div>
                  <div class="col-md-4"><div class="stat-card"><div class="small-note">Bus</div><div class="fw-bold">${bus ? bus.number : "Selected bus"}</div></div></div>
                  <div class="col-md-4"><div class="stat-card"><div class="small-note">Stop</div><div class="fw-bold">${form.stop.value || "Selected stop"}</div></div></div>
                </div>
              </div>
              <div class="col-lg-5">
                <div class="confidence-ring mx-auto" style="--value:${confidence};">
                  <div>
                    <div class="small-note text-uppercase fw-semibold">Confidence</div>
                    <div class="display-6 fw-bold mb-0">${confidence}%</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div class="d-flex justify-content-between small fw-semibold mb-1"><span>Prediction confidence</span><span>${confidence}%</span></div>
              <div class="progress" style="height:11px;"><div class="progress-bar" style="width:${confidence}%"></div></div>
            </div>
            <div class="alert alert-info border-0 mt-4 mb-0">Simulated/rule-based ETA. This can later be replaced with an ML model.</div>
          </div>
        `;
        toast("ETA prediction generated from the API.", "success");
      } catch (error) {
        toast("Unable to generate ETA prediction.", "danger");
      }
    });
  }

  function initTrackingPage() {
    const busList = document.querySelector("[data-tracking-bus-list]");
    const tracker = document.querySelector("[data-tracker]");
    const details = document.querySelector("[data-tracking-details]");
    const search = document.querySelector("[data-tracking-search]");
    if (!busList || !tracker || !details) return;

    let selectedId = buses[0]?.id || null;

    const getSelected = () => getBusById(selectedId) || buses[0];

    const renderMap = () => {
      const selected = getSelected();
      if (!selected) {
        tracker.innerHTML = '<div class="p-4 text-center text-muted">No demo GPS data available.</div>';
        details.innerHTML = "";
        return;
      }
      const busPosition = selected.location || { x: 50, y: 50 };
      const route = getRouteById(selected.routeId || selected.route_id);
      const markers = (route?.stops || [])
        .map((stop, index, arr) => {
          const step = 70 / Math.max(arr.length - 1, 1);
          const x = 14 + step * index;
          const y = index % 2 === 0 ? 24 : 72;
          return `<div class="stop-marker" style="left:${x}%; top:${y}%;" title="${stop}"><span>${stop}</span></div>`;
        })
        .join("");

      tracker.innerHTML = `
        <div class="route-path" style="left: 12%; top: 64%; width: 72%; transform: rotate(-12deg);"></div>
        <div class="route-path" style="left: 16%; top: 28%; width: 68%; transform: rotate(14deg); opacity: 0.55;"></div>
        ${markers}
        <div class="bus-marker" style="left: calc(${busPosition.x}% - 29px); top: calc(${busPosition.y}% - 29px);"><span>🚌</span></div>
        <div class="map-legend">
          <div class="map-pill"><i class="bi bi-geo-alt text-primary"></i> Current location: ${selected.currentStop}</div>
          <div class="map-pill"><i class="bi bi-arrow-right-circle text-info"></i> Next stop: ${selected.nextStop}</div>
          <div class="map-pill"><i class="bi bi-stopwatch text-success"></i> ETA: ${selected.eta} min</div>
        </div>
      `;
      details.innerHTML = `
        <div class="stat-card p-3 mb-3">
          <div class="small-note">Selected bus</div>
          <div class="fs-4 fw-bold">${selected.number}</div>
          <div class="muted">${selected.route}</div>
        </div>
        <div class="row g-3">
          <div class="col-6"><div class="stat-card p-3 h-100"><div class="small-note">Current stop</div><div class="fw-bold">${selected.currentStop}</div></div></div>
          <div class="col-6"><div class="stat-card p-3 h-100"><div class="small-note">Next stop</div><div class="fw-bold">${selected.nextStop}</div></div></div>
          <div class="col-6"><div class="stat-card p-3 h-100"><div class="small-note">Speed</div><div class="fw-bold">${selected.speed} km/h</div></div></div>
          <div class="col-6"><div class="stat-card p-3 h-100"><div class="small-note">ETA</div><div class="fw-bold">${selected.eta} min</div></div></div>
        </div>
        <div class="mt-3">
          <div class="d-flex justify-content-between small fw-semibold mb-1"><span>Route progress</span><span>${selected.progress}%</span></div>
          <div class="progress" style="height:10px;"><div class="progress-bar" style="width:${selected.progress}%"></div></div>
        </div>
        <div class="mt-3"><span class="bus-tag ${statusClass(selected.status)}">${statusLabel(selected.status)}</span></div>
      `;
    };

    const renderBusList = (term = "") => {
      const filtered = buses.filter((bus) => !term || `${bus.number} ${bus.route} ${bus.currentStop} ${bus.nextStop} ${bus.status}`.toLowerCase().includes(term.toLowerCase()));
      busList.innerHTML = filtered
        .map(
          (bus) => `
            <button class="btn btn-light text-start border w-100 mb-2 ${bus.id === selectedId ? "border-primary" : ""}" data-select-bus="${bus.id}">
              <div class="d-flex justify-content-between align-items-start">
                <div><div class="fw-bold">${bus.number}</div><div class="small-note">${bus.route}</div></div>
                <span class="badge ${statusClass(bus.status)}">${statusLabel(bus.status)}</span>
              </div>
            </button>
          `
        )
        .join("");

      document.querySelectorAll("[data-select-bus]").forEach((button) => {
        button.addEventListener("click", () => {
          selectedId = button.dataset.selectBus;
          renderBusList(search?.value || "");
          renderMap();
          toast(`Tracking ${getSelected()?.number || "bus"}.`, "info");
        });
      });
    };

    const refreshTracking = async () => {
      try {
        const data = await api("/tracking");
        if (Array.isArray(data.buses)) {
          hydrate(buses, data.buses);
          if (selectedId && !getBusById(selectedId)) selectedId = buses[0]?.id || null;
          renderBusList(search?.value || "");
          renderMap();
        }
      } catch (error) {
        console.warn("Tracking refresh failed", error);
      }
    };

    search?.addEventListener("input", () => renderBusList(search.value));
    renderBusList();
    renderMap();
    refreshTracking();
    setInterval(refreshTracking, 5000);

    document.querySelector("[data-simulate-advance]")?.addEventListener("click", async () => {
      const selected = getSelected();
      if (!selected) return;
      try {
        await api(`/buses/${selected.id}`, {
          method: "PUT",
          body: JSON.stringify({
            current_stop: selected.currentStop,
            next_stop: selected.nextStop,
            speed: Math.min((selected.speed || 20) + 3, 45),
            eta: Math.max((selected.eta || 5) - 1, 1),
            progress_percent: Math.min((selected.progress || 0) + 4, 100),
            latitude: (selected.location?.x || 50) + 1.5,
            longitude: (selected.location?.y || 50) + 0.9,
            status: selected.status === "Offline" ? "On Time" : "Arriving",
          }),
        });
        await refreshTracking();
        toast(`${selected.number} advanced on the demo route.`, "success");
      } catch (error) {
        toast("Unable to advance the selected bus.", "danger");
      }
    });
  }

  function initHomeCtas() {
    document.querySelectorAll("[data-scroll-target]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = document.querySelector(button.dataset.scrollTarget);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function initUtilityButtons() {
    document.querySelectorAll("[data-toast]").forEach((button) => {
      button.addEventListener("click", () => {
        toast(button.dataset.toast || "Action completed.", button.dataset.toastTone || "primary");
      });
    });
  }

  function initHomeHero() {
    const busCount = document.querySelector("[data-hero-bus-count]");
    const routeCount = document.querySelector("[data-hero-route-count]");
    const unreadCount = document.querySelector("[data-hero-unread-count]");
    if (busCount) busCount.textContent = `${dashboardStats.active_buses || buses.length}+`;
    if (routeCount) routeCount.textContent = dashboardStats.total_routes || routes.length;
    if (unreadCount) unreadCount.textContent = countUnread();
  }

  async function initCommon() {
    setActiveNav();
    initUtilityButtons();
    initHomeCtas();
    initHomeHero();
    await loadServerState();
    fillSelects();
    renderUnreadBadges();
    initHomeHero();
  }

  async function init() {
    await initCommon();
    renderHomeStats();
    renderDashboardStats();
    renderDashboardBuses();
    initDashboardInteractions();
    renderRoutesPage();
    initRouteInteractions();
    renderNotificationsPage();
    renderNotificationSummary();
    bindNotificationInteractions();
    initPredictionForm();
    initTrackingPage();
  }

  return {
    buses,
    routes,
    notifications,
    statusClass,
    getBusById,
    getRouteById,
    routeStops,
    countUnread,
    toast,
    init,
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  if (window.BusApp) {
    window.BusApp.init();
  }
});

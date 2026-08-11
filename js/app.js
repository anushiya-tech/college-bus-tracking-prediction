window.BusApp = (() => {
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
    { id: "N1", type: "Delay Alert", title: "Bus CB-102 is delayed by 8 minutes", time: "2 min ago", read: false, tone: "delayed" },
    { id: "N2", type: "Arrival Alert", title: "Bus CB-104 will reach Sports Complex shortly", time: "8 min ago", read: false, tone: "on-time" },
    { id: "N3", type: "Route Update", title: "Route 3 has a temporary stop change at City Mall", time: "24 min ago", read: true, tone: "moving" },
    { id: "N4", type: "Announcement", title: "Extra college bus service available during exams", time: "1 hour ago", read: true, tone: "idle" },
    { id: "N5", type: "Delay Alert", title: "Bus CB-101 is slowing near Library Junction", time: "1 hour ago", read: false, tone: "delayed" },
  ];

  const trafficFactors = { light: 0.9, moderate: 1, heavy: 1.22, "peak-hour": 1.35 };

  function statusClass(status) {
    const key = status.toLowerCase();
    if (key.includes("delay")) return "status-delayed";
    if (key.includes("offline") || key.includes("idle")) return "status-idle";
    if (key.includes("arriv")) return "status-arriving";
    if (key.includes("move")) return "status-moving";
    return "status-on-time";
  }

  function statusLabel(status) {
    const key = status.toLowerCase();
    if (key.includes("delay")) return "Delayed";
    if (key.includes("offline") || key.includes("idle")) return "Offline";
    if (key.includes("arriv")) return "Arriving";
    if (key.includes("move")) return "Moving";
    return "On Time";
  }

  function routeStops(routeId) {
    const route = routes.find((r) => r.id === routeId);
    return route ? route.stops : [];
  }

  function getBusById(id) {
    return buses.find((bus) => bus.id === id);
  }

  function getRouteById(id) {
    return routes.find((route) => route.id === id);
  }

  function busOptions() {
    return buses.map((bus) => `<option value="${bus.id}">${bus.number} - ${bus.route}</option>`).join("");
  }

  function routeOptions() {
    return routes.map((route) => `<option value="${route.id}">${route.number} - ${route.name}</option>`).join("");
  }

  function trafficOptions() {
    return [["light", "Light Traffic"], ["moderate", "Moderate Traffic"], ["heavy", "Heavy Traffic"], ["peak-hour", "Peak Hour"]].map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  }

  function countUnread() {
    return notifications.filter((item) => !item.read).length;
  }

  function renderUnreadBadges() {
    document.querySelectorAll("[data-unread-count]").forEach((node) => {
      const unread = countUnread();
      node.textContent = unread;
      node.classList.toggle("d-none", unread === 0);
    });
  }

  function setActiveNav() {
    const page = document.body.dataset.page;
    document.querySelectorAll("[data-nav]").forEach((link) => {
      const matches = link.dataset.nav === page;
      link.classList.toggle("active", matches);
      if (matches) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function toast(message, tone = "primary") {
    const container = document.querySelector(".toast-container");
    if (!container) return;

    const id = `toast-${Date.now()}`;
    const bg = { primary: "text-bg-primary", success: "text-bg-success", warning: "text-bg-warning", danger: "text-bg-danger", info: "text-bg-info" }[tone] || "text-bg-primary";

    container.insertAdjacentHTML("beforeend", `
      <div id="${id}" class="toast align-items-center ${bg} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `);

    const node = document.getElementById(id);
    const toastInstance = bootstrap.Toast.getOrCreateInstance(node, { delay: 2400 });
    node.addEventListener("hidden.bs.toast", () => node.remove());
    toastInstance.show();
  }

  function renderHomeStats() {
    const stats = [["25+", "Active buses"], ["12", "Routes"], ["120+", "Daily trips"], ["98%", "On-time performance"]];
    document.querySelectorAll("[data-home-stat]").forEach((node, index) => {
      if (!stats[index]) return;
      node.querySelector(".value").textContent = stats[index][0];
      node.querySelector(".label").textContent = stats[index][1];
    });
  }

  function renderDashboardStats() {
    const values = [25, 20, 5, 12];
    const nodes = document.querySelectorAll("[data-dashboard-stat]");
    values.forEach((value, index) => {
      if (nodes[index]) nodes[index].textContent = value;
    });
  }

  function renderDashboardTable(list = buses) {
    const target = document.querySelector("[data-dashboard-table]");
    if (!target) return;
    target.innerHTML = `
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
            ${list.map((bus) => `
              <tr>
                <td class="fw-semibold">${bus.number}</td>
                <td>${bus.route}</td>
                <td>${bus.currentStop}</td>
                <td>${bus.eta} min</td>
                <td><span class="bus-tag ${statusClass(bus.status)}">${bus.status}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function bindBusModalTriggers() {
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
              <div class="progress" style="height: 10px;"><div class="progress-bar" style="width:${bus.progress}%"></div></div>
              <div class="d-flex justify-content-between small-note mt-2"><span>Speed ${bus.speed} km/h</span><span>${bus.progress}% complete</span></div>
            </div>
          </div>
        `;
        bootstrap.Modal.getOrCreateInstance(modal).show();
      });
    });
  }

  function renderDashboardBuses(filterText = "") {
    const target = document.querySelector("[data-dashboard-buses]");
    if (!target) return;

    const term = filterText.trim().toLowerCase();
    const filtered = buses.filter((bus) => !term || `${bus.number} ${bus.route} ${bus.currentStop} ${bus.nextStop} ${bus.status}`.toLowerCase().includes(term));

    target.innerHTML = filtered.map((bus, index) => `
      <div class="bus-card p-3 fade-in-up stagger-${(index % 5) + 1}">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-3">
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
        <div class="row g-3 small">
          <div class="col-md-6"><div class="muted">Current Stop</div><div class="fw-semibold">${bus.currentStop}</div></div>
          <div class="col-md-6"><div class="muted">Next Stop</div><div class="fw-semibold">${bus.nextStop}</div></div>
        </div>
        <div class="progress mt-3" style="height: 9px;"><div class="progress-bar" style="width:${bus.progress}%"></div></div>
        <div class="d-flex justify-content-between small-note mt-2"><span>${bus.progress}% route completed</span><span class="badge-soft ${statusClass(bus.status)}">${statusLabel(bus.status)}</span></div>
        <div class="d-flex flex-wrap gap-2 mt-3">
          <button class="btn btn-sm btn-primary" data-open-bus-modal="${bus.id}">Track Bus</button>
          <button class="btn btn-sm btn-outline-primary" data-toast="Tracking request sent for ${bus.number}.">Quick notify</button>
        </div>
      </div>
    `).join("");

    bindBusModalTriggers();
    renderDashboardTable(filtered);
  }

  function initDashboardSearch() {
    const input = document.querySelector("[data-dashboard-search]");
    if (!input) return;
    input.addEventListener("input", () => renderDashboardBuses(input.value));
  }

  function initDashboardRefresh() {
    const button = document.querySelector("[data-refresh-dashboard]");
    if (!button) return;
    button.addEventListener("click", () => {
      buses.forEach((bus) => {
        const drift = Math.round((Math.random() * 4 - 1.5) * 10) / 10;
        bus.eta = Math.max(2, Math.min(18, Math.round((bus.eta + drift + (Math.random() > 0.75 ? 1 : 0)) * 10) / 10));
        bus.progress = Math.max(5, Math.min(98, bus.progress + Math.floor(Math.random() * 7 - 2)));
        bus.speed = Math.max(18, Math.min(42, bus.speed + Math.floor(Math.random() * 7 - 2)));
      });
      renderDashboardStats();
      renderDashboardBuses(document.querySelector("[data-dashboard-search]")?.value || "");
      toast("Dashboard values refreshed with demo telemetry.", "info");
    });
  }

  function initRouteFilter() {
    const input = document.querySelector("[data-route-filter]");
    const target = document.querySelector("[data-routes]");
    const modal = document.getElementById("routeModal");
    if (!input || !target) return;

    const renderRoutes = () => {
      const term = input.value.trim().toLowerCase();
      const filtered = routes.filter((route) => {
        const haystack = `${route.number} ${route.name} ${route.start} ${route.destination} ${route.distance} ${route.duration} ${route.stops.join(" ")}`.toLowerCase();
        return !term || haystack.includes(term);
      });

      target.innerHTML = filtered.map((route, index) => `
        <div class="route-card p-3 fade-in-up stagger-${(index % 5) + 1}">
          <div class="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <div class="badge-soft status-moving mb-2">${route.number}</div>
              <h5 class="fw-bold mb-1">${route.name}</h5>
              <div class="muted">${route.start} to ${route.destination}</div>
            </div>
            <div class="text-end">
              <div class="small-note">Distance</div>
              <div class="fw-bold fs-5">${route.distance}</div>
              <div class="small-note">${route.duration}</div>
            </div>
          </div>
          <div class="d-flex flex-wrap gap-2 my-3">
            <span class="badge-soft status-moving"><i class="bi bi-geo-alt"></i> ${route.stops.length} stops</span>
            <span class="badge-soft status-on-time"><i class="bi bi-clock"></i> ${route.duration}</span>
          </div>
          <div class="route-line my-3"></div>
          <div class="timeline">
            ${route.stops.map((stop, stopIndex) => `
              <div class="timeline-step">
                <div class="fw-semibold">${stop}</div>
                <div class="small-note">${stopIndex === 0 ? "Start point" : stopIndex === route.stops.length - 1 ? "Destination" : "Intermediate stop"}</div>
              </div>
            `).join("")}
          </div>
          <div class="d-flex justify-content-end mt-3">
            <button class="btn btn-sm btn-primary" data-view-route="${route.id}">View Route</button>
          </div>
        </div>
      `).join("");

      document.querySelectorAll("[data-view-route]").forEach((button) => {
        button.addEventListener("click", () => {
          const route = routes.find((item) => item.id === button.dataset.viewRoute);
          if (!route || !modal) return;
          modal.querySelector("[data-modal-title]").textContent = route.name;
          modal.querySelector("[data-modal-body]").innerHTML = `
            <div class="row g-3">
              <div class="col-md-6"><div class="stat-card"><div class="small-note">Route Number</div><div class="fw-bold">${route.number}</div></div></div>
              <div class="col-md-6"><div class="stat-card"><div class="small-note">Distance</div><div class="fw-bold">${route.distance}</div></div></div>
              <div class="col-12">
                <div class="timeline">
                  ${route.stops.map((stop, stopIndex) => `
                    <div class="timeline-step">
                      <div class="fw-semibold">${stop}</div>
                      <div class="small-note">${stopIndex === 0 ? "Start" : stopIndex === route.stops.length - 1 ? "Destination" : "Stop ${stopIndex}"}</div>
                    </div>
                  `).join("")}
                </div>
              </div>
            </div>
          `;
          bootstrap.Modal.getOrCreateInstance(modal).show();
        });
      });
    };

    input.addEventListener("input", renderRoutes);
    renderRoutes();
  }

  function initHomeCtas() {
    document.querySelectorAll("[data-scroll-target]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = document.querySelector(button.dataset.scrollTarget);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        else if (button.dataset.href) window.location.href = button.dataset.href;
      });
    });
  }

  function initUtilityButtons() {
    document.querySelectorAll("[data-toast]").forEach((button) => {
      button.addEventListener("click", () => toast(button.dataset.toast || "Action completed.", button.dataset.toastTone || "primary"));
    });
  }

  function fillSelects() {
    document.querySelectorAll("[data-bus-select]").forEach((select) => {
      select.innerHTML = `<option value="">Select a bus</option>${busOptions()}`;
    });
    document.querySelectorAll("[data-route-select]").forEach((select) => {
      select.innerHTML = `<option value="">Select a route</option>${routeOptions()}`;
    });
    document.querySelectorAll("[data-stop-select]").forEach((select) => {
      const busId = select.dataset.busId;
      const routeId = select.dataset.routeId;
      let stops = [];
      if (busId && getBusById(busId)) stops = routeStops(getBusById(busId).routeId);
      else if (routeId) stops = routeStops(routeId);
      else stops = [...new Set(routes.flatMap((route) => route.stops))];
      select.innerHTML = `<option value="">Select a stop</option>${stops.map((stop) => `<option value="${stop}">${stop}</option>`).join("")}`;
    });
    document.querySelectorAll("[data-traffic-select]").forEach((select) => {
      select.innerHTML = trafficOptions();
    });
  }

  function initPageSpecificSelectSync() {
    document.querySelectorAll("[data-bus-select]").forEach((busSelect) => {
      busSelect.addEventListener("change", () => {
        const stopSelect = document.querySelector("[data-stop-select]");
        if (!stopSelect) return;
        const selectedBus = getBusById(busSelect.value);
        const stops = selectedBus ? routeStops(selectedBus.routeId) : [...new Set(routes.flatMap((route) => route.stops))];
        stopSelect.innerHTML = `<option value="">Select a stop</option>${stops.map((stop) => `<option value="${stop}">${stop}</option>`).join("")}`;
      });
    });
  }

  function renderNotifications() {
    const target = document.querySelector("[data-notifications]");
    if (!target) return;

    const iconMap = {
      "Delay Alert": ["bi-exclamation-triangle", "delay"],
      "Arrival Alert": ["bi-bus-front", "arrival"],
      "Route Update": ["bi-signpost-split", "route"],
      Announcement: ["bi-megaphone", "announcement"],
    };

    target.innerHTML = notifications.map((note, index) => `
      <div class="notification-card p-3 fade-in-up stagger-${(index % 5) + 1} ${note.read ? "opacity-75" : "unread"}" data-notification="${note.id}">
        <div class="d-flex align-items-start gap-3">
          <div class="notification-icon ${iconMap[note.type]?.[1] || "route"}">
            <i class="bi ${iconMap[note.type]?.[0] || "bi-bell"}"></i>
          </div>
          <div class="flex-grow-1">
            <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
              <div>
                <div class="badge-soft badge-${note.tone} mb-2">${note.type}</div>
                <h6 class="fw-bold mb-1">${note.title}</h6>
                <div class="small-note">${note.time}</div>
              </div>
              <div class="text-end">
                <span class="badge ${note.read ? "text-bg-light" : "text-bg-primary"}">${note.read ? "Read" : "Unread"}</span>
              </div>
            </div>
            <div class="mt-3 d-flex justify-content-end">
              <button class="btn btn-sm btn-outline-primary" data-mark-read="${note.id}" ${note.read ? "disabled" : ""}>Mark as read</button>
            </div>
          </div>
        </div>
      </div>
    `).join("");

    renderUnreadBadges();
    bindNotificationButtons();
  }

  function bindNotificationButtons() {
    document.querySelectorAll("[data-mark-read]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = notifications.find((note) => note.id === button.dataset.markRead);
        if (!item || item.read) return;
        item.read = true;
        renderNotifications();
        toast(`${item.type} marked as read.`, "success");
      });
    });

    document.querySelector("[data-mark-all]")?.addEventListener("click", () => {
      notifications.forEach((note) => (note.read = true));
      renderNotifications();
      toast("All notifications marked as read.", "success");
    });
  }

  function renderNotificationSummary() {
    const total = notifications.length;
    const unread = countUnread();
    const delayed = notifications.filter((n) => n.tone === "delayed").length;
    const announcements = notifications.filter((n) => n.type === "Announcement").length;
    const values = [total, unread, delayed, announcements];
    document.querySelectorAll("[data-notification-summary]").forEach((node, index) => {
      node.textContent = values[index];
    });
  }

  function initPredictionForm() {
    const form = document.querySelector("[data-prediction-form]");
    const result = document.querySelector("[data-prediction-result]");
    if (!form || !result) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const bus = getBusById(form.bus.value);
      const route = bus ? getRouteById(bus.routeId) : null;
      const traffic = form.traffic.value || "moderate";
      const speed = Number(form.speed.value || (bus ? bus.speed : 25));
      const baseEta = bus ? bus.eta : 10;
      const trafficMultiplier = trafficFactors[traffic] || 1;
      const stopBoost = form.stop.value && route && route.stops.indexOf(form.stop.value) > 1 ? 1.08 : 1;
      const predictedMinutes = Math.max(2, Math.round(baseEta * trafficMultiplier * stopBoost * (28 / Math.max(speed, 18))));
      const predictedTime = new Date(Date.now() + predictedMinutes * 60000);
      const confidence = Math.max(68, Math.min(97, Math.round(94 - (trafficMultiplier - 1) * 22 - Math.abs(speed - (bus ? bus.speed : speed)) * 0.8)));

      result.innerHTML = `
        <div class="prediction-result-card">
          <div class="row g-3 align-items-center">
            <div class="col-lg-7">
              <div class="d-flex flex-wrap gap-2 mb-3">
                <span class="badge-soft status-moving">Estimated arrival</span>
                <span class="badge-soft status-on-time">Simulated data</span>
              </div>
              <div class="display-6 fw-bold mb-1">${predictedMinutes} Minutes</div>
              <div class="small-note mb-4">Expected Time: <span class="fw-bold text-dark">${predictedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
              <div class="row g-3">
                <div class="col-md-4"><div class="stat-card"><div class="small-note">Status</div><div class="fw-bold ${predictedMinutes > 14 ? "text-danger" : "text-success"}">${predictedMinutes > 14 ? "Delayed" : "On Time"}</div></div></div>
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
            <div class="progress" style="height: 11px;"><div class="progress-bar" style="width:${confidence}%"></div></div>
          </div>
          <div class="alert alert-info border-0 mt-4 mb-0">Simulated/demo prediction data generated from the selected bus, stop, speed, and traffic condition.</div>
        </div>
      `;

      toast("ETA prediction generated from demo data.", "success");
    });
  }

  function initTrackingPage() {
    const busList = document.querySelector("[data-tracking-bus-list]");
    const tracker = document.querySelector("[data-tracker]");
    const details = document.querySelector("[data-tracking-details]");
    const search = document.querySelector("[data-tracking-search]");
    if (!busList || !tracker || !details) return;

    let selected = buses[0];

    const renderMap = () => {
      const busPosition = selected.location;
      const route = getRouteById(selected.routeId);
      const stopMarkers = (route?.stops || []).map((stop, index, arr) => {
        const step = 70 / Math.max(arr.length - 1, 1);
        const x = 14 + index * step;
        const y = index % 2 === 0 ? 24 : 72;
        return `<div class="stop-marker" style="left:${x}%; top:${y}%;" title="${stop}"><span>${stop}</span></div>`;
      }).join("");
      tracker.innerHTML = `
        <div class="route-path" style="left: 12%; top: 64%; width: 72%; transform: rotate(-12deg);"></div>
        <div class="route-path" style="left: 16%; top: 28%; width: 68%; transform: rotate(14deg); opacity: 0.55;"></div>
        ${stopMarkers}
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
          <div class="progress" style="height: 10px;"><div class="progress-bar" style="width:${selected.progress}%"></div></div>
        </div>
        <div class="mt-3"><span class="bus-tag ${statusClass(selected.status)}">${selected.status}</span></div>
      `;
    };

    const renderBusList = (term = "") => {
      const filtered = buses.filter((bus) => !term || `${bus.number} ${bus.route} ${bus.currentStop} ${bus.nextStop} ${bus.status}`.toLowerCase().includes(term.toLowerCase()));
      busList.innerHTML = filtered.map((bus) => `
        <button class="btn btn-light text-start border w-100 mb-2 ${bus.id === selected.id ? "border-primary" : ""}" data-select-bus="${bus.id}">
          <div class="d-flex justify-content-between align-items-start">
            <div><div class="fw-bold">${bus.number}</div><div class="small-note">${bus.route}</div></div>
            <span class="badge ${statusClass(bus.status)}">${statusLabel(bus.status)}</span>
          </div>
        </button>
      `).join("");

      document.querySelectorAll("[data-select-bus]").forEach((button) => {
        button.addEventListener("click", () => {
          selected = getBusById(button.dataset.selectBus) || selected;
          renderBusList(search?.value || "");
          renderMap();
          toast(`Tracking ${selected.number}.`, "info");
        });
      });
    };

    search?.addEventListener("input", () => renderBusList(search.value));
    renderBusList();
    renderMap();

    setInterval(() => {
      buses.forEach((bus) => {
        bus.location.x = Math.max(8, Math.min(86, bus.location.x + (Math.random() * 4 - 2)));
        bus.location.y = Math.max(10, Math.min(82, bus.location.y + (Math.random() * 4 - 2)));
        bus.progress = Math.max(0, Math.min(100, bus.progress + Math.round(Math.random() * 2)));
        bus.eta = Math.max(1, bus.eta + Math.round(Math.random() * 2 - 1));
      });
      selected = getBusById(selected.id) || selected;
      renderMap();
      renderBusList(search?.value || "");
    }, 5000);

    document.querySelector("[data-simulate-advance]")?.addEventListener("click", () => {
      selected.location.x = Math.max(8, Math.min(86, selected.location.x + 3));
      selected.location.y = Math.max(10, Math.min(82, selected.location.y + 1.5));
      selected.progress = Math.min(100, selected.progress + 4);
      selected.eta = Math.max(1, selected.eta - 1);
      renderMap();
      renderBusList(search?.value || "");
      toast(`${selected.number} advanced on the demo route.`, "success");
    });
  }

  function initHomeHero() {
    const busCount = document.querySelector("[data-hero-bus-count]");
    const routeCount = document.querySelector("[data-hero-route-count]");
    const unreadCount = document.querySelector("[data-hero-unread-count]");
    if (busCount) busCount.textContent = buses.length;
    if (routeCount) routeCount.textContent = routes.length;
    if (unreadCount) unreadCount.textContent = countUnread();
  }

  function initCommon() {
    setActiveNav();
    fillSelects();
    renderUnreadBadges();
    initUtilityButtons();
    initHomeCtas();
    initHomeHero();
  }

  function init() {
    initCommon();
    renderHomeStats();
    renderDashboardStats();
    renderDashboardBuses();
    initDashboardSearch();
    initDashboardRefresh();
    initRouteFilter();
    renderNotifications();
    renderNotificationSummary();
    initPredictionForm();
    initPageSpecificSelectSync();
    initTrackingPage();
  }

  return { buses, routes, notifications, statusClass, getBusById, getRouteById, routeStops, countUnread, toast, init };
})();

document.addEventListener("DOMContentLoaded", () => {
  if (window.BusApp) window.BusApp.init();
});

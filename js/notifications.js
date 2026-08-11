document.addEventListener("DOMContentLoaded", () => {
  const note = document.querySelector("[data-notifications-note]");
  if (note) note.textContent = "Notification badges update live in the browser using demo data.";
});

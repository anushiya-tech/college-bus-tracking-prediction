document.addEventListener("DOMContentLoaded", () => {
  const note = document.querySelector("[data-prediction-note]");
  if (note) note.textContent = "This prediction uses simulated demo data only. No backend, GPS feed, or ML model is involved.";
});

// Theme management
const THEMES = ["dark", "light", "ocean", "forest", "sunset"];

function applyTheme(theme) {
  if (!THEMES.includes(theme)) theme = "dark";
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("yt-theme", theme);
  const picker = document.getElementById("themePicker");
  if (picker) picker.value = theme;
}

// Apply saved theme on every page load
(function () {
  const saved = localStorage.getItem("yt-theme") || "dark";
  applyTheme(saved);
})();

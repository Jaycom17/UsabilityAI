document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("theme-toggle");
  const body = document.body;

  // Cargar tema guardado (si hay)
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    body.classList.add("dark");
    toggle.checked = false;
  }

  toggle.addEventListener("change", () => {
    if (toggle.checked) {
      body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  });

  const startButton = document.getElementById("start-button");
  startButton.addEventListener("click", async () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "INJECT_AXE" });
    });

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Scroll al tope primero
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.scrollTo({ top: 0, behavior: "instant" }),
    });

    chrome.runtime.sendMessage(
      { action: "START_CAPTURE", tabId: tab.id }, (response) => {
        if (response === "ok") {
          console.log("Tarea terminada");
        } else {
          console.error("Error al iniciar la captura:");
        }
      }
    );
  });
});

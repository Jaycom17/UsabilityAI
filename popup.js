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

  showOverlay("loading");

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
        console.log(response);
        showOverlay("success");
        if (response === "ok") {
          console.log("Tarea terminada");
        } else {
          console.error("Error al iniciar la captura:");
        }
      }
    );
  });
});


function showOverlay(type) {
  document.getElementById("loading-screen").classList.add("hidden");
  document.getElementById("success-screen").classList.add("hidden");
  document.getElementById("error-screen").classList.add("hidden");

  switch (type) {
    case "loading":
      document.getElementById("loading-screen").classList.remove("hidden");
      break;
    case "success":
      document.getElementById("success-screen").classList.remove("hidden");
      break;
    case "error":
      document.getElementById("error-screen").classList.remove("hidden");
      break;
  }
}

function closeOverlay() {
  showOverlay(""); // Oculta todo
}

function retry() {
  closeOverlay();
  document.getElementById("start-button").click(); // Vuelve a intentar
}

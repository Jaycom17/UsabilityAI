// 1. Escuchar los resultados
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data.type === "AXE_RESULTS") {
    console.log("Axe results received:", event.data.data);

    chrome.storage.local.set({ axeResults: event.data.data });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "INJECT_AXE") {
    const axeScript = document.createElement("script");
    axeScript.src = chrome.runtime.getURL("libs/axe.min.js");
    axeScript.onload = () => {
      const runnerScript = document.createElement("script");
      runnerScript.src = chrome.runtime.getURL("scripts/axe-runner.js");
      document.documentElement.appendChild(runnerScript);
    };
    document.documentElement.appendChild(axeScript);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GET_DIMENSIONS") {
    sendResponse({
      totalHeight: document.body.scrollHeight,
      viewportHeight: window.innerHeight,
    });
  }

  if (message.action === "STITCH_IMAGES") {
    const { screenshots } = message;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = screenshots[screenshots.length - 1].y + window.innerHeight;

    let loaded = 0;
    let hasError = false;

    const timeout = setTimeout(() => {
      if (!hasError && loaded < screenshots.length) {
        console.error("Timeout: No todas las imágenes se cargaron.");
      }
    }, 10000); // max 5 segundos de espera

    screenshots.forEach((shot) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(
          img,
          0,
          shot.y,
          canvas.width,
          (canvas.width * img.height) / img.width
        );
        loaded++;

        if (loaded === screenshots.length) {
          clearTimeout(timeout);
          const finalUrl = canvas.toDataURL("image/png");

          canvas.toBlob(
            (blob) => {
              chrome.storage.local.get(["axeResults"], (result) => {
                const axeResults = result.axeResults || {};

                const formData = new FormData();
                formData.append(
                  "website",
                  axeResults.url || window.location.href
                );
                formData.append(
                  "axeContext",
                  JSON.stringify(axeResults.violations || [])
                );
                formData.append("screenshot", blob, "screenshot.jpg"); // blob con nombre

                fetch("http://localhost:3000/axeContext/process", {
                  method: "POST",
                  body: formData,
                })
                  .then((res) => res.json())
                  .then((data) => {
                    console.log("Datos enviados al backend:", data);
                    sendResponse("ok");
                  })
                  .catch((err) => {
                    console.error("Error al enviar datos:", err);
                    sendResponse(null);
                  });
              });
            },
            "image/jpeg",
            0.8
          ); // tipo, calidad
        }
      };
      img.onerror = (e) => {
        hasError = true;
        console.error("Error al cargar imagen:", shot.dataUrl, e);
        clearTimeout(timeout);
      };
      img.src = shot.dataUrl;
    });

    return true;
  }
});

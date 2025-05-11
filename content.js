// 1. Escuchar los resultados
window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  if (event.data.type === 'AXE_RESULTS') {
    sendResultsToBackend(event.data.data);
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
  if (message.action === 'GET_DIMENSIONS') {
    sendResponse({
      totalHeight: document.body.scrollHeight,
      viewportHeight: window.innerHeight,
    });
  }

  if (message.action === 'STITCH_IMAGES') {
    const { screenshots } = message;
  
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
  
    canvas.width = window.innerWidth;
    canvas.height = screenshots[screenshots.length - 1].y + window.innerHeight;
  
    let loaded = 0;
  
    screenshots.forEach((shot, i) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, shot.y);
        loaded++;
  
        if (loaded === screenshots.length) {
          const finalUrl = canvas.toDataURL("image/png");
          sendResponse(finalUrl); // << Aquí se devuelve correctamente
        }
      };
      img.onerror = (e) => {
        console.error("Error al cargar imagen:", shot.dataUrl, e);
      };
      img.src = shot.dataUrl;
    });
  
    return true; // IMPORTANTE para usar sendResponse de forma asíncrona
  }
});




//funcion para enviar los resultados al backend
function sendResultsToBackend(results) {
  fetch('http://localhost:3000/axeContext/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({website: results.url, axeContext: results.violations})
  })
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch((error) => console.error('Error:', error));
}
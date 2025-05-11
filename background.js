chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "START_CAPTURE") {
    chrome.tabs.sendMessage(
      message.tabId,
      { action: "GET_DIMENSIONS" },
      async (dim) => {
        const totalHeight = dim.totalHeight;
        const viewportHeight = dim.viewportHeight;
        const tabId = message.tabId;

        const screenshots = [];
        let scrollY = 0;

        while (scrollY < totalHeight) {
          await chrome.scripting.executeScript({
            target: { tabId },
            func: (y) => window.scrollTo(0, y),
            args: [scrollY],
          });

          // Espera a que el navegador renderice después del scroll
          await new Promise((r) => setTimeout(r, 800)); // <- aumentamos el delay

          // Captura la imagen visible
          const dataUrl = await new Promise((resolve) => {
            chrome.tabs.captureVisibleTab(null, { format: "png" }, (url) => {
              resolve(url); // puede ser null si aún no se renderizó
            });
          });

          if (!dataUrl) {
            console.error(`Fallo en captura en scrollY=${scrollY}`);
            return sendResponse(null); // o seguir si quieres ignorar errores
          }

          screenshots.push({ y: scrollY, dataUrl });
          scrollY += viewportHeight;
        }

        // Unir imágenes
        chrome.tabs.sendMessage(
          tabId,
          { action: "STITCH_IMAGES", screenshots },
          (finalUrl) => {
            if (!finalUrl) {
              console.error("No se recibió finalUrl");
            } else {
              sendResponse("ok");
            }
          }
        );
      }
    );

    return true;
  }
});

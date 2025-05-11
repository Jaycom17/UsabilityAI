chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'START_CAPTURE') {
      chrome.tabs.sendMessage(message.tabId, { action: 'GET_DIMENSIONS' }, async (dim) => {
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
  
          await new Promise(r => setTimeout(r, 300));
  
          const dataUrl = await new Promise((resolve) => {
            chrome.tabs.captureVisibleTab(null, { format: 'png' }, resolve);
          });
  
          screenshots.push({ y: scrollY, dataUrl });
          scrollY += viewportHeight;
        }
  
        // Unir imágenes
        chrome.tabs.sendMessage(tabId, { action: 'STITCH_IMAGES', screenshots }, (finalUrl) => {
            if (!finalUrl) {
              console.error("No se recibió finalUrl");
            } else {
              sendResponse(finalUrl);
            }
          });
      });
  
      return true;
    }
  });
  
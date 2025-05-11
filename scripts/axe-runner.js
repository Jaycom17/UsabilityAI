axe
  .run(document, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa"],
    },
  })
  .then((results) => {
    window.postMessage({ type: "AXE_RESULTS", data: results }, "*");
  });

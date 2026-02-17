// Content script that adds a floating "Capture" button on supported job platforms

(function() {
  // Don't inject if already present
  if (document.getElementById("jobio-capture-btn")) return;

  const button = document.createElement("button");
  button.id = "jobio-capture-btn";
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
    Jobio
  `;
  button.title = "Capturer cette mission dans Jobio";

  button.addEventListener("click", () => {
    // Send message to open popup - since we can't open popup from content script,
    // we redirect to the extension popup
    chrome.runtime.sendMessage({ action: "openPopup" });
  });

  document.body.appendChild(button);
})();

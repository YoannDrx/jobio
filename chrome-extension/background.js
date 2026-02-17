// Background service worker
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "openPopup") {
    // Can't programmatically open popup in Manifest V3
    // The user must click the extension icon
    // We can show a notification instead
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#22d3ee" });

    // Clear badge after 3 seconds
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "" });
    }, 3000);
  }
});

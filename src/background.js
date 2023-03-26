var contentScriptReady = false;
async function handleTabEvent(tabId) {
  chrome.storage.sync.get("extensionEnabled", (items) => {
    if (items.extensionEnabled) {
        chrome.tabs.sendMessage(tabId, { command: "start" });
    } else {
      // Send a message to the content script to stop reading assistant
      chrome.tabs.sendMessage(tabId, { command: "stop" }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn(
            "Content script not found on this page:",
            chrome.runtime.lastError.message
          );
        }
      });
    }
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ extensionEnabled: false });
});
chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.message === "contentScriptReady") {
      contentScriptReady = true;
    handleTabEvent(sender.tab.id);
  }

});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete" && contentScriptReady) {
    handleTabEvent(tabId);
  }
});
chrome.tabs.onActivated.addListener((activeInfo) => {
    if (contentScriptReady) {
        handleTabEvent(activeInfo.tabId);
    }
});
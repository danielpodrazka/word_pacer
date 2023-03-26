var extensionEnabled;


function updateEnabledState() {
    chrome.storage.sync.get("extensionEnabled", (items) => {
        if (items.extensionEnabled !== undefined) {
            extensionEnabled = items.extensionEnabled;
            document.getElementById("startStopButton").innerText = extensionEnabled ? "Stop" : "Start";
        }
    });
}

function setEnabledState(enabled) {
    extensionEnabled = enabled;
    chrome.storage.sync.set({"extensionEnabled": extensionEnabled});
    updateEnabledState();
}


document.addEventListener("DOMContentLoaded", () => {
    updateEnabledState();

    // Load stored settings
    chrome.storage.sync.get(["wordsPerMinute", "timeBeforeScrolling"], (items) => {
        if (items.wordsPerMinute) {
            document.getElementById("wordsPerMinute").value = items.wordsPerMinute;
        }
        if (items.timeBeforeScrolling) {
            document.getElementById("timeBeforeScrolling").value = items.timeBeforeScrolling;
        }
    });
    // Update wordsPerMinute from input
    document.getElementById("wordsPerMinute").addEventListener("change", (e) => {
        chrome.storage.sync.set({wordsPerMinute: parseInt(e.target.value)});
    });
    // Update timeBeforeScrolling from input
    document.getElementById("timeBeforeScrolling").addEventListener("change", (e) => {
        chrome.storage.sync.set({timeBeforeScrolling: parseInt(e.target.value)});
    });
    // Start or stop the extension
    document.getElementById("startStopButton").addEventListener("click", () => {
        setEnabledState(!extensionEnabled); // Toggle the enabled state
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const details = {
                target: {tabId: tabs[0].id},
                function: (params) => {
                    if (params.enabled) {
                        startReadingAssistant();
                    } else {
                        stopReadingAssistant();
                    }
                },
                args: [{enabled: extensionEnabled}],
            };
            chrome.scripting.executeScript(details);
        });
    });
});


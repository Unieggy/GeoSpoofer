// State management keys
const STATE_KEY = 'spoofState';

// Initialize state structure
const defaultState = {
  isActive: false,
  targetTabId: null,
  coordinates: null,
  lastUpdated: null
};

// Get current state from storage
async function getState() {
  const result = await chrome.storage.local.get(STATE_KEY);
  return result[STATE_KEY] || { ...defaultState };
}

// Save state to storage
async function saveState(state) {
  await chrome.storage.local.set({ [STATE_KEY]: state });
}

// Clear state
async function clearState() {
  await saveState({ ...defaultState });
}

// Attach debugger and set geolocation override
async function attachDebugger(tabId, coords) {
  return new Promise((resolve, reject) => {
    // First check if tab exists
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        reject(new Error(`Tab not found: ${chrome.runtime.lastError.message}`));
        return;
      }

      chrome.debugger.attach({ tabId }, "1.3", () => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Debugger attach failed: ${chrome.runtime.lastError.message}`));
          return;
        }

        chrome.debugger.sendCommand(
          { tabId },
          "Emulation.setGeolocationOverride",
          {
            latitude: coords.lat,
            longitude: coords.lng,
            accuracy: 100
          },
          () => {
            if (chrome.runtime.lastError) {
              reject(new Error(`Geolocation override failed: ${chrome.runtime.lastError.message}`));
              return;
            }
            resolve();
          }
        );
      });
    });
  });
}

// Detach debugger safely
async function detachDebugger(tabId) {
  return new Promise((resolve) => {
    if (!tabId) {
      resolve();
      return;
    }

    chrome.debugger.detach({ tabId }, () => {
      if (chrome.runtime.lastError) {
        console.log(`Debugger detach note: ${chrome.runtime.lastError.message}`);
      }
      resolve();
    });
  });
}

// Stop spoofing - detach debugger and clear state
async function stopSpoofing() {
  const state = await getState();

  if (state.targetTabId) {
    await detachDebugger(state.targetTabId);
  }

  await clearState();
}

// Parse coordinates from Google Maps URL
function parseCoordinatesFromUrl(url) {
  // Handle various Google Maps URL patterns:
  // /@lat,lng,zoom
  // /@lat,lng/
  // /place/.../@lat,lng
  const pattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)(?:,|\/|$)/;
  const match = url.match(pattern);

  if (match) {
    return {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2])
    };
  }
  return null;
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Start location selection - open Google Maps
  if (message.type === "START_SELECTION") {
    const targetTabId = message.targetTabId;

    // Store target tab temporarily
    chrome.storage.local.set({ pendingTargetTabId: targetTabId }, () => {
      chrome.tabs.create({ url: "https://www.google.com/maps" });
    });

    return true;
  }

  // User selected coordinates from Google Maps
  if (message.type === "COORDS_SELECTED") {
    (async () => {
      try {
        const { lat, lng } = message;
        console.log(`Received coords: ${lat}, ${lng}`);

        // Get pending target tab
        const { pendingTargetTabId } = await chrome.storage.local.get('pendingTargetTabId');

        if (!pendingTargetTabId) {
          console.error("No target tab stored");
          return;
        }

        // Close the Google Maps picker tab
        if (sender.tab && sender.tab.id) {
          chrome.tabs.remove(sender.tab.id).catch(() => {});
        }

        // Attach debugger and set geolocation
        await attachDebugger(pendingTargetTabId, { lat, lng });

        // Save active state
        await saveState({
          isActive: true,
          targetTabId: pendingTargetTabId,
          coordinates: { lat, lng },
          lastUpdated: Date.now()
        });

        // Clear pending tab
        await chrome.storage.local.remove('pendingTargetTabId');

        // Reload target tab to apply new location
        chrome.tabs.reload(pendingTargetTabId);

        console.log("Spoofing active!");
      } catch (error) {
        console.error("Error setting up spoofing:", error);
        await clearState();
      }
    })();

    return true;
  }

  // User cancelled selection
  if (message.type === "CANCEL_SELECTION") {
    (async () => {
      // Close the Google Maps tab
      if (sender.tab && sender.tab.id) {
        chrome.tabs.remove(sender.tab.id).catch(() => {});
      }

      // Clear pending target
      await chrome.storage.local.remove('pendingTargetTabId');
    })();

    return true;
  }

  // Stop spoofing request
  if (message.type === "STOP_SPOOFING") {
    (async () => {
      await stopSpoofing();
      sendResponse({ success: true });
    })();

    return true;
  }

  // Get current state
  if (message.type === "GET_STATE") {
    (async () => {
      const state = await getState();
      sendResponse(state);
    })();

    return true;
  }
});

// Clean up when debugger is detached (e.g., tab closed, user pressed stop)
chrome.debugger.onDetach.addListener(async (source, reason) => {
  console.log(`Debugger detached from tab ${source.tabId}, reason: ${reason}`);

  const state = await getState();

  if (state.targetTabId === source.tabId) {
    await clearState();
  }
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const state = await getState();

  if (state.targetTabId === tabId) {
    await clearState();
  }
});

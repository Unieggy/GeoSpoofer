// DOM elements
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const coordsSection = document.getElementById('coordsSection');
const latValue = document.getElementById('latValue');
const lngValue = document.getElementById('lngValue');
const pickLocationBtn = document.getElementById('pickLocationBtn');
const stopSpoofingBtn = document.getElementById('stopSpoofingBtn');

// Update UI based on state
function updateUI(state) {
  if (state.isActive && state.coordinates) {
    // Active state
    statusDot.classList.add('active');
    statusText.textContent = 'Active';
    coordsSection.classList.remove('hidden');
    latValue.textContent = state.coordinates.lat.toFixed(6);
    lngValue.textContent = state.coordinates.lng.toFixed(6);
    stopSpoofingBtn.classList.remove('hidden');
  } else {
    // Inactive state
    statusDot.classList.remove('active');
    statusText.textContent = 'Inactive';
    coordsSection.classList.add('hidden');
    latValue.textContent = '-';
    lngValue.textContent = '-';
    stopSpoofingBtn.classList.add('hidden');
  }
}

// Load current state on popup open
async function loadState() {
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
    if (chrome.runtime.lastError) {
      console.error('Error getting state:', chrome.runtime.lastError);
      return;
    }
    updateUI(state || { isActive: false });
  });
}

// Pick location button handler
pickLocationBtn.addEventListener('click', async () => {
  // Get current active tab (the one to spoof)
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Send message to background to start selection flow
  chrome.runtime.sendMessage({
    type: 'START_SELECTION',
    targetTabId: currentTab.id
  });

  // Close popup
  window.close();
});

// Stop spoofing button handler
stopSpoofingBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'STOP_SPOOFING' }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error stopping spoofing:', chrome.runtime.lastError);
      return;
    }
    updateUI({ isActive: false });
  });
});

// Listen for state changes from background
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.spoofState) {
    updateUI(changes.spoofState.newValue || { isActive: false });
  }
});

// Initialize
loadState();

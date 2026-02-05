// Inject styles for the UI components
const styles = document.createElement('style');
styles.textContent = `
  .mapspoofer-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 10000;
    display: flex;
    gap: 12px;
    align-items: center;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .mapspoofer-fab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 24px;
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: white;
    font-size: 15px;
    font-weight: 600;
    border: none;
    border-radius: 50px;
    box-shadow: 0 4px 14px rgba(34, 197, 94, 0.4);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .mapspoofer-fab:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(34, 197, 94, 0.5);
  }

  .mapspoofer-fab:active {
    transform: translateY(0);
  }

  .mapspoofer-cancel {
    padding: 14px 20px;
    background: #f1f5f9;
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
    border: none;
    border-radius: 50px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .mapspoofer-cancel:hover {
    background: #e2e8f0;
    color: #475569;
  }

  .mapspoofer-toast {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: #22c55e;
    color: white;
    padding: 14px 28px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 500;
    box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 10001;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .mapspoofer-toast.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
`;
document.head.appendChild(styles);

// Create container
const container = document.createElement('div');
container.className = 'mapspoofer-container';

// Create FAB button
const spoofBtn = document.createElement('button');
spoofBtn.className = 'mapspoofer-fab';
spoofBtn.innerHTML = '<span>Spoof Here</span>';

// Create cancel button
const cancelBtn = document.createElement('button');
cancelBtn.className = 'mapspoofer-cancel';
cancelBtn.textContent = 'Cancel';

// Create toast
const toast = document.createElement('div');
toast.className = 'mapspoofer-toast';
toast.textContent = 'Location selected! Redirecting...';

// Add elements to DOM
container.appendChild(cancelBtn);
container.appendChild(spoofBtn);
document.body.appendChild(container);
document.body.appendChild(toast);

// Show toast notification
function showToast() {
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

// Parse coordinates from URL
function getCoordinatesFromUrl() {
  const url = window.location.href;

  // Enhanced regex for various Google Maps URL patterns:
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

// Handle spoof button click
spoofBtn.addEventListener('click', () => {
  const coords = getCoordinatesFromUrl();

  if (coords) {
    showToast();

    // Send coordinates to background script
    chrome.runtime.sendMessage({
      type: "COORDS_SELECTED",
      lat: coords.lat,
      lng: coords.lng
    });
  } else {
    // Show error if coordinates not found
    const originalText = spoofBtn.innerHTML;
    spoofBtn.innerHTML = '<span>Move the map first</span>';
    spoofBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    spoofBtn.style.boxShadow = '0 4px 14px rgba(239, 68, 68, 0.4)';

    setTimeout(() => {
      spoofBtn.innerHTML = originalText;
      spoofBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
      spoofBtn.style.boxShadow = '0 4px 14px rgba(34, 197, 94, 0.4)';
    }, 2000);
  }
});

// Handle cancel button click
cancelBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({
    type: "CANCEL_SELECTION"
  });
});

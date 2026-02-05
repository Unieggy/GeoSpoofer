# MapSpoofer

MapSpoofer is a Chrome Extension that allows users to spoof their geolocation on any active tab. It provides a user interface to select a location directly from Google Maps and automatically overrides the browser's sensor data.

## Features

* **Visual Selection:** Pick a location using the Google Maps interface.
* **Automatic Spoofing:** Injects coordinates and overrides the browser geolocation sensors.
* **State Persistence:** Remembers the active state and coordinates even when the popup is closed.
* **Auto-Reload:** Automatically refreshes the target page to apply the new location.

## Installation

This extension is not in the Chrome Web Store and must be installed in Developer Mode.

1.  Download the source code or create a folder named `MapSpoofer` containing the extension files.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode** in the top right corner.
4.  Click **Load unpacked**.
5.  Select the `MapSpoofer` folder.

## How to Use

1.  Navigate to the website you want to spoof.
2.  Click the MapSpoofer extension icon in the toolbar.
3.  Click **Pick Location**. This opens Google Maps in a new tab.
4.  Drag the map to center your desired location.
5.  Click the **Spoof Here** button at the bottom of the map.
6.  The map tab will close, and your target website will reload with the new location.

## Limitations

* **Warning Bar:** When active, Chrome displays a "Started debugging this browser" warning bar. This is a mandatory security feature for extensions using the debugger API.
* **Inspect Element:** Opening Chrome DevTools (Inspect Element) on the target tab will disconnect the spoofer, as Chrome only allows one debugger instance at a time.

## License

This project is open source.
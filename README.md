# Web2PC

Web2PC is a project that allows you to control your computer directly from your phone's web browser over your local network. It consists of a Python FastAPI backend that executes commands on the machine and a React/Vite frontend that provides a mobile-friendly user interface.

## 🚀 Done Tasks

- **Basic Backend Setup:** Created a FastAPI server (`app.py`) to handle API requests.
- **Frontend App:** Built a React/Vite app to interact with the backend APIs.
- **PIN Authentication:** Implemented a secure PIN system to prevent unauthorized access. The backend generates a 4-digit PIN upon startup and displays a QR Code in the terminal.
- **Dynamic IP Binding:** Updated backend to bind dynamically to the local IP network address (0.0.0.0).
- **System Controls:** Added support for Sleep and Lock actions (`pmset` and `osascript`).
- **Media & Volume Controls:** Added endpoints for Volume (Up, Down, Mute) and Media (Play/Pause, Next, Prev) using `osascript`.
- **Application Management:** Implemented searching, launching, and closing Mac applications.
- **Terminal Integration:** Added the ability to run raw terminal commands from the web UI.
- **Mouse Control:** Added endpoints for moving the cursor, scrolling, and clicking using `pyautogui`.
- **Typing Simulation Update:** Modified the keyboard typing action to paste and type strings word-by-word, creating a more realistic typing experience.

## 📝 Plan to Develop Later

- **Cross-Platform Support:** Currently, many system commands (like Volume, Media, and App Launching) use macOS-specific `osascript` or `pmset`. Expand support to Windows and Linux systems.
- **HTTPS & Security:** Configure SSL/TLS to run the server over HTTPS, securing the PIN and command traffic from local network sniffing.
- **Clipboard Syncing:** Add a feature to quickly sync clipboard text between the phone and the PC.
- **File Transfer:** Implement drag-and-drop file sharing from the phone directly to the PC's Downloads folder.
- **Custom Shortcuts & Macros:** Allow users to define custom bash scripts or macros that can be triggered via a single button on the web interface.
- **Wake-on-LAN (WoL):** Support waking the computer up remotely before attempting to connect.
- **System Monitor Stats:** Display CPU, RAM, and Battery statistics directly on the mobile frontend.

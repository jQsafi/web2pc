# Project Guidelines (Web2PC)

This file contains rules and context for the AI agent working on this project.

## Stack Overview
- **Backend:** Python (FastAPI, uvicorn), using libraries like `pyautogui` and `pyperclip` for system control. Resides in the `python-backend/` directory.
- **Frontend:** React (Vite), using `axios` for API calls and `lucide-react` for icons. Resides in the `frontend/` directory.

## Running the Servers
- **Backend:** Navigate to `python-backend/`, activate the virtual environment (`venv/bin/activate`), and run `python app.py`. It runs on port 5001.
- **Frontend:** Navigate to `frontend/`, and run `npm run dev` (which executes `vite --host`). It typically runs on port 5173.

## Core Mechanics
- **Authentication:** The backend generates a random 4-digit PIN on startup, prints it as a QR code, and requires it in the `x-pin` header for all API requests.
- **System Interactions:** Currently optimized for **macOS** (using `osascript` for media/volume/app control, and `pmset` for sleep).
- **Keyboard Typing:** Implements a word-by-word clipboard copy-paste workaround to support typing all characters (including Unicode) realistically.

## Development Rules
1. **Maintain macOS Compatibility:** Ensure any new backend commands are tested for macOS first before attempting cross-platform support.
2. **Secure the PIN:** Do not bypass the PIN authentication middleware. Ensure the frontend handles 401 Unauthorized errors by prompting the user to re-enter the PIN.
3. **Graceful Error Handling:** Ensure all `subprocess.run` calls in the backend catch exceptions and return standard HTTP 500 errors with the detailed message.
4. **Use Absolute Paths:** When working with the file system or launching apps, try to use absolute paths where possible.

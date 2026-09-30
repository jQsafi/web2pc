import subprocess
import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pyautogui
import pyperclip
from typing import Optional

import socket
import random
import qrcode
import threading
from fastapi.responses import JSONResponse

app = FastAPI()

# Generate PIN
PIN = str(random.randint(1000, 9999))

def print_qr():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    url = f"http://{IP}:5173/?pin={PIN}"
    print(f"\n======================================")
    print(f"Server is running!")
    print(f"PIN for connection: {PIN}")
    print(f"Scan this QR code from your phone to connect!")
    print(f"======================================\n")
    qr = qrcode.QRCode()
    qr.add_data(url)
    qr.print_ascii(invert=True)
    print("\n")

# Start QR print in thread so it doesn't block
threading.Thread(target=print_qr, daemon=True).start()

@app.middleware("http")
async def verify_pin_middleware(request: Request, call_next):
    if request.url.path.startswith("/api/") and request.method != "OPTIONS":
        client_pin = request.headers.get("x-pin")
        if client_pin != PIN:
            return JSONResponse(status_code=401, content={"error": "Invalid or missing PIN"})
    return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def run_cmd(cmd: str) -> str:
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=e.stderr.strip() or str(e))

class AppPathRequest(BaseModel):
    appPath: str

class AppNameRequest(BaseModel):
    appName: str

class CommandRequest(BaseModel):
    command: str

class MouseMoveRequest(BaseModel):
    dx: float
    dy: float

class MouseClickRequest(BaseModel):
    button: str = 'left'
    double: bool = False

class MouseScrollRequest(BaseModel):
    dx: float
    dy: float

class KeyboardTypeRequest(BaseModel):
    text: Optional[str] = None
    key: Optional[str] = None


# --- SYSTEM & POWER ---
@app.post('/api/system/sleep')
def system_sleep():
    run_cmd('pmset sleepnow')
    return {"success": True, "message": "Sleeping PC"}

@app.post('/api/system/lock')
def system_lock():
    run_cmd("""osascript -e 'tell application "System Events" to keystroke "q" using {command down, control down}'""")
    return {"success": True, "message": "Screen locked"}

# --- VOLUME ---
@app.post('/api/volume/up')
def volume_up():
    run_cmd('osascript -e "set volume output volume (output volume of (get volume settings) + 10)"')
    return {"success": True}

@app.post('/api/volume/down')
def volume_down():
    run_cmd('osascript -e "set volume output volume (output volume of (get volume settings) - 10)"')
    return {"success": True}

@app.post('/api/volume/mute')
def volume_mute():
    run_cmd('osascript -e "set volume with output muted"')
    return {"success": True}

# --- MEDIA ---
@app.post('/api/media/playpause')
def media_playpause():
    run_cmd("osascript -e 'tell application \"System Events\" to key code 100'")
    return {"success": True}

@app.post('/api/media/next')
def media_next():
    run_cmd("osascript -e 'tell application \"System Events\" to key code 101'")
    return {"success": True}

@app.post('/api/media/prev')
def media_prev():
    run_cmd("osascript -e 'tell application \"System Events\" to key code 98'")
    return {"success": True}

# --- APPLICATIONS ---
@app.get('/api/apps/search')
def apps_search(q: str = ''):
    if not q:
        return {"apps": []}
    
    cmd = f"mdfind \"kMDItemKind == 'Application' && kMDItemFSName == '*{q}*'\" | head -n 10"
    output = subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout.strip()
    apps = []
    for p in output.split('\\n'):
        if p:
            name = os.path.basename(p).replace('.app', '')
            apps.append({"path": p, "name": name})
    return {"apps": apps}

@app.post('/api/apps/launch')
def apps_launch(req: AppPathRequest):
    run_cmd(f'open "{req.appPath}"')
    return {"success": True}

@app.post('/api/apps/close')
def apps_close(req: AppNameRequest):
    run_cmd(f'osascript -e \'tell application "{req.appName}" to quit\'')
    return {"success": True}

# --- TERMINAL ---
@app.post('/api/terminal/run')
def terminal_run(req: CommandRequest):
    output = run_cmd(req.command)
    return {"success": True, "output": output}

# --- MOUSE & KEYBOARD ---
@app.post('/api/mouse/move')
def mouse_move(req: MouseMoveRequest):
    pyautogui.move(int(req.dx), int(req.dy))
    x, y = pyautogui.position()
    return {"success": True, "pos": {"x": x, "y": y}}

@app.post('/api/mouse/click')
def mouse_click(req: MouseClickRequest):
    if req.double:
        pyautogui.doubleClick(button=req.button)
    else:
        pyautogui.click(button=req.button)
    return {"success": True}

@app.post('/api/mouse/scroll')
def mouse_scroll(req: MouseScrollRequest):
    # pyautogui.scroll takes integer clicks. On Mac, positive is up, negative is down.
    if req.dy != 0:
        pyautogui.scroll(int(req.dy))
    if req.dx != 0:
        pyautogui.hscroll(int(req.dx))
    return {"success": True}

@app.post('/api/keyboard/type')
def keyboard_type(req: KeyboardTypeRequest):
    if req.text:
        # pyautogui.write doesn't support unicode (like Bangla). 
        # Workaround: copy to clipboard and paste (Cmd+V on Mac)
        old_clipboard = pyperclip.paste()
        words = req.text.split(' ')
        for i, word in enumerate(words):
            if word:
                pyperclip.copy(word)
                pyautogui.hotkey('command', 'v')
            if i < len(words) - 1:
                pyautogui.press('space')
        
        # Optionally restore old clipboard after a tiny delay, 
        # but for instant typing, this might race. Let's just leave it in clipboard.
    elif req.key:
        pyautogui.press(req.key)
    return {"success": True}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=5001)

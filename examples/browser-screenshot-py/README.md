# Website screenshot (Python)

Capture any webpage as a PNG. Sets a fixed desktop viewport before navigating, so the screenshot covers a known frame rather than whatever the site defaults to.

## Run

```bash
cd examples/browser-screenshot-py
pip install -r requirements.txt
export SOLARI_API_KEY=slr_live_...   # https://console.getsolari.com

python main.py                          # screenshots example.com → screenshot.png
python main.py https://example.com out.png   # custom URL and output path
```

Source: [`main.py`](main.py)

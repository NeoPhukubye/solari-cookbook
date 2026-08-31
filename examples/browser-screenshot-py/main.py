"""Website screenshot — capture any page as a PNG.

Set the viewport before navigating so you control the exact frame the
screenshot covers. The default 1280×720 is a common desktop size; drop it
to 375×667 for mobile.

Run:
    python main.py [url] [output.png]
"""

import asyncio
import os
import pathlib
import sys

from solari_browser import Solari

BASE_URL = "https://api.getsolari.com"


async def main() -> None:
    url = sys.argv[1] if len(sys.argv) > 1 else "https://example.com"
    output = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else "screenshot.png")

    solari = Solari(api_key=os.environ["SOLARI_API_KEY"])
    browser = await solari.launch()
    try:
        page = await browser.new_page()
        await page.set_viewport_size({"width": 1280, "height": 720})
        await page.goto(url)

        shot = await page.screenshot()
        output.write_bytes(shot)
        print(f"screenshot: {output} ({len(shot)} bytes)")
    finally:
        await browser.close()
        await solari.close()


if __name__ == "__main__":
    asyncio.run(main())

from pathlib import Path
from urllib.parse import urljoin

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:3000"
ROUTES = ["/", "/browse", "/categories", "/qna", "/wallet", "/seller", "/admin"]
API_ROUTES = [
    "/api/stats",
    "/api/search?q=chat&page=1&limit=5",
    "/api/ai/search/suggest?q=chat&top_n=5",
    "/api/ai/recommendations/trending?top_n=3",
]
SCREENSHOT_DIR = Path("tool-results") / "ui-smoke"


def safe_name(value: str) -> str:
    cleaned = value.strip("/").replace("/", "-")
    return cleaned or "home"


def audit_viewport(browser, name: str, width: int, height: int) -> list[str]:
    context = browser.new_context(viewport={"width": width, "height": height})
    page = context.new_page()
    failures: list[str] = []
    page_errors: list[str] = []
    console_errors: list[str] = []

    page.on("pageerror", lambda error: page_errors.append(str(error)))
    page.on(
        "console",
        lambda msg: console_errors.append(msg.text)
        if msg.type == "error"
        else None,
    )

    for route in ROUTES:
        url = urljoin(BASE_URL, route)
        try:
            response = page.goto(url, wait_until="domcontentloaded", timeout=30_000)
            try:
                page.wait_for_load_state("networkidle", timeout=15_000)
            except PlaywrightTimeoutError:
                pass

            status = response.status if response else 0
            body_text = page.locator("body").inner_text(timeout=10_000).strip()
            if status >= 500:
                failures.append(f"{name} {route}: HTTP {status}")
            if not body_text:
                failures.append(f"{name} {route}: blank page")
            if "Application error" in body_text or "Unhandled Runtime Error" in body_text:
                failures.append(f"{name} {route}: runtime error screen")

            page.screenshot(
                path=str(SCREENSHOT_DIR / f"{name}-{safe_name(route)}.png"),
                full_page=False,
            )
            print(f"{name:7} {route:14} status={status} chars={len(body_text)}")
        except Exception as exc:
            failures.append(f"{name} {route}: {exc}")

    if name == "desktop":
        try:
            page.goto(BASE_URL, wait_until="networkidle", timeout=30_000)
            search = page.locator("form input[placeholder='Search prompts...']").first
            search.fill("chatgpt")
            page.keyboard.press("Enter")
            page.wait_for_url("**/browse", timeout=10_000)
            print("desktop search navigation ok")
        except Exception as exc:
            failures.append(f"desktop search: {exc}")

    if page_errors:
        failures.append(f"{name} page errors: {' | '.join(page_errors[:3])}")
    if console_errors:
        print(f"{name} console errors observed: {len(console_errors)}")
        for message in console_errors[:5]:
            print(f"  console: {message[:220]}")

    context.close()
    return failures


def audit_api(playwright) -> list[str]:
    failures: list[str] = []
    request = playwright.request.new_context(base_url=BASE_URL)
    for route in API_ROUTES:
        response = request.get(route, timeout=30_000)
        text = response.text()
        print(f"api     {route:48} status={response.status} chars={len(text)}")
        if response.status >= 500:
            failures.append(f"api {route}: HTTP {response.status}")
        if response.status == 404:
            failures.append(f"api {route}: not found")
    request.dispose()
    return failures


def main() -> int:
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        failures = []
        failures.extend(audit_api(playwright))
        failures.extend(audit_viewport(browser, "desktop", 1365, 900))
        failures.extend(audit_viewport(browser, "mobile", 390, 844))
        browser.close()

    if failures:
        print("\nFAILURES")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("\nUI smoke audit passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

from playwright.sync_api import sync_playwright
import sys

def run_audit():
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(f"Page Error: {err}"))
        page.on("requestfailed", lambda req: errors.append(f"Request Failed: {req.url} - {req.failure}"))
        
        # We'll also capture console errors, but some might be acceptable warnings.
        # Let's just track severe errors for now.

        urls_to_test = [
            "http://localhost:3000/",
            "http://localhost:3000/browse",
            "http://localhost:3000/qna",
            "http://localhost:3000/wallet"
        ]

        for url in urls_to_test:
            print(f"Navigating to {url}...")
            try:
                response = page.goto(url)
                page.wait_for_load_state("networkidle", timeout=10000)
                
                if response and not response.ok:
                    errors.append(f"Bad response from {url}: {response.status} {response.status_text}")
                else:
                    print(f"Successfully loaded {url}")
            except Exception as e:
                errors.append(f"Failed to load {url}: {str(e)}")

        browser.close()
        
        if errors:
            print("Audit failed with the following errors:")
            for err in errors:
                print(f" - {err}")
            sys.exit(1)
        else:
            print("Audit completed successfully! No errors found.")
            sys.exit(0)

if __name__ == "__main__":
    run_audit()

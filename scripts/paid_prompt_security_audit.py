import json
import sys
import urllib.error
import urllib.request

BASE_URL = "http://127.0.0.1:3000"


def request_json(path: str, method: str = "GET", payload: dict | None = None) -> tuple[int, dict]:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        BASE_URL + path,
        data=data,
        headers={"Content-Type": "application/json"},
        method=method,
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8")
            return response.status, json.loads(body)
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except json.JSONDecodeError:
            parsed = {"success": False, "error": body}
        return error.code, parsed


def collect_prompts(data):
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    if not isinstance(data, dict):
        return []
    if isinstance(data.get("prompts"), list):
        return data["prompts"]
    if isinstance(data.get("recommendations"), list):
        return data["recommendations"]
    if isinstance(data.get("similar"), list):
        prompts = []
        if isinstance(data.get("prompt"), dict):
          prompts.append(data["prompt"])
        prompts.extend(data["similar"])
        return prompts
    if "id" in data:
        return [data]
    return []


def is_paid(prompt: dict) -> bool:
    return not prompt.get("isFree") and float(prompt.get("price") or 0) > 0


def assert_paid_prompts_locked(label: str, body: dict) -> list[str]:
    failures = []
    prompts = collect_prompts(body.get("data"))
    for prompt in prompts:
        if is_paid(prompt) and prompt.get("promptText"):
            failures.append(
                f"{label}: paid prompt {prompt.get('id')} leaked promptText"
            )
        if is_paid(prompt) and prompt.get("isPromptLocked") is not True:
            failures.append(
                f"{label}: paid prompt {prompt.get('id')} was not marked locked for guest"
            )
    return failures


def main() -> int:
    failures: list[str] = []

    listing_status, listing_body = request_json("/api/prompts?limit=20")
    if listing_status != 200 or not listing_body.get("success"):
        print(f"Unable to read public prompt listing: HTTP {listing_status}")
        print(json.dumps(listing_body, indent=2))
        return 1

    listing_prompts = listing_body["data"]["prompts"]
    paid_prompt = next((prompt for prompt in listing_prompts if is_paid(prompt)), None)
    if not paid_prompt:
        print("No paid prompt is available in the local database; paid-content security audit skipped.")
        return 0

    paid_id = paid_prompt["id"]
    checks = [
        ("listing", lambda: (listing_status, listing_body)),
        ("detail", lambda: request_json(f"/api/prompts/{paid_id}")),
        ("search", lambda: request_json("/api/search?q=chat&limit=20")),
        (
            "ai_search_rank",
            lambda: request_json(
                "/api/ai/search/rank",
                method="POST",
                payload={"query": "chat", "limit": 20},
            ),
        ),
        ("ai_trending", lambda: request_json("/api/ai/recommendations/trending?top_n=20")),
        ("ai_recommendations", lambda: request_json("/api/ai/recommendations?top_n=20")),
        (
            "ai_similar",
            lambda: request_json(f"/api/ai/recommendations/similar?promptId={paid_id}&top_n=10"),
        ),
    ]

    for label, run in checks:
        status, body = run()
        print(f"{label:18} HTTP {status}")
        if status >= 500 or not body.get("success"):
            failures.append(f"{label}: unexpected response {status} {body.get('error')}")
            continue
        failures.extend(assert_paid_prompts_locked(label, body))

    feature_status, _feature_body = request_json(f"/api/ai/features?type=prompt&id={paid_id}")
    print(f"{'ai_features_guest':18} HTTP {feature_status}")
    if feature_status not in (401, 403):
        failures.append(f"ai_features_guest: expected 401/403, got {feature_status}")

    if failures:
        print("\nFAILURES")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("\nPaid prompt security audit passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

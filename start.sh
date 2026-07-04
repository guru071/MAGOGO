#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
AI_DIR="$ROOT_DIR/src/ai"
NEXT_PORT="${NEXT_PORT:-3000}"
AI_PORT="${AI_PORT:-8000}"
NEXT_PID=""
AI_PID=""
SKIP_INSTALL=false

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'

cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  [ -n "$AI_PID" ] && kill "$AI_PID" 2>/dev/null
  [ -n "$NEXT_PID" ] && kill "$NEXT_PID" 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

usage() {
  echo "Usage: $0 [dev|production] [--skip-install]"
  echo "  dev            Start dev servers (default)"
  echo "  production     Build + start production"
  echo "  --skip-install Skip npm/pip install"
  exit 0
}

MODE="dev"
for arg in "$@"; do
  case "$arg" in
    production) MODE="production" ;;
    --skip-install) SKIP_INSTALL=true ;;
    --help|-h) usage ;;
  esac
done

echo -e "${CYAN}==============================${NC}"
echo -e "${CYAN}  AI Prompt Marketplace — Start${NC}"
echo -e "${CYAN}==============================${NC}"

# ───── Prerequisites ─────
echo -e "${YELLOW}[1/3] Prerequisites...${NC}"
if ! command -v node &>/dev/null; then echo -e "${RED}node not found${NC}"; exit 1; fi
if ! command -v python3 &>/dev/null; then echo -e "${RED}python3 not found${NC}"; exit 1; fi
RUNNER="npm"; command -v bun &>/dev/null && RUNNER="bun"
echo "  Node $(node -v) | Python $(python3 --version 2>&1 | cut -d' ' -f2) | $RUNNER"
echo "  Ports: Next.js=$NEXT_PORT  AI=$AI_PORT"

# ───── Install ─────
echo -e "${YELLOW}[2/3] Dependencies...${NC}"
if [ "$SKIP_INSTALL" = true ]; then
  echo "  Skipped (--skip-install)"
else
  [ ! -d "$ROOT_DIR/node_modules" ] && echo "  Installing Node packages..." && $RUNNER install --silent 2>&1 | tail -1
  if [ ! -d "$AI_DIR/venv" ]; then echo "  Creating Python venv..."; python3 -m venv "$AI_DIR/venv"; fi
  source "$AI_DIR/venv/bin/activate"
  if [ -f "$AI_DIR/venv/.req_checksum" ] && md5sum --status -c "$AI_DIR/venv/.req_checksum" 2>/dev/null; then
    echo "  Python packages OK (cached)"
  else
    echo "  Installing Python packages..."
    pip install -q -r "$AI_DIR/requirements.txt" 2>&1 | tail -1
    md5sum "$AI_DIR/requirements.txt" > "$AI_DIR/venv/.req_checksum"
  fi
  deactivate
fi

# ───── Prisma ─────
echo -e "${YELLOW}[3/3] Starting servers...${NC}"
npx --yes prisma generate 2>&1 | tail -1

# ───── Start AI ─────
cd "$AI_DIR"
source "$AI_DIR/venv/bin/activate"
uvicorn main:app --host 0.0.0.0 --port "$AI_PORT" --log-level warning &
AI_PID=$!
deactivate
cd "$ROOT_DIR"
sleep 1
if kill -0 "$AI_PID" 2>/dev/null; then echo -e "  ${GREEN}✓ AI on port $AI_PORT${NC}"; else echo -e "  ${RED}✗ AI failed${NC}"; exit 1; fi

# ───── Start Next.js ─────
if [ "$MODE" = "production" ]; then
  echo "  Building..."
  npm run build 2>&1 | tail -5
  echo "  Starting production..."
  NODE_ENV=production node .next/standalone/server.js &
else
  echo "  Starting dev server..."
  npm run dev &
fi
NEXT_PID=$!
sleep 2
if kill -0 "$NEXT_PID" 2>/dev/null; then echo -e "  ${GREEN}✓ Next.js on port $NEXT_PORT${NC}"; else echo -e "  ${RED}✗ Next.js failed${NC}"; kill "$AI_PID" 2>/dev/null; exit 1; fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  http://localhost:$NEXT_PORT  (marketplace)  ║${NC}"
echo -e "${GREEN}║  http://localhost:$AI_PORT   (AI service)   ║${NC}"
echo -e "${GREEN}║  Ctrl+C to stop                      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
wait

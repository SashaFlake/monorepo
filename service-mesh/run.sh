#!/usr/bin/env bash
set -euo pipefail

# ── Service Mesh Control Plane — запуск локального стенда ────────────────────
# Использование:
#   ./run.sh           # foreground (логи в терминале)
#   ./run.sh -d        # detach (фоновый режим)
#   ./run.sh --down    # остановить стенд
#   ./run.sh --clean   # остановить и удалить volumes / images
# ─────────────────────────────────────────────────────────────────────────────

COMPOSE_FILE="docker-compose.service-mesh.yml"
DETACH=""
COMMAND="up --build"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -d|--detach)
      DETACH="-d"
      shift
      ;;
    --down)
      COMMAND="down"
      DETACH=""
      shift
      ;;
    --clean)
      COMMAND="down --volumes --rmi local --remove-orphans"
      DETACH=""
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [-d|--detach] [--down] [--clean] [-h|--help]"
      echo ""
      echo "Options:"
      echo "  -d, --detach   Запустить в фоновом режиме"
      echo "  --down         Остановить стенд"
      echo "  --clean        Остановить и полностью очистить (volumes, images)"
      echo "  -h, --help     Показать эту справку"
      exit 0
      ;;
    *)
      echo "Неизвестный аргумент: $1"
      echo "Используйте $0 --help для справки"
      exit 1
      ;;
  esac
done

# ── Проверка Docker ──────────────────────────────────────────────────────────
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker не запущен. Запустите Docker и повторите."
  exit 1
fi

# ── Git pull (опционально, только если нет локальных изменений) ────────────
if git diff --quiet && git diff --cached --quiet; then
  echo "📥 Обновление репозитория…"
  git pull || true
else
  echo "⚠️  Есть несохранённые изменения. git pull пропущен."
fi

# ── Синхронизация frontend package-lock.json ─────────────────────────────────
if [[ -f frontend/service-mesh/package.json && -f frontend/service-mesh/package-lock.json ]]; then
  echo "🔧 Проверка синхронизации frontend/package-lock.json…"
  (
    cd frontend/service-mesh
    # npm ci --dry-run не выйдет с ошибкой, если lockfile не синхронизирован
    # Поэтому делаем npm install при необходимости
    if ! npm ci --dry-run >/dev/null 2>&1; then
      echo "   package-lock.json устарел, запускаю npm install…"
      npm install --package-lock-only >/dev/null 2>&1 || npm install
    else
      echo "   package-lock.json актуален."
    fi
  )
fi

# ── Запуск / остановка ─────────────────────────────────────────────────────
echo "🚀 docker compose -f ${COMPOSE_FILE} ${COMMAND} ${DETACH}"
docker compose -f "${COMPOSE_FILE}" ${COMMAND} ${DETACH}

# ── Вывод информации ─────────────────────────────────────────────────────────
if [[ "${COMMAND}" == up* ]]; then
  echo ""
  echo "✅ Стенд запущен. Доступные сервисы:"
  echo "   • Registry API : http://localhost:4000"
  echo "   • Admin UI     : http://localhost:5173"
  echo "   • Mock-1       : http://localhost:3001"
  echo "   • Mock-2       : http://localhost:3002"
  echo ""
  if [[ -n "${DETACH}" ]]; then
    echo "Логи: docker compose -f ${COMPOSE_FILE} logs -f"
  fi
else
  echo "✅ Команда выполнена: ${COMMAND}"
fi

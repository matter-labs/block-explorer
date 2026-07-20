#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

usage() {
  cat <<'EOF'
Usage:
  create-dtrack-collection-project.sh

Required env:
  DT_BASE_URL      Dependency Track base URL (e.g. https://dtrack.example.com)
  DT_API_KEY       Dependency Track API key
  PROJECT_NAME     Name for the collection project
  PROJECT_VERSION  Version string (e.g. main, v1.0.0)
  PARENT_UUID      UUID of the parent project
EOF
}

log() { printf '[%s] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

main() {
  : "${DT_BASE_URL:?Set DT_BASE_URL (e.g. https://dtrack.example.com)}"
  : "${DT_API_KEY:?Set DT_API_KEY}"
  : "${PROJECT_NAME:?Set PROJECT_NAME}"
  : "${PROJECT_VERSION:?Set PROJECT_VERSION}"
  : "${PARENT_UUID:?Set PARENT_UUID}"

  log "Creating collection project '${PROJECT_NAME}' ${PROJECT_VERSION} under parent ${PARENT_UUID}..."

  local http_response http_status response_body uuid

  http_response=$(curl -s -w "\n%{http_code}" \
    -X PUT "${DT_BASE_URL}/api/v1/project" \
    -H "X-Api-Key: ${DT_API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{
      "name":            "'"${PROJECT_NAME}"'",
      "version":         "'"${PROJECT_VERSION}"'",
      "classifier":      "APPLICATION",
      "active":          true,
      "isLatest":        true,
      "collectionLogic": "AGGREGATE_LATEST_VERSION_CHILDREN",
      "parent":          {"uuid": "'"${PARENT_UUID}"'"}
    }')

  http_status=$(printf '%s' "${http_response}" | tail -n1)
  response_body=$(printf '%s' "${http_response}" | head -n-1)

  if [[ "${http_status}" == "201" ]]; then
    log "Project created."
    uuid=$(printf '%s' "${response_body}" | jq -r '.uuid')
  elif [[ "${http_status}" == "409" ]]; then
    log "Project already exists, fetching existing project..."
    local existing
    existing=$(curl -sf --get \
      --data-urlencode "name=${PROJECT_NAME}" \
      "${DT_BASE_URL}/api/v1/project" \
      -H "X-Api-Key: ${DT_API_KEY}")
    uuid=$(printf '%s' "${existing}" | jq -r --arg v "${PROJECT_VERSION}" '.[] | select(.version == $v) | .uuid')
    [[ -z "${uuid}" ]] && die "Could not locate existing project '${PROJECT_NAME}' ${PROJECT_VERSION}"
  else
    log "Unexpected HTTP ${http_status}:"
    printf '%s\n' "${response_body}" >&2
    exit 1
  fi

  local project name version
  project=$(curl -sf \
    -X GET "${DT_BASE_URL}/api/v1/project/${uuid}" \
    -H "X-Api-Key: ${DT_API_KEY}")

  name=$(printf '%s' "${project}"    | jq -r '.name')
  version=$(printf '%s' "${project}" | jq -r '.version // "n/a"')

  log "Project UUID:    ${uuid}"
  log "Project name:    ${name}"
  log "Project version: ${version}"
}

main "$@"

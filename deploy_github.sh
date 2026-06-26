#!/usr/bin/env bash
set -euo pipefail

repo_name="${1:-prompt-lineage-library}"

printf "GitHub username is fetched from the token.\n"
printf "Paste a GitHub token with repo access. It will not be echoed.\n"
read -r -s -p "GitHub token: " github_token
printf "\n"

api() {
  curl -fsS \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${github_token}" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "$@"
}

user_json="$(api https://api.github.com/user)"
owner="$(printf "%s" "$user_json" | sed -n 's/.*"login"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"

if [[ -z "$owner" ]]; then
  printf "Could not read GitHub username from token.\n" >&2
  exit 1
fi

repo_url="https://github.com/${owner}/${repo_name}.git"
repo_api="https://api.github.com/repos/${owner}/${repo_name}"

if api "$repo_api" >/dev/null 2>&1; then
  printf "Repository already exists: https://github.com/%s/%s\n" "$owner" "$repo_name"
else
  printf "Creating public repository: %s/%s\n" "$owner" "$repo_name"
  api \
    -X POST \
    https://api.github.com/user/repos \
    -d "{\"name\":\"${repo_name}\",\"private\":false,\"description\":\"Local-first prompt lineage library\",\"auto_init\":false}" \
    >/dev/null
fi

git remote remove origin >/dev/null 2>&1 || true
git remote add origin "$repo_url"

printf "Pushing main branch...\n"
git push -u "https://x-access-token:${github_token}@github.com/${owner}/${repo_name}.git" main

printf "Requesting GitHub Pages workflow mode if available...\n"
api \
  -X POST \
  "https://api.github.com/repos/${owner}/${repo_name}/pages" \
  -d '{"build_type":"workflow"}' \
  >/dev/null 2>&1 || true

printf "\nDone.\n"
printf "Repository: https://github.com/%s/%s\n" "$owner" "$repo_name"
printf "Pages URL, after the workflow finishes: https://%s.github.io/%s/\n" "$owner" "$repo_name"
printf "Actions: https://github.com/%s/%s/actions\n" "$owner" "$repo_name"

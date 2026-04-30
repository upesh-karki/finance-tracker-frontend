# Required GitHub Secrets

## All repos
| Secret | Description | Where to get it |
|---|---|---|
| `SNYK_TOKEN` | Snyk API token for vulnerability scanning | https://app.snyk.io/account |

## Notes
- GITHUB_TOKEN is automatically available in all workflows
- SNYK_TOKEN: Create a free account at snyk.io → Account Settings → Auth Token
- Gitleaks uses GITHUB_TOKEN (auto-provided) — no extra setup

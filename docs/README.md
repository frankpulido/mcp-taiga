# Documentation Directory

## Purpose
This directory contains all external documentation for the project.

## Structure

### `notion/`
Exported Notion pages relevant to this project.

**How to add:**
1. Export page from Notion (••• → Export → Markdown & CSV)
2. Move files here
3. Tell Warp AI to read them

### `api-docs/`
API documentation for external services used in this project.

**Note:** Most API docs should be in the global cache.
Use the workflow scripts to fetch and cache API documentation.

Only put project-specific or custom API docs here.

### `tutorials/`
Saved tutorials, guides, and how-tos relevant to this project.

### `external/`
Other external documentation (PDFs, images, design specs, etc.)

## For Warp AI

At session start, tell Warp AI:
```
"Read docs/notion/ and docs/api-docs/"
```

## Maintenance

- **Weekly:** Update Notion exports if requirements changed
- **Monthly:** Check if API docs in global cache are stale
- **Always:** Document as you go, not after!

---

**Created:** $(date +%Y-%m-%d)

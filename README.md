**English** | [فارسی](./README.fa.md)

# Telegram Widget Bot — Modular HTML Chat Widget Engine on Telegram Serverless

[![Live Docs](https://img.shields.io/badge/Docs-azipa.github.io-2AABEE?logo=readthedocs&logoColor=white)](https://azipa.github.io/projects/telegram-widget-bot/)
[![Telegram Serverless](https://img.shields.io/badge/Platform-Telegram%20Serverless-26A5E4?logo=telegram&logoColor=white)](https://azipa.github.io/projects/telegram-widget-bot/)
[![tgcloud CLI](https://img.shields.io/badge/%40tgcloud%2Fcli-%5E0.2.0-3B82F6)](https://azipa.github.io/projects/telegram-widget-bot/setup/)
[![Node.js 26 CI](https://img.shields.io/badge/Node.js-26%20%28CI%29-339933?logo=nodedotjs&logoColor=white)](./.github/workflows/deploy.yml)
[![License: MPL-2.0](https://img.shields.io/badge/License-MPL--2.0-brightgreen)](./LICENSE)

A pure-JavaScript **Telegram widget bot** and modular **Profile 1 Mini-HTML** chat widget engine built natively for **Telegram Serverless** (`@tgcloud/cli`). It ships with 3 interactive **Telegram chat widgets** (`/timer`, `/poll`, `/duel`), a live private-chat **custom HTML widget validator** and sandbox launcher, 3 fail-closed **Mini App API endpoints** (`POST /api/*`), and a 2-table **built-in SQLite** schema — running with **zero VPS** and zero runtime `node_modules`.

> [!CAUTION]
> **Telegram Test Server Only & Runtime Scope**
> - **Test Server Required:** Telegram currently has Chat Widgets disabled globally on public Production servers. Live in-chat widget rendering works **only on Telegram's Test Server** until Telegram enables Chat Widgets in production.
> - **Runtime & Scope Notes:** `@tgcloud/cli 0.2.0` does not yet support dedicated `widget_query` handler filenames (bridged automatically via `wg:` callbacks and `POST /api/widgetQuery`), default configuration restricts widgets to private chats (`ALLOW_GROUP_WIDGETS: false`, `ALLOW_SHARED_WIDGETS: false`), and the in-Telegram bot UI is **English-only (`en-US`)** while this README and the docs site are bilingual EN/FA.

## Quick Start (GitHub Actions — Single Secret)

Deploy your own instance in minutes using **GitHub Actions deploy** — **only one secret (`TGCLOUD_TOKEN`)** is required:

1. **Enable Serverless & Inline Mode in `@BotFather`:** Create or select your bot (on Telegram's **Test Server** for live widget rendering), turn **Serverless ON**, copy your **CLI Access Token** (`app<id>:<secret>` from `Serverless → CLI Access → Access token` — NOT the HTTP Bot API token), and enable **Inline Mode** (`/setinline`).
2. **Fork the Repository:** Click **Fork** on [`AZiPA/telegram-widget-bot`](https://github.com/AZiPA/telegram-widget-bot) to create your own copy.
3. **Add One Secret (`TGCLOUD_TOKEN`):** Open **Settings → Secrets and variables → Actions** in your fork and create **`TGCLOUD_TOKEN`** with your `app<id>:<secret>` value — **no other secrets or environment variables are needed**.
4. **Deploy & Launch:** Run the **✈️ Deploy to Telegram** workflow in the **Actions** tab (or push a commit). CI validates all widgets against Profile 1 (`<= 4096B` zlib-9), pushes modules to Telegram Serverless, applies `migrate --safe`, and syncs webhooks — then send `/start`, `/timer`, or a `.html` file in private chat.

**Prefer local CLI deployment?** See the **[Setup & Deployment Guide](https://azipa.github.io/projects/telegram-widget-bot/setup/)** for `@tgcloud/cli` installation and Bash / PowerShell / CMD commands.

## Key Features

- **3 Built-In Profile 1 Chat Widgets:** Offline client-only **Telegram stopwatch widget** (`/timer`) with swipeable Analog SVG / Digital lap views (`localStorage`), **Live Shared Telegram poll widget** (`/poll`) with commit-after-edit & monotonic revisions, and **Tap Duel** (`/duel`) 2-player turn game (flip `ALLOW_GROUP_WIDGETS` / `ALLOW_SHARED_WIDGETS` in `tgcloud/lib/widgets/config.js` for multiplayer).
- **Live Custom `.html` Validator & Sandbox:** Upload `.html`/`.htm` files (up to `64 KB`) in private chat with `<!-- @tg-widget {...} -->` directives and caption flags (`--strict`, `width=`, `height=`, `queries=`); automatically minifies, enforces Profile 1 budgets (`32 KB` raw / `4 KB` deflate, DOM/tag/network checks), and launches live.
- **Modular Widget Engine & CI Auto-Catalog:** Add widgets under `tgcloud/lib/widgets/definitions/<type>/` using pure zero-SDK templates; `scripts/validate-widgets.js` validates Profile 1 limits (`<= 4096B` zlib-9) and regenerates `catalog.js` automatically.
- **Launch Menu & Inline Deep Links:** Dynamic `/share` inline keyboard and `@bot [query]` inline search returning `https://t.me/<bot>?start=launch_<type>` deep-link cards.
- **3 Fail-Closed Mini App API Endpoints + 2-Table SQLite:** `POST /api/listWidgets`, `POST /api/sendWidget`, and `POST /api/widgetQuery` authenticated via `ctx.initData.user`, backed by built-in SQLite (`shared_widgets` and `widget_instances`) with automatic 7-day TTL pruning (skipped for offline widgets).

## Full Documentation Hub

| Guide | What You Will Learn |
|---|---|
| [Overview & Highlights](https://azipa.github.io/projects/telegram-widget-bot/) | System architecture, Telegram Serverless runtime model, and Profile 1 capabilities |
| [Setup & Deployment](https://azipa.github.io/projects/telegram-widget-bot/setup/) | BotFather Test Server setup, single-secret GitHub Actions, and local `@tgcloud/cli` commands |
| [Widgets, Commands & Custom Uploads](https://azipa.github.io/projects/telegram-widget-bot/widgets-commands/) | Using `/timer`, `/poll`, `/duel`, `/share`, inline mode, and `.html` upload directives |
| [Widget Engine & Authoring Guide](https://azipa.github.io/projects/telegram-widget-bot/widget-engine/) | Authoring new widgets, `scripts/validate-widgets.js` checks, and Profile 1 budgets |
| [Configuration, Schema & Mini App API](https://azipa.github.io/projects/telegram-widget-bot/config-schema-api/) | `WIDGET_CONFIG` flags, `shared_widgets` / `widget_instances` schema, and `POST /api/*` endpoints |

## License

Licensed under the [Mozilla Public License 2.0 (MPL-2.0)](./LICENSE).

<div dir="rtl">

[English](./README.md) | **فارسی**

# ربات ویجت تلگرام — موتور ماژولار ویجت‌های HTML چت روی تلگرام سرورلس

[![مستندات آنلاین](https://img.shields.io/badge/Docs-azipa.github.io%2Ffa-2AABEE?logo=readthedocs&logoColor=white)](https://azipa.github.io/fa/projects/telegram-widget-bot/)
[![تلگرام سرورلس](https://img.shields.io/badge/Platform-Telegram%20Serverless-26A5E4?logo=telegram&logoColor=white)](https://azipa.github.io/fa/projects/telegram-widget-bot/)
[![tgcloud CLI](https://img.shields.io/badge/%40tgcloud%2Fcli-%5E0.2.0-3B82F6)](https://azipa.github.io/fa/projects/telegram-widget-bot/setup/)
[![Node.js 26 CI](https://img.shields.io/badge/Node.js-26%20%28CI%29-339933?logo=nodedotjs&logoColor=white)](./.github/workflows/deploy.yml)
[![مجوز MPL-2.0](https://img.shields.io/badge/License-MPL--2.0-brightgreen)](./LICENSE)

یک **ربات ویجت تلگرام** تمام‌جاوااسکریپت و موتور ماژولار **ویجت‌های چت تلگرام** (مبتنی بر پروفایل ۱ Mini-HTML) که به‌صورت بومی برای **تلگرام سرورلس** (`@tgcloud/cli`) ساخته شده است. این پروژه شامل ۳ ویجت تعاملی پیش‌فرض (`/timer`، `/poll` و `/duel`)، اعتبارسنجی و اجرای زنده **ویجت HTML سفارشی** در چت خصوصی ربات، ۳ اندپوینت امن **مینی‌اپ** (`POST /api/*`) با سیاست fail-closed و یک اسکیمای دوجدولی روی **دیتابیس داخلی SQLite** است — **بدون نیاز به VPS** و بدون وابستگی زمان اجرای `node_modules`.

> [!CAUTION]
> **فقط روی سرور تست تلگرام (Test Server) و نکات اجرایی**
> - **نیازمند سرور تست تلگرام:** در حال حاضر تلگرام قابلیت Chat Widgets را روی سرورهای عمومی اصلی (Production) به‌طور سراسری غیرفعال کرده است؛ رندر زنده ویجت در چت تا زمان فعال‌سازی عمومی توسط تلگرام، **فقط روی سرور تست تلگرام (Telegram Test Server)** کار می‌کند.
> - **محدودیت‌ها و زبان رابط ربات:** نسخه `@tgcloud/cli 0.2.0` هنوز از نام فایل هندلر اختصاصی `widget_query` پشتیبانی نمی‌کند (از طریق کالبک‌های `wg:` و `POST /api/widgetQuery` پل زده شده است)، فلگ‌های پیش‌فرض اجرای ویجت را به چت خصوصی ربات محدود می‌کنند (`ALLOW_GROUP_WIDGETS: false` و `ALLOW_SHARED_WIDGETS: false`) و رابط کاربری ربات در تلگرام **فقط انگلیسی (`en-US`)** است (در حالی که این README و مستندات وب دوزبانه هستند).

## راه‌اندازی سریع (دیپلوی با GitHub Actions — تنها یک Secret)

با **دیپلوی خودکار GitHub Actions** و **تنها یک Secret (`TGCLOUD_TOKEN`)**، نسخه شخصی خود را در چند دقیقه راه‌اندازی کنید:

1. **فعال‌سازی Serverless و Inline Mode در `@BotFather`:** ربات خود را بسازید یا انتخاب کنید (برای اجرای زنده ویجت، روی **سرور تست تلگرام**)، گزینه **Serverless** را روشن کنید، **CLI Access Token** خود (`app<id>:<secret>` از مسیر `Serverless → CLI Access → Access token` — نه توکن HTTP Bot API) را کپی کنید و **Inline Mode** (`/setinline`) را فعال نمایید.
2. **فورک کردن مخزن:** روی دکمه **Fork** در مخزن [`AZiPA/telegram-widget-bot`](https://github.com/AZiPA/telegram-widget-bot) کلیک کنید تا نسخه شخصی خود را بسازید.
3. **افزودن تنها یک Secret (`TGCLOUD_TOKEN`):** در فورک خود به **Settings → Secrets and variables → Actions** بروید و سکرت **`TGCLOUD_TOKEN`** را با مقدار `app<id>:<secret>` ایجاد کنید — **هیچ Secret یا متغیر محیطی دیگری لازم نیست**.
4. **دیپلوی و اجرا:** ورک‌فلو **✈️ Deploy to Telegram** را از تب **Actions** اجرا کنید (یا یک کامیت پوش نمایید). CI تمام ویجت‌ها را با **اعتبارسنجی پروفایل ۱** (`<= 4096B` با zlib-9) بررسی کرده، ماژول‌ها را روی تلگرام سرورلس ارسال می‌کند، `migrate --safe` را اعمال و وبهوک‌ها را همگام‌سازی می‌نماید؛ سپس در چت خصوصی ربات دستور `/start`، `/timer` یا یک فایل `.html` ارسال کنید.

**ترجیح می‌دهید از CLI لوکال دیپلوی کنید؟** برای نصب `@tgcloud/cli` و دستورهای Bash / PowerShell / CMD به **[راهنمای راه‌اندازی و دیپلوی](https://azipa.github.io/fa/projects/telegram-widget-bot/setup/)** مراجعه کنید.

## ویژگی‌های کلیدی

- **۳ ویجت داخلی پروفایل ۱:** **کرنومتر تلگرام** (`/timer`) آفلاین و سمت کاربر با نمای آنالوگ SVG و دیجیتال و ذخیره دورها در `localStorage`، **نظرسنجی زنده** و اشتراک‌پذیر (`/poll`) با الگوی Commit-After-Edit و شمارنده نسخه صعودی، و بازی دونفره نوبتی **Tap Duel** (`/duel`) (برای بازی چندنفره، فلگ‌های گروه/اشتراک‌گذاری را در `tgcloud/lib/widgets/config.js` فعال کنید).
- **اعتبارسنجی پروفایل ۱ و اجرای زنده `.html` سفارشی:** فایل‌های `.html` یا `.htm` (تا سقف `64 KB`) را همراه با متادیتای `<!-- @tg-widget {...} -->` و فلگ‌های کپشن (`--strict`، `width=`، `height=`، `queries=`) در چت خصوصی ربات ارسال کنید؛ ربات فایل را مینیفای کرده، سقف‌های پروفایل ۱ (`32 KB` خام / `4 KB` فشرده و بررسی‌های DOM، تگ و شبکه) را کنترل و آن را زنده اجرا می‌کند.
- **موتور ماژولار ویجت و کاتالوگ خودکار CI:** ویجت‌های جدید را در مسیر `tgcloud/lib/widgets/definitions/<type>/` بدون وابستگی SDK بسازید؛ اسکریپت `scripts/validate-widgets.js` سقف‌های پروفایل ۱ (`<= 4096B` zlib-9) را بررسی و فایل `catalog.js` را خودکار بازتولید می‌کند.
- **منوی لانچ و لینک‌های عمیق اینلاین:** کیبورد شیشه‌ای پویا با دستور `/share` و جستجوی اینلاین `@bot [query]` که کارت‌های لینک عمیق `https://t.me/<bot>?start=launch_<type>` برمی‌گرداند.
- **۳ اندپوینت fail-closed مینی‌اپ + دیتابیس داخلی SQLite:** اندپوینت‌های `POST /api/listWidgets`، `POST /api/sendWidget` و `POST /api/widgetQuery` با احراز هویت `ctx.initData.user` و جداول `shared_widgets` و `widget_instances` همراه با پاک‌سازی خودکار ۷ روزه (ویجت‌های آفلاین در دیتابیس ثبت نمی‌شوند).

## مرکز مستندات کامل

| راهنما | موضوعات پوشش‌داده‌شده |
|---|---|
| [معرفی و ویژگی‌ها](https://azipa.github.io/fa/projects/telegram-widget-bot/) | معماری سیستم، مدل اجرای تلگرام سرورلس و قابلیت‌های پروفایل ۱ |
| [راه‌اندازی و دیپلوی](https://azipa.github.io/fa/projects/telegram-widget-bot/setup/) | تنظیم BotFather در سرور تست، دیپلوی تک‌سکرت GitHub Actions و دستورهای `@tgcloud/cli` |
| [ویجت‌ها، دستورات و آپلود سفارشی](https://azipa.github.io/fa/projects/telegram-widget-bot/widgets-commands/) | کار با `/timer`، `/poll`، `/duel`، `/share`، حالت اینلاین و آپلود فایل‌های `.html` |
| [موتور ویجت و راهنمای ساخت ویجت](https://azipa.github.io/fa/projects/telegram-widget-bot/widget-engine/) | ساخت ویجت جدید، بررسی‌های `scripts/validate-widgets.js` و محدودیت‌های پروفایل ۱ |
| [پیکربندی، دیتابیس و API مینی‌اپ](https://azipa.github.io/fa/projects/telegram-widget-bot/config-schema-api/) | فلگ‌های `WIDGET_CONFIG`، جداول `shared_widgets` / `widget_instances` و اندپوینت‌های `POST /api/*` |

## مجوز (License)

تحت مجوز [Mozilla Public License 2.0 (MPL-2.0)](./LICENSE) منتشر شده است.

</div>

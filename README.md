# Formula

Освітня платформа для підготовки до НМТ і поглибленого навчання.

Монорепо: **npm workspaces + Turborepo**. Web: Next.js. API: NestJS + PostgreSQL (чистий SQL, без ORM).

```
apps/web           Next.js (лендінг, кабінет студента, адмін-заглушка)
apps/api           NestJS (health, auth-заглушка, SQL-міграції)
packages/shared    спільні типи, zod-схеми, константи
packages/config    спільні eslint, prettier, tsconfig
deploy/            nginx, certbot
```

## Вимоги

- Node.js 22 LTS (рекомендовано актуальний патч, >= 22.22) і npm 11
- Docker Desktop (PostgreSQL 16 + Redis для розробки)

## Локальний запуск

```bash
# 1. Залежності (також ставить git-хуки)
npm install

# 2. Змінні середовища
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 3. PostgreSQL + Redis
npm run db:up

# 4. SQL-міграції
npm run db:migrate

# 5. web + api
npm run dev
```

| Що                    | Адреса                                                                |
| --------------------- | --------------------------------------------------------------------- |
| Web                   | http://localhost:3000                                                 |
| API health            | http://localhost:4000/api/health                                      |
| Swagger               | http://localhost:4000/api/docs                                        |
| Adminer (за бажанням) | `docker compose --profile tools up -d adminer`, http://localhost:8080 |

Корисні команди: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run db:psql`, `npm run db:down`. Повний список скриптів у кореневому `package.json`.

## SEO і Google

1. У `.env.production` вкажи `DOMAIN` (від нього залежать `NEXT_PUBLIC_SITE_URL`, canonical, sitemap).
2. Додай сайт у [Google Search Console](https://search.google.com/search-console), підтверди володіння через «HTML-тег» і впиши токен у `GOOGLE_SITE_VERIFICATION`.
3. Надішли `https://твій-домен/sitemap.xml`. Перевір `https://твій-домен/robots.txt` і превʼю через Rich Results Test (FAQ).
4. Заміни тексти-заглушки (Lorem ipsum) на реальні, інакше вони потраплять у видачу.
5. Картинка при поширенні посилання (Telegram, Viber, WhatsApp, Facebook): у кожної публічної сторінки (`/`, `/privacy`, `/login`, `/register`) свій файл `opengraph-image.png` (1200x630) поруч зі сторінкою в `apps/web/src/app`. Адреса картинки в тегах абсолютна й береться з `NEXT_PUBLIC_SITE_URL`, тож у проді там має бути `https://твій-домен`. Після зміни картинки месенджери довго тримають старий кеш: оновлення для Facebook в [Sharing Debugger](https://developers.facebook.com/tools/debug/), для Telegram в боті [@WebpageBot](https://t.me/WebpageBot) (надішли йому посилання).

## Перший адміністратор

Адміни зберігаються окремо від користувачів: у таблиці `admins` (один рядок = один адмін). У таблиці `users` немає ні ролі, ні прав, тому звичайний код (реєстрація, профіль, списки) не може випадково дати комусь права. Усі нові акаунти звичайні користувачі (студенти). Зареєструйтесь на `/register`, потім додайте себе в адміни одним із способів.

**Через термінал:**

```bash
npm run user:set-role -w @formula/api -- your@email.com admin      # суперадмін (усі права)
npm run user:set-role -w @formula/api -- your@email.com subadmin   # обмежений адмін
npm run user:set-role -w @formula/api -- your@email.com student    # забрати права
```

**Через DB-viewer (DBeaver, DbVisualizer, Adminer, pgAdmin...).** Підключення до PostgreSQL у Docker: хост `localhost`, порт `5442`, база `formula`, користувач `formula`, пароль `formula` (як у `docker-compose.yml`; у проді дані з `.env.production`). Виконайте SQL (підставте свою пошту):

```sql
INSERT INTO admins (user_id, level)
SELECT id, 'superadmin' FROM users WHERE email = 'your@email.com';
```

Або додайте рядок у таблицю `admins` руками: `user_id` це `id` вашого запису з `users`, `level` це `superadmin` або `subadmin`. Щоб забрати права, видаліть рядок з `admins` (разом з ним зникнуть і дозволи розділів):

```sql
DELETE FROM admins WHERE user_id = (SELECT id FROM users WHERE email = 'your@email.com');
```

## Демо-контент для тренування

Щоб у кабінеті було на чому вчитись, запустіть (api і Docker мають працювати; для PDF потрібен Google Chrome):

```bash
npm run seed:biology -w @formula/api -- --grant=student@email.com
```

З'явиться опублікований предмет «Біологія»: 3 теми, 8 підтем з описами й PDF-шпаргалками, тести з варіантами відповідей і ситуаційні задачі. Три підтеми безкоштовні, решту відкриває адмін (або одразу студентам з `--grant`). Повторний запуск нічого не дублює.

Субадміну розділи відкриває суперадмін у адмінці (меню «Команда») або рядками в `admin_permissions` (`admin_id`, `section_key`). Після зміни прав вийдіть з акаунта й увійдіть знову: роль зберігається в токені до 15 хвилин, а адмінські API-запити перевіряють права по базі одразу.

## Сповіщення і чат підтримки

- **Дзвіночок** є в студента й адміна. Сповіщення пишуть api-модулі: «тест перевірено» і «відкрито доступ» студенту, «нова робота на перевірку» рецензентам, нові повідомлення чату обом сторонам, а також **новини** від адміна всім студентам (розділ «Новини» в адмінці). Поки сповіщення лише на сайті; Telegram і пошта додаються як ще один канал доставки в api (`NotificationChannel`), без змін у місцях, де сповіщення створюються.
- **Чат підтримки**: у студента один діалог («Підтримка» в меню кабінету), відповідають адміни з розділом «Підтримка» (спільна черга діалогів в адмінці, пошук, закриття діалогу). Текст і картинки, онлайн-оновлення без перезавантаження (SSE-потік `GET /api/events`), позначки «прочитано», «друкує…».
- Розділи «Підтримка» і «Новини» субадмінам видає суперадмін так само, як інші (меню «Команда»).

## Telegram-бот Formula

Усе вже реалізовано, бот **спить, доки в `apps/api/.env` немає токена**. У профілі тоді написано «Бот поки що не налаштований».

1. У Telegram відкрийте [@BotFather](https://t.me/BotFather) → `/newbot`, назвіть бота «Formula». Отримаєте **токен** і ім'я бота (наприклад `Formula_bot`).
2. Локально (`apps/api/.env`):

   ```env
   TELEGRAM_BOT_TOKEN=123456:ABC...
   TELEGRAM_BOT_USERNAME=Formula_bot
   TELEGRAM_MODE=polling
   ```

   Перезапустіть api (`npm run dev`). Режим `polling` не потребує публічної адреси, але працює лише з ОДНИМ запущеним api.

3. Продакшн (`.env.production`): `TELEGRAM_MODE=webhook`, `TELEGRAM_WEBHOOK_SECRET` (16+ випадкових символів), `API_PUBLIC_URL=https://ваш-домен` (api сам викличе `setWebhook` під час старту).
4. Як це бачить користувач: профіль → «Підключити Telegram» → «Відкрити бота» → `Start` → **бот вимагає поділитися номером телефону** (кнопка, лише власний контакт) → готово. Після цього сюди йдуть усі сповіщення сайту; `/stop` вимикає їх. Номер потрапляє в профіль (якщо там порожньо), а адмін бачить телефон, месенджери й стан бота на сторінці студента.

Новий месенджер (Viber тощо) додається як ще один провайдер в `apps/api/src/modules/messengers`.

## Вхід через Google

1. У [Google Cloud Console](https://console.cloud.google.com/apis/credentials) створіть OAuth-клієнт типу **Web application**.
2. У «Authorised redirect URIs» додайте адресу **api** (не сайту): локально `http://localhost:4000/api/auth/google/callback`, у проді `https://твій-домен/api/auth/google/callback`.
3. Запишіть `GOOGLE_CLIENT_ID` і `GOOGLE_CLIENT_SECRET` в `apps/api/.env` (локально) або `.env.production`. Поки обидва порожні, кнопка «Продовжити з Google» веде на сторінку входу з повідомленням, що вхід через Google недоступний.

Як це працює: кнопка на `/login` і `/register` веде на `GET /api/auth/google`, api відправляє браузер у Google, а після згоди повертає на `WEB_URL` з уже встановленими cookie сесії. Акаунт з такою ж поштою (підтвердженою в Google) прив'язується до Google, нового користувача створюємо без пароля (його можна задати в профілі) і ведемо в онбординг.

## Деплой на VPS (Ubuntu, KVM)

Стек: nginx (TLS через Let's Encrypt/certbot) -> web (Next.js standalone) + api (NestJS), PostgreSQL 16 і Redis у Docker. Усе в [docker-compose.prod.yml](docker-compose.prod.yml). Ця інструкція готує деплой, нічого автоматично не розгортається.

### 1. Підготовка сервера

```bash
# Ubuntu 22.04/24.04, під root або користувачем із sudo
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl git ufw

# Docker Engine + compose plugin (офіційний скрипт)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"   # перелогіньтесь після цього

# Файрвол
sudo ufw allow OpenSSH && sudo ufw allow 80,443/tcp && sudo ufw enable
```

### 2. Домен

Створіть A-запис `formula.example.com` -> IP вашого VPS і дочекайтесь поширення DNS (`dig +short formula.example.com`).

### 3. Код і конфіг

```bash
git clone <repo-url> formula && cd formula
cp .env.production.example .env.production
nano .env.production    # DOMAIN, LETSENCRYPT_EMAIL, POSTGRES_PASSWORD, JWT_* секрети
```

Згенерувати секрети: `openssl rand -base64 48`.

### 4. Перший сертифікат Let's Encrypt

```bash
# Спершу можна перевірити на staging (без лімітів): STAGING=1 bash deploy/init-letsencrypt.sh
bash deploy/init-letsencrypt.sh
```

Скрипт створює тимчасовий сертифікат, запускає nginx, отримує справжній сертифікат і перезавантажує nginx. Контейнер `certbot` далі сам оновлює сертифікати, а nginx перечитує їх кожні 6 годин.

### 5. Запуск стеку і міграції

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# SQL-міграції (виконувати після кожного оновлення, якщо є нові файли)
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm api node scripts/migrate.mjs
```

Перевірка: `curl https://formula.example.com/api/health`.

### 6. Оновлення

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm api node scripts/migrate.mjs
```

### Бекап бази

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres \
  pg_dump -U formula formula | gzip > "backup-$(date +%F).sql.gz"
```

### Бекап файлів

Відео, документи й картинки з адмінки лежать у Docker-томі `formula_uploads` (у контейнері api це `/app/storage`). Без нього база посилається на файли, яких уже немає, тож бекапте його разом з базою:

```bash
docker run --rm -v formula_uploads:/data:ro -v "$PWD":/backup alpine \
  tar czf "/backup/uploads-$(date +%F).tar.gz" -C /data .
```

Відео до 1 ГБ проходять через nginx (`client_max_body_size 1100m` для `/api/`), тому на VPS потрібно достатньо місця на диску. Згодом сховище можна замінити на S3-сумісне, змінивши лише `StorageService` в api.

## Дизайн-система

Токени з Figma (кольори, шрифти, радіуси) лежать у `apps/web/src/app/globals.css`. Усе, чого немає у Figma (темна тема, мобільні розміри заголовків), позначено `TODO: sync with Figma`.

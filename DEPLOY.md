# Деплой Formula на VPS — покроковий гайд

Результат: сайт на `https://<ваш-домен>` з nginx (TLS від Let's Encrypt), web (Next.js), api (NestJS), PostgreSQL 16 і Redis — усе в Docker на одному сервері. Усі команди нижче виконуються **на VPS під Ubuntu 22.04/24.04**, якщо не сказано інше.

Мінімальні вимоги до VPS: 2 vCPU, **2 ГБ RAM (краще 4)**, 20+ ГБ диска (відео до 1 ГБ лежать на диску сервера), публічний IPv4.

---

## 0. Що треба мати до початку

- VPS з Ubuntu і root/sudo-доступом по SSH.
- Домен, DNS яким ви керуєте.
- Код проєкту в git-репозиторії (GitHub/GitLab) **або** готовність залити код через `rsync`/`scp` (див. крок 3).

---

## 1. Підготовка сервера

```bash
ssh root@<IP-VPS>

apt update && apt upgrade -y
apt install -y ca-certificates curl git ufw

# Docker Engine + плагін compose
curl -fsSL https://get.docker.com | sh
docker --version && docker compose version

# Файрвол: тільки SSH, 80 і 443
ufw allow OpenSSH
ufw allow 80,443/tcp
ufw enable
```

(Необов'язково, але правильно) окремий користувач замість root:

```bash
adduser deploy
usermod -aG sudo,docker deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy   # щоб працював ваш SSH-ключ
# далі заходьте: ssh deploy@<IP-VPS>
```

Якщо RAM ≤ 2 ГБ — додайте swap, інакше `next build` може впасти з Out of memory:

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 2. Домен

У панелі DNS створіть **A-запис** `formula.example.com → <IP-VPS>` (для корінного домену — `@`). Перевірте, що він поширився (має повернути IP сервера):

```bash
dig +short formula.example.com
```

Без правильного DNS крок 5 (сертифікат) не спрацює.

---

## 3. Код на сервері

### Варіант A — через git (рекомендовано)

На своєму ПК (у репо зараз немає remote):

```bash
git remote add origin git@github.com:<you>/formula.git
git push -u origin master
```

На VPS:

```bash
cd /opt
git clone git@github.com:<you>/formula.git formula   # для приватного репо додайте deploy key або https-токен
cd /opt/formula
```

### Варіант B — без git, напряму з Windows

З PowerShell / Git Bash на ПК (не копіюємо node_modules, .next, dist, .env):

```powershell
scp -r D:\NORIS_PRIVATE\FORMULA\{apps,packages,deploy,package.json,package-lock.json,turbo.json,docker-compose.prod.yml,.env.production.example,.dockerignore} root@<IP-VPS>:/opt/formula/
```

Або `rsync` з Git Bash/WSL:

```bash
rsync -avz --exclude node_modules --exclude .next --exclude dist --exclude .turbo --exclude '.env*' \
  /d/NORIS_PRIVATE/FORMULA/ root@<IP-VPS>:/opt/formula/
```

**Важливо після копіювання з Windows:** приберіть CRLF у shell-скрипті, інакше буде `bad interpreter`:

```bash
sed -i 's/\r$//' /opt/formula/deploy/init-letsencrypt.sh
```

---

## 4. Конфіг `.env.production`

```bash
cd /opt/formula
cp .env.production.example .env.production
nano .env.production
```

Обов'язково заповнити:

| Змінна               | Що вписати                                    |
| -------------------- | --------------------------------------------- |
| `DOMAIN`             | `formula.example.com` (без `https://`)        |
| `LETSENCRYPT_EMAIL`  | ваша пошта (нагадування про сертифікат)       |
| `POSTGRES_PASSWORD`  | `openssl rand -base64 32`                     |
| `JWT_ACCESS_SECRET`  | `openssl rand -base64 48`                     |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 48` (інший, ніж access) |

Згенерувати всі три одразу:

```bash
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)"
echo "JWT_ACCESS_SECRET=$(openssl rand -base64 48)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 48)"
```

Необов'язково (можна залишити порожнім і додати потім):

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — вхід через Google. У Google Cloud Console створіть OAuth client типу **Web application** з redirect URI `https://<DOMAIN>/api/v1/auth/google/callback`.
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` (16+ випадкових символів) — Telegram-бот. Без токена бот просто спить.
- `GOOGLE_SITE_VERIFICATION` — токен Search Console.

Файл `.env.production` **ніколи не комітиться** (він у `.gitignore` / `.dockerignore`).

---

## 5. Перший сертифікат Let's Encrypt

nginx не стартує без сертифіката, а certbot не отримає сертифікат без nginx — скрипт розв'язує це сам:

```bash
cd /opt/formula

# 1) спочатку тест на staging-CA (не витрачає ліміти Let's Encrypt)
STAGING=1 bash deploy/init-letsencrypt.sh

# 2) якщо завершилось "Done." — отримуємо справжній
bash deploy/init-letsencrypt.sh
```

Далі контейнер `certbot` сам оновлює сертифікат двічі на день, а nginx перечитує його кожні 6 годин — нічого робити не треба.

Типові причини помилки тут: DNS ще не поширився (крок 2), порт 80 закритий (крок 1), у `DOMAIN` вписано `https://`.

---

## 6. Запуск стеку і міграції

```bash
cd /opt/formula

# Збірка образів web і api та запуск усіх сервісів (перший раз 5–10 хв)
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# SQL-міграції (створюють усі таблиці)
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm api node scripts/migrate.mjs
```

Перевірка:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps     # усі Up / healthy
curl -s https://formula.example.com/api/health                                # {"status":"ok",...}
```

Відкрийте `https://formula.example.com` у браузері.

Щоб не писати довгий префікс щоразу, додайте alias у `~/.bashrc`:

```bash
echo "alias fc='docker compose -f /opt/formula/docker-compose.prod.yml --env-file /opt/formula/.env.production'" >> ~/.bashrc
source ~/.bashrc
# далі: fc ps, fc logs -f api, fc up -d --build ...
```

---

## 7. Перший адмін

1. Зареєструйтесь на сайті звичайним користувачем (своя пошта).
2. Дайте собі права суперадміна (адміни живуть окремо в таблиці `admins`):

```bash
fc exec api node scripts/set-role.mjs your@email.com admin
```

3. Оновіть сторінку — з'явиться адмінка. Субадмінам ролі й розділи далі видаються з адмінки.

(Необов'язково) демо-предмет «Біологія» для перевірки:

```bash
fc exec api node scripts/seed-biology.mjs -- --grant=your@email.com
```

---

## 8. Оновлення після змін у коді

```bash
cd /opt/formula
git pull                      # або повторний rsync з кроку 3B
fc up -d --build              # пересобирає лише те, що змінилось
fc run --rm api node scripts/migrate.mjs   # якщо з'явились нові файли в apps/api/db/migrations
```

Простій під час оновлення — кілька секунд на перезапуск контейнерів web/api.

---

## 9. Бекапи (база + завантажені файли)

Файли з адмінки (відео, PDF, картинки) лежать у Docker-томі `formula_uploads`. Без них база посилатиметься на неіснуючі файли, тож бекапте **обидва**:

```bash
mkdir -p /opt/backups && cd /opt/backups

# База
fc exec -T postgres pg_dump -U formula formula | gzip > "db-$(date +%F).sql.gz"

# Файли
docker run --rm -v formula_uploads:/data:ro -v "$PWD":/backup alpine \
  tar czf "/backup/uploads-$(date +%F).tar.gz" -C /data .
```

Для автоматизації — покласти ці дві команди в скрипт і додати в `crontab -e`, напр. `0 3 * * * /opt/backups/backup.sh`, а архіви відправляти за межі сервера (rclone → Google Drive / S3).

Відновлення бази:

```bash
gunzip -c db-2026-10-29.sql.gz | fc exec -T postgres psql -U formula formula
```

---

## 10. Діагностика

```bash
fc logs -f api          # логи бекенду
fc logs -f web          # логи Next.js
fc logs -f nginx        # 502/504 — дивитись сюди
fc logs certbot         # проблеми з сертифікатом
fc restart api          # перезапустити один сервіс
fc exec postgres psql -U formula formula    # psql до прод-бази
docker system df && docker image prune -f   # звільнити місце від старих образів
```

| Симптом                                 | Куди дивитись                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| `502 Bad Gateway`                       | `fc ps` — api або web не піднялись; `fc logs api`                              |
| Сайт відкривається по http, не по https | крок 5 не завершився; `fc logs nginx`, `ls deploy/certbot/conf/live/`          |
| `set POSTGRES_PASSWORD` при `up`        | не передали `--env-file .env.production` або змінна порожня                    |
| Збірка падає / сервер зависає           | мало RAM — swap з кроку 1                                                      |
| Вхід через Google не працює             | redirect URI в Google Console ≠ `https://<DOMAIN>/api/v1/auth/google/callback` |
| `bad interpreter: ^M`                   | CRLF у скрипті — `sed -i 's/\r$//' deploy/init-letsencrypt.sh`                 |

---

## Чеклист

- [ ] Docker + ufw на VPS
- [ ] A-запис домену → IP, `dig` повертає IP
- [ ] Код у `/opt/formula`
- [ ] `.env.production` з DOMAIN, email, 3 секретами
- [ ] `init-letsencrypt.sh` завершився "Done."
- [ ] `fc up -d --build` + `migrate.mjs`
- [ ] `/api/health` відповідає, сайт відкривається по https
- [ ] Зареєструвались + `set-role.mjs ... admin`
- [ ] Налаштовано бекап бази і тому `formula_uploads`

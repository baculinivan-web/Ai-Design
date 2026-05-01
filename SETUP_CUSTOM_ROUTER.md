# Настройка HTTP AI роутера для Cloudflare Pages

Ваш AI роутер работает по HTTP (без HTTPS), что блокируется браузерами при запросах с HTTPS-сайта. Cloudflare Functions решает эту проблему, работая как безопасный прокси.

## Шаги настройки

### 1. Добавьте API ключ (если требуется)

Если ваш роутер требует API ключ, добавьте его как секрет:

```bash
npx wrangler pages secret put CUSTOM_API_KEY
```

Если API ключ не требуется, можно использовать пустое значение или любую строку.

### 2. Настройте переменные окружения в Cloudflare Pages Dashboard

Перейдите в: **Cloudflare Dashboard → Pages → Ваш проект → Settings → Environment variables**

Добавьте следующие переменные:

#### PROVIDERS_CONFIG
```json
{"openai":{"base_url":"https://api.openai.com","api_key_env":"OPENAI_API_KEY"},"openrouter":{"base_url":"https://openrouter.ai/api/v1","api_key_env":"OPENROUTER_API_KEY"},"custom":{"base_url":"http://46.226.165.141:20128/v1","api_key_env":"CUSTOM_API_KEY"}}
```

**Важно:** В Cloudflare Dashboard НЕ используйте внешние кавычки. Вставьте JSON как есть.

#### MODELS_CONFIG

Ваш роутер предоставляет следующие модели (примеры лучших):

```json
[{"id":"gpt-4o-mini","name":"GPT-4o mini","provider":"openai"},{"id":"google/gemini-2.0-flash-001","name":"Gemini 2.0 Flash","provider":"openrouter"},{"id":"cx/gpt-5.5-xhigh","name":"GPT-5.5 XHigh","provider":"custom"},{"id":"kr/claude-opus-4.7","name":"Claude Opus 4.7","provider":"custom"},{"id":"kr/claude-sonnet-4.5","name":"Claude Sonnet 4.5","provider":"custom"}]
```

**Доступные модели в вашем роутере:**
- `cx/gpt-5.5-xhigh` - GPT-5.5 XHigh (1M+ tokens, vision, reasoning)
- `cx/gpt-5.5-high` - GPT-5.5 High
- `cx/gpt-5.5-medium` - GPT-5.5 Medium
- `cx/gpt-5.5` - GPT-5.5
- `cx/gpt-5.5-mini` - GPT-5.5 Mini
- `kr/claude-opus-4.7` - Claude Opus 4.7 (1M tokens, vision, thinking)
- `kr/claude-sonnet-4.6` - Claude Sonnet 4.6
- `kr/claude-sonnet-4.5` - Claude Sonnet 4.5
- `if/qwen3-max` - Qwen3 Max
- `if/deepseek-v3.2` - DeepSeek V3.2
- `if/deepseek-r1` - DeepSeek R1 (reasoning)

Выберите нужные модели и добавьте их в `MODELS_CONFIG`.

### 3. Деплой изменений

После добавления переменных окружения, Cloudflare автоматически пересоберет ваш проект. Если этого не произошло:

```bash
npm run build
npx wrangler pages deploy dist
```

### 4. Проверка

1. Откройте ваш сайт
2. В селекторе моделей должна появиться новая модель
3. Выберите её и попробуйте сгенерировать дизайн
4. Cloudflare Functions будет проксировать запросы к вашему HTTP роутеру через HTTPS

## Как это работает

```
Браузер (HTTPS) 
  → Ваш сайт на Cloudflare Pages (HTTPS)
    → Cloudflare Function /v1/chat/completions (HTTPS)
      → Ваш AI роутер http://46.226.165.141:20128/v1 (HTTP)
```

Cloudflare Functions работает на сервере, поэтому может безопасно делать HTTP запросы к вашему роутеру, а браузер получает ответ через HTTPS.

## Troubleshooting

### Модель не появляется в списке
- Проверьте, что `PROVIDERS_CONFIG` и `MODELS_CONFIG` добавлены в Environment variables
- Убедитесь, что JSON валидный (без внешних кавычек в Cloudflare Dashboard)

### Ошибка "Missing API key"
- Добавьте секрет: `npx wrangler pages secret put CUSTOM_API_KEY`
- Или измените `"api_key_env"` на существующий секрет

### Ошибка при генерации
- Проверьте, что ваш роутер доступен: `curl http://46.226.165.141:20128/v1/models`
- Убедитесь, что `"id"` модели совпадает с тем, что принимает ваш роутер
- Проверьте логи в Cloudflare Dashboard → Pages → Ваш проект → Functions

### Локальная разработка

Для локальной разработки добавьте в `.env`:
```env
CUSTOM_API_KEY=your_key_here
PROVIDERS_CONFIG={"custom":{"base_url":"http://46.226.165.141:20128/v1","api_key_env":"CUSTOM_API_KEY"}}
MODELS_CONFIG=[{"id":"custom-model","name":"Custom AI Model","provider":"custom"}]
```

Затем запустите:
```bash
npm run dev
```

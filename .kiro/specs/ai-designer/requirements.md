# Requirements Document

## Introduction

AI Designer - веб-приложение для генерации дизайнов приглашений на выпускной с использованием AI-модели GLM4.7. Пользователь вводит текстовый промпт, система генерирует HTML-дизайн и преобразует его в изображение. Приложение имеет минималистичный чёрно-белый интерфейс с поддержкой dark/light mode.

## Glossary

- **AI_Designer**: Веб-приложение для генерации дизайнов приглашений
- **User**: Пользователь приложения, создающий дизайн приглашения
- **Prompt**: Текстовое описание желаемого дизайна, вводимое пользователем
- **GLM4.7**: AI-модель для генерации контента
- **ClawRouter**: Прокси/роутер для AI-моделей (https://github.com/BlockRunAI/ClawRouter)
- **HTML_Design**: Сгенерированный HTML-код, представляющий дизайн приглашения
- **Design_Image**: Изображение, полученное из HTML_Design путём конвертации
- **Theme_Mode**: Визуальная тема интерфейса (dark или light)

## Requirements

### Requirement 1: Главная страница с полем ввода промпта

**User Story:** Как пользователь, я хочу видеть простую главную страницу с полем для ввода промпта, чтобы быстро начать создание дизайна.

#### Acceptance Criteria

1. WHEN пользователь открывает главную страницу, THE AI_Designer SHALL отобразить большое поле ввода для промпта с placeholder "design anything"
2. THE AI_Designer SHALL отображать поле ввода по центру страницы
3. WHILE dark mode активен, THE AI_Designer SHALL отображать чёрный фон с белым текстом
4. WHILE light mode активен, THE AI_Designer SHALL отображать белый фон с чёрным текстом
5. WHEN поле ввода пустое, THE AI_Designer SHALL отображать placeholder текст "design anything"

### Requirement 2: Переключение темы интерфейса

**User Story:** Как пользователь, я хочу переключать между dark и light режимами, чтобы выбрать комфортный для глаз интерфейс.

#### Acceptance Criteria

1. THE AI_Designer SHALL предоставить кнопку переключения темы в верхней части страницы
2. WHEN пользователь нажимает кнопку переключения темы, THE AI_Designer SHALL изменить Theme_Mode на противоположный
3. THE AI_Designer SHALL сохранять выбранную тему в localStorage
4. WHEN пользователь возвращается на страницу, THE AI_Designer SHALL восстановить сохранённую тему

### Requirement 3: Генерация дизайна через AI

**User Story:** Как пользователь, я хочу вводить промпт и получать сгенерированный дизайн приглашения, чтобы создать уникальное приглашение на выпускной.

#### Acceptance Criteria

1. WHEN пользователь вводит промпт и нажимает кнопку генерации, THE AI_Designer SHALL отправить запрос к ClawRouter для генерации HTML_Design через GLM4.7
2. WHILE запрос обрабатывается, THE AI_Designer SHALL отображать индикатор загрузки
3. WHEN HTML_Design успешно сгенерирован, THE AI_Designer SHALL отобразить результат пользователю
4. IF ClawRouter возвращает ошибку, THEN THE AI_Designer SHALL отобразить информативное сообщение об ошибке
5. IF сетевое соединение прервано, THEN THE AI_Designer SHALL отобразить сообщение о проблеме с соединением

### Requirement 4: Конвертация HTML в изображение

**User Story:** Как пользователь, я хочу получать результат в виде изображения, чтобы легко скачать и использовать дизайн приглашения.

#### Acceptance Criteria

1. WHEN HTML_Design успешно сгенерирован, THE AI_Designer SHALL конвертировать HTML_Design в Design_Image
2. THE AI_Designer SHALL отображать Design_Image в интерфейсе после конвертации
3. IF конвертация завершается с ошибкой, THEN THE AI_Designer SHALL отобразить HTML_Design как fallback

### Requirement 5: Скачивание изображения

**User Story:** Как пользователь, я хочу скачивать сгенерированное изображение, чтобы использовать его для приглашений.

#### Acceptance Criteria

1. WHEN Design_Image успешно создан, THE AI_Designer SHALL отобразить кнопку "Скачать"
2. WHEN пользователь нажимает кнопку "Скачать", THE AI_Designer SHALL инициировать скачивание Design_Image в формате PNG
3. THE AI_Designer SHALL предложить пользователю указать имя файла перед скачиванием

### Requirement 6: Интеграция с ClawRouter

**User Story:** Как разработчик, я хочу интегрировать AI_Designer с ClawRouter, чтобы использовать GLM4.7 для генерации дизайнов.

#### Acceptance Criteria

1. THE AI_Designer SHALL отправлять HTTP-запросы к ClawRouter API endpoint
2. THE AI_Designer SHALL передавать пользовательский промпт и системный промпт в запросе
3. THE AI_Designer SHALL обрабатывать ответы от ClawRouter в формате JSON
4. IF ClawRouter недоступен, THEN THE AI_Designer SHALL отобразить сообщение о недоступности сервиса

### Requirement 7: Адаптивный дизайн

**User Story:** Как пользователь, я хочу использовать приложение на разных устройствах, чтобы создавать приглашения с телефона или компьютера.

#### Acceptance Criteria

1. THE AI_Designer SHALL корректно отображаться на экранах шириной от 320px до 1920px
2. WHEN ширина экрана меньше 768px, THE AI_Designer SHALL адаптировать размер поля ввода и кнопок
3. THE AI_Designer SHALL поддерживать touch-взаимодействие на мобильных устройствах

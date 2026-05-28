/**
 * =============================================================
 *  РОЗДІЛ 8 — Серверна архітектура додатку
 *  Файл: server.js
 * =============================================================
 *
 *  Express.js сервер для IT-блогу "ByteLog".
 *  Реалізує REST API з такими маршрутами:
 *
 *    GET  /api/articles          — список статей
 *    GET  /api/articles/:id      — стаття за ID
 *    GET  /api/articles/featured — рекомендовані
 *    POST /api/articles/:id/like — лайк
 *    GET  /api/authors           — список авторів
 *    GET  /api/authors/:id       — автор за ID
 *    GET  /api/categories        — список категорій
 *    GET  /api/articles/:id/comments   — коментарі
 *    POST /api/articles/:id/comments   — новий коментар
 *    POST /api/subscribe         — підписка
 *    POST /api/contact           — форма контакту
 *    GET  /api/search?q=...      — пошук
 *    GET  /api/stats             — статистика
 *
 *  Для запуску в реальному середовищі:
 *    npm install express cors helmet morgan
 *    node server.js
 * =============================================================
 */

/*
 * ─── ЗАЛЕЖНОСТІ ───
 * У реальному Node.js-середовищі:
 *
 * const express = require('express');
 * const cors    = require('cors');
 * const helmet  = require('helmet');
 * const morgan  = require('morgan');
 * const path    = require('path');
 *
 * Нижче наведено повний код сервера як документацію архітектури.
 */

// ══════════════════════════════════════════════════════════
//  КОНФІГУРАЦІЯ СЕРВЕРА
// ══════════════════════════════════════════════════════════

const SERVER_CONFIG = {
  port:    process?.env?.PORT || 3000,
  host:    '0.0.0.0',
  env:     process?.env?.NODE_ENV || 'development',

  // CORS — дозволені джерела запитів
  cors: {
    origin: ['http://localhost:3000', 'https://bytelog.ua'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },

  // Ліміти для захисту від зловживань
  rateLimit: {
    windowMs:       15 * 60 * 1000, // 15 хвилин
    max:            100,             // max 100 запитів за вікно
    searchMax:      20,              // max 20 пошукових запитів
    contactMax:     5                // max 5 повідомлень
  },

  // Пагінація за замовчуванням
  pagination: {
    defaultLimit: 6,
    maxLimit:     50
  }
};

// ══════════════════════════════════════════════════════════
//  МІДЛВАР
// ══════════════════════════════════════════════════════════

/**
 * Middleware для логування запитів
 * morgan('combined') у production, morgan('dev') у development
 */
function loggerMiddleware(req, res, next) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
}

/**
 * Middleware для валідації пагінації
 */
function paginationMiddleware(req, res, next) {
  const limit  = Math.min(
    parseInt(req.query.limit)  || SERVER_CONFIG.pagination.defaultLimit,
    SERVER_CONFIG.pagination.maxLimit
  );
  const offset = Math.max(parseInt(req.query.offset) || 0, 0);
  req.pagination = { limit, offset };
  next();
}

/**
 * Middleware для обробки помилок
 */
function errorMiddleware(err, req, res, next) {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    ok:    false,
    error: SERVER_CONFIG.env === 'development' ? err.message : 'Внутрішня помилка сервера'
  });
}

/**
 * Хелпер для відповідей
 */
const sendOk   = (res, data, status = 200) => res.status(status).json({ ok: true,  data });
const sendFail = (res, error, status = 400) => res.status(status).json({ ok: false, error });

// ══════════════════════════════════════════════════════════
//  МАРШРУТИ — ARTICLES
// ══════════════════════════════════════════════════════════

const articleRoutes = {

  /** GET /api/articles */
  getAll(req, res) {
    const { category, tag } = req.query;
    const { limit, offset } = req.pagination;

    let items = [...(typeof articles !== 'undefined' ? articles : [])];
    if (category && category !== 'all') items = items.filter(a => a.category === category);
    if (tag) items = items.filter(a => a.tags && a.tags.includes(tag));

    items.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    const total = items.length;
    const page  = items.slice(offset, offset + limit);

    sendOk(res, { items: page, total, limit, offset });
  },

  /** GET /api/articles/featured */
  getFeatured(req, res) {
    const items = (typeof articles !== 'undefined' ? articles : []).filter(a => a.featured);
    sendOk(res, { items, total: items.length });
  },

  /** GET /api/articles/:id */
  getOne(req, res) {
    const id      = parseInt(req.params.id);
    const article = typeof getArticleById !== 'undefined' ? getArticleById(id) : null;
    if (!article) return sendFail(res, 'Статтю не знайдено', 404);
    article.views = (article.views || 0) + 1;
    sendOk(res, article);
  },

  /** POST /api/articles/:id/like */
  like(req, res) {
    const id      = parseInt(req.params.id);
    const article = typeof getArticleById !== 'undefined' ? getArticleById(id) : null;
    if (!article) return sendFail(res, 'Статтю не знайдено', 404);
    article.likes = (article.likes || 0) + 1;
    sendOk(res, { id, likes: article.likes });
  },

  /** GET /api/stats */
  getStats(req, res) {
    const arts = typeof articles !== 'undefined' ? articles : [];
    sendOk(res, {
      totalArticles: arts.length,
      totalViews:    arts.reduce((s, a) => s + (a.views || 0), 0),
      totalLikes:    arts.reduce((s, a) => s + (a.likes || 0), 0),
    });
  }
};

// ══════════════════════════════════════════════════════════
//  МАРШРУТИ — AUTHORS
// ══════════════════════════════════════════════════════════

const authorRoutes = {

  /** GET /api/authors */
  getAll(req, res) {
    const items = typeof authors !== 'undefined' ? authors : [];
    sendOk(res, { items, total: items.length });
  },

  /** GET /api/authors/:id */
  getOne(req, res) {
    const id     = parseInt(req.params.id);
    const author = typeof getAuthorById !== 'undefined' ? getAuthorById(id) : null;
    if (!author) return sendFail(res, 'Автора не знайдено', 404);
    const authorArticles = (typeof articles !== 'undefined' ? articles : [])
      .filter(a => a.authorId === id);
    sendOk(res, { ...author, articles: authorArticles });
  }
};

// ══════════════════════════════════════════════════════════
//  МАРШРУТИ — CATEGORIES
// ══════════════════════════════════════════════════════════

const categoryRoutes = {

  /** GET /api/categories */
  getAll(req, res) {
    const cats = typeof categories !== 'undefined' ? categories : [];
    const withCount = cats.map(c => ({
      ...c,
      articleCount: typeof getArticleCountByCategory !== 'undefined'
        ? getArticleCountByCategory(c.id)
        : 0
    }));
    sendOk(res, { items: withCount, total: withCount.length });
  }
};

// ══════════════════════════════════════════════════════════
//  МАРШРУТИ — COMMENTS
// ══════════════════════════════════════════════════════════

const commentRoutes = {

  /** GET /api/articles/:id/comments */
  getByArticle(req, res) {
    const articleId = parseInt(req.params.id);
    const items = typeof getCommentsByArticleId !== 'undefined'
      ? getCommentsByArticleId(articleId)
      : [];
    sendOk(res, { items, total: items.length });
  },

  /** POST /api/articles/:id/comments */
  add(req, res) {
    const articleId = parseInt(req.params.id);
    const { guestName, text } = req.body || {};

    if (!text || text.trim().length < 3) {
      return sendFail(res, 'Текст коментаря занадто короткий');
    }
    if (!guestName || guestName.trim().length < 2) {
      return sendFail(res, "Вкажіть ваше ім'я");
    }

    const newComment = {
      id:        Date.now(),
      articleId,
      authorId:  null,
      guestName: guestName.trim(),
      text:      text.trim(),
      createdAt: new Date().toISOString().split('T')[0],
      likes:     0,
      parentId:  null
    };

    if (typeof comments !== 'undefined') comments.push(newComment);
    sendOk(res, newComment, 201);
  }
};

// ══════════════════════════════════════════════════════════
//  МАРШРУТИ — SUBSCRIBE / CONTACT / SEARCH
// ══════════════════════════════════════════════════════════

const utilRoutes = {

  /** POST /api/subscribe */
  subscribe(req, res) {
    const { email, categories: cats = [] } = req.body || {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      return sendFail(res, 'Невірний формат email-адреси');
    }

    console.log('[Subscribe] Новий підписник:', email);
    sendOk(res, { message: 'Підписку оформлено. Перевірте пошту.' });
  },

  /** POST /api/contact */
  contact(req, res) {
    const { name, email, subject, message } = req.body || {};

    if (!name || !email || !message) {
      return sendFail(res, "Заповніть усі обов'язкові поля");
    }

    console.log('[Contact] Нове повідомлення від:', name, email);
    sendOk(res, { message: 'Повідомлення надіслано. Відповімо протягом 24 годин.' });
  },

  /** GET /api/search?q= */
  search(req, res) {
    const { q, limit = 5 } = req.query;

    if (!q || q.trim().length < 2) {
      return sendFail(res, 'Запит занадто короткий (мінімум 2 символи)');
    }

    const results = typeof searchArticles !== 'undefined'
      ? searchArticles(q.trim()).slice(0, parseInt(limit))
      : [];

    sendOk(res, { query: q, items: results, total: results.length });
  }
};

// ══════════════════════════════════════════════════════════
//  СХЕМА РЕЄСТРАЦІЇ МАРШРУТІВ (для Express)
// ══════════════════════════════════════════════════════════

/**
 * У реальному Node.js проєкті реєстрація маршрутів:
 *
 * const app = express();
 * app.use(express.json());
 * app.use(cors(SERVER_CONFIG.cors));
 * app.use(helmet());
 * app.use(morgan(SERVER_CONFIG.env === 'production' ? 'combined' : 'dev'));
 * app.use(loggerMiddleware);
 *
 * // Статичні файли
 * app.use(express.static(path.join(__dirname, 'public')));
 *
 * // API маршрути
 * app.get ('/api/articles',              paginationMiddleware, articleRoutes.getAll);
 * app.get ('/api/articles/featured',     articleRoutes.getFeatured);
 * app.get ('/api/articles/stats',        articleRoutes.getStats);
 * app.get ('/api/articles/:id',          articleRoutes.getOne);
 * app.post('/api/articles/:id/like',     articleRoutes.like);
 * app.get ('/api/articles/:id/comments', commentRoutes.getByArticle);
 * app.post('/api/articles/:id/comments', commentRoutes.add);
 * app.get ('/api/authors',               authorRoutes.getAll);
 * app.get ('/api/authors/:id',           authorRoutes.getOne);
 * app.get ('/api/categories',            categoryRoutes.getAll);
 * app.post('/api/subscribe',             utilRoutes.subscribe);
 * app.post('/api/contact',               utilRoutes.contact);
 * app.get ('/api/search',                utilRoutes.search);
 *
 * // SPA fallback
 * app.get('*', (req, res) => {
 *   res.sendFile(path.join(__dirname, 'public', 'index.html'));
 * });
 *
 * app.use(errorMiddleware);
 *
 * app.listen(SERVER_CONFIG.port, SERVER_CONFIG.host, () => {
 *   console.log(`ByteLog server: http://localhost:${SERVER_CONFIG.port}`);
 * });
 */

// ══════════════════════════════════════════════════════════
//  АРХІТЕКТУРА ПРОЕКТУ — СТРУКТУРА ФАЙЛІВ
// ══════════════════════════════════════════════════════════

/**
 * bytelog/
 * ├── public/                  ← Статичні файли (клієнт)
 * │   ├── index.html
 * │   ├── style.css
 * │   ├── script.js
 * │   ├── data.js
 * │   ├── api.js
 * │   ├── db.js
 * │   ├── integrations.js
 * │   └── sw.js               ← Service Worker
 * │
 * ├── server/                  ← Серверна частина (Node.js)
 * │   ├── server.js           ← Головний файл сервера
 * │   ├── routes/
 * │   │   ├── articles.js
 * │   │   ├── authors.js
 * │   │   ├── categories.js
 * │   │   ├── comments.js
 * │   │   └── utils.js
 * │   ├── middleware/
 * │   │   ├── auth.js
 * │   │   ├── rateLimit.js
 * │   │   └── validate.js
 * │   └── db/
 * │       ├── schema.sql
 * │       └── seed.js
 * │
 * ├── package.json
 * ├── .env                     ← Змінні середовища
 * └── README.md
 */

// Експорт конфігурації та обробників для документування
const ServerArchitecture = {
  config:   SERVER_CONFIG,
  routes:   { articleRoutes, authorRoutes, categoryRoutes, commentRoutes, utilRoutes },
  middleware: { loggerMiddleware, paginationMiddleware, errorMiddleware }
};

console.log('[Server] Архітектуру сервера ByteLog визначено');
console.log('[Server] Порт:', SERVER_CONFIG.port, '| Середовище:', SERVER_CONFIG.env);

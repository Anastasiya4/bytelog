/**
 * =============================================================
 *  РОЗДІЛ 5 — Механізми отримання та оновлення даних
 *  Файл: api.js
 * =============================================================
 *
 *  Імітує REST API для роботи з даними блогу.
 *  У реальному проєкті замість локальних масивів
 *  використовувались би fetch()-запити до сервера.
 *
 *  Реалізовані методи:
 *    ArticleAPI   — CRUD для статей
 *    AuthorAPI    — отримання авторів
 *    CommentAPI   — отримання та додавання коментарів
 *    SubscriberAPI— підписка на розсилку
 *    SearchAPI    — повнотекстовий пошук
 * =============================================================
 */

// ─── Утиліта: імітація затримки мережевого запиту ─────────
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Утиліта: відповідь у форматі {ok, data, error} ──────
const ok    = (data)    => ({ ok: true,  data,  error: null });
const fail  = (message) => ({ ok: false, data: null, error: message });

// ══════════════════════════════════════════════════════════
//  ArticleAPI — робота зі статтями
// ══════════════════════════════════════════════════════════
const ArticleAPI = {

  /**
   * GET /api/articles
   * Отримати всі статті (з опціональною фільтрацією)
   * @param {Object} params
   * @param {string} [params.category] - фільтр за категорією
   * @param {string} [params.tag]      - фільтр за тегом
   * @param {number} [params.limit]    - ліміт результатів
   * @param {number} [params.offset]   - зміщення (пагінація)
   * @returns {Promise<{ok, data, error}>}
   */
  async getAll({ category = null, tag = null, limit = 10, offset = 0 } = {}) {
    await delay();
    try {
      let result = [...articles]; // копія масиву з data.js

      if (category && category !== 'all') {
        result = result.filter(a => a.category === category);
      }
      if (tag) {
        result = result.filter(a => a.tags.includes(tag));
      }

      const total = result.length;
      const paginated = result.slice(offset, offset + limit);

      return ok({ items: paginated, total, limit, offset });
    } catch (e) {
      return fail('Помилка отримання статей: ' + e.message);
    }
  },

  /**
   * GET /api/articles/:id
   * Отримати одну статтю за ID
   * @param {number} id
   * @returns {Promise<{ok, data, error}>}
   */
  async getById(id) {
    await delay();
    const article = getArticleById(id);
    if (!article) return fail(`Статтю з ID ${id} не знайдено`);
    article.views++; // імітація лічильника переглядів
    return ok(article);
  },

  /**
   * GET /api/articles/featured
   * Отримати рекомендовані статті
   * @returns {Promise<{ok, data, error}>}
   */
  async getFeatured() {
    await delay();
    const featured = articles.filter(a => a.featured);
    return ok({ items: featured, total: featured.length });
  },

  /**
   * POST /api/articles/:id/like
   * Поставити лайк статті
   * @param {number} id
   * @returns {Promise<{ok, data, error}>}
   */
  async like(id) {
    await delay(150);
    const article = getArticleById(id);
    if (!article) return fail(`Статтю з ID ${id} не знайдено`);
    article.likes++;
    return ok({ id, likes: article.likes });
  },

  /**
   * GET /api/articles/stats
   * Отримати загальну статистику блогу
   * @returns {Promise<{ok, data, error}>}
   */
  async getStats() {
    await delay(100);
    return ok({
      totalArticles:  articles.length,
      totalAuthors:   authors.length,
      totalViews:     articles.reduce((sum, a) => sum + a.views, 0),
      totalLikes:     articles.reduce((sum, a) => sum + a.likes, 0),
      byCategory:     categories.map(c => ({
        id:    c.id,
        name:  c.name,
        count: getArticleCountByCategory(c.id)
      }))
    });
  }
};

// ══════════════════════════════════════════════════════════
//  AuthorAPI — робота з авторами
// ══════════════════════════════════════════════════════════
const AuthorAPI = {

  /**
   * GET /api/authors
   * Отримати всіх авторів
   */
  async getAll() {
    await delay();
    return ok({ items: authors, total: authors.length });
  },

  /**
   * GET /api/authors/:id
   * Отримати автора за ID разом з його статтями
   */
  async getById(id) {
    await delay();
    const author = getAuthorById(id);
    if (!author) return fail(`Автора з ID ${id} не знайдено`);
    const authorArticles = articles.filter(a => a.authorId === id);
    return ok({ ...author, articles: authorArticles });
  }
};

// ══════════════════════════════════════════════════════════
//  CommentAPI — коментарі
// ══════════════════════════════════════════════════════════
const CommentAPI = {

  /**
   * GET /api/articles/:articleId/comments
   * Отримати коментарі до статті
   */
  async getByArticle(articleId) {
    await delay();
    const result = getCommentsByArticleId(articleId);
    return ok({ items: result, total: result.length });
  },

  /**
   * POST /api/articles/:articleId/comments
   * Додати новий коментар
   * @param {number} articleId
   * @param {{guestName: string, text: string}} data
   */
  async add(articleId, { guestName, text }) {
    await delay(400);

    if (!text || text.trim().length < 3) {
      return fail('Текст коментаря занадто короткий');
    }
    if (!guestName || guestName.trim().length < 2) {
      return fail("Вкажіть ваше ім'я");
    }

    const newComment = {
      id:        comments.length + 1,
      articleId,
      authorId:  null,
      guestName: guestName.trim(),
      text:      text.trim(),
      createdAt: new Date().toISOString().split('T')[0],
      likes:     0,
      parentId:  null
    };
    comments.push(newComment);
    return ok(newComment);
  },

  /**
   * POST /api/comments/:id/like
   * Лайкнути коментар
   */
  async like(commentId) {
    await delay(150);
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return fail('Коментар не знайдено');
    comment.likes++;
    return ok({ id: commentId, likes: comment.likes });
  }
};

// ══════════════════════════════════════════════════════════
//  SubscriberAPI — підписка на розсилку
// ══════════════════════════════════════════════════════════
const SubscriberAPI = {

  /**
   * POST /api/subscribe
   * Підписатися на розсилку
   * @param {string} email
   * @param {string[]} [categories]
   */
  async subscribe(email, categories = []) {
    await delay(500);

    // Валідація email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail('Невірний формат email-адреси');
    }

    // Перевірка дублікату
    if (subscribers.find(s => s.email === email)) {
      return fail('Ця email-адреса вже підписана');
    }

    const newSubscriber = {
      id:           subscribers.length + 1,
      email:        email.toLowerCase().trim(),
      subscribedAt: new Date().toISOString().split('T')[0],
      confirmed:    false, // потребує підтвердження по email
      categories
    };
    subscribers.push(newSubscriber);
    return ok({ message: 'Підписку оформлено. Перевірте пошту для підтвердження.' });
  },

  /**
   * DELETE /api/subscribe
   * Відписатися від розсилки
   */
  async unsubscribe(email) {
    await delay(300);
    const index = subscribers.findIndex(s => s.email === email);
    if (index === -1) return fail('Email не знайдено серед підписників');
    subscribers.splice(index, 1);
    return ok({ message: 'Підписку скасовано' });
  }
};

// ══════════════════════════════════════════════════════════
//  SearchAPI — пошук
// ══════════════════════════════════════════════════════════
const SearchAPI = {

  /**
   * GET /api/search?q=query
   * Повнотекстовий пошук по статтях
   * @param {string} query
   * @param {number} [limit]
   */
  async search(query, limit = 5) {
    await delay(200);

    if (!query || query.trim().length < 2) {
      return fail('Запит занадто короткий (мінімум 2 символи)');
    }

    const results = searchArticles(query.trim()).slice(0, limit);
    return ok({
      query,
      items: results,
      total: results.length
    });
  }
};

// ══════════════════════════════════════════════════════════
//  ContactAPI — форма зворотнього зв'язку
// ══════════════════════════════════════════════════════════
const ContactAPI = {

  /**
   * POST /api/contact
   * Надіслати повідомлення команді
   * @param {{name, email, subject, message}} data
   */
  async send({ name, email, subject, message }) {
    await delay(600);

    if (!name || !email || !message) {
      return fail("Заповніть усі обов'язкові поля");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail('Невірний формат email-адреси');
    }

    // У реальному проєкті — надсилання на сервер / SMTP
    console.log('[ContactAPI] Нове повідомлення:', { name, email, subject });
    return ok({ message: 'Повідомлення надіслано. Відповімо протягом 24 годин.' });
  }
};

// ══════════════════════════════════════════════════════════
//  Клас LocalStorage Cache — кешування відповідей
// ══════════════════════════════════════════════════════════
class ApiCache {
  constructor(ttlSeconds = 300) {
    this.store = new Map();
    this.ttl   = ttlSeconds * 1000;
  }

  /** Отримати значення з кешу */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  /** Зберегти значення в кеш */
  set(key, value) {
    this.store.set(key, { value, timestamp: Date.now() });
  }

  /** Очистити кеш */
  clear() {
    this.store.clear();
  }

  /** Видалити конкретний ключ */
  invalidate(key) {
    this.store.delete(key);
  }
}

const apiCache = new ApiCache(300); // 5 хвилин TTL

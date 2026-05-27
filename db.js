/**
 * =============================================================
 *  РОЗДІЛ 6 — База даних для зберігання та отримання інформації
 *  Файл: db.js
 * =============================================================
 *
 *  Опис схеми реляційної бази даних для блогу "ByteLog".
 *  Реалізовано:
 *    1. SQL DDL-схема (сумісна з SQLite / PostgreSQL)
 *    2. Клас DatabaseManager — імітація DB-запитів через
 *       localStorage (для клієнтської демонстрації)
 *    3. Функції seed-ініціалізації бази даних
 *
 *  У production-версії замість localStorage
 *  використовуватиметься PostgreSQL + Node.js (pg або Prisma).
 * =============================================================
 */

// ══════════════════════════════════════════════════════════
//  1. SQL DDL — схема бази даних
// ══════════════════════════════════════════════════════════

/**
 * Повна SQL-схема бази даних блогу ByteLog.
 * Збережена як рядок для документування та можливого
 * виконання у серверному середовищі.
 */
const DB_SCHEMA_SQL = `
-- ─── Таблиця категорій ──────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id          TEXT        PRIMARY KEY,          -- slug: 'web', 'ai', ...
    name        TEXT        NOT NULL,
    icon        TEXT        NOT NULL DEFAULT '📄',
    description TEXT,
    color       TEXT        NOT NULL DEFAULT 'cat-default',
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Таблиця авторів ────────────────────────────────────
CREATE TABLE IF NOT EXISTS authors (
    id          INTEGER     PRIMARY KEY AUTOINCREMENT,
    name        TEXT        NOT NULL,
    initials    TEXT        NOT NULL,             -- 2 символи
    role        TEXT,
    bio         TEXT,
    avatar_url  TEXT,
    github_url  TEXT,
    twitter_url TEXT,
    linkedin_url TEXT,
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Таблиця навичок автора ─────────────────────────────
CREATE TABLE IF NOT EXISTS author_skills (
    id          INTEGER     PRIMARY KEY AUTOINCREMENT,
    author_id   INTEGER     NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    skill       TEXT        NOT NULL
);

-- ─── Таблиця тегів ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
    id          TEXT        PRIMARY KEY,          -- slug: 'javascript', 'react', ...
    label       TEXT        NOT NULL
);

-- ─── Таблиця статей ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
    id          INTEGER     PRIMARY KEY AUTOINCREMENT,
    title       TEXT        NOT NULL,
    slug        TEXT        NOT NULL UNIQUE,
    excerpt     TEXT,
    content     TEXT,
    category_id TEXT        NOT NULL REFERENCES categories(id),
    author_id   INTEGER     NOT NULL REFERENCES authors(id),
    published_at DATE,
    read_time   INTEGER     DEFAULT 5,            -- хвилини
    views       INTEGER     NOT NULL DEFAULT 0,
    likes       INTEGER     NOT NULL DEFAULT 0,
    featured    BOOLEAN     NOT NULL DEFAULT FALSE,
    cover_color TEXT        DEFAULT 'linear-gradient(135deg, #0ea5e9, #6366f1)',
    is_published BOOLEAN    NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Індекс для швидкого пошуку за категорією та датою
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_author   ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug     ON articles(slug);

-- ─── Таблиця зв'язку статей і тегів (M:M) ───────────────
CREATE TABLE IF NOT EXISTS article_tags (
    article_id  INTEGER     NOT NULL REFERENCES articles(id)  ON DELETE CASCADE,
    tag_id      TEXT        NOT NULL REFERENCES tags(id)       ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

-- ─── Таблиця коментарів ─────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
    id          INTEGER     PRIMARY KEY AUTOINCREMENT,
    article_id  INTEGER     NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    author_id   INTEGER     REFERENCES authors(id),          -- NULL для гостей
    guest_name  TEXT,                                        -- для незареєстрованих
    text        TEXT        NOT NULL,
    likes       INTEGER     NOT NULL DEFAULT 0,
    parent_id   INTEGER     REFERENCES comments(id),         -- для відповідей
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_commenter CHECK (
        author_id IS NOT NULL OR guest_name IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article_id);

-- ─── Таблиця підписників ────────────────────────────────
CREATE TABLE IF NOT EXISTS subscribers (
    id              INTEGER     PRIMARY KEY AUTOINCREMENT,
    email           TEXT        NOT NULL UNIQUE,
    subscribed_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed       BOOLEAN     NOT NULL DEFAULT FALSE,
    confirm_token   TEXT,                                    -- токен підтвердження
    unsubscribed_at TIMESTAMP                                -- дата відписки
);

-- ─── Таблиця категорій підписника (M:M) ─────────────────
CREATE TABLE IF NOT EXISTS subscriber_categories (
    subscriber_id   INTEGER     NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    category_id     TEXT        NOT NULL REFERENCES categories(id)  ON DELETE CASCADE,
    PRIMARY KEY (subscriber_id, category_id)
);

-- ─── Таблиця контактних повідомлень ─────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
    id          INTEGER     PRIMARY KEY AUTOINCREMENT,
    name        TEXT        NOT NULL,
    email       TEXT        NOT NULL,
    subject     TEXT,
    message     TEXT        NOT NULL,
    is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

// ══════════════════════════════════════════════════════════
//  2. Типові SQL-запити (для документування та сервера)
// ══════════════════════════════════════════════════════════

const QUERIES = {

  // Всі статті з авторами та категоріями
  getAllArticles: `
    SELECT
      a.id, a.title, a.slug, a.excerpt,
      a.published_at, a.read_time, a.views, a.likes, a.featured,
      a.cover_color,
      c.id   AS category_id,   c.name  AS category_name, c.icon AS category_icon,
      au.id  AS author_id,     au.name AS author_name,   au.initials AS author_initials
    FROM articles a
    JOIN categories c  ON a.category_id = c.id
    JOIN authors    au ON a.author_id   = au.id
    WHERE a.is_published = TRUE
    ORDER BY a.published_at DESC
    LIMIT ? OFFSET ?
  `,

  // Стаття за slug з тегами
  getArticleBySlug: `
    SELECT a.*, c.name AS category_name, c.icon AS category_icon,
           au.name AS author_name, au.initials AS author_initials, au.role AS author_role,
           GROUP_CONCAT(t.label) AS tag_labels
    FROM articles a
    JOIN categories c  ON a.category_id = c.id
    JOIN authors    au ON a.author_id   = au.id
    LEFT JOIN article_tags at ON a.id = at.article_id
    LEFT JOIN tags         t  ON at.tag_id = t.id
    WHERE a.slug = ? AND a.is_published = TRUE
    GROUP BY a.id
  `,

  // Статті за категорією
  getByCategory: `
    SELECT a.id, a.title, a.slug, a.excerpt, a.published_at, a.read_time,
           a.views, a.likes, a.cover_color
    FROM articles a
    WHERE a.category_id = ? AND a.is_published = TRUE
    ORDER BY a.published_at DESC
  `,

  // Повнотекстовий пошук
  searchArticles: `
    SELECT a.id, a.title, a.slug, a.excerpt, a.published_at,
           c.name AS category_name, c.icon AS category_icon
    FROM articles a
    JOIN categories c ON a.category_id = c.id
    WHERE a.is_published = TRUE
      AND (a.title   LIKE '%' || ? || '%'
        OR a.excerpt LIKE '%' || ? || '%'
        OR a.content LIKE '%' || ? || '%')
    ORDER BY a.views DESC
    LIMIT ?
  `,

  // Статистика
  getStats: `
    SELECT
      (SELECT COUNT(*) FROM articles   WHERE is_published = TRUE) AS total_articles,
      (SELECT COUNT(*) FROM authors)                              AS total_authors,
      (SELECT SUM(views) FROM articles)                          AS total_views,
      (SELECT SUM(likes) FROM articles)                          AS total_likes,
      (SELECT COUNT(*) FROM subscribers WHERE confirmed = TRUE)  AS total_subscribers
  `
};

// ══════════════════════════════════════════════════════════
//  3. DatabaseManager — клієнтська імітація через Map
// ══════════════════════════════════════════════════════════

class DatabaseManager {
  constructor() {
    this.tables = {
      categories:    new Map(),
      authors:       new Map(),
      articles:      new Map(),
      tags:          new Map(),
      comments:      new Map(),
      subscribers:   new Map(),
      article_tags:  [],
      author_skills: [],
    };
    this._autoId = {
      authors: 10, articles: 10, comments: 10, subscribers: 10
    };
    this._initialized = false;
  }

  /** Ініціалізація — завантаження seed-даних з data.js */
  async init() {
    if (this._initialized) return;

    // Seed categories
    categories.forEach(c => this.tables.categories.set(c.id, { ...c }));

    // Seed tags
    tags.forEach(t => this.tables.tags.set(t.id, { ...t }));

    // Seed authors
    authors.forEach(a => {
      this.tables.authors.set(a.id, {
        id:           a.id,
        name:         a.name,
        initials:     a.initials,
        role:         a.role,
        bio:          a.bio,
        avatar_url:   a.avatar,
        github_url:   a.social.github,
        twitter_url:  a.social.twitter,
        linkedin_url: a.social.linkedin,
        created_at:   new Date().toISOString()
      });
      // skills
      a.skills.forEach(skill => {
        this.tables.author_skills.push({ author_id: a.id, skill });
      });
    });

    // Seed articles
    articles.forEach(a => {
      this.tables.articles.set(a.id, {
        id:           a.id,
        title:        a.title,
        slug:         a.slug,
        excerpt:      a.excerpt,
        content:      a.content,
        category_id:  a.category,
        author_id:    a.authorId,
        published_at: a.publishedAt,
        read_time:    a.readTime,
        views:        a.views,
        likes:        a.likes,
        featured:     a.featured,
        cover_color:  a.coverColor,
        is_published: true,
        created_at:   new Date().toISOString(),
        updated_at:   new Date().toISOString()
      });
      // tags M:M
      a.tags.forEach(tagId => {
        this.tables.article_tags.push({ article_id: a.id, tag_id: tagId });
      });
    });

    // Seed comments
    comments.forEach(c => this.tables.comments.set(c.id, { ...c }));

    this._initialized = true;
    console.log('[DB] Ініціалізовано:', {
      categories: this.tables.categories.size,
      articles:   this.tables.articles.size,
      authors:    this.tables.authors.size,
    });
  }

  // ── Запити ──────────────────────────────────────────────

  /** SELECT всі статті з JOIN-даними */
  selectArticles({ category = null, limit = 10, offset = 0 } = {}) {
    let rows = [...this.tables.articles.values()]
      .filter(a => a.is_published);

    if (category && category !== 'all') {
      rows = rows.filter(a => a.category_id === category);
    }

    rows.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    const total = rows.length;
    rows = rows.slice(offset, offset + limit);

    // JOIN authors та categories
    rows = rows.map(a => ({
      ...a,
      category:   this.tables.categories.get(a.category_id),
      author:     this.tables.authors.get(a.author_id),
      tags:       this.tables.article_tags
                    .filter(at => at.article_id === a.id)
                    .map(at => this.tables.tags.get(at.tag_id))
                    .filter(Boolean)
    }));

    return { rows, total };
  }

  /** SELECT стаття за ID */
  selectArticleById(id) {
    const a = this.tables.articles.get(id);
    if (!a) return null;
    return {
      ...a,
      category: this.tables.categories.get(a.category_id),
      author:   this.tables.authors.get(a.author_id),
      tags:     this.tables.article_tags
                  .filter(at => at.article_id === id)
                  .map(at => this.tables.tags.get(at.tag_id))
                  .filter(Boolean),
      comments: [...this.tables.comments.values()]
                  .filter(c => c.articleId === id || c.article_id === id)
    };
  }

  /** UPDATE лайки статті */
  updateArticleLikes(id) {
    const a = this.tables.articles.get(id);
    if (!a) return null;
    a.likes++;
    a.updated_at = new Date().toISOString();
    return a;
  }

  /** UPDATE перегляди статті */
  updateArticleViews(id) {
    const a = this.tables.articles.get(id);
    if (!a) return null;
    a.views++;
    a.updated_at = new Date().toISOString();
    return a;
  }

  /** INSERT новий коментар */
  insertComment({ article_id, guest_name, text, parent_id = null }) {
    const id = ++this._autoId.comments;
    const comment = {
      id,
      article_id,
      author_id:  null,
      guest_name,
      text,
      likes:      0,
      parent_id,
      created_at: new Date().toISOString()
    };
    this.tables.comments.set(id, comment);
    return comment;
  }

  /** INSERT підписник */
  insertSubscriber({ email, categories: cats = [] }) {
    // Перевірка унікальності
    const exists = [...this.tables.subscribers.values()]
      .find(s => s.email === email);
    if (exists) throw new Error('Email вже підписаний');

    const id = ++this._autoId.subscribers;
    const subscriber = {
      id,
      email,
      subscribed_at:  new Date().toISOString(),
      confirmed:      false,
      confirm_token:  Math.random().toString(36).slice(2),
      categories:     cats
    };
    this.tables.subscribers.set(id, subscriber);
    return subscriber;
  }

  /** SELECT коментарі за статтею */
  selectCommentsByArticle(articleId) {
    return [...this.tables.comments.values()]
      .filter(c => (c.article_id || c.articleId) === articleId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  /** SELECT пошук */
  selectSearch(query) {
    const q = query.toLowerCase();
    return [...this.tables.articles.values()]
      .filter(a => a.is_published && (
        a.title.toLowerCase().includes(q) ||
        (a.excerpt || '').toLowerCase().includes(q)
      ))
      .map(a => ({
        ...a,
        category: this.tables.categories.get(a.category_id),
      }));
  }

  /** SELECT статистика */
  selectStats() {
    const arts = [...this.tables.articles.values()].filter(a => a.is_published);
    return {
      total_articles:   arts.length,
      total_authors:    this.tables.authors.size,
      total_views:      arts.reduce((s, a) => s + a.views, 0),
      total_likes:      arts.reduce((s, a) => s + a.likes, 0),
      total_subscribers: [...this.tables.subscribers.values()]
                          .filter(s => s.confirmed).length,
      by_category: [...this.tables.categories.values()].map(c => ({
        id:    c.id,
        name:  c.name,
        count: arts.filter(a => a.category_id === c.id).length
      }))
    };
  }
}

// Singleton екземпляр бази даних
const db = new DatabaseManager();

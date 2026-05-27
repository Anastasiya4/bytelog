/**
 * =============================================================
 *  РОЗДІЛ 7 — Інтеграція сторонніх сервісів
 *  Файл: integrations.js
 * =============================================================
 *
 *  Реалізовані інтеграції:
 *    1. Google Fonts API     — підключення шрифтів
 *    2. GitHub API           — відображення репозиторію
 *    3. Web Share API        — нативне поширення
 *    4. Intersection Observer— анімація появи елементів
 *    5. Clipboard API        — копіювання посилань
 *    6. EmailJS (імітація)   — надсилання email з форми
 *    7. Open Graph / Meta    — SEO та соціальні мета-теги
 *    8. Service Worker       — офлайн-кешування (PWA-базис)
 * =============================================================
 */

// ══════════════════════════════════════════════════════════
//  1. GOOGLE FONTS API
//  Шрифти підключено через <link> у <head> (index.html):
//  https://fonts.googleapis.com/css2?family=Space+Mono&family=Syne:wght@400;600;700;800
//  CSS змінні: --font-sans: 'Syne'; --font-mono: 'Space Mono'
// ══════════════════════════════════════════════════════════

const GoogleFontsIntegration = {
  name: 'Google Fonts',
  type: 'CDN / Static',
  description: 'Підключення кастомних шрифтів без встановлення',

  /**
   * Динамічне підключення шрифту (альтернативний спосіб)
   * @param {string} family - назва сімейства шрифту
   * @param {string[]} weights - масив вагів
   */
  loadFont(family, weights = ['400', '700']) {
    const existing = document.querySelector(`link[data-font="${family}"]`);
    if (existing) return; // вже підключено

    const url = `https://fonts.googleapis.com/css2?family=${
      encodeURIComponent(family)
    }:wght@${weights.join(';')}&display=swap`;

    const link = document.createElement('link');
    link.rel          = 'stylesheet';
    link.href         = url;
    link.dataset.font = family;
    document.head.appendChild(link);
    console.log(`[GoogleFonts] Підключено: ${family}`);
  },

  /** Перевірка завантаженості шрифту */
  async isFontLoaded(family) {
    if (!document.fonts) return false;
    await document.fonts.ready;
    return document.fonts.check(`16px "${family}"`);
  }
};


// ══════════════════════════════════════════════════════════
//  2. GITHUB API
//  Відображає інформацію про GitHub-репозиторій блогу
// ══════════════════════════════════════════════════════════

const GitHubIntegration = {
  name:    'GitHub REST API',
  type:    'REST API / fetch',
  baseUrl: 'https://api.github.com',

  /**
   * Отримати інформацію про репозиторій
   * @param {string} owner - власник репо
   * @param {string} repo  - назва репо
   */
  async getRepo(owner, repo) {
    try {
      const res = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });
      if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
      const data = await res.json();
      return {
        ok: true,
        data: {
          name:        data.name,
          description: data.description,
          stars:       data.stargazers_count,
          forks:       data.forks_count,
          language:    data.language,
          url:         data.html_url,
          updated_at:  data.updated_at
        }
      };
    } catch (e) {
      console.warn('[GitHub] Не вдалось завантажити дані репо:', e.message);
      return { ok: false, error: e.message };
    }
  },

  /**
   * Відображає статистику репо у вказаному елементі
   * @param {string} selector - CSS-селектор контейнера
   * @param {string} owner
   * @param {string} repo
   */
  async renderRepoWidget(selector, owner, repo) {
    const container = document.querySelector(selector);
    if (!container) return;

    container.innerHTML = '<p class="loading">Завантаження даних GitHub...</p>';
    const result = await this.getRepo(owner, repo);

    if (!result.ok) {
      container.innerHTML = `<p class="error">GitHub недоступний</p>`;
      return;
    }

    const { name, description, stars, forks, language, url } = result.data;
    container.innerHTML = `
      <div class="github-widget">
        <div class="gh-header">
          <span class="gh-icon">🐙</span>
          <a href="${url}" target="_blank" rel="noopener">${owner}/${name}</a>
        </div>
        <p class="gh-desc">${description || ''}</p>
        <div class="gh-stats">
          <span>⭐ ${stars}</span>
          <span>🍴 ${forks}</span>
          <span>💻 ${language || 'HTML'}</span>
        </div>
      </div>
    `;
  }
};


// ══════════════════════════════════════════════════════════
//  3. WEB SHARE API
//  Нативне поширення контенту на мобільних пристроях
// ══════════════════════════════════════════════════════════

const ShareIntegration = {
  name: 'Web Share API',
  type: 'Browser Native API',

  /** Перевірити підтримку браузером */
  isSupported() {
    return Boolean(navigator.share);
  },

  /**
   * Поширити статтю
   * @param {Object} article - об'єкт статті
   */
  async shareArticle(article) {
    const shareData = {
      title: article.title,
      text:  article.excerpt,
      url:   `${window.location.origin}/#${article.slug}`
    };

    if (this.isSupported()) {
      try {
        await navigator.share(shareData);
        console.log('[Share] Успішно поширено');
        return { ok: true, method: 'native' };
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.warn('[Share] Помилка:', e.message);
        }
        return { ok: false, error: e.message };
      }
    } else {
      // Fallback: копіювання посилання
      return await ClipboardIntegration.copy(shareData.url);
    }
  }
};


// ══════════════════════════════════════════════════════════
//  4. INTERSECTION OBSERVER API
//  Анімація появи елементів при прокрутці
// ══════════════════════════════════════════════════════════

const AnimationIntegration = {
  name: 'Intersection Observer API',
  type: 'Browser Native API',
  _observer: null,

  /**
   * Ініціалізація спостерігача
   * @param {string} selector   - CSS-селектор елементів
   * @param {string} activeClass- клас для додавання
   * @param {number} threshold  - поріг видимості (0-1)
   */
  init(selector = '.animate-on-scroll', activeClass = 'in-view', threshold = 0.12) {
    if (!('IntersectionObserver' in window)) {
      // Fallback: показати всі без анімації
      document.querySelectorAll(selector)
        .forEach(el => el.classList.add(activeClass));
      return;
    }

    this._observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add(activeClass);
            this._observer.unobserve(entry.target); // спостерігати лише один раз
          }
        });
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll(selector)
      .forEach(el => this._observer.observe(el));

    console.log(`[Animation] Спостерігач запущено для: ${selector}`);
  },

  /**
   * Додати новий елемент до спостерігача
   */
  observe(element) {
    if (this._observer) this._observer.observe(element);
  },

  /** Зупинити всі спостереження */
  disconnect() {
    if (this._observer) this._observer.disconnect();
  }
};


// ══════════════════════════════════════════════════════════
//  5. CLIPBOARD API
//  Копіювання посилань та тексту
// ══════════════════════════════════════════════════════════

const ClipboardIntegration = {
  name: 'Clipboard API',
  type: 'Browser Native API',

  /**
   * Копіювати текст у буфер обміну
   * @param {string} text
   * @param {HTMLElement} [btn] - кнопка для візуального зворотного зв'язку
   */
  async copy(text, btn = null) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback для HTTP або старих браузерів
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      // Візуальне підтвердження
      if (btn) {
        const original = btn.textContent;
        btn.textContent = '✓ Скопійовано!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove('copied');
        }, 2000);
      }

      return { ok: true, method: 'clipboard' };
    } catch (e) {
      console.warn('[Clipboard] Помилка копіювання:', e.message);
      return { ok: false, error: e.message };
    }
  }
};


// ══════════════════════════════════════════════════════════
//  6. EMAILJS (імітація)
//  Надсилання email з форми контакту без серверу
// ══════════════════════════════════════════════════════════

const EmailIntegration = {
  name:        'EmailJS',
  type:        'Third-party SaaS API',
  serviceId:   'service_bytelog',   // ID сервісу в EmailJS
  templateId:  'template_contact',  // ID шаблону
  publicKey:   'YOUR_PUBLIC_KEY',   // публічний ключ

  /**
   * Ініціалізація EmailJS SDK
   * У реальному проєкті підключається через CDN:
   * <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
   */
  init() {
    if (typeof emailjs !== 'undefined') {
      emailjs.init({ publicKey: this.publicKey });
      console.log('[EmailJS] Ініціалізовано');
    } else {
      console.warn('[EmailJS] SDK не завантажено. Переконайтесь що підключено CDN.');
    }
  },

  /**
   * Надіслати email через EmailJS
   * @param {{name, email, subject, message}} formData
   */
  async send(formData) {
    // Імітація для демо (без реального EmailJS)
    console.log('[EmailJS] Імітація надсилання:', formData);
    await new Promise(r => setTimeout(r, 800));

    /* У реальному проєкті:
    try {
      await emailjs.send(this.serviceId, this.templateId, {
        from_name:    formData.name,
        from_email:   formData.email,
        subject:      formData.subject,
        message:      formData.message,
        to_email:     'hello@bytelog.ua'
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.text };
    }
    */

    return { ok: true, simulated: true };
  }
};


// ══════════════════════════════════════════════════════════
//  7. SEO — Open Graph та Meta-теги
//  Динамічне оновлення мета-тегів при відкритті статті
// ══════════════════════════════════════════════════════════

const SeoIntegration = {
  name: 'Open Graph / Meta Tags',
  type: 'HTML Meta API',

  /** Базові мета-теги сайту (в index.html) */
  defaults: {
    title:       'ByteLog — IT Блог для розробників',
    description: 'Статті, туторіали та новини зі світу веб-розробки, AI та кібербезпеки',
    image:       'https://bytelog.ua/og-image.png',
    url:         'https://bytelog.ua'
  },

  /**
   * Оновити мета-теги для конкретної статті
   * @param {Object} article
   */
  setArticleMeta(article) {
    document.title = `${article.title} | ByteLog`;
    this._setMeta('description',         article.excerpt);
    this._setMeta('og:title',            article.title);
    this._setMeta('og:description',      article.excerpt);
    this._setMeta('og:url',              `${window.location.origin}/#${article.slug}`);
    this._setMeta('og:type',             'article');
    this._setMeta('article:published_time', article.publishedAt);
    this._setMeta('twitter:card',        'summary_large_image');
    this._setMeta('twitter:title',       article.title);
    this._setMeta('twitter:description', article.excerpt);
  },

  /** Скинути мета-теги до дефолтних */
  resetMeta() {
    document.title = this.defaults.title;
    this._setMeta('description',    this.defaults.description);
    this._setMeta('og:title',       this.defaults.title);
    this._setMeta('og:description', this.defaults.description);
    this._setMeta('og:url',         this.defaults.url);
  },

  _setMeta(name, content) {
    if (!content) return;
    let el = document.querySelector(
      `meta[name="${name}"], meta[property="${name}"]`
    );
    if (!el) {
      el = document.createElement('meta');
      const attr = name.startsWith('og:') || name.startsWith('article:') ? 'property' : 'name';
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }
};


// ══════════════════════════════════════════════════════════
//  8. SERVICE WORKER REGISTRATION (PWA базис)
//  Офлайн-кешування статичних ресурсів
// ══════════════════════════════════════════════════════════

const ServiceWorkerIntegration = {
  name: 'Service Worker API',
  type: 'Browser Native API (PWA)',

  /**
   * Реєстрація Service Worker
   * Файл sw.js повинен бути в кореневій директорії
   */
  async register() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[SW] Service Worker не підтримується браузером');
      return { ok: false, error: 'Not supported' };
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('[SW] Зареєстровано, scope:', reg.scope);
      return { ok: true, registration: reg };
    } catch (e) {
      console.warn('[SW] Помилка реєстрації:', e.message);
      return { ok: false, error: e.message };
    }
  }
};

/* ── Вміст sw.js (Service Worker) ──────────────────────────

  Цей файл розміщується окремо як /sw.js:

  const CACHE_NAME = 'bytelog-v1';
  const ASSETS = [
    '/', '/index.html', '/style.css',
    '/script.js', '/data.js', '/api.js',
    '/db.js', '/integrations.js'
  ];

  self.addEventListener('install', e => {
    e.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(ASSETS))
    );
  });

  self.addEventListener('fetch', e => {
    e.respondWith(
      caches.match(e.request)
        .then(cached => cached || fetch(e.request))
    );
  });

*/


// ══════════════════════════════════════════════════════════
//  ІНІЦІАЛІЗАЦІЯ ВСІХ ІНТЕГРАЦІЙ
// ══════════════════════════════════════════════════════════

async function initIntegrations() {
  // 1. Перевірка шрифтів
  const fontLoaded = await GoogleFontsIntegration.isFontLoaded('Syne');
  if (!fontLoaded) {
    GoogleFontsIntegration.loadFont('Syne', ['400', '600', '700', '800']);
  }

  // 2. Анімація прокрутки
  AnimationIntegration.init(
    '.article-card, .author-card, .category-card, .hero-visual, .terminal',
    'in-view',
    0.1
  );

  // 3. EmailJS (якщо SDK підключено)
  EmailIntegration.init();

  // 4. Service Worker (для PWA)
  if (window.location.protocol === 'https:') {
    ServiceWorkerIntegration.register();
  }

  // 5. SEO дефолт
  SeoIntegration.resetMeta();

  console.log('[Integrations] Всі сервіси ініціалізовано');
}

// Запуск після завантаження DOM
document.addEventListener('DOMContentLoaded', initIntegrations);

/**
 * =============================================================
 *  script.js — Логіка IT-блогу "ByteLog"
 * =============================================================
 *  Розділ 3: Розміщення та стилізація елементів інтерфейсу
 *  - Рендер карток статей і авторів
 *  - Фільтрація за категоріями
 *  - Пошук
 *  - Модальне вікно статті
 *  - Мобільне меню
 *  - "Завантажити більше"
 *  - Підписка / Контакти (форми)
 *  - Прокрутка до верху
 * =============================================================
 */

// ─── Стан застосунку ───────────────────────────────────────
const state = {
  currentFilter:  "all",
  visibleCount:   4,          // скільки статей відображається
  itemsPerPage:   4,
  searchOpen:     false
};

// ─── DOM-елементи ──────────────────────────────────────────
const articlesGrid   = document.getElementById("articles-grid");
const authorsGrid    = document.getElementById("authors-grid");
const filterBtns     = document.querySelectorAll(".filter-btn");
const loadMoreBtn    = document.getElementById("load-more");
const searchToggle   = document.getElementById("search-toggle");
const searchClose    = document.getElementById("search-close");
const searchBar      = document.getElementById("search-bar");
const searchInput    = document.getElementById("search-input");
const searchResults  = document.getElementById("search-results");
const modalOverlay   = document.getElementById("modal-overlay");
const articleModal   = document.getElementById("article-modal");
const modalContent   = document.getElementById("modal-content");
const modalClose     = document.getElementById("modal-close");
const burger         = document.getElementById("burger");
const mainNav        = document.getElementById("main-nav");
const backToTop      = document.getElementById("back-to-top");
const siteHeader     = document.getElementById("site-header");


// ═══════════════════════════════════════════════════════════
//  1. РЕНДЕРИНГ КАРТОК СТАТЕЙ
// ═══════════════════════════════════════════════════════════

/**
 * Створює HTML картки статті
 * @param {Article} article
 * @returns {string} HTML-рядок картки
 */
function createArticleCard(article) {
  const author   = getAuthorById(article.authorId);
  const category = getCategoryById(article.category);

  return `
    <article class="article-card ${article.featured ? 'featured' : ''}" data-id="${article.id}" data-category="${article.category}">
      <div class="card-cover" style="background: ${article.coverColor}">
        <span class="card-category-badge ${category.color}">${category.icon} ${category.name}</span>
        ${article.featured ? '<span class="card-featured-badge">⭐ Вибране</span>' : ''}
      </div>
      <div class="card-body">
        <div class="card-meta">
          <span class="card-date">📅 ${formatDate(article.publishedAt)}</span>
          <span class="card-read">⏱ ${article.readTime} хв</span>
        </div>
        <h3 class="card-title">${article.title}</h3>
        <p class="card-excerpt">${article.excerpt}</p>
        <div class="card-tags">
          ${article.tags.slice(0, 3).map(t => `<span class="tag">#${t}</span>`).join('')}
        </div>
        <div class="card-footer">
          <div class="card-author">
            <div class="author-avatar-sm">${author ? author.initials : '??'}</div>
            <span>${author ? author.name : 'Невідомо'}</span>
          </div>
          <div class="card-stats">
            <span class="card-stat">👁 ${article.views.toLocaleString()}</span>
            <span class="card-stat">❤️ ${article.likes}</span>
          </div>
        </div>
        <button class="btn-read-more" onclick="openArticle(${article.id})">Читати →</button>
      </div>
    </article>
  `;
}

/**
 * Відображає статті з урахуванням фільтра та кількості
 */
function renderArticles() {
  const filtered = getArticlesByCategory(state.currentFilter);
  const visible  = filtered.slice(0, state.visibleCount);

  articlesGrid.innerHTML = visible.length
    ? visible.map(createArticleCard).join("")
    : `<div class="no-results">
         <p>😕 Статей за цим фільтром ще немає.</p>
       </div>`;

  // Сховати/показати кнопку "більше"
  loadMoreBtn.style.display = visible.length < filtered.length ? "block" : "none";
}


// ═══════════════════════════════════════════════════════════
//  2. РЕНДЕРИНГ КАРТОК АВТОРІВ
// ═══════════════════════════════════════════════════════════

function createAuthorCard(author) {
  const articleCount = articles.filter(a => a.authorId === author.id).length;
  return `
    <div class="author-card">
      <div class="author-avatar">${author.initials}</div>
      <div class="author-info">
        <h3>${author.name}</h3>
        <p class="author-role">${author.role}</p>
        <p class="author-bio">${author.bio}</p>
        <div class="author-skills">
          ${author.skills.map(s => `<span class="skill-tag">${s}</span>`).join("")}
        </div>
        <div class="author-meta">
          <span>📝 ${articleCount} статей</span>
          <div class="author-social">
            <a href="https://${author.social.github}" target="_blank" rel="noopener" title="GitHub">GH</a>
            <a href="https://${author.social.twitter}" target="_blank" rel="noopener" title="Twitter">TW</a>
            <a href="https://${author.social.linkedin}" target="_blank" rel="noopener" title="LinkedIn">LI</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAuthors() {
  authorsGrid.innerHTML = authors.map(createAuthorCard).join("");
}


// ═══════════════════════════════════════════════════════════
//  3. ПІДРАХУНОК КІЛЬКОСТІ СТАТЕЙ У КАТЕГОРІЯХ
// ═══════════════════════════════════════════════════════════

function renderCategoryCounts() {
  document.querySelectorAll(".cat-count[data-cat]").forEach(el => {
    const catId = el.getAttribute("data-cat");
    const count = getArticleCountByCategory(catId);
    el.textContent = `${count} ${pluralArticles(count)}`;
  });
}

function pluralArticles(n) {
  if (n === 1) return "стаття";
  if (n >= 2 && n <= 4) return "статті";
  return "статей";
}


// ═══════════════════════════════════════════════════════════
//  4. ФІЛЬТРАЦІЯ СТАТЕЙ
// ═══════════════════════════════════════════════════════════

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.currentFilter = btn.dataset.filter;
    state.visibleCount  = state.itemsPerPage;
    renderArticles();
  });
});

// Фільтрація через клік на картці категорії
document.querySelectorAll(".category-card[data-filter]").forEach(card => {
  card.addEventListener("click", e => {
    e.preventDefault();
    const filter = card.dataset.filter;
    state.currentFilter = filter;
    state.visibleCount  = state.itemsPerPage;

    // Активуємо відповідну кнопку фільтра
    filterBtns.forEach(b => {
      b.classList.toggle("active", b.dataset.filter === filter);
    });

    renderArticles();
    document.getElementById("articles").scrollIntoView({ behavior: "smooth" });
  });
});


// ═══════════════════════════════════════════════════════════
//  5. ЗАВАНТАЖИТИ БІЛЬШЕ
// ═══════════════════════════════════════════════════════════

loadMoreBtn.addEventListener("click", () => {
  state.visibleCount += state.itemsPerPage;
  renderArticles();
});


// ═══════════════════════════════════════════════════════════
//  6. МОДАЛЬНЕ ВІКНО СТАТТІ
// ═══════════════════════════════════════════════════════════

function openArticle(id) {
  const article  = getArticleById(id);
  if (!article) return;

  const author   = getAuthorById(article.authorId);
  const category = getCategoryById(article.category);
  const artComments = getCommentsByArticleId(article.id);

  // Збільшуємо лічильник переглядів (локально)
  article.views++;

  modalContent.innerHTML = `
    <div class="modal-header" style="background: ${article.coverColor}">
      <span class="card-category-badge ${category.color}">${category.icon} ${category.name}</span>
      <h1 class="modal-title">${article.title}</h1>
      <div class="modal-meta">
        <div class="card-author" style="color:#fff">
          <div class="author-avatar-sm">${author ? author.initials : '??'}</div>
          <span>${author ? author.name : 'Невідомо'}</span>
        </div>
        <span>📅 ${formatDate(article.publishedAt)}</span>
        <span>⏱ ${article.readTime} хв читання</span>
        <span>👁 ${article.views.toLocaleString()} переглядів</span>
      </div>
    </div>
    <div class="modal-body">
      ${article.content}
      <div class="modal-tags">
        ${article.tags.map(t => `<span class="tag">#${t}</span>`).join("")}
      </div>
      <div class="modal-actions">
        <button class="btn-like" onclick="likeArticle(${article.id}, this)">
          ❤️ <span>${article.likes}</span>
        </button>
        <button class="btn-share" onclick="shareArticle('${article.title}')">
          🔗 Поділитись
        </button>
      </div>
      ${artComments.length ? `
        <div class="modal-comments">
          <h3>Коментарі (${artComments.length})</h3>
          ${artComments.map(c => `
            <div class="comment">
              <div class="comment-author">
                ${c.authorId
                  ? `<strong>${getAuthorById(c.authorId)?.name}</strong>`
                  : `<strong>${c.guestName}</strong>`}
                <span class="comment-date">${formatDate(c.createdAt)}</span>
              </div>
              <p>${c.text}</p>
              <span class="comment-likes">❤️ ${c.likes}</span>
            </div>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;

  modalOverlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modalOverlay.classList.remove("open");
  document.body.style.overflow = "";
}

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

function likeArticle(id, btn) {
  const article = getArticleById(id);
  if (!article) return;
  article.likes++;
  btn.querySelector("span").textContent = article.likes;
  btn.classList.add("liked");
  btn.disabled = true;
}

function shareArticle(title) {
  if (navigator.share) {
    navigator.share({ title, url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert("Посилання скопійовано!");
  }
}


// ═══════════════════════════════════════════════════════════
//  7. ПОШУК
// ═══════════════════════════════════════════════════════════

searchToggle.addEventListener("click", () => {
  state.searchOpen = !state.searchOpen;
  searchBar.classList.toggle("open", state.searchOpen);
  if (state.searchOpen) searchInput.focus();
});

searchClose.addEventListener("click", () => {
  state.searchOpen = false;
  searchBar.classList.remove("open");
  searchInput.value = "";
  searchResults.innerHTML = "";
});

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();
  if (query.length < 2) {
    searchResults.innerHTML = "";
    return;
  }
  const results = searchArticles(query);
  if (!results.length) {
    searchResults.innerHTML = `<p class="search-empty">Нічого не знайдено за запитом «${query}»</p>`;
    return;
  }
  searchResults.innerHTML = results.map(a => `
    <div class="search-item" onclick="openArticle(${a.id}); searchClose.click()">
      <strong>${a.title}</strong>
      <span>${getCategoryById(a.category)?.icon} ${getCategoryById(a.category)?.name}</span>
    </div>
  `).join("");
});


// ═══════════════════════════════════════════════════════════
//  8. МОБІЛЬНЕ МЕНЮ (БУРГЕР)
// ═══════════════════════════════════════════════════════════

burger.addEventListener("click", () => {
  burger.classList.toggle("open");
  mainNav.classList.toggle("open");
});

// Закрити меню при кліку на посилання
mainNav.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    burger.classList.remove("open");
    mainNav.classList.remove("open");
  });
});


// ═══════════════════════════════════════════════════════════
//  9. СКРОЛ: ХЕДЕР + КНОПКА "ВГОРУ"
// ═══════════════════════════════════════════════════════════

window.addEventListener("scroll", () => {
  const scrolled = window.scrollY > 60;
  siteHeader.classList.toggle("scrolled", scrolled);
  backToTop.classList.toggle("visible", window.scrollY > 400);
});

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});


// ═══════════════════════════════════════════════════════════
//  10. ПЛАВНА ПРОКРУТКА ДО ЯКОРІВ
// ═══════════════════════════════════════════════════════════

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", e => {
    const target = document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    const offset = siteHeader.offsetHeight + 16;
    window.scrollTo({
      top:      target.getBoundingClientRect().top + window.scrollY - offset,
      behavior: "smooth"
    });
  });
});


// ═══════════════════════════════════════════════════════════
//  11. ФОРМИ
// ═══════════════════════════════════════════════════════════

function handleSubscribe(e) {
  e.preventDefault();
  const email   = document.getElementById("subscribe-email").value;
  const success = document.getElementById("subscribe-success");

  // В реальному проєкті — запит до API
  console.log("Нова підписка:", email);

  success.style.display = "block";
  e.target.querySelector("input").value = "";
  setTimeout(() => success.style.display = "none", 5000);
}

function handleContact(e) {
  e.preventDefault();
  const success = document.getElementById("contact-success");

  // В реальному проєкті — запит до API
  console.log("Нове повідомлення з форми контакту");

  success.style.display = "block";
  e.target.reset();
  setTimeout(() => success.style.display = "none", 5000);
}


// ═══════════════════════════════════════════════════════════
//  12. АНІМАЦІЯ ПОЯВИ ЕЛЕМЕНТІВ (Intersection Observer)
// ═══════════════════════════════════════════════════════════

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

function observeElements() {
  document.querySelectorAll(
    ".article-card, .author-card, .category-card, .hero-visual, .about-visual"
  ).forEach(el => observer.observe(el));
}


// ═══════════════════════════════════════════════════════════
//  ІНІЦІАЛІЗАЦІЯ
// ═══════════════════════════════════════════════════════════

function init() {
  renderArticles();
  renderAuthors();
  renderCategoryCounts();
  observeElements();
}

document.addEventListener("DOMContentLoaded", init);


// ─────────────────────────────────────────────
//  МОДЕЛЬ 1: Category (Категорія)
// ─────────────────────────────────────────────
/**
 * @typedef {Object} Category
 * @property {string}   id          - Унікальний ідентифікатор (slug)
 * @property {string}   name        - Назва категорії
 * @property {string}   icon        - Емодзі-іконка категорії
 * @property {string}   description - Опис категорії
 * @property {string}   color       - CSS-клас для кольорового акценту
 */
const categories = [
  {
    id:          "web",
    name:        "Веб-розробка",
    icon:        "🌐",
    description: "HTML, CSS, JS, React, Vue, Node.js та сучасні фреймворки",
    color:       "cat-web"
  },
  {
    id:          "ai",
    name:        "Штучний інтелект",
    icon:        "🤖",
    description: "ML, Deep Learning, LLM, нейронні мережі та автоматизація",
    color:       "cat-ai"
  },
  {
    id:          "security",
    name:        "Кібербезпека",
    icon:        "🔐",
    description: "Захист даних, пентестинг, шифрування та вразливості",
    color:       "cat-security"
  },
  {
    id:          "devops",
    name:        "DevOps",
    icon:        "⚙️",
    description: "Docker, CI/CD, Kubernetes, хмарні сервіси та автоматизація",
    color:       "cat-devops"
  },
  {
    id:          "mobile",
    name:        "Мобільна розробка",
    icon:        "📱",
    description: "iOS, Android, React Native, Flutter та крос-платформні рішення",
    color:       "cat-mobile"
  }
];

// ─────────────────────────────────────────────
//  МОДЕЛЬ 2: Author (Автор)
// ─────────────────────────────────────────────
/**
 * @typedef {Object} Author
 * @property {number}   id       - Унікальний числовий ідентифікатор
 * @property {string}   name     - Повне ім'я автора
 * @property {string}   avatar   - URL аватара (або initials-заглушка)
 * @property {string}   initials - Ініціали для аватара-заглушки
 * @property {string}   role     - Посада / спеціалізація
 * @property {string}   bio      - Короткий опис автора
 * @property {string[]} skills   - Список технічних навичок
 * @property {Object}   social   - Посилання на соцмережі
 * @property {string}   social.github
 * @property {string}   social.twitter
 * @property {string}   social.linkedin
 */
const authors = [
  {
    id:       1,
    name:     "Олексій Коваль",
    avatar:   null,
    initials: "ОК",
    role:     "Senior Frontend Developer",
    bio:      "10 років у веб-розробці. Пише про React, CSS та перформанс.",
    skills:   ["React", "TypeScript", "CSS", "Performance"],
    social: {
      github:   "github.com/oleksii-koval",
      twitter:  "twitter.com/oleksii_dev",
      linkedin: "linkedin.com/in/oleksii-koval"
    }
  },
  {
    id:       2,
    name:     "Марія Петренко",
    avatar:   null,
    initials: "МП",
    role:     "ML Engineer",
    bio:      "Спеціаліст з машинного навчання та комп'ютерного зору.",
    skills:   ["Python", "TensorFlow", "PyTorch", "LLM"],
    social: {
      github:   "github.com/maria-petrenko",
      twitter:  "twitter.com/maria_ml",
      linkedin: "linkedin.com/in/maria-petrenko"
    }
  },
  {
    id:       3,
    name:     "Дмитро Іваненко",
    avatar:   null,
    initials: "ДІ",
    role:     "DevOps Engineer",
    bio:      "Будує інфраструктуру та автоматизує все, що рухається.",
    skills:   ["Docker", "Kubernetes", "AWS", "CI/CD"],
    social: {
      github:   "github.com/dmytro-ivanenko",
      twitter:  "twitter.com/dmytro_devops",
      linkedin: "linkedin.com/in/dmytro-ivanenko"
    }
  },
  {
    id:       4,
    name:     "Анна Лисенко",
    avatar:   null,
    initials: "АЛ",
    role:     "Security Researcher",
    bio:      "Досліджує вразливості та навчає захищатись від атак.",
    skills:   ["Pentesting", "OWASP", "Cryptography", "Linux"],
    social: {
      github:   "github.com/anna-lysenko",
      twitter:  "twitter.com/anna_security",
      linkedin: "linkedin.com/in/anna-lysenko"
    }
  }
];

// ─────────────────────────────────────────────
//  МОДЕЛЬ 3: Tag (Тег)
// ─────────────────────────────────────────────
/**
 * @typedef {Object} Tag
 * @property {string} id    - Slug-ідентифікатор тегу
 * @property {string} label - Відображувана назва тегу
 */
const tags = [
  { id: "javascript", label: "JavaScript" },
  { id: "react",      label: "React" },
  { id: "css",        label: "CSS" },
  { id: "nodejs",     label: "Node.js" },
  { id: "python",     label: "Python" },
  { id: "docker",     label: "Docker" },
  { id: "kubernetes", label: "Kubernetes" },
  { id: "llm",        label: "LLM" },
  { id: "security",   label: "Security" },
  { id: "flutter",    label: "Flutter" },
  { id: "typescript", label: "TypeScript" },
  { id: "git",        label: "Git" }
];

// ─────────────────────────────────────────────
//  МОДЕЛЬ 4: Article (Стаття)
// ─────────────────────────────────────────────
/**
 * @typedef {Object} Article
 * @property {number}   id          - Унікальний ідентифікатор статті
 * @property {string}   title       - Заголовок статті
 * @property {string}   slug        - URL-дружній ідентифікатор
 * @property {string}   excerpt     - Короткий анонс статті
 * @property {string}   content     - Повний текст статті (HTML)
 * @property {string}   category    - ID категорії (foreign key → categories.id)
 * @property {number}   authorId    - ID автора (foreign key → authors.id)
 * @property {string[]} tags        - Масив ID тегів (foreign key → tags.id)
 * @property {string}   publishedAt - Дата публікації (ISO 8601)
 * @property {number}   readTime    - Приблизний час читання (хвилини)
 * @property {number}   views       - Кількість переглядів
 * @property {number}   likes       - Кількість лайків
 * @property {boolean}  featured    - Чи є стаття вибраною/рекомендованою
 * @property {string}   coverColor  - CSS-градієнт для обкладинки
 */
const articles = [
  {
    id:          1,
    title:       "React 19: що нового і як мігрувати",
    slug:        "react-19-new-features-migration",
    excerpt:     "Детальний огляд нових можливостей React 19: Server Components, use() hook, Actions та покращена обробка помилок.",
    content:     `<h2>Що нового в React 19?</h2>
<p>React 19 — це значне оновлення, яке приносить ряд нових можливостей, що спрощують розробку та покращують продуктивність додатків.</p>
<h3>1. Server Components (стабільно)</h3>
<p>Server Components тепер офіційно стабільні. Вони дозволяють рендерити компоненти на сервері без відправки JavaScript на клієнт.</p>
<pre><code>// ServerComponent.jsx
async function BlogPost({ id }) {
  const post = await db.posts.find(id);
  return &lt;article&gt;{post.content}&lt;/article&gt;;
}</code></pre>
<h3>2. Новий use() хук</h3>
<p>Хук use() дозволяє читати значення з Promise або Context в будь-якому місці компонента, навіть всередині умов та циклів.</p>
<h3>3. Actions</h3>
<p>Actions спрощують обробку форм та асинхронних операцій, автоматично керуючи pending-станами та помилками.</p>`,
    category:    "web",
    authorId:    1,
    tags:        ["react", "javascript", "typescript"],
    publishedAt: "2025-04-15",
    readTime:    8,
    views:       3420,
    likes:       187,
    featured:    true,
    coverColor:  "linear-gradient(135deg, #0ea5e9, #6366f1)"
  },
  {
    id:          2,
    title:       "Локальні LLM: запускаємо Llama 3 на своєму ПК",
    slug:        "local-llm-llama3-setup",
    excerpt:     "Покрокова інструкція з налаштування та запуску великих мовних моделей локально за допомогою Ollama та LM Studio.",
    content:     `<h2>Навіщо запускати LLM локально?</h2>
<p>Локальні мовні моделі дають повний контроль над даними, не потребують інтернету та можуть бути швидшими для конкретних завдань.</p>
<h3>Встановлення Ollama</h3>
<pre><code># macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Запуск Llama 3
ollama run llama3

# Перевірка
ollama list</code></pre>
<h3>Використання через API</h3>
<p>Ollama надає REST API сумісний з OpenAI, тому інтеграція з існуючими проєктами займе хвилини.</p>`,
    category:    "ai",
    authorId:    2,
    tags:        ["llm", "python"],
    publishedAt: "2025-04-20",
    readTime:    12,
    views:       5210,
    likes:       304,
    featured:    true,
    coverColor:  "linear-gradient(135deg, #8b5cf6, #ec4899)"
  },
  {
    id:          3,
    title:       "Docker для початківців: від нуля до деплою",
    slug:        "docker-beginners-guide",
    excerpt:     "Повний гайд по Docker: контейнери, образи, Docker Compose та деплой на VPS. Пояснюємо простою мовою.",
    content:     `<h2>Що таке Docker?</h2>
<p>Docker — це платформа для контейнеризації, яка дозволяє пакувати додатки разом з усіма залежностями в ізольовані контейнери.</p>
<h3>Основні поняття</h3>
<ul>
<li><strong>Image</strong> — незмінний шаблон для створення контейнерів</li>
<li><strong>Container</strong> — запущений екземпляр образу</li>
<li><strong>Dockerfile</strong> — інструкції для побудови образу</li>
<li><strong>Docker Hub</strong> — реєстр публічних образів</li>
</ul>
<h3>Перший Dockerfile</h3>
<pre><code>FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]</code></pre>`,
    category:    "devops",
    authorId:    3,
    tags:        ["docker", "kubernetes"],
    publishedAt: "2025-04-25",
    readTime:    15,
    views:       4870,
    likes:       256,
    featured:    false,
    coverColor:  "linear-gradient(135deg, #f59e0b, #ef4444)"
  },
  {
    id:          4,
    title:       "OWASP Top 10 2025: найнебезпечніші вразливості",
    slug:        "owasp-top-10-2025",
    excerpt:     "Актуальний список найпоширеніших вразливостей веб-додатків та методи їхнього усунення.",
    content:     `<h2>OWASP Top 10 у 2025 році</h2>
<p>OWASP (Open Web Application Security Project) регулярно оновлює список найкритичніших ризиків безпеки для веб-додатків.</p>
<h3>A01: Broken Access Control</h3>
<p>Найпоширеніша вразливість — неправильна перевірка прав доступу. Дозволяє зловмисникам отримати доступ до чужих даних або функцій.</p>
<h3>A02: Cryptographic Failures</h3>
<p>Слабке шифрування або відсутність шифрування для чутливих даних. Сюди відносяться незашифровані паролі, слабкі алгоритми хешування.</p>
<h3>A03: Injection</h3>
<p>SQL ін'єкції, XSS, command injection — коли недовірені дані передаються інтерпретатору як команди.</p>`,
    category:    "security",
    authorId:    4,
    tags:        ["security"],
    publishedAt: "2025-05-01",
    readTime:    10,
    views:       2930,
    likes:       198,
    featured:    false,
    coverColor:  "linear-gradient(135deg, #10b981, #0ea5e9)"
  },
  {
    id:          5,
    title:       "Flutter 3.22: огляд нових можливостей",
    slug:        "flutter-3-22-new-features",
    excerpt:     "Що нового у Flutter 3.22: покращений Impeller, нові віджети, WebAssembly підтримка та оптимізації продуктивності.",
    content:     `<h2>Flutter 3.22 — великий стрибок вперед</h2>
<p>Google випустила Flutter 3.22 з рядом покращень, що роблять крос-платформну розробку ще привабливішою.</p>
<h3>Impeller — новий рендер рушій</h3>
<p>Impeller тепер є рушієм за замовчуванням для iOS та Android. Він забезпечує плавніші анімації та менші затримки рендерингу.</p>
<h3>WebAssembly (Wasm) підтримка</h3>
<p>Flutter Web тепер може компілюватись у WebAssembly, що дає значний приріст продуктивності для складних веб-додатків.</p>`,
    category:    "mobile",
    authorId:    1,
    tags:        ["flutter"],
    publishedAt: "2025-05-05",
    readTime:    7,
    views:       1870,
    likes:       134,
    featured:    false,
    coverColor:  "linear-gradient(135deg, #06b6d4, #3b82f6)"
  },
  {
    id:          6,
    title:       "CSS Grid у 2025: прийоми, які ти ще не знаєш",
    slug:        "css-grid-advanced-tips-2025",
    excerpt:     "Просунуті техніки CSS Grid: subgrid, container queries, masonry layout та нові властивості, що вже підтримуються браузерами.",
    content:     `<h2>CSS Grid у 2025 — потужніший ніж будь-коли</h2>
<p>CSS Grid продовжує розвиватись. У 2025 році з'явилась підтримка кількох довгоочікуваних функцій у всіх основних браузерах.</p>
<h3>Subgrid</h3>
<p>Subgrid дозволяє дочірнім елементам брати участь у батьківській сітці, вирішуючи давні проблеми вирівнювання.</p>
<pre><code>.parent {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.child {
  display: grid;
  grid-column: span 2;
  grid-template-columns: subgrid; /* успадковує сітку батька */
}</code></pre>
<h3>Masonry Layout (нарешті!)</h3>
<p>Нативний masonry layout у CSS Grid дозволяє створювати "цегляні" розкладки без JavaScript.</p>`,
    category:    "web",
    authorId:    1,
    tags:        ["css", "javascript"],
    publishedAt: "2025-05-08",
    readTime:    6,
    views:       2340,
    likes:       221,
    featured:    true,
    coverColor:  "linear-gradient(135deg, #f97316, #eab308)"
  }
];

// ─────────────────────────────────────────────
//  МОДЕЛЬ 5: Comment (Коментар)
// ─────────────────────────────────────────────
/**
 * @typedef {Object} Comment
 * @property {number}      id          - Унікальний ідентифікатор коментаря
 * @property {number}      articleId   - ID статті (foreign key → articles.id)
 * @property {number|null} authorId    - ID зареєстрованого автора (або null)
 * @property {string}      guestName   - Ім'я анонімного коментатора (якщо authorId = null)
 * @property {string}      text        - Текст коментаря
 * @property {string}      createdAt   - Дата створення (ISO 8601)
 * @property {number}      likes       - Кількість лайків
 * @property {number|null} parentId    - ID батьківського коментаря для відповідей (або null)
 */
const comments = [
  {
    id:        1,
    articleId: 1,
    authorId:  null,
    guestName: "Іван Сидоренко",
    text:      "Дякую за детальний огляд! Особливо корисна частина про Server Components.",
    createdAt: "2025-04-16",
    likes:     12,
    parentId:  null
  },
  {
    id:        2,
    articleId: 1,
    authorId:  2,
    guestName: null,
    text:      "Гарна стаття. Чи плануєте написати про React Server Actions детальніше?",
    createdAt: "2025-04-17",
    likes:     8,
    parentId:  null
  },
  {
    id:        3,
    articleId: 2,
    authorId:  null,
    guestName: "Петро Мельник",
    text:      "Спробував запустити Llama 3 — все спрацювало! Відмінна інструкція.",
    createdAt: "2025-04-21",
    likes:     15,
    parentId:  null
  }
];

// ─────────────────────────────────────────────
//  МОДЕЛЬ 6: Subscriber (Підписник)
// ─────────────────────────────────────────────
/**
 * @typedef {Object} Subscriber
 * @property {number}  id          - Унікальний ідентифікатор підписника
 * @property {string}  email       - Email-адреса підписника
 * @property {string}  subscribedAt- Дата підписки (ISO 8601)
 * @property {boolean} confirmed   - Чи підтверджена підписка
 * @property {string[]} categories - Категорії, що цікавлять підписника
 */
const subscribers = [
  {
    id:           1,
    email:        "user@example.com",
    subscribedAt: "2025-01-10",
    confirmed:    true,
    categories:   ["web", "ai"]
  }
];

// ─────────────────────────────────────────────
//  Допоміжні функції для роботи з моделями
// ─────────────────────────────────────────────

/** Отримати статтю за ID */
function getArticleById(id) {
  return articles.find(a => a.id === id) || null;
}

/** Отримати статті за категорією */
function getArticlesByCategory(categoryId) {
  if (categoryId === "all") return articles;
  return articles.filter(a => a.category === categoryId);
}

/** Отримати автора за ID */
function getAuthorById(id) {
  return authors.find(a => a.id === id) || null;
}

/** Отримати категорію за ID */
function getCategoryById(id) {
  return categories.find(c => c.id === id) || null;
}

/** Отримати коментарі до статті */
function getCommentsByArticleId(articleId) {
  return comments.filter(c => c.articleId === articleId);
}

/** Отримати кількість статей у категорії */
function getArticleCountByCategory(categoryId) {
  return articles.filter(a => a.category === categoryId).length;
}

/** Пошук статей за ключовим словом */
function searchArticles(query) {
  const q = query.toLowerCase();
  return articles.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.excerpt.toLowerCase().includes(q) ||
    a.tags.some(t => t.includes(q))
  );
}

/** Форматування дати публікації */
function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString("uk-UA", {
    day:   "numeric",
    month: "long",
    year:  "numeric"
  });
}

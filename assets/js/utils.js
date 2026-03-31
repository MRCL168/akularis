(function () {
  const STORAGE_KEYS = {
    connection: 'gfcpa_connection',
    site: 'gfcpa_demo_site',
    posts: 'gfcpa_demo_posts',
    media: 'gfcpa_demo_media',
    autosave: 'gfcpa_editor_autosave'
  };

  const DEFAULT_SITE = {
    siteTitle: 'GitHub File CMS Pro',
    siteTagline: 'CMS tanpa database untuk GitHub Pages',
    siteUrl: 'https://username.github.io/repository',
    language: 'id-ID',
    heroTitle: 'Bangun website dinamis tanpa database',
    heroDescription: 'Konten disimpan sebagai file JSON di repository GitHub dan dikelola melalui panel admin modern.',
    postsPerPage: 6,
    footerText: 'Dibuat dengan GitHub File CMS Pro',
    showFeaturedOnlyOnTop: true
  };

  const FALLBACK_POSTS = [
    {
      id: 'sample-1',
      slug: 'mulai-dengan-cms-advanced',
      title: 'Mulai dengan CMS Pro',
      excerpt: 'Contoh artikel yang menunjukkan editor Markdown, preview, dan workflow GitHub.',
      content: '# Selamat datang\n\nPaket ini menyimpan konten sebagai file JSON di repository GitHub.\n\n## Kenapa cocok untuk GitHub Pages\n\n- Tidak butuh database\n- Mudah dipindah antar repository\n- Bisa diaudit lewat commit history\n\n> Gunakan **Demo Mode** untuk mencoba semuanya tanpa token GitHub.\n\n## Contoh kode\n\n```js\nconsole.log("Hello from GitHub File CMS Pro");\n```\n',
      category: 'Panduan',
      tags: ['demo', 'markdown', 'github'],
      coverImage: 'assets/img/placeholder.svg',
      status: 'published',
      featured: true,
      author: 'Admin',
      seoTitle: 'Mulai dengan CMS Pro',
      seoDescription: 'Artikel contoh untuk pengujian GitHub File CMS Pro.',
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function safeJsonParse(text, fallback) {
    try {
      return JSON.parse(text);
    } catch (error) {
      return fallback;
    }
  }

  function slugify(text) {
    return String(text || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function escapeHtml(text) {
    return String(text || '').replace(/[&<>"']/g, function (match) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[match];
    });
  }

  function stripMarkdown(text) {
    return String(text || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[[^\]]*\]\(([^)]+)\)/g, ' ')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
      .replace(/^>\s?/gm, '')
      .replace(/^#+\s+/gm, '')
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/[*_~]/g, ' ')
      .replace(/\n{2,}/g, '\n')
      .trim();
  }

  function excerptFromContent(text, limit) {
    const clean = stripMarkdown(String(text || '')).replace(/\s+/g, ' ').trim();
    const max = typeof limit === 'number' ? limit : 155;
    return clean.length > max ? clean.slice(0, max).trim() + '…' : clean;
  }

  function formatDate(value) {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch (error) {
      return value;
    }
  }

  function formatDateTime(value) {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return value;
    }
  }

  function readingTime(text) {
    const words = stripMarkdown(String(text || '')).trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }

  function uniqueValues(items) {
    return Array.from(new Set(items.filter(Boolean).map(function (item) { return String(item).trim(); }))).sort();
  }

  function normalizePost(input) {
    const now = new Date().toISOString();
    const post = Object.assign({
      id: String(Date.now()),
      slug: slugify(input && (input.title || input.slug) || 'untitled-post'),
      title: '',
      excerpt: '',
      content: '',
      category: 'Umum',
      tags: [],
      coverImage: 'assets/img/placeholder.svg',
      status: 'draft',
      featured: false,
      author: 'Admin',
      seoTitle: '',
      seoDescription: '',
      publishedAt: now,
      updatedAt: now
    }, input || {});

    if (!Array.isArray(post.tags)) {
      post.tags = String(post.tags || '').split(',').map(function (tag) { return tag.trim(); }).filter(Boolean);
    }

    if (!post.slug) post.slug = slugify(post.title || post.id);
    if (!post.excerpt) post.excerpt = excerptFromContent(post.content);
    if (!post.seoTitle) post.seoTitle = post.title;
    if (!post.seoDescription) post.seoDescription = post.excerpt;
    if (!post.coverImage) post.coverImage = 'assets/img/placeholder.svg';
    if (!post.updatedAt) post.updatedAt = now;
    if (!post.publishedAt) post.publishedAt = now;
    return post;
  }

  function sortPosts(posts) {
    return deepClone(posts).sort(function (a, b) {
      const dateA = new Date(a.publishedAt || a.updatedAt || 0).getTime();
      const dateB = new Date(b.publishedAt || b.updatedAt || 0).getTime();
      return dateB - dateA;
    });
  }

  function getPublishedPosts(posts) {
    return sortPosts((posts || []).map(normalizePost).filter(function (post) {
      return post.status === 'published';
    }));
  }

  function normalizeSite(input) {
    return Object.assign({}, DEFAULT_SITE, input || {});
  }

  function resolveSiteUrl(siteOrUrl) {
    const raw = typeof siteOrUrl === 'string' ? siteOrUrl : (siteOrUrl && siteOrUrl.siteUrl) || DEFAULT_SITE.siteUrl;
    return String(raw || '').replace(/\/+$/, '');
  }

  function resolveAbsoluteUrl(siteOrUrl, relativePath) {
    const base = resolveSiteUrl(siteOrUrl);
    const path = String(relativePath || '').replace(/^\/+/, '');
    return base ? base + '/' + path : path;
  }

  function renderInlineMarkdown(text) {
    let html = escapeHtml(text);
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    return html;
  }

  function markdownToHtml(markdown) {
    const source = String(markdown || '').replace(/\r\n?/g, '\n').trim();
    if (!source) return '<div class="empty-state small-empty">Belum ada konten.</div>';

    const fences = [];
    const text = source.replace(/```(\w+)?\n([\s\S]*?)```/g, function (_, lang, code) {
      const token = '@@FENCE' + fences.length + '@@';
      fences.push({ lang: lang || '', code: escapeHtml(code) });
      return token;
    });

    const lines = text.split('\n');
    const html = [];
    let paragraph = [];
    let listType = null;
    let listItems = [];
    let quote = [];

    function flushParagraph() {
      if (!paragraph.length) return;
      html.push('<p>' + renderInlineMarkdown(paragraph.join(' ')) + '</p>');
      paragraph = [];
    }

    function flushList() {
      if (!listItems.length) return;
      html.push('<' + listType + '>' + listItems.map(function (item) {
        return '<li>' + renderInlineMarkdown(item) + '</li>';
      }).join('') + '</' + listType + '>');
      listItems = [];
      listType = null;
    }

    function flushQuote() {
      if (!quote.length) return;
      html.push('<blockquote>' + quote.map(renderInlineMarkdown).join('<br>') + '</blockquote>');
      quote = [];
    }

    function flushAll() {
      flushParagraph();
      flushList();
      flushQuote();
    }

    lines.forEach(function (line) {
      const trimmed = line.trim();
      const fenceMatch = trimmed.match(/^@@FENCE(\d+)@@$/);
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      const ulMatch = line.match(/^[-*+]\s+(.*)$/);
      const olMatch = line.match(/^\d+\.\s+(.*)$/);
      const quoteMatch = line.match(/^>\s?(.*)$/);
      const hrMatch = trimmed.match(/^(-{3,}|\*{3,}|_{3,})$/);

      if (!trimmed) {
        flushAll();
        return;
      }

      if (fenceMatch) {
        flushAll();
        const item = fences[Number(fenceMatch[1])];
        const language = item.lang ? '<div class="meta-chip" style="margin-bottom:10px;">' + escapeHtml(item.lang) + '</div>' : '';
        html.push('<pre>' + language + '<code>' + item.code + '</code></pre>');
        return;
      }

      if (headingMatch) {
        flushAll();
        const level = headingMatch[1].length;
        const textValue = headingMatch[2].trim();
        const id = slugify(stripMarkdown(textValue));
        html.push('<h' + level + ' id="' + escapeHtml(id) + '">' + renderInlineMarkdown(textValue) + '</h' + level + '>');
        return;
      }

      if (hrMatch) {
        flushAll();
        html.push('<hr>');
        return;
      }

      if (quoteMatch) {
        flushParagraph();
        flushList();
        quote.push(quoteMatch[1]);
        return;
      }

      if (ulMatch) {
        flushParagraph();
        flushQuote();
        if (listType && listType !== 'ul') flushList();
        listType = 'ul';
        listItems.push(ulMatch[1]);
        return;
      }

      if (olMatch) {
        flushParagraph();
        flushQuote();
        if (listType && listType !== 'ol') flushList();
        listType = 'ol';
        listItems.push(olMatch[1]);
        return;
      }

      paragraph.push(trimmed);
    });

    flushAll();
    return html.join('');
  }

  function extractHeadings(markdown) {
    return String(markdown || '').replace(/\r\n?/g, '\n').split('\n').map(function (line) {
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (!match) return null;
      const text = stripMarkdown(match[2]).trim();
      if (!text) return null;
      return {
        level: match[1].length,
        text: text,
        id: slugify(text)
      };
    }).filter(Boolean);
  }

  async function fetchJSON(path) {
    const response = await fetch(path + '?_=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Gagal memuat ' + path + '. Jalankan melalui server lokal atau unggah ke GitHub Pages.');
    }
    return response.json();
  }

  async function loadPublicData() {
    const result = await Promise.all([fetchJSON('data/site.json'), fetchJSON('data/posts.json')]);
    return {
      site: normalizeSite(result[0] || {}),
      posts: sortPosts((result[1] || []).map(normalizePost))
    };
  }

  function loadDemoData() {
    let site = DEFAULT_SITE;
    let posts = FALLBACK_POSTS;

    try {
      const savedSite = localStorage.getItem(STORAGE_KEYS.site);
      if (savedSite) site = Object.assign({}, DEFAULT_SITE, JSON.parse(savedSite));
    } catch (error) {}

    try {
      const savedPosts = localStorage.getItem(STORAGE_KEYS.posts);
      if (savedPosts) posts = JSON.parse(savedPosts);
    } catch (error) {}

    return {
      site: normalizeSite(site),
      posts: sortPosts((posts || FALLBACK_POSTS).map(normalizePost))
    };
  }

  function saveDemoData(site, posts) {
    localStorage.setItem(STORAGE_KEYS.site, JSON.stringify(normalizeSite(site || {}), null, 2));
    localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(sortPosts((posts || []).map(normalizePost)), null, 2));
  }

  function loadConnection() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.connection) || '{}');
    } catch (error) {
      return {};
    }
  }

  function saveConnection(connection) {
    localStorage.setItem(STORAGE_KEYS.connection, JSON.stringify(connection || {}, null, 2));
  }

  function loadAutosave() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.autosave) || 'null');
    } catch (error) {
      return null;
    }
  }

  function saveAutosave(payload) {
    localStorage.setItem(STORAGE_KEYS.autosave, JSON.stringify(payload || {}, null, 2));
  }

  function clearAutosave() {
    localStorage.removeItem(STORAGE_KEYS.autosave);
  }

  function hasGithubConfig(connection) {
    return Boolean(connection && connection.owner && connection.repo && connection.baseBranch && connection.token);
  }

  function getTargetBranch(connection) {
    if (!connection) return 'main';
    return connection.publishMode === 'pr' ? (connection.workingBranch || 'cms-draft') : (connection.baseBranch || 'main');
  }

  function githubHeaders(connection, extraHeaders) {
    return Object.assign({
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + connection.token
    }, extraHeaders || {});
  }

  function unicodeToBase64(content) {
    return btoa(unescape(encodeURIComponent(content)));
  }

  function base64ToUnicode(content) {
    return decodeURIComponent(escape(atob(String(content || '').replace(/\n/g, ''))));
  }

  async function githubRequest(url, options) {
    const response = await fetch(url, options || {});
    if (!response.ok) {
      let message = response.status + ' ' + response.statusText;
      try {
        const data = await response.json();
        if (data && data.message) message = data.message;
      } catch (error) {
        try {
          message = await response.text();
        } catch (innerError) {}
      }
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }
    if (response.status === 204) return null;
    return response.json();
  }

  async function maybeGetRepoFile(connection, path, branch) {
    try {
      return await getRepoFile(connection, path, branch);
    } catch (error) {
      if (error && error.status === 404) return null;
      throw error;
    }
  }

  async function getRepoFile(connection, path, branch) {
    const activeBranch = branch || getTargetBranch(connection);
    const url = 'https://api.github.com/repos/' + encodeURIComponent(connection.owner) + '/' + encodeURIComponent(connection.repo) + '/contents/' + path + '?ref=' + encodeURIComponent(activeBranch);
    const data = await githubRequest(url, {
      headers: githubHeaders(connection)
    });

    return {
      sha: data.sha,
      content: base64ToUnicode(data.content)
    };
  }

  async function putRepoFile(connection, path, content, message, sha, isEncoded, branch) {
    const activeBranch = branch || getTargetBranch(connection);
    const url = 'https://api.github.com/repos/' + encodeURIComponent(connection.owner) + '/' + encodeURIComponent(connection.repo) + '/contents/' + path;
    const body = {
      message: message,
      content: isEncoded ? content : unicodeToBase64(content),
      branch: activeBranch
    };
    if (sha) body.sha = sha;

    return githubRequest(url, {
      method: 'PUT',
      headers: githubHeaders(connection, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(body)
    });
  }

  async function upsertRepoFile(connection, path, content, message, branch, isEncoded) {
    const existing = await maybeGetRepoFile(connection, path, branch);
    const response = await putRepoFile(connection, path, content, message, existing && existing.sha, isEncoded, branch);
    return response;
  }

  async function getBranchSha(connection, branch) {
    const url = 'https://api.github.com/repos/' + encodeURIComponent(connection.owner) + '/' + encodeURIComponent(connection.repo) + '/git/ref/heads/' + encodeURIComponent(branch);
    const data = await githubRequest(url, { headers: githubHeaders(connection) });
    return data.object.sha;
  }

  async function ensureBranch(connection, branch, fromBranch) {
    const target = branch || getTargetBranch(connection);
    const base = fromBranch || connection.baseBranch || 'main';
    try {
      await getBranchSha(connection, target);
      return target;
    } catch (error) {
      if (!error || error.status !== 404) throw error;
    }

    const sha = await getBranchSha(connection, base);
    const url = 'https://api.github.com/repos/' + encodeURIComponent(connection.owner) + '/' + encodeURIComponent(connection.repo) + '/git/refs';
    await githubRequest(url, {
      method: 'POST',
      headers: githubHeaders(connection, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ ref: 'refs/heads/' + target, sha: sha })
    });
    return target;
  }

  async function loadRepoData(connection) {
    const targetBranch = getTargetBranch(connection);
    let loadBranch = targetBranch;
    try {
      if (connection.publishMode === 'pr') {
        await getBranchSha(connection, targetBranch);
      }
    } catch (error) {
      if (error && error.status === 404) loadBranch = connection.baseBranch;
      else throw error;
    }

    const result = await Promise.all([
      maybeGetRepoFile(connection, 'data/site.json', loadBranch),
      maybeGetRepoFile(connection, 'data/posts.json', loadBranch)
    ]);

    return {
      site: normalizeSite(safeJsonParse(result[0] && result[0].content || '{}', {})),
      posts: sortPosts((safeJsonParse(result[1] && result[1].content || '[]', []) || []).map(normalizePost)),
      shas: {
        site: result[0] && result[0].sha || null,
        posts: result[1] && result[1].sha || null
      },
      branchLoaded: loadBranch
    };
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        const result = String(reader.result || '');
        const base64 = result.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function uploadImageToRepo(connection, file, folderPath, branch) {
    const safeName = slugify(file.name.replace(/\.[^.]+$/, '')) || 'image';
    const extensionMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'png';
    const filename = Date.now() + '-' + safeName + '.' + extension;
    const path = (folderPath || 'assets/uploads').replace(/^\/+|\/+$/g, '') + '/' + filename;
    const content = await fileToBase64(file);
    await putRepoFile(connection, path, content, 'Upload image: ' + filename, null, true, branch);
    return path;
  }

  async function findExistingPullRequest(connection, headBranch, baseBranch) {
    const url = 'https://api.github.com/repos/' + encodeURIComponent(connection.owner) + '/' + encodeURIComponent(connection.repo) + '/pulls?state=open&head=' + encodeURIComponent(connection.owner + ':' + headBranch) + '&base=' + encodeURIComponent(baseBranch);
    const pulls = await githubRequest(url, { headers: githubHeaders(connection) });
    return pulls && pulls[0] ? pulls[0] : null;
  }

  async function createOrOpenPullRequest(connection, options) {
    const head = options && options.head || connection.workingBranch || 'cms-draft';
    const base = options && options.base || connection.baseBranch || 'main';
    const title = options && options.title || 'Content update from GitHub File CMS Pro';
    const body = options && options.body || 'Perubahan konten dibuat dari panel admin.';

    const existing = await findExistingPullRequest(connection, head, base);
    if (existing) return existing;

    const url = 'https://api.github.com/repos/' + encodeURIComponent(connection.owner) + '/' + encodeURIComponent(connection.repo) + '/pulls';
    return githubRequest(url, {
      method: 'POST',
      headers: githubHeaders(connection, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title: title, body: body, head: head, base: base })
    });
  }

  function debounce(fn, wait) {
    let timeout;
    return function () {
      const args = arguments;
      const self = this;
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        fn.apply(self, args);
      }, wait || 250);
    };
  }

  function buildSearchIndex(site, posts) {
    const items = getPublishedPosts(posts).map(function (post) {
      return {
        title: post.title,
        slug: post.slug,
        url: resolveAbsoluteUrl(site, 'post.html?slug=' + encodeURIComponent(post.slug)),
        excerpt: post.excerpt,
        category: post.category,
        tags: post.tags,
        publishedAt: post.publishedAt,
        updatedAt: post.updatedAt
      };
    });
    return JSON.stringify(items, null, 2);
  }

  function buildSitemapXml(site, posts) {
    const baseUrl = resolveSiteUrl(site);
    const urls = [baseUrl + '/', baseUrl + '/index.html'].concat(getPublishedPosts(posts).map(function (post) {
      return resolveAbsoluteUrl(site, 'post.html?slug=' + encodeURIComponent(post.slug));
    }));
    const unique = Array.from(new Set(urls.filter(Boolean)));
    return ['<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ].concat(unique.map(function (url) {
      return '  <url><loc>' + escapeHtml(url) + '</loc></url>';
    })).concat(['</urlset>']).join('\n');
  }

  function buildRssXml(site, posts) {
    const published = getPublishedPosts(posts).slice(0, 20);
    const siteUrl = resolveSiteUrl(site);
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0">',
      '<channel>',
      '  <title>' + escapeHtml(site.siteTitle || DEFAULT_SITE.siteTitle) + '</title>',
      '  <link>' + escapeHtml(siteUrl + '/') + '</link>',
      '  <description>' + escapeHtml(site.siteTagline || site.heroDescription || '') + '</description>',
      '  <language>' + escapeHtml(site.language || 'id-ID') + '</language>'
    ].concat(published.map(function (post) {
      const url = resolveAbsoluteUrl(site, 'post.html?slug=' + encodeURIComponent(post.slug));
      return [
        '  <item>',
        '    <title>' + escapeHtml(post.title) + '</title>',
        '    <link>' + escapeHtml(url) + '</link>',
        '    <guid>' + escapeHtml(url) + '</guid>',
        '    <description>' + escapeHtml(post.excerpt || '') + '</description>',
        '    <pubDate>' + new Date(post.publishedAt || post.updatedAt || Date.now()).toUTCString() + '</pubDate>',
        '  </item>'
      ].join('\n');
    })).concat([
      '</channel>',
      '</rss>'
    ]).join('\n');
  }

  function buildRobotsTxt(site) {
    const baseUrl = resolveSiteUrl(site);
    return [
      'User-agent: *',
      'Allow: /',
      '',
      'Sitemap: ' + baseUrl + '/sitemap.xml'
    ].join('\n');
  }

  function downloadTextFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2500);
  }

  function setSelection(textarea, selectionStart, selectionEnd, replacement) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    textarea.value = value.slice(0, start) + replacement + value.slice(end);
    textarea.focus();
    textarea.selectionStart = selectionStart;
    textarea.selectionEnd = selectionEnd;
  }

  function insertMarkdownSnippet(textarea, action) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end) || 'teks';
    let replacement = selected;
    let selectionStart = start;
    let selectionEnd = start + replacement.length;

    if (action === 'h2') replacement = '## ' + selected;
    if (action === 'h3') replacement = '### ' + selected;
    if (action === 'bold') replacement = '**' + selected + '**';
    if (action === 'link') replacement = '[' + selected + '](https://example.com)';
    if (action === 'code') replacement = '```\n' + selected + '\n```';
    if (action === 'quote') replacement = '> ' + selected;
    if (action === 'list') replacement = '- ' + selected;
    if (action === 'image') replacement = '![' + selected + '](assets/uploads/nama-file.jpg)';

    selectionStart = start + replacement.length;
    selectionEnd = selectionStart;
    setSelection(textarea, selectionStart, selectionEnd, replacement);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }



  function loadDemoMedia() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.media) || '[]');
      return sortMediaItems((saved || []).map(normalizeMediaItem));
    } catch (error) {
      return [];
    }
  }

  function saveDemoMedia(mediaItems) {
    localStorage.setItem(STORAGE_KEYS.media, JSON.stringify(sortMediaItems((mediaItems || []).map(normalizeMediaItem)), null, 2));
  }

  function mediaKindFromName(name, mimeType) {
    const value = String(mimeType || name || '').toLowerCase();
    if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(value) || value.indexOf('image/') === 0) return 'image';
    if (/\.(mp4|webm|mov|m4v)$/.test(value) || value.indexOf('video/') === 0) return 'video';
    if (/\.(mp3|wav|ogg|m4a)$/.test(value) || value.indexOf('audio/') === 0) return 'audio';
    return 'file';
  }

  function normalizeMediaItem(input) {
    const now = new Date().toISOString();
    const item = Object.assign({
      id: 'media-' + Math.random().toString(36).slice(2, 10),
      name: '',
      path: '',
      url: '',
      alt: '',
      caption: '',
      mimeType: '',
      kind: 'image',
      size: 0,
      folder: 'assets/uploads',
      source: 'repo',
      createdAt: now,
      updatedAt: now
    }, input || {});
    item.url = item.url || item.path;
    item.folder = item.folder || (item.path ? item.path.split('/').slice(0, -1).join('/') : 'assets/uploads');
    item.name = item.name || (item.path ? item.path.split('/').pop() : 'file');
    item.kind = item.kind || mediaKindFromName(item.name, item.mimeType);
    if (!item.updatedAt) item.updatedAt = now;
    if (!item.createdAt) item.createdAt = now;
    return item;
  }

  function sortMediaItems(items) {
    return deepClone(items || []).map(normalizeMediaItem).sort(function (a, b) {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }

  function isImageMedia(item) {
    return normalizeMediaItem(item).kind === 'image';
  }

  function formatBytes(bytes) {
    const value = Number(bytes || 0);
    if (!value) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    const scaled = value / Math.pow(1024, index);
    return scaled.toFixed(scaled >= 10 || index === 0 ? 0 : 1) + ' ' + units[index];
  }

  async function deleteRepoFile(connection, path, message, sha, branch) {
    const activeBranch = branch || getTargetBranch(connection);
    const fileSha = sha || (await getRepoFile(connection, path, activeBranch)).sha;
    const url = 'https://api.github.com/repos/' + encodeURIComponent(connection.owner) + '/' + encodeURIComponent(connection.repo) + '/contents/' + path;
    return githubRequest(url, {
      method: 'DELETE',
      headers: githubHeaders(connection, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ message: message || ('Delete ' + path), sha: fileSha, branch: activeBranch })
    });
  }

  async function listRepoTree(connection, branch, prefix) {
    const activeBranch = branch || getTargetBranch(connection);
    const sha = await getBranchSha(connection, activeBranch);
    const url = 'https://api.github.com/repos/' + encodeURIComponent(connection.owner) + '/' + encodeURIComponent(connection.repo) + '/git/trees/' + encodeURIComponent(sha) + '?recursive=1';
    const data = await githubRequest(url, { headers: githubHeaders(connection) });
    const targetPrefix = String(prefix || '').replace(/^\/+/, '').replace(/\/+$/, '');
    return (data.tree || []).filter(function (item) {
      if (item.type !== 'blob') return false;
      if (!targetPrefix) return true;
      return String(item.path || '').indexOf(targetPrefix + '/') === 0 || String(item.path || '') === targetPrefix;
    });
  }

  async function loadRepoMedia(connection, branch) {
    const activeBranch = branch || getTargetBranch(connection);
    const mediaFile = await maybeGetRepoFile(connection, 'data/media.json', activeBranch);
    if (mediaFile && mediaFile.content) {
      return {
        items: sortMediaItems((safeJsonParse(mediaFile.content, []) || []).map(normalizeMediaItem)),
        sha: mediaFile.sha,
        source: 'media.json'
      };
    }
    const tree = await listRepoTree(connection, activeBranch, 'assets/uploads');
    const inferred = tree.map(function (item) {
      return normalizeMediaItem({
        id: 'media-' + slugify(item.path) + '-' + String(item.sha || '').slice(0, 7),
        name: item.path.split('/').pop(),
        path: item.path,
        url: item.path,
        kind: mediaKindFromName(item.path),
        size: item.size || 0,
        folder: item.path.split('/').slice(0, -1).join('/'),
        source: 'tree',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
    return { items: sortMediaItems(inferred), sha: null, source: 'tree' };
  }

  async function saveRepoMedia(connection, mediaItems, branch) {
    const activeBranch = branch || getTargetBranch(connection);
    const existing = await maybeGetRepoFile(connection, 'data/media.json', activeBranch);
    const response = await putRepoFile(
      connection,
      'data/media.json',
      JSON.stringify(sortMediaItems((mediaItems || []).map(normalizeMediaItem)), null, 2),
      'Update media.json',
      existing && existing.sha,
      false,
      activeBranch
    );
    return response && response.content ? response.content.sha : null;
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function uploadMediaFiles(connection, files, folderPath, branch) {
    const targetFolder = (folderPath || 'assets/uploads').replace(/^\/+|\/+$/g, '') || 'assets/uploads';
    const result = [];
    for (const file of Array.from(files || [])) {
      const safeName = slugify(file.name.replace(/\.[^.]+$/, '')) || 'media';
      const extensionMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
      const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'bin';
      const filename = Date.now() + '-' + safeName + '.' + extension;
      const path = targetFolder + '/' + filename;
      const content = await fileToBase64(file);
      await putRepoFile(connection, path, content, 'Upload media: ' + filename, null, true, branch);
      result.push(normalizeMediaItem({
        name: filename,
        path: path,
        url: path,
        alt: file.name.replace(/\.[^.]+$/, ''),
        caption: '',
        mimeType: file.type || '',
        kind: mediaKindFromName(file.name, file.type),
        size: file.size || 0,
        folder: targetFolder,
        source: 'repo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    }
    return result;
  }

  function createDemoMediaItems(files, folderPath) {
    const targetFolder = (folderPath || 'demo-media').replace(/^\/+|\/+$/g, '') || 'demo-media';
    return Promise.all(Array.from(files || []).map(async function (file) {
      const url = await fileToDataUrl(file);
      return normalizeMediaItem({
        name: file.name,
        path: url,
        url: url,
        alt: file.name.replace(/\.[^.]+$/, ''),
        caption: '',
        mimeType: file.type || '',
        kind: mediaKindFromName(file.name, file.type),
        size: file.size || 0,
        folder: targetFolder,
        source: 'demo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }));
  }

  function getOAuthRedirectUri(customRedirectUri) {
    return customRedirectUri || window.location.origin + window.location.pathname;
  }

  function startGithubOAuth(connection, customRedirectUri) {
    if (!connection || !connection.oauthClientId) throw new Error('OAuth Client ID belum diisi.');
    if (!connection || !connection.oauthProxyUrl) throw new Error('OAuth Proxy URL belum diisi.');
    const stateValue = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('gfcpa_oauth_state', stateValue);
    const redirectUri = getOAuthRedirectUri(customRedirectUri || connection.oauthRedirectUri);
    const params = new URLSearchParams({
      client_id: connection.oauthClientId,
      redirect_uri: redirectUri,
      scope: connection.oauthScope || 'repo read:user',
      state: stateValue,
      allow_signup: 'true'
    });
    window.location.href = 'https://github.com/login/oauth/authorize?' + params.toString();
  }

  async function exchangeGithubCode(connection, code, customRedirectUri) {
    const redirectUri = getOAuthRedirectUri(customRedirectUri || connection.oauthRedirectUri);
    const proxyBase = String(connection.oauthProxyUrl || '').replace(/\/+$/, '');
    const url = /\/oauth\/exchange$/.test(proxyBase) ? proxyBase : (proxyBase + '/oauth/exchange');
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code, redirect_uri: redirectUri })
    });
    if (!response.ok) {
      let message = 'OAuth exchange gagal.';
      try {
        const payload = await response.json();
        if (payload && payload.error) message = payload.error;
        if (payload && payload.details) message = payload.details;
      } catch (error) {
        try { message = await response.text(); } catch (innerError) {}
      }
      throw new Error(message);
    }
    return response.json();
  }

  async function getGithubViewer(token) {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': 'Bearer ' + token
      }
    });
    if (!response.ok) throw new Error('Gagal memuat profil GitHub.');
    return response.json();
  }

  async function handleOAuthCallback(connection) {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const stateValue = params.get('state');
    const oauthError = params.get('error');
    if (oauthError) throw new Error('GitHub OAuth ditolak: ' + oauthError);
    if (!code) return null;
    const storedState = sessionStorage.getItem('gfcpa_oauth_state');
    if (storedState && stateValue !== storedState) throw new Error('OAuth state tidak cocok. Ulangi login.');
    const payload = await exchangeGithubCode(connection, code, connection.oauthRedirectUri);
    if (!payload || !payload.access_token) throw new Error('Access token tidak ditemukan dari OAuth proxy.');
    const profile = await getGithubViewer(payload.access_token);
    params.delete('code');
    params.delete('state');
    params.delete('error');
    const cleanUrl = window.location.pathname + (params.toString() ? ('?' + params.toString()) : '') + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);
    sessionStorage.removeItem('gfcpa_oauth_state');
    return {
      token: payload.access_token,
      scope: payload.scope || '',
      tokenType: payload.token_type || 'bearer',
      profile: profile,
      obtainedAt: new Date().toISOString()
    };
  }

  function clearGithubOAuthState() {
    sessionStorage.removeItem('gfcpa_oauth_state');
  }

  window.CMS = {
    STORAGE_KEYS: STORAGE_KEYS,
    DEFAULT_SITE: DEFAULT_SITE,
    FALLBACK_POSTS: FALLBACK_POSTS,
    deepClone: deepClone,
    safeJsonParse: safeJsonParse,
    slugify: slugify,
    escapeHtml: escapeHtml,
    stripMarkdown: stripMarkdown,
    excerptFromContent: excerptFromContent,
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    readingTime: readingTime,
    uniqueValues: uniqueValues,
    normalizePost: normalizePost,
    normalizeSite: normalizeSite,
    sortPosts: sortPosts,
    getPublishedPosts: getPublishedPosts,
    resolveSiteUrl: resolveSiteUrl,
    resolveAbsoluteUrl: resolveAbsoluteUrl,
    markdownToHtml: markdownToHtml,
    extractHeadings: extractHeadings,
    loadPublicData: loadPublicData,
    loadDemoData: loadDemoData,
    saveDemoData: saveDemoData,
    loadDemoMedia: loadDemoMedia,
    saveDemoMedia: saveDemoMedia,
    loadConnection: loadConnection,
    saveConnection: saveConnection,
    loadAutosave: loadAutosave,
    saveAutosave: saveAutosave,
    clearAutosave: clearAutosave,
    hasGithubConfig: hasGithubConfig,
    getTargetBranch: getTargetBranch,
    getRepoFile: getRepoFile,
    maybeGetRepoFile: maybeGetRepoFile,
    putRepoFile: putRepoFile,
    upsertRepoFile: upsertRepoFile,
    deleteRepoFile: deleteRepoFile,
    listRepoTree: listRepoTree,
    loadRepoData: loadRepoData,
    loadRepoMedia: loadRepoMedia,
    saveRepoMedia: saveRepoMedia,
    ensureBranch: ensureBranch,
    uploadImageToRepo: uploadImageToRepo,
    uploadMediaFiles: uploadMediaFiles,
    createDemoMediaItems: createDemoMediaItems,
    createOrOpenPullRequest: createOrOpenPullRequest,
    debounce: debounce,
    buildSearchIndex: buildSearchIndex,
    buildSitemapXml: buildSitemapXml,
    buildRssXml: buildRssXml,
    buildRobotsTxt: buildRobotsTxt,
    downloadTextFile: downloadTextFile,
    insertMarkdownSnippet: insertMarkdownSnippet,
    normalizeMediaItem: normalizeMediaItem,
    sortMediaItems: sortMediaItems,
    isImageMedia: isImageMedia,
    mediaKindFromName: mediaKindFromName,
    formatBytes: formatBytes,
    getOAuthRedirectUri: getOAuthRedirectUri,
    startGithubOAuth: startGithubOAuth,
    exchangeGithubCode: exchangeGithubCode,
    getGithubViewer: getGithubViewer,
    handleOAuthCallback: handleOAuthCallback,
    clearGithubOAuthState: clearGithubOAuthState
  };
})();

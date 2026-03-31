(function () {
  const state = {
    site: null,
    posts: [],
    filtered: [],
    currentPage: 1,
    query: '',
    category: 'all'
  };

  const els = {
    brandTitle: document.getElementById('brandTitle'),
    brandTagline: document.getElementById('brandTagline'),
    heroTitle: document.getElementById('heroTitle'),
    heroDescription: document.getElementById('heroDescription'),
    footerText: document.getElementById('footerText'),
    statPosts: document.getElementById('statPosts'),
    statPublished: document.getElementById('statPublished'),
    statCategories: document.getElementById('statCategories'),
    statFeatured: document.getElementById('statFeatured'),
    searchInput: document.getElementById('searchInput'),
    categoryFilter: document.getElementById('categoryFilter'),
    featuredWrap: document.getElementById('featuredWrap'),
    postsGrid: document.getElementById('postsGrid'),
    emptyState: document.getElementById('emptyState'),
    pagination: document.getElementById('pagination')
  };

  function setSiteMeta(site) {
    document.title = site.siteTitle || 'GitHub File CMS Pro';
    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) descriptionTag.setAttribute('content', site.siteTagline || site.heroDescription || 'CMS tanpa database');
    document.documentElement.lang = (site.language || 'id').split('-')[0];
    els.brandTitle.textContent = site.siteTitle || 'GitHub File CMS Pro';
    els.brandTagline.textContent = site.siteTagline || 'CMS tanpa database untuk GitHub Pages';
    els.heroTitle.textContent = site.heroTitle || 'Bangun website dinamis tanpa database';
    els.heroDescription.textContent = site.heroDescription || 'Konten disimpan sebagai file JSON di repository GitHub.';
    els.footerText.textContent = site.footerText || 'Dibuat dengan GitHub File CMS Pro';
  }

  function renderStats(posts) {
    const published = CMS.getPublishedPosts(posts);
    const categories = CMS.uniqueValues(published.map(function (post) { return post.category; }));
    const featured = published.filter(function (post) { return post.featured; });
    els.statPosts.textContent = String(posts.length);
    els.statPublished.textContent = String(published.length);
    els.statCategories.textContent = String(categories.length);
    els.statFeatured.textContent = String(featured.length);
  }

  function renderCategoryOptions(posts) {
    const categories = CMS.uniqueValues(posts.map(function (post) { return post.category; }));
    els.categoryFilter.innerHTML = '<option value="all">Semua kategori</option>' + categories.map(function (category) {
      return '<option value="' + CMS.escapeHtml(category) + '">' + CMS.escapeHtml(category) + '</option>';
    }).join('');
  }

  function buildPostCard(post) {
    const tags = (post.tags || []).slice(0, 3).map(function (tag) {
      return '<span class="tag-chip">#' + CMS.escapeHtml(tag) + '</span>';
    }).join('');

    return [
      '<article class="card post-card">',
      '  <div class="post-card-cover"><img src="' + CMS.escapeHtml(post.coverImage || 'assets/img/placeholder.svg') + '" alt="' + CMS.escapeHtml(post.title) + '"></div>',
      '  <div class="post-card-body">',
      '    <div class="meta-row">',
      '      <span class="meta-chip">' + CMS.escapeHtml(post.category || 'Umum') + '</span>',
      '      <span class="meta-chip">' + CMS.formatDate(post.publishedAt) + '</span>',
      '      <span class="meta-chip">' + CMS.readingTime(post.content) + ' min baca</span>',
      '    </div>',
      '    <h3>' + CMS.escapeHtml(post.title) + '</h3>',
      '    <p>' + CMS.escapeHtml(post.excerpt || '') + '</p>',
      '    <div class="tag-row">' + tags + '</div>',
      '    <a class="post-link" href="post.html?slug=' + encodeURIComponent(post.slug) + '">Baca selengkapnya →</a>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function renderFeatured(posts) {
    els.featuredWrap.innerHTML = '';
    if (!state.site.showFeaturedOnlyOnTop) return;
    const featured = posts.find(function (post) { return post.featured; });
    if (!featured) return;

    els.featuredWrap.innerHTML = [
      '<article class="card featured-card">',
      '  <div class="featured-media"><img src="' + CMS.escapeHtml(featured.coverImage || 'assets/img/placeholder.svg') + '" alt="' + CMS.escapeHtml(featured.title) + '"></div>',
      '  <div class="featured-body">',
      '    <span class="pill">Featured post</span>',
      '    <h3>' + CMS.escapeHtml(featured.title) + '</h3>',
      '    <p>' + CMS.escapeHtml(featured.excerpt || '') + '</p>',
      '    <div class="meta-row">',
      '      <span class="meta-chip">' + CMS.escapeHtml(featured.category || 'Umum') + '</span>',
      '      <span class="meta-chip">' + CMS.formatDate(featured.publishedAt) + '</span>',
      '      <span class="meta-chip">' + CMS.readingTime(featured.content) + ' min baca</span>',
      '    </div>',
      '    <div class="button-row">',
      '      <a class="btn btn-primary" href="post.html?slug=' + encodeURIComponent(featured.slug) + '">Baca Artikel</a>',
      '    </div>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function applyFilters() {
    const published = CMS.getPublishedPosts(state.posts);
    state.filtered = published.filter(function (post) {
      const inCategory = state.category === 'all' || post.category === state.category;
      const haystack = [post.title, post.excerpt, post.category].concat(post.tags || []).join(' ').toLowerCase();
      const matchesQuery = !state.query || haystack.indexOf(state.query) !== -1;
      return inCategory && matchesQuery;
    });
    state.currentPage = 1;
    renderAll();
  }

  function renderPagination(totalPages) {
    els.pagination.innerHTML = '';
    if (totalPages <= 1) return;
    for (let page = 1; page <= totalPages; page += 1) {
      const button = document.createElement('button');
      button.textContent = String(page);
      if (page === state.currentPage) button.classList.add('active');
      button.addEventListener('click', function () {
        state.currentPage = page;
        renderAll();
        window.scrollTo({ top: document.getElementById('postsSection').offsetTop - 10, behavior: 'smooth' });
      });
      els.pagination.appendChild(button);
    }
  }

  function renderAll() {
    renderFeatured(state.filtered);
    const perPage = Math.max(1, Number(state.site.postsPerPage || 6));
    const totalPages = Math.max(1, Math.ceil(state.filtered.length / perPage));
    if (state.currentPage > totalPages) state.currentPage = totalPages;
    const start = (state.currentPage - 1) * perPage;
    const items = state.filtered.slice(start, start + perPage);

    els.postsGrid.innerHTML = items.map(buildPostCard).join('');
    els.emptyState.classList.toggle('hidden', items.length > 0);
    renderPagination(totalPages);
  }

  function bindEvents() {
    els.searchInput.addEventListener('input', CMS.debounce(function (event) {
      state.query = String(event.target.value || '').trim().toLowerCase();
      applyFilters();
    }, 150));

    els.categoryFilter.addEventListener('change', function (event) {
      state.category = event.target.value;
      applyFilters();
    });
  }

  async function init() {
    bindEvents();
    try {
      const data = await CMS.loadPublicData();
      state.site = data.site;
      state.posts = data.posts;
      setSiteMeta(state.site);
      renderStats(state.posts);
      renderCategoryOptions(CMS.getPublishedPosts(state.posts));
      state.filtered = CMS.getPublishedPosts(state.posts);
      renderAll();
    } catch (error) {
      els.postsGrid.innerHTML = '<div class="empty-state">' + CMS.escapeHtml(error.message) + '</div>';
    }
  }

  init();
})();

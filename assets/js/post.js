(function () {
  const els = {
    brandTitle: document.getElementById('brandTitle'),
    brandTagline: document.getElementById('brandTagline'),
    footerText: document.getElementById('footerText'),
    postContainer: document.getElementById('postContainer'),
    relatedPosts: document.getElementById('relatedPosts'),
    tocWrap: document.getElementById('tocWrap')
  };

  function getSlug() {
    const params = new URLSearchParams(window.location.search);
    return params.get('slug') || '';
  }

  function renderToc(headings) {
    if (!headings.length) {
      els.tocWrap.innerHTML = '<div class="empty-state small-empty">Belum ada heading.</div>';
      return;
    }
    els.tocWrap.innerHTML = headings.map(function (item) {
      return '<a class="toc-level-' + item.level + '" href="#' + encodeURIComponent(item.id) + '">' + CMS.escapeHtml(item.text) + '</a>';
    }).join('');
  }

  function renderPost(post, site) {
    els.brandTitle.textContent = site.siteTitle || 'GitHub File CMS Pro';
    els.brandTagline.textContent = site.siteTagline || 'CMS tanpa database untuk GitHub Pages';
    els.footerText.textContent = site.footerText || 'Dibuat dengan GitHub File CMS Pro';

    document.title = (post.seoTitle || post.title) + ' • ' + (site.siteTitle || 'GitHub File CMS Pro');
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute('content', post.seoDescription || post.excerpt || 'Artikel');

    els.postContainer.innerHTML = [
      '<div class="post-cover"><img src="' + CMS.escapeHtml(post.coverImage || 'assets/img/placeholder.svg') + '" alt="' + CMS.escapeHtml(post.title) + '"></div>',
      '<div class="post-content-wrap">',
      '  <div class="meta-row">',
      '    <span class="meta-chip">' + CMS.escapeHtml(post.category || 'Umum') + '</span>',
      '    <span class="meta-chip">' + CMS.formatDate(post.publishedAt) + '</span>',
      '    <span class="meta-chip">' + CMS.readingTime(post.content) + ' min baca</span>',
      '    <span class="meta-chip">' + CMS.escapeHtml(post.author || 'Admin') + '</span>',
      '  </div>',
      '  <h1 class="post-title">' + CMS.escapeHtml(post.title) + '</h1>',
      '  <p class="help-text">' + CMS.escapeHtml(post.excerpt || '') + '</p>',
      '  <div class="tag-row" style="margin:18px 0 20px;">' + (post.tags || []).map(function (tag) {
        return '<span class="tag-chip">#' + CMS.escapeHtml(tag) + '</span>';
      }).join('') + '</div>',
      '  <div class="post-body prose-block">' + CMS.markdownToHtml(post.content || '') + '</div>',
      '</div>'
    ].join('');
  }

  function renderRelated(posts, currentPost) {
    const related = posts.filter(function (post) {
      return post.slug !== currentPost.slug && post.category === currentPost.category;
    }).slice(0, 3);

    if (!related.length) {
      els.relatedPosts.innerHTML = '<div class="empty-state">Belum ada artikel terkait.</div>';
      return;
    }

    els.relatedPosts.innerHTML = related.map(function (post) {
      return [
        '<article class="card post-card">',
        '  <div class="post-card-cover"><img src="' + CMS.escapeHtml(post.coverImage || 'assets/img/placeholder.svg') + '" alt="' + CMS.escapeHtml(post.title) + '"></div>',
        '  <div class="post-card-body">',
        '    <div class="meta-row">',
        '      <span class="meta-chip">' + CMS.escapeHtml(post.category || 'Umum') + '</span>',
        '      <span class="meta-chip">' + CMS.formatDate(post.publishedAt) + '</span>',
        '    </div>',
        '    <h3>' + CMS.escapeHtml(post.title) + '</h3>',
        '    <p>' + CMS.escapeHtml(post.excerpt || '') + '</p>',
        '    <a class="post-link" href="post.html?slug=' + encodeURIComponent(post.slug) + '">Buka artikel →</a>',
        '  </div>',
        '</article>'
      ].join('');
    }).join('');
  }

  async function init() {
    const slug = getSlug();
    if (!slug) {
      els.postContainer.innerHTML = '<div class="post-content-wrap"><div class="empty-state">Slug artikel tidak ditemukan.</div></div>';
      return;
    }

    try {
      const data = await CMS.loadPublicData();
      const posts = CMS.getPublishedPosts(data.posts);
      const post = posts.find(function (item) { return item.slug === slug; });
      if (!post) {
        els.postContainer.innerHTML = '<div class="post-content-wrap"><div class="empty-state">Artikel tidak ditemukan atau belum dipublish.</div></div>';
        return;
      }
      renderPost(post, data.site);
      renderRelated(posts, post);
      renderToc(CMS.extractHeadings(post.content));
    } catch (error) {
      els.postContainer.innerHTML = '<div class="post-content-wrap"><div class="empty-state">' + CMS.escapeHtml(error.message) + '</div></div>';
    }
  }

  init();
})();

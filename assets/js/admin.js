(function () {
  const savedConnection = CMS.loadConnection();
  const state = {
    connection: Object.assign({
      publishMode: 'direct',
      baseBranch: 'main',
      workingBranch: 'cms-draft',
      oauthScope: 'repo read:user'
    }, savedConnection),
    demoMode: Boolean(savedConnection.demoMode),
    site: CMS.deepClone(CMS.DEFAULT_SITE),
    posts: [],
    media: [],
    selectedPostId: null,
    selectedMediaId: null,
    shas: { site: null, posts: null, media: null },
    editorView: 'split'
  };

  const els = {
    demoMode: document.getElementById('demoMode'),
    ghOwner: document.getElementById('ghOwner'),
    ghRepo: document.getElementById('ghRepo'),
    ghBaseBranch: document.getElementById('ghBaseBranch'),
    ghPublishMode: document.getElementById('ghPublishMode'),
    ghWorkingBranch: document.getElementById('ghWorkingBranch'),
    oauthClientId: document.getElementById('oauthClientId'),
    oauthProxyUrl: document.getElementById('oauthProxyUrl'),
    oauthScope: document.getElementById('oauthScope'),
    ghToken: document.getElementById('ghToken'),
    saveConnectionBtn: document.getElementById('saveConnectionBtn'),
    oauthLoginBtn: document.getElementById('oauthLoginBtn'),
    refreshIdentityBtn: document.getElementById('refreshIdentityBtn'),
    logoutGithubBtn: document.getElementById('logoutGithubBtn'),
    loadRepoBtn: document.getElementById('loadRepoBtn'),
    syncAllBtn: document.getElementById('syncAllBtn'),
    createPrBtn: document.getElementById('createPrBtn'),
    connectionBadge: document.getElementById('connectionBadge'),
    authBadge: document.getElementById('authBadge'),
    identityName: document.getElementById('identityName'),
    identityMeta: document.getElementById('identityMeta'),
    identityCard: document.getElementById('identityCard'),

    adminStatPosts: document.getElementById('adminStatPosts'),
    adminStatPublished: document.getElementById('adminStatPublished'),
    adminStatDraft: document.getElementById('adminStatDraft'),
    adminStatCategories: document.getElementById('adminStatCategories'),
    adminStatMedia: document.getElementById('adminStatMedia'),

    autosaveBadge: document.getElementById('autosaveBadge'),
    autosaveText: document.getElementById('autosaveText'),

    siteTitle: document.getElementById('siteTitle'),
    siteTagline: document.getElementById('siteTagline'),
    siteUrl: document.getElementById('siteUrl'),
    siteLanguage: document.getElementById('siteLanguage'),
    heroTitle: document.getElementById('heroTitle'),
    heroDescription: document.getElementById('heroDescription'),
    postsPerPage: document.getElementById('postsPerPage'),
    footerText: document.getElementById('footerText'),
    showFeaturedOnlyOnTop: document.getElementById('showFeaturedOnlyOnTop'),
    saveSiteBtn: document.getElementById('saveSiteBtn'),
    exportBackupBtn: document.getElementById('exportBackupBtn'),
    importBackupInput: document.getElementById('importBackupInput'),

    postId: document.getElementById('postId'),
    postTitle: document.getElementById('postTitle'),
    postSlug: document.getElementById('postSlug'),
    postAuthor: document.getElementById('postAuthor'),
    postCategory: document.getElementById('postCategory'),
    postStatus: document.getElementById('postStatus'),
    postTags: document.getElementById('postTags'),
    postExcerpt: document.getElementById('postExcerpt'),
    postContent: document.getElementById('postContent'),
    markdownPreview: document.getElementById('markdownPreview'),
    postCoverImage: document.getElementById('postCoverImage'),
    coverUpload: document.getElementById('coverUpload'),
    postSeoTitle: document.getElementById('postSeoTitle'),
    postSeoDescription: document.getElementById('postSeoDescription'),
    postFeatured: document.getElementById('postFeatured'),
    uploadImageBtn: document.getElementById('uploadImageBtn'),
    deletePostBtn: document.getElementById('deletePostBtn'),
    newPostBtn: document.getElementById('newPostBtn'),
    duplicatePostBtn: document.getElementById('duplicatePostBtn'),
    savePostBtn: document.getElementById('savePostBtn'),
    coverPreview: document.getElementById('coverPreview'),
    seoPreview: document.getElementById('seoPreview'),
    restoreAutosaveBtn: document.getElementById('restoreAutosaveBtn'),
    clearAutosaveBtn: document.getElementById('clearAutosaveBtn'),
    editorWorkbench: document.getElementById('editorWorkbench'),
    editorViewSwitch: document.getElementById('editorViewSwitch'),

    mediaFolder: document.getElementById('mediaFolder'),
    mediaSearch: document.getElementById('mediaSearch'),
    mediaUploadInput: document.getElementById('mediaUploadInput'),
    uploadMediaBtn: document.getElementById('uploadMediaBtn'),
    refreshMediaBtn: document.getElementById('refreshMediaBtn'),
    mediaGrid: document.getElementById('mediaGrid'),
    mediaCountBadge: document.getElementById('mediaCountBadge'),
    mediaUsageHint: document.getElementById('mediaUsageHint'),
    mediaMetaId: document.getElementById('mediaMetaId'),
    mediaMetaPath: document.getElementById('mediaMetaPath'),
    mediaMetaAlt: document.getElementById('mediaMetaAlt'),
    mediaMetaCaption: document.getElementById('mediaMetaCaption'),
    saveMediaMetaBtn: document.getElementById('saveMediaMetaBtn'),
    deleteMediaBtn: document.getElementById('deleteMediaBtn'),
    copyMediaUrlBtn: document.getElementById('copyMediaUrlBtn'),
    copyMediaMarkdownBtn: document.getElementById('copyMediaMarkdownBtn'),
    useMediaAsCoverBtn: document.getElementById('useMediaAsCoverBtn'),
    insertMediaToEditorBtn: document.getElementById('insertMediaToEditorBtn'),
    selectedMediaPreview: document.getElementById('selectedMediaPreview'),

    adminSearch: document.getElementById('adminSearch'),
    postList: document.getElementById('postList'),
    toast: document.getElementById('toast')
  };

  function showToast(message, tone) {
    els.toast.textContent = message;
    els.toast.className = 'toast show';
    if (tone === 'danger') els.toast.style.borderColor = 'rgba(239, 68, 68, 0.35)';
    else if (tone === 'success') els.toast.style.borderColor = 'rgba(34, 197, 94, 0.35)';
    else els.toast.style.borderColor = 'rgba(148, 163, 184, 0.18)';
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () {
      els.toast.className = 'toast';
    }, 2800);
  }

  function getConnectionFromForm() {
    const next = Object.assign({}, state.connection, {
      demoMode: Boolean(els.demoMode.checked),
      owner: els.ghOwner.value.trim(),
      repo: els.ghRepo.value.trim(),
      baseBranch: els.ghBaseBranch.value.trim() || 'main',
      publishMode: els.ghPublishMode.value,
      workingBranch: els.ghWorkingBranch.value.trim() || 'cms-draft',
      oauthClientId: els.oauthClientId.value.trim(),
      oauthProxyUrl: els.oauthProxyUrl.value.trim(),
      oauthScope: els.oauthScope.value.trim() || 'repo read:user'
    });

    const manualToken = els.ghToken.value.trim();
    if (manualToken) {
      next.token = manualToken;
      next.authType = 'pat';
    }
    if (!next.authType) next.authType = next.token ? 'oauth' : '';
    return next;
  }

  function saveConnectionState() {
    state.connection.demoMode = state.demoMode;
    CMS.saveConnection(state.connection);
  }

  function syncConnectionToForm() {
    els.demoMode.checked = Boolean(state.demoMode);
    els.ghOwner.value = state.connection.owner || '';
    els.ghRepo.value = state.connection.repo || '';
    els.ghBaseBranch.value = state.connection.baseBranch || 'main';
    els.ghPublishMode.value = state.connection.publishMode || 'direct';
    els.ghWorkingBranch.value = state.connection.workingBranch || 'cms-draft';
    els.oauthClientId.value = state.connection.oauthClientId || '';
    els.oauthProxyUrl.value = state.connection.oauthProxyUrl || '';
    els.oauthScope.value = state.connection.oauthScope || 'repo read:user';
    els.ghToken.value = state.connection.authType === 'pat' ? (state.connection.token || '') : '';
    toggleGithubInputs();
    refreshConnectionBadge();
    renderIdentity();
  }

  function toggleGithubInputs() {
    const isDemo = Boolean(state.demoMode);
    [
      els.ghOwner, els.ghRepo, els.ghBaseBranch, els.ghPublishMode, els.ghWorkingBranch,
      els.oauthClientId, els.oauthProxyUrl, els.oauthScope, els.ghToken,
      els.loadRepoBtn, els.syncAllBtn, els.createPrBtn, els.oauthLoginBtn,
      els.refreshIdentityBtn, els.logoutGithubBtn, els.uploadMediaBtn, els.refreshMediaBtn
    ].forEach(function (element) {
      if (element) element.disabled = isDemo;
    });
  }

  function refreshConnectionBadge() {
    if (state.demoMode) {
      els.connectionBadge.textContent = 'Demo mode aktif';
      els.connectionBadge.className = 'status-badge success';
      return;
    }
    if (CMS.hasGithubConfig(state.connection)) {
      const modeLabel = state.connection.publishMode === 'pr' ? 'PR workflow' : 'Direct publish';
      els.connectionBadge.textContent = modeLabel + ' • ' + CMS.getTargetBranch(state.connection);
      els.connectionBadge.className = 'status-badge warning';
      return;
    }
    els.connectionBadge.textContent = 'Konfigurasi belum lengkap';
    els.connectionBadge.className = 'status-badge';
  }

  function renderIdentity() {
    if (state.demoMode) {
      els.authBadge.textContent = 'Demo mode';
      els.authBadge.className = 'status-badge success';
      els.identityName.textContent = 'Demo mode aktif';
      els.identityMeta.textContent = 'OAuth dan GitHub API dinonaktifkan saat demo mode.';
      return;
    }
    const viewer = state.connection.viewer;
    if (!state.connection.token) {
      els.authBadge.textContent = 'Belum login';
      els.authBadge.className = 'status-badge';
      els.identityName.textContent = 'Belum login';
      els.identityMeta.textContent = 'Simpan pengaturan lalu login memakai OAuth, atau isi token manual sebagai fallback.';
      return;
    }
    els.authBadge.textContent = state.connection.authType === 'oauth' ? 'OAuth aktif' : 'Token manual';
    els.authBadge.className = 'status-badge success';
    els.identityName.textContent = viewer && (viewer.name || viewer.login) ? (viewer.name || viewer.login) : 'Token tersimpan';
    const repoText = state.connection.owner && state.connection.repo ? (' • repo: ' + state.connection.owner + '/' + state.connection.repo) : '';
    els.identityMeta.textContent = viewer && viewer.login
      ? '@' + viewer.login + repoText
      : 'Token siap dipakai untuk GitHub API.' + repoText;
  }

  function updateAutosaveStatus(payload) {
    if (payload && payload.savedAt) {
      els.autosaveBadge.textContent = 'Autosave aktif';
      els.autosaveBadge.className = 'status-badge success';
      els.autosaveText.textContent = 'Draft terakhir tersimpan pada ' + CMS.formatDateTime(payload.savedAt) + '.';
      return;
    }
    els.autosaveBadge.textContent = 'Autosave belum aktif';
    els.autosaveBadge.className = 'status-badge';
    els.autosaveText.textContent = 'Draft editor akan disimpan otomatis di browser.';
  }

  function renderAdminStats() {
    const published = state.posts.filter(function (post) { return post.status === 'published'; }).length;
    const draft = state.posts.filter(function (post) { return post.status === 'draft'; }).length;
    const categories = CMS.uniqueValues(state.posts.map(function (post) { return post.category; })).length;
    els.adminStatPosts.textContent = String(state.posts.length);
    els.adminStatPublished.textContent = String(published);
    els.adminStatDraft.textContent = String(draft);
    els.adminStatCategories.textContent = String(categories);
    els.adminStatMedia.textContent = String(state.media.length);
    els.mediaCountBadge.textContent = state.media.length + ' item';
  }

  function renderSiteForm() {
    els.siteTitle.value = state.site.siteTitle || '';
    els.siteTagline.value = state.site.siteTagline || '';
    els.siteUrl.value = state.site.siteUrl || '';
    els.siteLanguage.value = state.site.language || 'id-ID';
    els.heroTitle.value = state.site.heroTitle || '';
    els.heroDescription.value = state.site.heroDescription || '';
    els.postsPerPage.value = String(state.site.postsPerPage || 6);
    els.footerText.value = state.site.footerText || '';
    els.showFeaturedOnlyOnTop.checked = Boolean(state.site.showFeaturedOnlyOnTop);
  }

  function getSiteFromForm() {
    return CMS.normalizeSite({
      siteTitle: els.siteTitle.value.trim(),
      siteTagline: els.siteTagline.value.trim(),
      siteUrl: els.siteUrl.value.trim(),
      language: els.siteLanguage.value.trim() || 'id-ID',
      heroTitle: els.heroTitle.value.trim(),
      heroDescription: els.heroDescription.value.trim(),
      postsPerPage: Math.max(1, Number(els.postsPerPage.value || 6)),
      footerText: els.footerText.value.trim(),
      showFeaturedOnlyOnTop: Boolean(els.showFeaturedOnlyOnTop.checked)
    });
  }

  function renderCoverPreview(path) {
    if (!path) {
      els.coverPreview.classList.add('hidden');
      els.coverPreview.innerHTML = '';
      return;
    }
    els.coverPreview.classList.remove('hidden');
    els.coverPreview.innerHTML = '<img src="' + CMS.escapeHtml(path) + '" alt="Cover preview"><p class="help-text" style="margin-top:12px;">' + CMS.escapeHtml(path) + '</p>';
  }

  function renderMarkdownPreview() {
    els.markdownPreview.innerHTML = CMS.markdownToHtml(els.postContent.value);
  }

  function renderSeoPreview() {
    const title = els.postSeoTitle.value.trim() || els.postTitle.value.trim() || 'Judul artikel';
    const excerpt = els.postSeoDescription.value.trim() || els.postExcerpt.value.trim() || CMS.excerptFromContent(els.postContent.value, 155);
    const slug = els.postSlug.value.trim() || CMS.slugify(els.postTitle.value) || 'slug-artikel';
    const url = CMS.resolveAbsoluteUrl(getSiteFromForm(), 'post.html?slug=' + encodeURIComponent(slug));
    const reading = CMS.readingTime(els.postContent.value);
    els.seoPreview.innerHTML = [
      '<div class="seo-url">' + CMS.escapeHtml(url) + '</div>',
      '<div class="seo-title">' + CMS.escapeHtml(title) + '</div>',
      '<div class="seo-desc">' + CMS.escapeHtml(excerpt) + '</div>',
      '<div class="seo-meta">',
      '  <span>' + reading + ' min baca</span>',
      '  <span>•</span>',
      '  <span>' + CMS.escapeHtml(els.postCategory.value.trim() || 'Umum') + '</span>',
      '</div>'
    ].join('');
  }

  function getPostFromForm() {
    const existing = state.posts.find(function (item) { return item.id === els.postId.value.trim(); });
    return CMS.normalizePost({
      id: els.postId.value.trim() || String(Date.now()),
      slug: els.postSlug.value.trim() || CMS.slugify(els.postTitle.value),
      title: els.postTitle.value.trim(),
      author: els.postAuthor.value.trim() || 'Admin',
      category: els.postCategory.value.trim() || 'Umum',
      status: els.postStatus.value,
      tags: els.postTags.value.split(',').map(function (item) { return item.trim(); }).filter(Boolean),
      excerpt: els.postExcerpt.value.trim(),
      content: els.postContent.value,
      coverImage: els.postCoverImage.value.trim(),
      seoTitle: els.postSeoTitle.value.trim(),
      seoDescription: els.postSeoDescription.value.trim(),
      featured: Boolean(els.postFeatured.checked),
      publishedAt: existing && existing.publishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  function fillPostForm(post) {
    const item = CMS.normalizePost(post);
    state.selectedPostId = item.id;
    els.postId.value = item.id;
    els.postTitle.value = item.title || '';
    els.postSlug.value = item.slug || '';
    els.postAuthor.value = item.author || 'Admin';
    els.postCategory.value = item.category || 'Umum';
    els.postStatus.value = item.status || 'draft';
    els.postTags.value = (item.tags || []).join(', ');
    els.postExcerpt.value = item.excerpt || '';
    els.postContent.value = item.content || '';
    els.postCoverImage.value = item.coverImage || '';
    els.postSeoTitle.value = item.seoTitle || item.title || '';
    els.postSeoDescription.value = item.seoDescription || item.excerpt || '';
    els.postFeatured.checked = Boolean(item.featured);
    renderMarkdownPreview();
    renderSeoPreview();
    renderCoverPreview(item.coverImage || '');
    renderPostList();
  }

  function resetPostForm() {
    fillPostForm(CMS.normalizePost({
      id: String(Date.now()),
      slug: '',
      title: '',
      excerpt: '',
      content: '',
      category: 'Umum',
      tags: [],
      coverImage: '',
      status: 'draft',
      featured: false,
      author: 'Admin',
      seoTitle: '',
      seoDescription: ''
    }));
  }

  function renderPostList() {
    const keyword = els.adminSearch.value.trim().toLowerCase();
    const filtered = state.posts.filter(function (post) {
      if (!keyword) return true;
      return [post.title, post.slug, post.category, (post.tags || []).join(' ')].join(' ').toLowerCase().indexOf(keyword) >= 0;
    });

    if (!filtered.length) {
      els.postList.innerHTML = '<div class="empty-state">Belum ada artikel yang cocok.</div>';
      return;
    }

    els.postList.innerHTML = filtered.map(function (post) {
      const isActive = post.id === state.selectedPostId;
      return [
        '<article class="post-row ' + (isActive ? 'active' : '') + '">',
        '  <div>',
        '    <div class="post-row-title">' + CMS.escapeHtml(post.title || '(Tanpa judul)') + '</div>',
        '    <div class="post-row-meta">',
        '      <span>' + CMS.escapeHtml(post.slug) + '</span>',
        '      <span>•</span>',
        '      <span>' + CMS.escapeHtml(post.category || 'Umum') + '</span>',
        '      <span>•</span>',
        '      <span>' + CMS.escapeHtml(post.status || 'draft') + '</span>',
        '      <span>•</span>',
        '      <span>' + CMS.formatDateTime(post.updatedAt) + '</span>',
        '    </div>',
        '  </div>',
        '  <div class="button-row compact">',
        '    <button class="btn btn-secondary" data-action="edit" data-id="' + CMS.escapeHtml(post.id) + '">Edit</button>',
        '    <button class="btn btn-secondary" data-action="delete" data-id="' + CMS.escapeHtml(post.id) + '">Hapus</button>',
        '  </div>',
        '</article>'
      ].join('');
    }).join('');
  }

  function persistAutosaveDraft() {
    const post = getPostFromForm();
    const site = getSiteFromForm();
    const payload = { post: post, site: site, savedAt: new Date().toISOString() };
    CMS.saveAutosave(payload);
    updateAutosaveStatus(payload);
  }

  const debouncedAutosave = CMS.debounce(persistAutosaveDraft, 400);

  function setEditorView(view) {
    state.editorView = view;
    els.editorWorkbench.className = 'editor-workbench ' + view;
    Array.from(els.editorViewSwitch.querySelectorAll('button[data-view]')).forEach(function (button) {
      button.classList.toggle('active', button.getAttribute('data-view') === view);
    });
  }

  async function persistGeneratedFiles() {
    if (state.demoMode) return;
    const targetBranch = CMS.getTargetBranch(state.connection);
    const generated = [
      ['data/search.json', CMS.buildSearchIndex(state.site, state.posts), 'Update search index'],
      ['sitemap.xml', CMS.buildSitemapXml(state.site, state.posts), 'Update sitemap.xml'],
      ['rss.xml', CMS.buildRssXml(state.site, state.posts), 'Update rss.xml'],
      ['robots.txt', CMS.buildRobotsTxt(state.site), 'Update robots.txt']
    ];
    for (const item of generated) {
      await CMS.upsertRepoFile(state.connection, item[0], item[1], item[2], targetBranch, false);
    }
  }

  async function persistPosts() {
    state.posts = CMS.sortPosts(state.posts.map(CMS.normalizePost));
    if (state.demoMode) {
      CMS.saveDemoData(state.site, state.posts);
      return;
    }
    if (!CMS.hasGithubConfig(state.connection)) throw new Error('Konfigurasi GitHub belum lengkap.');
    const targetBranch = CMS.getTargetBranch(state.connection);
    if (state.connection.publishMode === 'pr') await CMS.ensureBranch(state.connection, targetBranch, state.connection.baseBranch);
    const existing = await CMS.maybeGetRepoFile(state.connection, 'data/posts.json', targetBranch);
    const response = await CMS.putRepoFile(state.connection, 'data/posts.json', JSON.stringify(state.posts, null, 2), 'Update posts.json', existing && existing.sha, false, targetBranch);
    state.shas.posts = response && response.content ? response.content.sha : state.shas.posts;
    await persistGeneratedFiles();
  }

  async function persistSite() {
    state.site = CMS.normalizeSite(state.site);
    if (state.demoMode) {
      CMS.saveDemoData(state.site, state.posts);
      return;
    }
    if (!CMS.hasGithubConfig(state.connection)) throw new Error('Konfigurasi GitHub belum lengkap.');
    const targetBranch = CMS.getTargetBranch(state.connection);
    if (state.connection.publishMode === 'pr') await CMS.ensureBranch(state.connection, targetBranch, state.connection.baseBranch);
    const existing = await CMS.maybeGetRepoFile(state.connection, 'data/site.json', targetBranch);
    const response = await CMS.putRepoFile(state.connection, 'data/site.json', JSON.stringify(state.site, null, 2), 'Update site.json', existing && existing.sha, false, targetBranch);
    state.shas.site = response && response.content ? response.content.sha : state.shas.site;
    await persistGeneratedFiles();
  }

  async function persistMedia() {
    state.media = CMS.sortMediaItems(state.media);
    if (state.demoMode) {
      CMS.saveDemoMedia(state.media);
      return;
    }
    if (!CMS.hasGithubConfig(state.connection)) throw new Error('Konfigurasi GitHub belum lengkap.');
    const targetBranch = CMS.getTargetBranch(state.connection);
    if (state.connection.publishMode === 'pr') await CMS.ensureBranch(state.connection, targetBranch, state.connection.baseBranch);
    state.shas.media = await CMS.saveRepoMedia(state.connection, state.media, targetBranch);
  }

  async function syncAllData() {
    try {
      state.site = getSiteFromForm();
      const activePost = getPostFromForm();
      if (activePost.title && activePost.content) {
        const index = state.posts.findIndex(function (item) { return item.id === activePost.id; });
        if (index >= 0) state.posts[index] = activePost;
        else state.posts.unshift(activePost);
      }
      if (state.demoMode) {
        CMS.saveDemoData(state.site, state.posts);
        CMS.saveDemoMedia(state.media);
      } else {
        await persistSite();
        await persistPosts();
        await persistMedia();
      }
      renderAdminStats();
      renderPostList();
      renderMediaGrid();
      persistAutosaveDraft();
      showToast(state.demoMode ? 'Semua data disinkronkan ke demo mode.' : 'Semua data berhasil disinkronkan ke GitHub.', 'success');
    } catch (error) {
      showToast(error.message, 'danger');
    }
  }

  async function loadData() {
    try {
      if (state.demoMode) {
        const data = CMS.loadDemoData();
        state.site = data.site;
        state.posts = data.posts;
        state.media = CMS.loadDemoMedia();
        state.shas = { site: null, posts: null, media: null };
      } else {
        if (!CMS.hasGithubConfig(state.connection)) throw new Error('Isi owner, repository, base branch, dan login GitHub terlebih dahulu.');
        const data = await CMS.loadRepoData(state.connection);
        const media = await CMS.loadRepoMedia(state.connection, data.branchLoaded);
        state.site = data.site;
        state.posts = data.posts;
        state.media = media.items;
        state.shas = { site: data.shas.site, posts: data.shas.posts, media: media.sha };
      }
      renderAdminStats();
      renderSiteForm();
      renderPostList();
      renderMediaGrid();
      if (state.posts.length) fillPostForm(state.posts[0]); else resetPostForm();
      if (state.media.length) selectMedia(state.media[0].id); else clearMediaSelection();
      updateAutosaveStatus(CMS.loadAutosave());
      showToast('Data berhasil dimuat.', 'success');
    } catch (error) {
      refreshConnectionBadge();
      showToast(error.message, 'danger');
    }
  }

  async function saveConnectionSettings() {
    state.connection = getConnectionFromForm();
    state.demoMode = Boolean(state.connection.demoMode);
    saveConnectionState();
    syncConnectionToForm();
    showToast('Pengaturan koneksi disimpan.', 'success');
    await loadData();
  }

  async function refreshIdentity() {
    if (state.demoMode) return;
    if (!state.connection.token) throw new Error('Belum ada token GitHub. Login OAuth atau isi token manual.');
    const viewer = await CMS.getGithubViewer(state.connection.token);
    state.connection.viewer = viewer;
    saveConnectionState();
    renderIdentity();
    showToast('Identitas GitHub diperbarui.', 'success');
  }

  async function loginWithGithub() {
    try {
      state.connection = getConnectionFromForm();
      state.demoMode = Boolean(state.connection.demoMode);
      saveConnectionState();
      CMS.startGithubOAuth(state.connection);
    } catch (error) {
      showToast(error.message, 'danger');
    }
  }

  function logoutGithub() {
    state.connection.token = '';
    state.connection.viewer = null;
    state.connection.authType = '';
    els.ghToken.value = '';
    saveConnectionState();
    renderIdentity();
    refreshConnectionBadge();
    showToast('Login GitHub dihapus dari browser.', 'success');
  }

  async function saveSiteSettings() {
    try {
      state.site = getSiteFromForm();
      await persistSite();
      renderSiteForm();
      persistAutosaveDraft();
      showToast(state.demoMode ? 'Pengaturan situs disimpan di demo mode.' : 'Pengaturan situs disimpan ke GitHub.', 'success');
    } catch (error) {
      showToast(error.message, 'danger');
    }
  }

  async function savePost() {
    try {
      const post = getPostFromForm();
      if (!post.title) throw new Error('Judul artikel wajib diisi.');
      if (!post.slug) throw new Error('Slug artikel wajib diisi.');
      if (!post.content) throw new Error('Konten artikel wajib diisi.');
      const duplicate = state.posts.find(function (item) { return item.slug === post.slug && item.id !== post.id; });
      if (duplicate) throw new Error('Slug sudah dipakai oleh artikel lain.');
      const index = state.posts.findIndex(function (item) { return item.id === post.id; });
      if (index >= 0) state.posts[index] = post;
      else state.posts.unshift(post);
      await persistPosts();
      renderAdminStats();
      renderPostList();
      fillPostForm(post);
      persistAutosaveDraft();
      showToast(state.demoMode ? 'Post disimpan di demo mode.' : 'Post disimpan ke GitHub.', 'success');
    } catch (error) {
      showToast(error.message, 'danger');
    }
  }

  function duplicateSelectedPost() {
    const post = getPostFromForm();
    if (!post.title) {
      showToast('Isi judul artikel dulu sebelum duplikasi.', 'danger');
      return;
    }
    const duplicated = Object.assign({}, post, {
      id: String(Date.now()),
      title: post.title + ' (copy)',
      slug: CMS.slugify(post.slug + '-copy'),
      status: 'draft',
      featured: false,
      updatedAt: new Date().toISOString()
    });
    state.posts.unshift(duplicated);
    fillPostForm(duplicated);
    renderAdminStats();
    renderPostList();
    persistAutosaveDraft();
    showToast('Draft duplikat dibuat. Simpan post jika ingin menyinkronkannya.', 'success');
  }

  async function deleteSelectedPost(idFromAction) {
    const targetId = idFromAction || state.selectedPostId;
    if (!targetId) {
      showToast('Pilih artikel yang ingin dihapus.', 'danger');
      return;
    }
    const post = state.posts.find(function (item) { return item.id === targetId; });
    if (!post) return;
    if (!window.confirm('Hapus artikel "' + post.title + '"?')) return;
    try {
      state.posts = state.posts.filter(function (item) { return item.id !== targetId; });
      await persistPosts();
      renderAdminStats();
      if (state.posts.length) fillPostForm(state.posts[0]); else resetPostForm();
      renderPostList();
      persistAutosaveDraft();
      showToast(state.demoMode ? 'Post dihapus dari demo mode.' : 'Post dihapus dari GitHub.', 'success');
    } catch (error) {
      showToast(error.message, 'danger');
    }
  }

  async function uploadCoverImage() {
    const file = els.coverUpload.files && els.coverUpload.files[0];
    if (!file) {
      showToast('Pilih file cover terlebih dahulu.', 'danger');
      return;
    }
    try {
      const items = await uploadMediaFromFiles([file], true);
      if (items[0]) {
        els.postCoverImage.value = items[0].path;
        renderCoverPreview(items[0].path);
        renderSeoPreview();
        persistAutosaveDraft();
      }
    } catch (error) {
      showToast(error.message, 'danger');
    }
  }

  async function uploadMediaFromFiles(files, silent) {
    const inputFiles = Array.from(files || []);
    if (!inputFiles.length) {
      if (!silent) showToast('Pilih file media terlebih dahulu.', 'danger');
      return [];
    }
    const folderPath = els.mediaFolder.value.trim() || 'assets/uploads';
    let uploaded = [];
    if (state.demoMode) {
      uploaded = await CMS.createDemoMediaItems(inputFiles, folderPath);
      state.media = CMS.sortMediaItems(uploaded.concat(state.media));
      CMS.saveDemoMedia(state.media);
    } else {
      if (!CMS.hasGithubConfig(state.connection)) throw new Error('Konfigurasi GitHub belum lengkap.');
      const targetBranch = CMS.getTargetBranch(state.connection);
      if (state.connection.publishMode === 'pr') await CMS.ensureBranch(state.connection, targetBranch, state.connection.baseBranch);
      uploaded = await CMS.uploadMediaFiles(state.connection, inputFiles, folderPath, targetBranch);
      state.media = CMS.sortMediaItems(uploaded.concat(state.media));
      await persistMedia();
    }
    renderAdminStats();
    renderMediaGrid();
    if (uploaded[0]) selectMedia(uploaded[0].id);
    if (!silent) showToast(uploaded.length + ' file media berhasil diunggah.', 'success');
    return uploaded;
  }

  function getSelectedMedia() {
    return state.media.find(function (item) { return item.id === state.selectedMediaId; }) || null;
  }

  function clearMediaSelection() {
    state.selectedMediaId = null;
    els.mediaMetaId.value = '';
    els.mediaMetaPath.value = '';
    els.mediaMetaAlt.value = '';
    els.mediaMetaCaption.value = '';
    els.selectedMediaPreview.innerHTML = 'Belum ada media dipilih.';
    els.selectedMediaPreview.className = 'selected-media-preview empty-state small-empty';
    els.mediaUsageHint.textContent = 'Pilih media untuk melihat aksi cepat.';
    renderMediaGrid();
  }

  function renderSelectedMedia(media) {
    if (!media) {
      clearMediaSelection();
      return;
    }
    els.mediaMetaId.value = media.id;
    els.mediaMetaPath.value = media.path;
    els.mediaMetaAlt.value = media.alt || '';
    els.mediaMetaCaption.value = media.caption || '';
    const preview = [];
    if (CMS.isImageMedia(media)) {
      preview.push('<img src="' + CMS.escapeHtml(media.path) + '" alt="' + CMS.escapeHtml(media.alt || media.name) + '">');
    } else {
      preview.push('<div class="media-file-icon">' + CMS.escapeHtml((media.kind || 'file').toUpperCase()) + '</div>');
    }
    preview.push('<div class="media-preview-meta">');
    preview.push('<strong>' + CMS.escapeHtml(media.name) + '</strong>');
    preview.push('<p class="help-text">' + CMS.escapeHtml(media.path) + '</p>');
    preview.push('<p class="help-text">' + CMS.escapeHtml(CMS.formatBytes(media.size || 0) + ' • ' + (media.kind || 'file')) + '</p>');
    preview.push('</div>');
    els.selectedMediaPreview.className = 'selected-media-preview';
    els.selectedMediaPreview.innerHTML = preview.join('');
    els.mediaUsageHint.textContent = 'Pakai aksi cepat untuk copy URL, set cover, atau sisipkan ke editor.';
  }

  function selectMedia(id) {
    state.selectedMediaId = id;
    renderMediaGrid();
    renderSelectedMedia(getSelectedMedia());
  }

  function renderMediaGrid() {
    const keyword = els.mediaSearch.value.trim().toLowerCase();
    const filtered = state.media.filter(function (item) {
      if (!keyword) return true;
      return [item.name, item.alt, item.caption, item.path, item.folder].join(' ').toLowerCase().indexOf(keyword) >= 0;
    });
    if (!filtered.length) {
      els.mediaGrid.innerHTML = '<div class="empty-state">Belum ada media yang cocok.</div>';
      return;
    }
    els.mediaGrid.innerHTML = filtered.map(function (item) {
      const isActive = item.id === state.selectedMediaId;
      return [
        '<button type="button" class="media-card ' + (isActive ? 'active' : '') + '" data-media-id="' + CMS.escapeHtml(item.id) + '">',
        '  <div class="media-card-thumb">',
        CMS.isImageMedia(item)
          ? '    <img src="' + CMS.escapeHtml(item.path) + '" alt="' + CMS.escapeHtml(item.alt || item.name) + '">'
          : '    <div class="media-file-icon">' + CMS.escapeHtml((item.kind || 'file').toUpperCase()) + '</div>',
        '  </div>',
        '  <div class="media-card-body">',
        '    <strong>' + CMS.escapeHtml(item.name) + '</strong>',
        '    <p>' + CMS.escapeHtml(item.alt || item.caption || item.path) + '</p>',
        '    <small>' + CMS.escapeHtml(CMS.formatBytes(item.size || 0) + ' • ' + (item.kind || 'file')) + '</small>',
        '  </div>',
        '</button>'
      ].join('');
    }).join('');
  }

  async function saveSelectedMediaMeta() {
    const media = getSelectedMedia();
    if (!media) {
      showToast('Pilih media terlebih dahulu.', 'danger');
      return;
    }
    media.alt = els.mediaMetaAlt.value.trim();
    media.caption = els.mediaMetaCaption.value.trim();
    media.updatedAt = new Date().toISOString();
    state.media = CMS.sortMediaItems(state.media);
    if (state.demoMode) CMS.saveDemoMedia(state.media);
    else await persistMedia();
    renderSelectedMedia(media);
    renderMediaGrid();
    showToast('Metadata media disimpan.', 'success');
  }

  async function deleteSelectedMedia() {
    const media = getSelectedMedia();
    if (!media) {
      showToast('Pilih media terlebih dahulu.', 'danger');
      return;
    }
    if (!window.confirm('Hapus media ini dari library' + (state.demoMode ? '?' : ' dan dari repository GitHub?'))) return;
    try {
      if (!state.demoMode && !String(media.path || '').startsWith('data:')) {
        const targetBranch = CMS.getTargetBranch(state.connection);
        const fileInfo = await CMS.getRepoFile(state.connection, media.path, targetBranch);
        await CMS.deleteRepoFile(state.connection, media.path, 'Delete media: ' + media.name, fileInfo.sha, targetBranch);
      }
      state.media = state.media.filter(function (item) { return item.id !== media.id; });
      await persistMedia();
      renderAdminStats();
      renderMediaGrid();
      if (state.media.length) selectMedia(state.media[0].id); else clearMediaSelection();
      showToast('Media berhasil dihapus.', 'success');
    } catch (error) {
      showToast(error.message, 'danger');
    }
  }

  async function copyText(value, successMessage) {
    try {
      await navigator.clipboard.writeText(value);
      showToast(successMessage, 'success');
    } catch (error) {
      showToast('Clipboard tidak tersedia di browser ini.', 'danger');
    }
  }

  function buildSelectedMediaMarkdown() {
    const media = getSelectedMedia();
    if (!media) return '';
    const alt = els.mediaMetaAlt.value.trim() || media.alt || media.name;
    const caption = els.mediaMetaCaption.value.trim() || media.caption || '';
    if (CMS.isImageMedia(media)) {
      return '![' + alt + '](' + media.path + ')' + (caption ? '\n\n> ' + caption : '');
    }
    return '[' + alt + '](' + media.path + ')' + (caption ? '\n\n> ' + caption : '');
  }

  function insertSelectedMediaToEditor() {
    const markdown = buildSelectedMediaMarkdown();
    if (!markdown) {
      showToast('Pilih media terlebih dahulu.', 'danger');
      return;
    }
    els.postContent.value += (els.postContent.value.trim() ? '\n\n' : '') + markdown;
    renderMarkdownPreview();
    renderSeoPreview();
    persistAutosaveDraft();
    showToast('Media disisipkan ke editor.', 'success');
  }

  function useSelectedMediaAsCover() {
    const media = getSelectedMedia();
    if (!media) {
      showToast('Pilih media terlebih dahulu.', 'danger');
      return;
    }
    els.postCoverImage.value = media.path;
    renderCoverPreview(media.path);
    renderSeoPreview();
    persistAutosaveDraft();
    showToast('Media dipakai sebagai cover.', 'success');
  }

  function exportBackup() {
    const payload = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      site: getSiteFromForm(),
      posts: state.posts,
      media: state.media
    };
    CMS.downloadTextFile('github-file-cms-pro-backup.json', JSON.stringify(payload, null, 2), 'application/json');
    showToast('Backup berhasil diexport.', 'success');
  }

  function importBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = CMS.safeJsonParse(String(reader.result || ''), null);
        if (!data || !data.site || !Array.isArray(data.posts)) throw new Error('Format backup tidak valid.');
        state.site = CMS.normalizeSite(data.site);
        state.posts = CMS.sortPosts(data.posts.map(CMS.normalizePost));
        state.media = CMS.sortMediaItems((data.media || []).map(CMS.normalizeMediaItem));
        renderSiteForm();
        renderAdminStats();
        renderPostList();
        renderMediaGrid();
        if (state.posts.length) fillPostForm(state.posts[0]); else resetPostForm();
        if (state.media.length) selectMedia(state.media[0].id); else clearMediaSelection();
        persistAutosaveDraft();
        showToast('Backup berhasil dimuat. Klik Sinkronkan Semua untuk menyimpan.', 'success');
      } catch (error) {
        showToast(error.message, 'danger');
      }
    };
    reader.readAsText(file);
  }

  function restoreAutosave() {
    const payload = CMS.loadAutosave();
    if (!payload || !payload.post) {
      showToast('Belum ada autosave yang bisa dipulihkan.', 'danger');
      return;
    }
    state.site = CMS.normalizeSite(payload.site || state.site);
    renderSiteForm();
    fillPostForm(CMS.normalizePost(payload.post));
    updateAutosaveStatus(payload);
    showToast('Autosave berhasil dipulihkan.', 'success');
  }

  function clearAutosave() {
    CMS.clearAutosave();
    updateAutosaveStatus(null);
    showToast('Autosave lokal dihapus.', 'success');
  }

  async function createPullRequest() {
    try {
      if (state.demoMode) throw new Error('Mode demo tidak mendukung Pull Request.');
      if (!CMS.hasGithubConfig(state.connection)) throw new Error('Konfigurasi GitHub belum lengkap.');
      if (state.connection.publishMode !== 'pr') throw new Error('Ubah mode publish ke Review via Pull Request terlebih dahulu.');
      const targetBranch = CMS.getTargetBranch(state.connection);
      await CMS.ensureBranch(state.connection, targetBranch, state.connection.baseBranch);
      const pr = await CMS.createOrOpenPullRequest(state.connection, {
        head: targetBranch,
        base: state.connection.baseBranch,
        title: 'Content update: ' + new Date().toLocaleDateString('id-ID'),
        body: 'Perubahan konten dibuat dari panel admin GitHub File CMS Pro.'
      });
      showToast('Pull Request siap dibuka.', 'success');
      if (pr && pr.html_url) window.open(pr.html_url, '_blank', 'noopener');
    } catch (error) {
      showToast(error.message, 'danger');
    }
  }

  async function refreshMedia() {
    try {
      if (state.demoMode) {
        state.media = CMS.loadDemoMedia();
      } else {
        const result = await CMS.loadRepoMedia(state.connection);
        state.media = result.items;
        state.shas.media = result.sha;
      }
      renderAdminStats();
      renderMediaGrid();
      if (state.media.length) selectMedia(state.media[0].id); else clearMediaSelection();
      showToast('Media library dimuat ulang.', 'success');
    } catch (error) {
      showToast(error.message, 'danger');
    }
  }

  function bindInputHelpers() {
    [
      els.postTitle, els.postSlug, els.postAuthor, els.postCategory, els.postStatus, els.postTags,
      els.postExcerpt, els.postContent, els.postCoverImage, els.postSeoTitle, els.postSeoDescription,
      els.postFeatured, els.siteTitle, els.siteTagline, els.siteUrl, els.siteLanguage, els.heroTitle,
      els.heroDescription, els.postsPerPage, els.footerText, els.showFeaturedOnlyOnTop
    ].forEach(function (element) {
      const eventName = element.tagName === 'SELECT' || element.type === 'checkbox' ? 'change' : 'input';
      element.addEventListener(eventName, function () {
        renderMarkdownPreview();
        renderSeoPreview();
        debouncedAutosave();
      });
    });

    els.postTitle.addEventListener('input', function () {
      if (!els.postSlug.value.trim()) els.postSlug.value = CMS.slugify(els.postTitle.value);
      if (!els.postSeoTitle.value.trim()) els.postSeoTitle.value = els.postTitle.value;
      renderSeoPreview();
    });

    els.postContent.addEventListener('input', CMS.debounce(function () {
      if (!els.postExcerpt.value.trim()) els.postExcerpt.value = CMS.excerptFromContent(els.postContent.value, 170);
      if (!els.postSeoDescription.value.trim()) els.postSeoDescription.value = CMS.excerptFromContent(els.postContent.value, 155);
      renderMarkdownPreview();
      renderSeoPreview();
    }, 120));

    els.postCoverImage.addEventListener('input', function () {
      renderCoverPreview(els.postCoverImage.value.trim());
      renderSeoPreview();
    });

    [els.mediaMetaAlt, els.mediaMetaCaption].forEach(function (element) {
      element.addEventListener('input', function () {
        const media = getSelectedMedia();
        if (!media) return;
        media.alt = els.mediaMetaAlt.value.trim();
        media.caption = els.mediaMetaCaption.value.trim();
      });
    });
  }

  function bindEvents() {
    els.demoMode.addEventListener('change', function () {
      state.demoMode = Boolean(els.demoMode.checked);
      state.connection.demoMode = state.demoMode;
      saveConnectionState();
      toggleGithubInputs();
      refreshConnectionBadge();
      renderIdentity();
    });
    els.ghPublishMode.addEventListener('change', function () {
      state.connection.publishMode = els.ghPublishMode.value;
      saveConnectionState();
      toggleGithubInputs();
      refreshConnectionBadge();
    });

    els.saveConnectionBtn.addEventListener('click', saveConnectionSettings);
    els.oauthLoginBtn.addEventListener('click', loginWithGithub);
    els.refreshIdentityBtn.addEventListener('click', function () {
      refreshIdentity().catch(function (error) { showToast(error.message, 'danger'); });
    });
    els.logoutGithubBtn.addEventListener('click', logoutGithub);
    els.loadRepoBtn.addEventListener('click', loadData);
    els.syncAllBtn.addEventListener('click', syncAllData);
    els.createPrBtn.addEventListener('click', createPullRequest);
    els.saveSiteBtn.addEventListener('click', saveSiteSettings);
    els.newPostBtn.addEventListener('click', resetPostForm);
    els.duplicatePostBtn.addEventListener('click', duplicateSelectedPost);
    els.savePostBtn.addEventListener('click', savePost);
    els.deletePostBtn.addEventListener('click', function () { deleteSelectedPost(); });
    els.uploadImageBtn.addEventListener('click', uploadCoverImage);
    els.exportBackupBtn.addEventListener('click', exportBackup);
    els.importBackupInput.addEventListener('change', function () {
      importBackup(els.importBackupInput.files && els.importBackupInput.files[0]);
      els.importBackupInput.value = '';
    });
    els.restoreAutosaveBtn.addEventListener('click', restoreAutosave);
    els.clearAutosaveBtn.addEventListener('click', clearAutosave);

    els.uploadMediaBtn.addEventListener('click', function () {
      uploadMediaFromFiles(els.mediaUploadInput.files).catch(function (error) { showToast(error.message, 'danger'); });
    });
    els.refreshMediaBtn.addEventListener('click', refreshMedia);
    els.saveMediaMetaBtn.addEventListener('click', function () {
      saveSelectedMediaMeta().catch(function (error) { showToast(error.message, 'danger'); });
    });
    els.deleteMediaBtn.addEventListener('click', deleteSelectedMedia);
    els.copyMediaUrlBtn.addEventListener('click', function () {
      const media = getSelectedMedia();
      if (!media) return showToast('Pilih media terlebih dahulu.', 'danger');
      copyText(media.path, 'URL media berhasil disalin.');
    });
    els.copyMediaMarkdownBtn.addEventListener('click', function () {
      const markdown = buildSelectedMediaMarkdown();
      if (!markdown) return showToast('Pilih media terlebih dahulu.', 'danger');
      copyText(markdown, 'Snippet Markdown berhasil disalin.');
    });
    els.useMediaAsCoverBtn.addEventListener('click', useSelectedMediaAsCover);
    els.insertMediaToEditorBtn.addEventListener('click', insertSelectedMediaToEditor);

    bindInputHelpers();

    els.adminSearch.addEventListener('input', renderPostList);
    els.mediaSearch.addEventListener('input', renderMediaGrid);

    els.postList.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const action = button.getAttribute('data-action');
      const id = button.getAttribute('data-id');
      const post = state.posts.find(function (item) { return item.id === id; });
      if (!post) return;
      if (action === 'edit') fillPostForm(post);
      if (action === 'delete') deleteSelectedPost(id);
    });

    els.mediaGrid.addEventListener('click', function (event) {
      const button = event.target.closest('[data-media-id]');
      if (!button) return;
      selectMedia(button.getAttribute('data-media-id'));
    });

    els.editorViewSwitch.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-view]');
      if (!button) return;
      setEditorView(button.getAttribute('data-view'));
    });

    document.querySelector('.markdown-tools').addEventListener('click', function (event) {
      const button = event.target.closest('button[data-md-action]');
      if (!button) return;
      CMS.insertMarkdownSnippet(els.postContent, button.getAttribute('data-md-action'));
    });
  }

  async function initOAuthCallback() {
    if (state.demoMode) return;
    try {
      const result = await CMS.handleOAuthCallback(state.connection);
      if (!result) return;
      state.connection.token = result.token;
      state.connection.viewer = result.profile;
      state.connection.authType = 'oauth';
      saveConnectionState();
      syncConnectionToForm();
      showToast('Login GitHub berhasil.', 'success');
    } catch (error) {
      showToast(error.message, 'danger');
    }
  }

  async function init() {
    syncConnectionToForm();
    bindEvents();
    setEditorView('split');
    await initOAuthCallback();
    await loadData();
  }

  init();
})();

(function() {
  'use strict';

  /* ==========================================================================
     Quiztide - Catalog Controller
     Scalable DOM-based Filtering, Live Search, and Fluid Animations with Anime.js
     (100% Language-Agnostic, Zero Text Fallbacks)
     ========================================================================== */

  var searchInput = document.getElementById('quiz-search-input');
  var tagFilterBar = document.getElementById('tag-filter-bar');
  var catalogCountLabel = document.getElementById('catalog-count-label');
  var noResults = document.getElementById('no-results-msg');
  var btnReset = document.getElementById('btn-reset-filters');
  var cards = document.querySelectorAll('.quiz-card');

  var activeTag = 'all';
  var cardsData = {};

  // Extract embedded JSON data from statically rendered cards
  cards.forEach(function(card) {
    var id = card.getAttribute('data-quiz-id');
    var scriptEl = card.querySelector('.quiz-card-data');
    if (scriptEl && id) {
      try {
        cardsData[id] = JSON.parse(scriptEl.textContent);
      } catch (err) {
        console.error('Error parsing card data for ' + id, err);
      }
    }
  });

  function getLang() {
    return (window.i18next && i18next.language) || window.CURRENT_LANG || window.DEFAULT_LANG;
  }

  function getLocalizedQuiz(id, lang) {
    var q = cardsData[id];
    if (!q) return null;
    return q[lang] || (window.DEFAULT_LANG ? q[window.DEFAULT_LANG] : null) || null;
  }

  function updateCardTexts(lang) {
    cards.forEach(function(card) {
      var id = card.getAttribute('data-quiz-id');
      var loc = getLocalizedQuiz(id, lang);
      if (!loc) return;

      var titleEl = card.querySelector('.card-title');
      var descEl = card.querySelector('.card-desc');
      var catEl = card.querySelector('.card-tag-badge');

      if (titleEl && loc.title) titleEl.textContent = loc.title;
      if (descEl && loc.subtitle) descEl.textContent = loc.subtitle;
      if (catEl && loc.category) catEl.textContent = loc.category;
    });
  }

  function renderTagFilterBar() {
    if (!tagFilterBar) return;
    var lang = getLang();
    var tagSet = {};

    cards.forEach(function(card) {
      var id = card.getAttribute('data-quiz-id');
      var loc = getLocalizedQuiz(id, lang);
      if (loc && Array.isArray(loc.tags)) {
        loc.tags.forEach(function(t) {
          var clean = t.trim();
          if (clean) tagSet[clean] = true;
        });
      }
    });

    var tags = Object.keys(tagSet);
    tagFilterBar.innerHTML = '';

    var allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'chip-btn' + (activeTag === 'all' ? ' active' : '');
    allBtn.setAttribute('data-i18n', 'all_tags');
    allBtn.textContent = (window.i18next && i18next.t('all_tags')) || '';
    allBtn.addEventListener('click', function() {
      tagFilterBar.querySelectorAll('.chip-btn').forEach(function(b) { b.classList.remove('active'); });
      allBtn.classList.add('active');
      activeTag = 'all';
      filterCards();
    });
    tagFilterBar.appendChild(allBtn);

    tags.forEach(function(tag) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip-btn' + (activeTag === tag.toLowerCase() ? ' active' : '');
      btn.textContent = '#' + tag;
      btn.addEventListener('click', function() {
        tagFilterBar.querySelectorAll('.chip-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeTag = tag.toLowerCase();
        filterCards();
      });
      tagFilterBar.appendChild(btn);
    });
  }

  function filterCards() {
    var lang = getLang();
    var query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    var visibleCount = 0;

    cards.forEach(function(card) {
      var id = card.getAttribute('data-quiz-id');
      var loc = getLocalizedQuiz(id, lang);

      if (!loc) {
        card.classList.add('is-hidden');
        return;
      }

      var tags = (loc.tags || []).map(function(t) { return t.toLowerCase(); });
      var matchesTag = (activeTag === 'all') || (tags.indexOf(activeTag.toLowerCase()) !== -1);

      var searchText = ((loc.title || '') + ' ' + (loc.subtitle || '') + ' ' + (loc.category || '') + ' ' + tags.join(' ')).toLowerCase();
      var matchesQuery = !query || searchText.indexOf(query) !== -1;

      var isVisible = matchesTag && matchesQuery;
      card.classList.toggle('is-hidden', !isVisible);
      if (isVisible) visibleCount++;
    });

    if (catalogCountLabel && window.i18next) {
      var countUnit = i18next.t('assessments_available');
      catalogCountLabel.textContent = visibleCount + ' ' + countUnit;
    }

    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      filterCards();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', function() {
      if (searchInput) searchInput.value = '';
      activeTag = 'all';
      renderTagFilterBar();
      filterCards();
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === '/' && searchInput && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  function boot() {
    var lang = getLang();
    updateCardTexts(lang);
    renderTagFilterBar();
    filterCards();

    // Stagger entrance of visible cards on initial page load with Anime.js
    if (window.anime) {
      anime({
        targets: '.quiz-card:not(.is-hidden)',
        opacity: [0, 1],
        translateY: [12, 0],
        duration: 320,
        delay: anime.stagger(40),
        easing: 'easeOutCubic'
      });

      anime({
        targets: ['.hero-badge', '.hero-title', '.hero-subtitle', '.toolbar-container'],
        opacity: [0, 1],
        translateY: [8, 0],
        duration: 320,
        delay: anime.stagger(40),
        easing: 'easeOutCubic'
      });
    }
  }

  window.addEventListener('quiztide:i18nready', function() {
    boot();
  });

  window.addEventListener('quiztide:langchange', function() {
    var lang = getLang();
    updateCardTexts(lang);
    renderTagFilterBar();
    filterCards();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

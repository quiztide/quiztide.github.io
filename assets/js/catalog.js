(function() {
  'use strict';

  /* ==========================================================================
     Quiztide - Catalog Controller
     Ultra-Lightweight Filtering & Search Powered by Liquid Pre-rendered DOM
     Smooth Motion with Anime.js (Zero i18n Lib, Zero Runtime Overhead)
     ========================================================================== */

  var tagFilterBar = document.getElementById('tag-filter-bar');
  var catalogCountLabel = document.getElementById('catalog-count-label');
  var noResults = document.getElementById('no-results-msg');
  var btnReset = document.getElementById('btn-reset-filters');
  var cards = document.querySelectorAll('.quiz-card');

  var activeTag = 'all';

  function getLang() {
    return document.documentElement.lang;
  }

  function getActiveSearchInput() {
    var lang = getLang();
    return document.querySelector('input[data-search-input][data-lang="' + lang + '"]') ||
           document.querySelector('input[data-search-input]');
  }

  function filterCards() {
    var lang = getLang();
    var searchInput = getActiveSearchInput();
    var query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    var visibleCount = 0;

    cards.forEach(function(card) {
      var quizLangs = (card.getAttribute('data-quiz-langs') || '').split(' ');
      if (quizLangs.indexOf(lang) === -1) {
        card.classList.add('is-hidden');
        return;
      }

      var meta = card.querySelector('.quiz-meta-data[data-lang="' + lang + '"]');
      if (!meta) {
        card.classList.add('is-hidden');
        return;
      }

      var tags = (meta.getAttribute('data-tags') || '').split(',');
      var matchesTag = (activeTag === 'all') || (tags.indexOf(activeTag.toLowerCase()) !== -1);

      var searchText = (meta.getAttribute('data-search') || '').toLowerCase();
      var matchesQuery = !query || searchText.indexOf(query) !== -1;

      var isVisible = matchesTag && matchesQuery;
      card.classList.toggle('is-hidden', !isVisible);
      if (isVisible) visibleCount++;
    });

    if (catalogCountLabel) {
      var unitEl = document.querySelector('#quiz-count-units [data-lang="' + lang + '"]');
      var unitText = unitEl ? unitEl.textContent : '';
      catalogCountLabel.textContent = visibleCount + ' ' + unitText;
    }

    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  // Tag filter chip click delegation
  if (tagFilterBar) {
    tagFilterBar.addEventListener('click', function(e) {
      var btn = e.target.closest('.chip-btn');
      if (!btn) return;
      var group = btn.closest('.tag-chips-lang-group');
      if (group) {
        group.querySelectorAll('.chip-btn').forEach(function(b) { b.classList.remove('active'); });
      }
      btn.classList.add('active');
      activeTag = btn.getAttribute('data-tag') || 'all';
      filterCards();
    });
  }

  // Search input listeners
  document.querySelectorAll('input[data-search-input]').forEach(function(input) {
    input.addEventListener('input', function() {
      filterCards();
    });
  });

  // Reset filters button
  if (btnReset) {
    btnReset.addEventListener('click', function() {
      document.querySelectorAll('input[data-search-input]').forEach(function(input) {
        input.value = '';
      });
      activeTag = 'all';
      if (tagFilterBar) {
        tagFilterBar.querySelectorAll('.chip-btn').forEach(function(b) {
          b.classList.toggle('active', b.getAttribute('data-tag') === 'all');
        });
      }
      filterCards();
    });
  }

  // Keyboard shortcut '/' to focus search input
  document.addEventListener('keydown', function(e) {
    var searchInput = getActiveSearchInput();
    if (e.key === '/' && searchInput && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  function boot() {
    filterCards();

    // Stagger entrance of visible cards on initial load with Anime.js
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

  window.addEventListener('quiztide:langchange', function() {
    activeTag = 'all';
    if (tagFilterBar) {
      tagFilterBar.querySelectorAll('.chip-btn').forEach(function(b) {
        b.classList.toggle('active', b.getAttribute('data-tag') === 'all');
      });
    }
    filterCards();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

(function() {
  'use strict';

  /* ==========================================================================
     Quiztide - Assessment Quiz Engine
     Smooth Interactive Motion Powered by Anime.js (Zero Text Fallbacks)
     ========================================================================== */

  var baseUrl = window.QUIZ_BASE_URL || './';
  if (baseUrl.charAt(baseUrl.length - 1) !== '/') {
    baseUrl += '/';
  }

  function getLang() {
    return (window.i18next && i18next.language) || window.CURRENT_LANG || 'pt';
  }

  var currentLang = getLang();
  var quizData = null;
  var currentIndex = 0;
  var scores = {};
  var winningKey = null;
  var isFinished = false;

  // DOM Elements
  var quizBackLink = document.getElementById('quiz-back-link');
  var quizCategoryPill = document.getElementById('quiz-category-pill');
  var quizTimePill = document.getElementById('quiz-time-pill');
  var quizTitle = document.getElementById('quiz-title');
  var quizSubtitle = document.getElementById('quiz-subtitle');
  var quizLangNotice = document.getElementById('quiz-lang-notice');

  var progressText = document.getElementById('quiz-progress-text');
  var progressPercent = document.getElementById('quiz-progress-percent');
  var progressFill = document.getElementById('quiz-progress-fill');
  var progressBar = document.getElementById('quiz-progress-bar');

  var questionCard = document.getElementById('quiz-question-card');
  var questionFlow = document.getElementById('quiz-question-flow');
  var questionEyebrow = document.getElementById('question-eyebrow');
  var questionImgWrapper = document.getElementById('quiz-question-img-wrapper');
  var questionImg = document.getElementById('quiz-question-img');
  var questionTitle = document.getElementById('quiz-question-title');
  var optionsList = document.getElementById('quiz-options-list');

  var resultCard = document.getElementById('quiz-result-card');
  var resultCelebration = document.getElementById('result-celebration');
  var resultImgWrapper = document.getElementById('result-img-wrapper');
  var resultImg = document.getElementById('result-img');
  var resultBadge = document.getElementById('result-badge');
  var resultTitle = document.getElementById('result-title');
  var resultDesc = document.getElementById('result-description');
  var traitBreakdownTitle = document.getElementById('trait-breakdown-title');
  var traitBarsContainer = document.getElementById('trait-bars-container');

  var btnWhatsapp = document.getElementById('btn-share-whatsapp');
  var btnWhatsappText = document.getElementById('btn-whatsapp-text');
  var btnCopy = document.getElementById('btn-copy-link');
  var btnCopyText = document.getElementById('btn-copy-text');
  var btnRestart = document.getElementById('btn-restart-quiz');
  var btnRestartText = document.getElementById('btn-restart-text');
  var copyFeedback = document.getElementById('copy-feedback');

  function calculateEstMinutes(questionCount) {
    if (questionCount <= 3) return 1;
    if (questionCount <= 7) return 2;
    if (questionCount <= 12) return 3;
    return Math.ceil(questionCount * 0.35);
  }

  function loadLocale(targetLang) {
    var url = baseUrl + 'locales/' + targetLang + '.json';

    return fetch(url)
      .then(function(res) {
        if (!res.ok) throw new Error('Locale not found: ' + targetLang);
        return res.json();
      })
      .then(function(data) {
        currentLang = targetLang;
        quizData = data;
        if (quizLangNotice) quizLangNotice.style.display = 'none';
        return data;
      });
  }

  function updateHeader() {
    if (!quizData || !window.i18next) return;

    if (quizBackLink) {
      var backSpan = quizBackLink.querySelector('span');
      if (backSpan) backSpan.textContent = i18next.t('back_to_catalog');
    }

    if (quizTitle) quizTitle.textContent = quizData.title || '';
    if (quizSubtitle) quizSubtitle.textContent = quizData.subtitle || '';
    if (quizCategoryPill) quizCategoryPill.textContent = quizData.category || '';

    var total = (quizData.questions && quizData.questions.length) ? quizData.questions.length : 1;
    var estMinutes = calculateEstMinutes(total);
    if (quizTimePill) quizTimePill.textContent = '~' + estMinutes + ' min';

    if (btnCopyText) btnCopyText.textContent = i18next.t('copy_link');
    if (btnWhatsappText) btnWhatsappText.textContent = i18next.t('share_whatsapp');
    if (btnRestartText) btnRestartText.textContent = i18next.t('retake_quiz');
    if (resultCelebration) resultCelebration.textContent = i18next.t('celebration');
    if (traitBreakdownTitle) traitBreakdownTitle.textContent = i18next.t('trait_breakdown');
    if (copyFeedback) copyFeedback.textContent = i18next.t('copied_success');
  }

  function renderQuestion(index) {
    if (!quizData || !quizData.questions || !window.i18next) return;
    var questions = quizData.questions;
    var totalQuestions = questions.length;
    var q = questions[index];
    if (!q) return;

    var currentNum = index + 1;
    var pct = Math.round((index / totalQuestions) * 100);

    var stepWord = i18next.t('step_label');
    var ofWord = i18next.t('of');

    if (questionEyebrow) {
      questionEyebrow.textContent = stepWord.toUpperCase() + ' ' + (currentNum < 10 ? '0' + currentNum : currentNum);
    }

    if (progressText) {
      progressText.innerHTML = stepWord + ' <span class="tabular-nums">' + (currentNum < 10 ? '0' + currentNum : currentNum) + '</span> ' + ofWord + ' <span class="tabular-nums">' + (totalQuestions < 10 ? '0' + totalQuestions : totalQuestions) + '</span>';
    }
    if (progressPercent) {
      progressPercent.innerHTML = '<span class="tabular-nums">' + pct + '%</span>';
    }
    if (window.anime && progressFill) {
      anime({
        targets: progressFill,
        width: pct + '%',
        duration: 280,
        easing: 'easeOutCubic'
      });
    } else if (progressFill) {
      progressFill.style.width = pct + '%';
    }
    if (progressBar) {
      progressBar.setAttribute('aria-valuenow', pct);
    }

    if (q.image && questionImg && questionImgWrapper) {
      questionImg.src = baseUrl + q.image;
      questionImgWrapper.style.display = 'block';
    } else if (questionImgWrapper) {
      questionImgWrapper.style.display = 'none';
    }

    if (questionTitle) {
      questionTitle.textContent = q.text || '';
    }

    if (optionsList) {
      optionsList.innerHTML = '';

      (q.options || []).forEach(function(opt, optIndex) {
        var btn = document.createElement('button');
        btn.className = 'quiz-option-button';
        btn.type = 'button';
        btn.setAttribute('data-index', optIndex);
        btn.setAttribute('data-key', String.fromCharCode(65 + optIndex));

        btn.innerHTML =
          '<span class="option-key-badge">' + String.fromCharCode(65 + optIndex) + '</span>' +
          '<span class="option-label-text">' + opt.text + '</span>';

        btn.addEventListener('click', function() {
          handleOptionSelect(btn, opt.type);
        });

        optionsList.appendChild(btn);
      });
    }
  }

  function handleOptionSelect(btnElement, resultType) {
    if (!optionsList) return;
    var allBtns = optionsList.querySelectorAll('.quiz-option-button');
    allBtns.forEach(function(b) { b.classList.add('disabled'); });
    btnElement.classList.add('selected');

    if (window.anime) {
      anime({
        targets: btnElement,
        scale: [0.97, 1],
        duration: 150,
        easing: 'easeOutCubic'
      });
    }

    if (resultType) {
      scores[resultType] = (scores[resultType] || 0) + 1;
    }

    if (window.anime && questionFlow) {
      anime({
        targets: questionFlow,
        opacity: [1, 0],
        translateX: [0, -16],
        duration: 140,
        easing: 'easeInCubic',
        complete: function() {
          currentIndex++;
          var questions = (quizData && quizData.questions) ? quizData.questions : [];
          if (currentIndex < questions.length) {
            renderQuestion(currentIndex);
            anime({
              targets: questionFlow,
              opacity: [0, 1],
              translateX: [16, 0],
              duration: 220,
              easing: 'easeOutCubic'
            });
          } else {
            showResults();
          }
        }
      });
    } else {
      setTimeout(function() {
        currentIndex++;
        var questions = (quizData && quizData.questions) ? quizData.questions : [];
        if (currentIndex < questions.length) {
          renderQuestion(currentIndex);
        } else {
          showResults();
        }
      }, 120);
    }
  }

  // Keyboard shortcut listener (A, B, C, D or 1, 2, 3, 4)
  window.addEventListener('keydown', function(e) {
    if (isFinished || !questionCard || questionCard.style.display === 'none') return;
    
    var key = e.key.toUpperCase();
    var optIndex = -1;

    if (key === 'A' || key === '1') optIndex = 0;
    else if (key === 'B' || key === '2') optIndex = 1;
    else if (key === 'C' || key === '3') optIndex = 2;
    else if (key === 'D' || key === '4') optIndex = 3;

    if (optIndex !== -1 && optionsList) {
      var buttons = optionsList.querySelectorAll('.quiz-option-button');
      if (buttons[optIndex] && !buttons[optIndex].classList.contains('disabled')) {
        e.preventDefault();
        buttons[optIndex].click();
      }
    }
  });

  function showResults() {
    isFinished = true;
    var results = (quizData && quizData.results) ? quizData.results : {};
    var questions = (quizData && quizData.questions) ? quizData.questions : [];
    var totalQuestions = questions.length || 1;

    if (progressText) progressText.innerHTML = i18next.t('completed');
    if (progressPercent) progressPercent.innerHTML = '<span class="tabular-nums">100%</span>';
    if (window.anime && progressFill) {
      anime({
        targets: progressFill,
        width: '100%',
        duration: 320,
        easing: 'easeOutCubic'
      });
    } else if (progressFill) {
      progressFill.style.width = '100%';
    }
    if (progressBar) progressBar.setAttribute('aria-valuenow', 100);

    // Calculate top trait
    if (!winningKey) {
      var maxScore = -1;
      var topKeys = [];
      for (var key in scores) {
        if (scores[key] > maxScore) {
          maxScore = scores[key];
          topKeys = [key];
        } else if (scores[key] === maxScore) {
          topKeys.push(key);
        }
      }
      winningKey = topKeys.length > 0 ? topKeys[0] : Object.keys(results)[0];
    }

    var winner = results[winningKey] || Object.values(results)[0];
    if (!winner) return;

    if (questionCard) questionCard.style.display = 'none';
    if (resultCard) {
      resultCard.style.display = 'block';
      if (window.anime) {
        anime({
          targets: resultCard,
          opacity: [0, 1],
          translateY: [16, 0],
          duration: 360,
          easing: 'easeOutCubic'
        });
        anime({
          targets: ['.result-celebration-pill', '.result-archetype-title', '.result-narrative-text', '.trait-breakdown-card', '.result-cta-panel'],
          opacity: [0, 1],
          translateY: [8, 0],
          delay: anime.stagger(45, { start: 80 }),
          duration: 320,
          easing: 'easeOutCubic'
        });
      }
    }

    if (winner.image && resultImg && resultImgWrapper) {
      resultImg.src = baseUrl + winner.image;
      resultImgWrapper.style.display = 'block';
    } else if (resultImgWrapper) {
      resultImgWrapper.style.display = 'none';
    }

    if (resultBadge) {
      if (winner.badge) {
        resultBadge.textContent = winner.badge;
        resultBadge.style.display = 'inline-block';
      } else {
        resultBadge.style.display = 'none';
      }
    }

    if (resultTitle) resultTitle.textContent = winner.title || '';
    if (resultDesc) resultDesc.textContent = winner.description || '';

    // Render Trait Breakdown Bars
    if (traitBarsContainer) {
      traitBarsContainer.innerHTML = '';
      var totalAnswered = 0;
      for (var sk in scores) {
        totalAnswered += scores[sk];
      }
      if (totalAnswered === 0) totalAnswered = totalQuestions;

      for (var rk in results) {
        var rItem = results[rk];
        var count = scores[rk] || 0;
        var percentage = Math.round((count / totalAnswered) * 100);

        var barRow = document.createElement('div');
        barRow.className = 'breakdown-bar-item';
        barRow.innerHTML =
          '<div class="bar-info-row">' +
            '<span class="bar-trait-title">' + (rItem.badge ? rItem.badge + ' ' : '') + rItem.title + '</span>' +
            '<span class="bar-trait-value tabular-nums">' + percentage + '%</span>' +
          '</div>' +
          '<div class="bar-track-wrap">' +
            '<div class="bar-fill-amount' + (rk === winningKey ? ' is-winner' : '') + '" data-target="' + percentage + '" style="width: 0%;"></div>' +
          '</div>';

        traitBarsContainer.appendChild(barRow);
      }

      if (window.anime) {
        anime({
          targets: '.bar-fill-amount',
          width: function(el) { return el.getAttribute('data-target') + '%'; },
          duration: 650,
          delay: anime.stagger(60, { start: 220 }),
          easing: 'easeOutQuart'
        });
      } else {
        var fillBars = traitBarsContainer.querySelectorAll('.bar-fill-amount');
        fillBars.forEach(function(bar) {
          bar.style.width = bar.getAttribute('data-target') + '%';
        });
      }
    }

    resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function initQuiz(targetLang) {
    currentIndex = 0;
    scores = {};
    winningKey = null;
    isFinished = false;

    if (resultCard) resultCard.style.display = 'none';
    if (questionCard) {
      questionCard.style.display = 'block';
      questionCard.style.opacity = '0';
    }

    loadLocale(targetLang || getLang()).then(function() {
      updateHeader();
      renderQuestion(currentIndex);
      if (questionCard) {
        if (window.anime) {
          anime({
            targets: questionCard,
            opacity: [0, 1],
            translateY: [10, 0],
            duration: 280,
            easing: 'easeOutCubic'
          });
        } else {
          questionCard.style.opacity = '1';
        }
      }
    });
  }

  // Social Share Handlers
  if (btnWhatsapp) {
    btnWhatsapp.addEventListener('click', function() {
      if (!quizData || !window.i18next) return;
      var results = quizData.results || {};
      var winner = results[winningKey] || Object.values(results)[0];
      if (!winner) return;

      var qTitle = quizData.title || '';
      var rTitle = winner.title || '';
      var tmpl = i18next.t('share_msg');
      var shareText = tmpl.replace('{title}', qTitle).replace('{result}', rTitle) + ' ' + window.location.href;

      var url = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(shareText);
      window.open(url, '_blank');
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', function() {
      navigator.clipboard.writeText(window.location.href).then(function() {
        if (copyFeedback) {
          copyFeedback.style.display = 'block';
          if (window.anime) {
            anime({
              targets: copyFeedback,
              opacity: [0, 1],
              translateY: [6, 0],
              duration: 200,
              easing: 'easeOutBack'
            });
          }
          setTimeout(function() {
            if (window.anime) {
              anime({
                targets: copyFeedback,
                opacity: [1, 0],
                duration: 180,
                easing: 'easeInQuad',
                complete: function() {
                  copyFeedback.style.display = 'none';
                }
              });
            } else {
              copyFeedback.style.display = 'none';
            }
          }, 2200);
        }
      });
    });
  }

  if (btnRestart) {
    btnRestart.addEventListener('click', function() {
      initQuiz(getLang());
    });
  }

  // Reactive mid-quiz language switch
  window.addEventListener('quiztide:langchange', function(e) {
    var newLang = e.detail.lang || getLang();
    loadLocale(newLang).then(function() {
      updateHeader();
      if (isFinished) {
        showResults();
      } else {
        renderQuestion(currentIndex);
      }
    });
  });

  // Start
  initQuiz(getLang());
})();

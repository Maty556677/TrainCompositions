document.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('languageSelector');

  // Language detection - 1. localStorage, 2. browser, 3. ENG
  let detectedLang = localStorage.getItem('lang');
  if (!detectedLang) {
    const browserLang = navigator.language.slice(0, 2);
    detectedLang = translations[browserLang] ? browserLang : 'en';
    localStorage.setItem('lang', detectedLang);
  }

  selector.value = detectedLang;
  applyTranslations(detectedLang);

  selector.addEventListener('change', (e) => {
    const lang = e.target.value;
    localStorage.setItem('lang', lang);
    applyTranslations(lang);
    location.reload();
  });
});

function applyTranslations(lang) {
  const dict = translations[lang] || {};

  document.querySelectorAll('body *').forEach(el => {
    el.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = node.textContent.replace(/\[(.*?)\]/g, (m, key) => {
          return dict[key] || m;
        });
      }
    });

    // Atributes translation
    ['title', 'placeholder', 'alt', 'aria-label'].forEach(attr => {
      const val = el.getAttribute(attr);
      if (val) {
        el.setAttribute(attr, val.replace(/\[(.*?)\]/g, (m, key) => {
          return dict[key] || m;
        }));
      }
    });
  });
}

const observer = new MutationObserver(() => {
  const lang = localStorage.getItem('lang') || 'en';
  applyTranslations(lang);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});


// Update flags
function updateSelectFlag() {
  const selector = document.getElementById('languageSelector');
  const selectedImg = selector.querySelector('.select-selected img');
  const selectedLang = localStorage.getItem('lang') || 'cs'; // Nebo jakýkoliv aktuální jazyk

  selectedImg.src = `/flags/${selectedLang}.svg`;
  selectedImg.alt = selectedLang.toUpperCase();
}

document.getElementById('languageSelector').addEventListener('change', updateSelectFlag);
document.addEventListener('DOMContentLoaded', updateSelectFlag);


document.addEventListener('DOMContentLoaded', function() {
  const customSelect = document.getElementById('languageSelector');
  const selected = customSelect.querySelector('.select-selected');
  const items = customSelect.querySelector('.select-items');

  // Toggle dropdown
  selected.addEventListener('click', function(e) {
    e.stopPropagation();
    items.classList.toggle('select-hide');
    selected.classList.toggle('select-arrow-active');
  });

  // Select option
  items.addEventListener('click', function(e) {
    const option = e.target.closest('[data-value]');
    if (!option) return;

    const value = option.dataset.value;
    const img = option.querySelector('img').src;

    selected.querySelector('img').src = img;

    const changeEvent = new CustomEvent('change', { 
      detail: { value: value }
    });
    customSelect.dispatchEvent(changeEvent);

    localStorage.setItem('lang', value);
    updateSelectFlag();
    applyTranslations(value);

    // Close dropdown
    items.classList.add('select-hide');
    selected.classList.remove('select-arrow-active');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function() {
    items.classList.add('select-hide');
    selected.classList.remove('select-arrow-active');
  });

  const savedLang = localStorage.getItem('lang') || 'cs';
  const savedOption = items.querySelector(`[data-value="${savedLang}"]`);
  if (savedOption) {
    const img = savedOption.querySelector('img').src;
    selected.querySelector('img').src = img;
  }
});

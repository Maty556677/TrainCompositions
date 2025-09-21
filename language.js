document.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('languageSelector');

  // Výchozí čeština, jinak z localStorage
  let selectedLang = localStorage.getItem('lang') || 'cs';

  // Pro custom select
  if (selector.classList.contains('custom-select')) {
    // Custom select se inicializuje níže
  } else {
    // Původní HTML select
    selector.value = selectedLang;
    applyTranslations(selectedLang);

    selector.addEventListener('change', (e) => {
      const lang = e.target.value;
      localStorage.setItem('lang', lang);
      applyTranslations(lang);
      location.reload();
    });
  }
});

function applyTranslations(lang) {
  const dict = translations[lang] || {};

  // Překlad title tagu
  const titleElement = document.querySelector('title');
  if (titleElement) {
    titleElement.textContent = titleElement.textContent.replace(/\[(.*?)\]/g, (m, key) => {
      return dict[key] || m;
    });
  }

  // Překlad textových uzlů v body
  document.querySelectorAll('body *').forEach(el => {
    el.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = node.textContent.replace(/\[(.*?)\]/g, (m, key) => {
          return dict[key] || m;
        });
      }
    });

    // Překlad atributů
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

// Po definici applyTranslations přidej observer
const observer = new MutationObserver(() => {
  const lang = localStorage.getItem('lang') || 'en';
  applyTranslations(lang);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Custom select functionality  
document.addEventListener('DOMContentLoaded', function() {
  // Výchozí čeština, jinak z localStorage
  let selectedLang = localStorage.getItem('lang') || 'cs';

  const customSelect = document.getElementById('languageSelector');

  // Kontrola, zda je to custom select
  if (!customSelect || !customSelect.classList.contains('custom-select')) {
    return; // Pokud není custom select, nic nedělej
  }

  const selected = customSelect.querySelector('.select-selected');
  const items = customSelect.querySelector('.select-items');

  // Nastav správnou vlajku hned na začátku
  const initialOption = items.querySelector(`[data-value="${selectedLang}"]`);
  if (initialOption) {
    const img = initialOption.querySelector('img').src;
    selected.querySelector('img').src = img;
  }

  // Aplikuj překlady
  applyTranslations(selectedLang);

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

    // Update selected display
    selected.querySelector('img').src = img;

    // Update localStorage a aplikuj překlady
    localStorage.setItem('lang', value);
    applyTranslations(value);
    location.reload();

    // Close dropdown
    items.classList.add('select-hide');
    selected.classList.remove('select-arrow-active');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function() {
    items.classList.add('select-hide');
    selected.classList.remove('select-arrow-active');
  });
});
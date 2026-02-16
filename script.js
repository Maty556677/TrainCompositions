document.addEventListener('DOMContentLoaded', () => {
  const trainSearch = document.getElementById('trainSearch');
  const searchBtn = document.getElementById('searchBtn');
  const results = document.getElementById('results');
  const serverSelect = document.getElementById('serverSelect');
  const toggleDark = document.getElementById('toggleDarkMode');
  const popup = document.getElementById('popup');
  const acceptCookies = document.getElementById('acceptCookies');
  const homeBtn = document.getElementById('homeBtn');
  const headerText = document.getElementById('headerText');

  const miniHeader = document.getElementById('miniHeader');
  const miniTrainSearch = document.getElementById('miniTrainSearch');
  const miniSearchBtn = document.getElementById('miniSearchBtn');
  const miniBackBtn = document.getElementById('miniBackBtn');

  window.addEventListener('scroll', () => {
    const scrollThreshold = 150;
    const maxScroll = 500;
    const scrollY = window.scrollY;

    if (scrollY <= scrollThreshold) {
      miniHeader.style.transform = 'translateX(-50%) translateY(-100%)';
      miniHeader.classList.add('hidden');
    } else {
      miniHeader.classList.remove('hidden');

      if (scrollY >= maxScroll) {
        miniHeader.style.transform = 'translateX(-50%) translateY(0)';
      } else {
        const progress = (scrollY - scrollThreshold) / (maxScroll - scrollThreshold);
        const translateY = -100 + (progress * 100);
        miniHeader.style.transform = `translateX(-50%) translateY(${translateY}%)`;
      }
    }
  });

  trainSearch.addEventListener('input', () => {
    miniTrainSearch.value = trainSearch.value;
  });
  miniTrainSearch.addEventListener('input', () => {
    trainSearch.value = miniTrainSearch.value;
  });

  miniSearchBtn.addEventListener('click', () => {
    handleSearch(false);
  });
  searchBtn.addEventListener('click', () => {
    handleSearch(false);
  });

  // Mini header - enter
  miniTrainSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSearch(false);
    }
  });

  // mini header - zpet
  miniBackBtn.addEventListener('click', () => {
    document.querySelectorAll('.train-card').forEach(card => card.remove());
    clearError();
    trainSearch.value = '';
    miniTrainSearch.value = '';
    renderLastSearches();
    setBackButtonVisible(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });


  function setBackButtonVisible(visible) {
    homeBtn.classList.toggle('hidden', !visible);
  }

  setBackButtonVisible(false);

  searchBtn.addEventListener('click', () => handleSearch(false));
  trainSearch.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSearch(false);
  });

  function attachHistoryClickHandlers() {
    const lastSearchButtons = document.querySelectorAll('#lastSearchesList button');
    lastSearchButtons.forEach(btn => {
      btn.addEventListener('click', () => setBackButtonVisible(true));
    });
  }

  function renderLastSearches() {
    const last = getLastSearches();
    if (!last.length) return;

    const oldList = document.getElementById('lastSearchesList');
    if (oldList) oldList.remove();

    const container = document.createElement('div');
    container.id = 'lastSearchesList';
    container.style.marginTop = '2rem';

    const title = document.createElement('h3');
    title.textContent = '[historySection]';
    container.appendChild(title);

    last.forEach(query => {
      const btn = document.createElement('button');
      const isTrainName = /[A-Z]/.test(query) && /[A-Z]/i.test(query.replace(/[0-9\s\-+,]/g, ''));
      btn.textContent = isTrainName ? `"${query}"` : query;
      btn.style.marginRight = '0.5rem';
      btn.addEventListener('click', () => {
        trainSearch.value = query;
        if (serverSelect.value) handleSearch(true);
      });
      container.appendChild(btn);
    });

    results.appendChild(container);
  }

  const originalRenderLastSearches = renderLastSearches;
  renderLastSearches = function() {
    originalRenderLastSearches();
    attachHistoryClickHandlers();
  };

  homeBtn.addEventListener('click', () => {
    document.querySelectorAll('.train-card').forEach(card => card.remove());
    clearError();
    trainSearch.value = '';
    renderLastSearches();
    setBackButtonVisible(false);
  });

  headerText.addEventListener('click', () => {
    document.querySelectorAll('.train-card').forEach(card => card.remove());
    clearError();
    trainSearch.value = '';
    renderLastSearches();
    setBackButtonVisible(false);
  });

  trainSearch.value = '';
  let darkMode = localStorage.getItem('darkMode') === 'true';

  function applyDarkMode(state) {
    document.body.classList.toggle('dark', state);
    toggleDark.textContent = state ? '🌙' : '☀️';
    localStorage.setItem('darkMode', state);
  }
  applyDarkMode(darkMode);

  toggleDark.addEventListener('click', () => {
    darkMode = !darkMode;
    applyDarkMode(darkMode);
  });

  if (!localStorage.getItem('cookiesAccepted')) {
    popup.classList.remove('hidden');
    acceptCookies.addEventListener('click', () => {
      popup.classList.add('hidden');
      localStorage.setItem('cookiesAccepted', 'true');
    });
  }

  fetch('https://panel.simrail.eu:8084/servers-open')
    .then(res => res.json())
    .then(data => {
      data.data.filter(s => s.IsActive).forEach(server => {
        const opt = document.createElement('option');
        opt.value = server.ServerCode;
        opt.textContent = server.ServerName;
        serverSelect.appendChild(opt);
      });
      serverSelect.value = localStorage.getItem('selectedServer') || '';
    })
    .catch(err => console.error('[error2]', err));

  serverSelect.addEventListener('change', () => {
    localStorage.setItem('selectedServer', serverSelect.value);
  });

  // rozsahy a oddelene hodnoty
  function expandRanges(input) {
    input = input.trim();
    if (input.includes('-')) {
      const [start, end] = input.split('-').map(Number);
      if (isNaN(start) || isNaN(end) || start > end) return [];
      return Array.from({ length: end - start + 1 }, (_, i) => String(start + i));
    }
    return [input];
  }

  function parseInput(input) {
    // carky a plusy
    const parts = input.toUpperCase().split(/[,+]/).map(p => p.trim()).filter(p => p.length > 0);
    return parts;
  }

  function showLoading() {
    clearError();
    results.innerHTML = '<p>[error3]</p>';
  }

  function showError(msg) {
    results.innerHTML = `<div class="error-box">❌ ${msg}</div>`;
  }

  function clearError() {
    const errorBox = results.querySelector('.error-box');
    if (errorBox) errorBox.remove();
  }


  function renderTrains(trains) {
    clearError();
    const results = document.getElementById('results');
    if (!results) {
      console.error('[error4]');
      return;
    }
    if (trains.length === 0) {
      showError('[error5]');
      return;
    }
    results.innerHTML = '';

    const locomotivesList = ['EU07', 'EP07', 'EP08', 'EP09', 'E6ACTadb', 'E6ACTa', 'E186', 'ET22', 'ET25', '163'];
    const unitsList = ['EN76', 'EN96', 'EN57', 'EN71', 'ED250'];

    const vehicleImageMap = {
      // 'EN57-009': 'EN57-009',
      'EN57-038': 'EN57-038',
      'EN57-047': 'EN57-038',
      'EN57-206': 'EN57-015',
      'EN57-612': 'EN57-015',
      'EN57-614': 'EN57-614',
      'EN57-650': 'EN57-015',
      'EN57-919': 'EN57-919',
      'EN57-1000': 'EN57-1000',
      'EN57-1003': 'EN57-614',
      'EN57-1051': 'EN57-009',
      'EN57-1181': 'EN57-015',
      'EN57-1219': 'EN57-1219',
      'EN57-1316': 'EN57-1219',
      'EN57-1331': 'EN57-015',
      'EN57-1458': 'EN57-1458',
      'EN57-1567': 'EN57-1567',
      'EN57-1571': 'EN57-1458',
      'EN57-1752': 'EN57-1567',
      'EN57-1755': 'EN57-1755',
      'EN57-1796': 'EN57-1000',
      'EN57-1821': 'EN57-1821',
      'EN71-002': 'EN57-015',
      'EN71-004': 'EN57-015',
      'EN71-005': 'EN57-1219',
      'EN71-011': 'EN57-009',
      'EN71-015': 'EN57-015',
      // 'EN76-006': 'EN76-006',
      // 'EN76-022': 'EN76-022',
      // 'EN96-001': 'EN96-001',
      // 'ET25-002': 'ET25-002',
      // 'E6ACTa-014': 'E6ACTa-014',
      // 'E6ACTa-016': 'E6ACTa-016',
      // 'E6ACTadb-027': 'E6ACTadb-027',
      // 'E186-134': 'E186-134',
      // 'E186-929': 'E186-929',
      // 'EU07-005': 'EU07-005',
      // 'EU07-068': 'EU07-068',
      // 'EU07-070': 'EU07-070',
      'EU07-085': 'EU07-005',
      // 'EU07-092': 'EU07-092',
      // 'EU07-096': 'EU07-096',
      // 'EU07-153': 'EU07-153',
      // 'EU07-193': 'EU07-193',
      // 'EU07-241': 'EU07-241',
      // 'EP07-135': 'EP07-135',
      // 'EP07-174': 'EP07-174',
      // 'ET22-243': 'ET22-243',
      // 'ET22-256': 'ET22-256',
      // 'ET22-644': 'ET22-644',
      // 'ET22-836': 'ET22-836',
      // 'ET22-911': 'ET22-911',
      // 'ET22-1163': 'ET22-1163',
      // 'EP08-001': 'EP08-001',
      // 'EP08-008': 'EP08-008',
      // 'EP08-013': 'EP08-013',
      // '230-01': '230-01',
      // '406Ra_34517981215': '406Ra_34517981215', // cervene 7981 215
      // '406Ra_33510079375': '406Ra_33510079375', // seda 0079 375
      // '406Ra_33517980031': '406Ra_33517980031', // bila 7980 031
      // '406Ra_33517881520': '406Ra_33517881520', // modra 7881 520
      // '406Ra_33517982861': '406Ra_33517982861', // bila s cervenym logem 7982 861
      // '406Ra_33517982861': '406Ra_33517982861', // bila s cervenym logem 7982 861
      // '406Rb': '406Rb',
      // normalni vozy
      // '408S': '408S',
      // '412W_364': '412W_364',
      // '412W_364b': '412W_364b',
      // '412W_33515356394': '412W_33515356394', // zelena 5356 349 
      // '412W_33565300118': '412W_33565300118', // ZOS Zvolen 5300 118
      // '412W_33565300177': '412W_33565300177', // Zos Zvolen 5300 177
      // brazowy
      // '424Z': '424Z',
      // '424Z_brazowy': '424Z_brazowy',
      // pisek
      //'441V_31516635283': '441V_31516635283', // modry
      // '441V_31516635512': '441V_31516635512', // hnedy
      // 629Z
      // '629Z': '629Z',
      // osobni vozy
      '11xa Bc9ou': '11xa_Bc9ou',
      '111A_51 51 20-71 102': '111A_51_51_20-71_102',
      '111A_51 51 20-70 829': '111A_51_51_20-70_829',
      'a9mnouz_61511970234': 'a9mnouz_61511970234',
      'b11mnouz_61512170098': 'b11mnouz_61512170098',
      'b11mnouz_61512170064': 'b11mnouz_61512170064',
      '163_021-9': '163 021-9',
      '163_029-2': '163 029-2',
      '163_030-0': '163 030-0',
      '163_034-2': '163 034-2',
      '163_035-9': '163 035-9',
      '163_040-9': '163 029-2',
      '163_041-7': '163 041-7',
      '163_042-5': '163 042-5',
      '163_043-3': '163 034-2',
      '163_045-8': '163 034-2',
      '163_046-6': '163 034-2',
    };

    trains.forEach(train => {
      const container = document.createElement('div');
      container.className = 'train-card';

      let category = train.Category || '';
      const line = train.Line ? `${train.Line}` : '';
      const trainNo = train.TrainNoLocal || '';
      const trainName = train.TrainName || '';

      const startStation = train.StartStation || '?';
      const endStation = train.EndStation || '?';

      // slozeni
      let locos = 0, units = 0, cars = 0;
      if (Array.isArray(train.Vehicles)) {
        train.Vehicles.forEach(v => {
          let namePart = v.includes('/') ? v.split('/').pop() : v;
          let baseName = namePart.split('_')[0];

          if (locomotivesList.some(loco => baseName.startsWith(loco))) locos++;
          else if (unitsList.some(unit => baseName.startsWith(unit))) units++;
          else cars++;
        });
      }

      // Sklonování
      const lang = localStorage.getItem('lang') || 'en';
      const template = translations[lang]?.compositionText || "Vlak složený z {text}.";

      function pluralizeEnglish(count, singular, plural) {
        return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
      }

      function pluralizePolish(count, singularGen, pluralGen) {
        return count === 1 ? `1 ${singularGen}` : `${count} ${pluralGen}`;
      }

      function sklonovaniVozy(pocet, lang = 'cs') {
        if (lang === 'en') return pluralizeEnglish(pocet, 'car', 'cars');
        if (lang === 'pl') return pluralizePolish(pocet, 'wagonu', 'wagonów');

        if (pocet === 1) return '1 vozu';
        if (pocet >= 2 && pocet <= 4) return `${pocet} vozů`;
        return `${pocet} vozů`;
      }

      function sklonovaniLokomotiv(pocet, lang = 'cs') {
        if (lang === 'en') return pluralizeEnglish(pocet, 'locomotive', 'locomotives');
        if (lang === 'pl') return pluralizePolish(pocet, 'lokomotywy', 'lokomotyw');

        if (pocet === 1) return '1 lokomotivy';
        if (pocet >= 2 && pocet <= 4) return `${pocet} lokomotiv`;
        return `${pocet} lokomotiv`;
      }

      function sklonovaniJednotek(pocet, lang = 'cs') {
        if (lang === 'en') return pluralizeEnglish(pocet, 'unit', 'units');
        if (lang === 'pl') return pluralizePolish(pocet, 'zespołu', 'zespołów');

        if (pocet === 1) return '1 jednotky';
        if (pocet >= 2 && pocet <= 4) return `${pocet} jednotek`;
        return `${pocet} jednotek`;
      }

      let textToInsert = '';
      if (units > 0) {
        textToInsert = sklonovaniJednotek(units, lang);
      } else if (locos > 0 && cars === 0) {
        textToInsert = sklonovaniLokomotiv(locos, lang);
      } else if (locos === 1) {
        textToInsert = sklonovaniVozy(cars, lang);
      } else {
        const conjunction = lang === 'pl' ? 'i' : 'a';
        textToInsert = `${sklonovaniLokomotiv(locos, lang)} ${conjunction} ${sklonovaniVozy(cars, lang)}`;
      }

      const compositionText = template.replace("{text}", textToInsert);







      container.innerHTML = `
        <h2>${trainName} – ${category}${line} (${trainNo})<a href="https://www.simrail-edr.de/livemap" target="_blank" class="live-dot" title="[liveMap]"></a></h2>
        <p><strong>${startStation}</strong> ➝ <strong>${endStation}</strong></p>
        <p>${compositionText}</p>
      `;

      // Vozidla
      if (Array.isArray(train.Vehicles) && train.Vehicles.length > 0) {
        const vehicleElements = document.createElement('div');
        vehicleElements.className = 'vehicles-scroll-wrapper';

        const vehiclesContainer = document.createElement('div');
        vehiclesContainer.className = 'vehicles-container';

        train.Vehicles.forEach(vehicle => {
          let fullVehicleStringOriginal = vehicle;
          let fullVehicleStringFormatted = fullVehicleStringOriginal.replace('/', '-');
          let [nickname, fullNameWithRest] = vehicle.split('/');
          let fullName = fullNameWithRest ? fullNameWithRest.split(' ')[0] : vehicle;
          if (nickname) {
            fullVehicleStringFormatted = fullVehicleStringFormatted || nickname;
          }
          if (fullName) {
            fullVehicleStringFormatted = fullName || fullVehicleStringFormatted;
          }

          const originalFullName = fullName; // pro mapovani obrazku apod.

          let vehicleNumberText = fullName;
          let imgName;
          function getFallbackImgName(fallbackName) {
            return vehicleImageMap.hasOwnProperty(fallbackName) ? vehicleImageMap[fallbackName] : fallbackName;
          }
          // bo SimKol
          if (vehicleNumberText.includes('EN71')) {
            nickname = 'EN71';
          }
          if (vehicleNumberText.includes('434Z')) {
            nickname = '434Z';
          }
          if (vehicleNumberText.includes('406Rb')) {
            nickname = '406Rb';
          }
          if (vehicleNumberText.includes('230-01')) {
            nickname = '230-01';
          }
          if (vehicle.startsWith('CD163/')) {
            const match = vehicle.match(/CD163\/(.+?):/);
            if (match) {
              const extracted = match[1]; // 163_042-5

              imgName = vehicleImageMap[extracted] || extracted;
              vehicleNumberText = extracted.replace(/_/g, ' '); // 163 042-5
              nickname = 'ČD 163';
            }
          } else if (/^11xa\/80s\//.test(vehicle)) {
            imgName = '11xa_Bc9ou';
            vehicleNumberText = '11xa Bc9ou';
            nickname = '(1980)';
          } else if (vehicleImageMap.hasOwnProperty(originalFullName)) {
            imgName = vehicleImageMap[originalFullName];
          } else {
            imgName = fullName;
            if (fullName.includes(':')) {
              fullName = fullName.split(':')[0];
              imgName = fullName;
              vehicleNumberText = fullName;
            }

            if (fullName.startsWith('ED250')) {
              imgName = 'ED250';
              const match = fullName.match(/ED250-\d+/);
              if (match) vehicleNumberText = match[0];
            } else {
              if (fullName.includes('_')) {
                imgName = fullName.split('_')[0];
                vehicleNumberText = imgName;
              }
              if (fullName.includes('brazowy')) {
                imgName = fullName.split(':')[0];
              }
              if (/^412W\//.test(vehicle)) {
                const match = vehicle.match(/^412W\/412W_v\d+_(\d+)(?:-[\d]+)?(_b)?/);
                if (match) {
                  let number = match[1];
                  let suffix = match[2] || '';
                  suffix = suffix.replace('_', '');
                  imgName = getFallbackImgName(`412W_${number}${suffix}`);
                  vehicleNumberText = "412W";
                } else {
                  const fallbackMatch = vehicle.match(/412W\/([^:-]+)-/);
                  if (fallbackMatch) {
                    imgName = getFallbackImgName(fallbackMatch[1]);
                    vehicleNumberText = "412W";
                  }
                }
              }
              if (/^11xa\//.test(vehicle)) {
                const match11xa = vehicle.match(/^11xa\/([^:-]+-[^:-]+)-/);
                if (match11xa) {
                  imgName = match11xa[1].replace(/ /g, '_');
                }
              }
              if (fullName.includes('406Ra')) {
                imgName = getFallbackImgName(fullName.split('-')[0]);
              }
              if (/^441V\//.test(vehicle)) {
                const match441V = vehicle.match(/441V\/([^:-]+)-/);
                if (match441V) {
                  imgName = getFallbackImgName(match441V[1]);
                  vehicleNumberText = "441V";
                }
              }
              if (/^Z2\//.test(vehicle)) {
                const matchZ2 = vehicle.match(/Z2\/([^:-]+)-/);
                if (matchZ2) {
                  imgName = getFallbackImgName(matchZ2[1]);
                }
              }
            }
          }



          let loadText = '';
          if (vehicle.includes('@')) {
            const loadPart = vehicle.split('@')[1].split(' ')[0];
            const translatedCargo = translations[lang]?.cargoNames?.[loadPart];
            loadText = translatedCargo ? ` / ${translatedCargo}` : '';
          }

          // Bo SimKol - pokud je tam EN, nerozděluj ho mezerou a zapis nickname jako name
          const displayNickname = nickname ? nickname.replace(/([a-zA-Z]+)(\d+)/, (_, p1, p2) => {
            if (p1 === 'EN' || "Z2") return p1 + p2;
            return p1 + ' ' + p2;
          }) : '';
          const vehicleNumberCapitalized = vehicleNumberText.charAt(0).toUpperCase() + vehicleNumberText.slice(1);
          const titleText = vehicleImageMap.hasOwnProperty(originalFullName) ? vehicleImageMap[originalFullName] : vehicleNumberCapitalized;

          const vehicleDiv = document.createElement('div');
          vehicleDiv.className = 'vehicle';
          vehicleDiv.innerHTML = `
            <img src="vehicles/${imgName}.png" title="${titleText}" />
            <div class="vehicle-number">${vehicleNumberCapitalized}</div>
            <div class="vehicle-nickname">${displayNickname}${loadText}</div>
          `;
          vehiclesContainer.appendChild(vehicleDiv);
        });

        vehicleElements.appendChild(vehiclesContainer);
        container.appendChild(vehicleElements);
      }


      results.appendChild(container);
    });
  }




  async function fetchTrainData(serverCode) {
    try {
      const res = await fetch(`https://panel.simrail.eu:8084/trains-open?serverCode=${serverCode}`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
      return json?.data || [];
    } catch (e) {
      showError(`[error6]${e.message}`);
      return [];
    }
  }

  function getLastSearches() {
    const match = document.cookie.match(/(?:^|; )lastSearches=([^;]+)/);
    return match ? match[1].split(',') : [];
  }

  function saveLastSearches(query) {
    // Normalizuj query pro ukládání velkými písmeny a bez uvozovek
    query = query.toUpperCase().replace(/^"(.*)"$/, '$1').trim();
    let last = getLastSearches().filter(item => item.toUpperCase() !== query);
    last.unshift(query);
    if (last.length > 10) last.pop();
    document.cookie = `lastSearches=${last.join(',')}; path=/; max-age=${60 * 60 * 24 * 365}`;
  }



  async function handleSearch(fromHistory = false) {
    let input = trainSearch.value.trim();
    const serverCode = serverSelect.value;

    clearError();

    if (!serverCode && !input) {
      showError('[chooseError1]');
      renderLastSearches();
      setBackButtonVisible(false);
      return;
    }
    if (!serverCode) {
      showError('[chooseError2]');
      renderLastSearches();
      setBackButtonVisible(false);
      return;
    }
    if (!input) {
      showError('[chooseError3]');
      renderLastSearches();
      setBackButtonVisible(false);
      return;
    }

    showLoading();

    try {
      const allData = await fetchTrainData(serverCode);
      const filters = parseInput(input); // rozdělení podle čárek, plusů, rozsahů atd.

      if (filters.length === 0) {
        showError('[chooseError4]');
        renderLastSearches();
        setBackButtonVisible(false);
        return;
      }

      let filteredTrains;

      // AND hledání
      const isAndSearch = input.includes('+') && filters.length > 1;

      if (isAndSearch) {
        filteredTrains = allData.filter(train =>
          filters.every(f => trainMatchesFilter(train, f))
        );
      } else {
        // OR hledani
        filteredTrains = allData.filter(train =>
          filters.some(f => trainMatchesFilter(train, f))
        );
      }

      // Serazeni vzestupne
      filteredTrains.sort((a, b) => Number(a.TrainNoLocal) - Number(b.TrainNoLocal));

      if (filteredTrains.length === 0) {
        showError('[chooseError5]');
        renderLastSearches();
        setBackButtonVisible(false);
        return; // nic neukladej
      }

      renderTrains(filteredTrains);

      // Posledni hledani validni - uloz ho
      if (!fromHistory) {
        if (filters.length === 1) {
          const single = filters[0];
          if (/[A-Z]/.test(single) && /[A-Z]/i.test(single.replace(/[0-9\s\-+,]/g, ''))) {
            saveLastSearches(`"${single.toUpperCase()}"`);
          } else {
            saveLastSearches(single.toUpperCase());
          }
        } else {
          saveLastSearches(input.toUpperCase());
        }
      }

      setBackButtonVisible(true);
      renderLastSearches();

    } catch (e) {
      showError(`[error1]${e.message}`);
      setBackButtonVisible(false);
    }
  }


  function trainMatchesFilter(train, filterRaw) {
    const filter = filterRaw.trim().toUpperCase();

    // cislo nebo rozsah
    const numbers = expandRanges(filter);
    if (numbers.includes(String(train.TrainNoLocal))) return true;

    const trainNameUpper = train.TrainName.toUpperCase();

    // vlaky a linky
    const trainNameWords = trainNameUpper.split(/[\s\-]+/);

    // jmeno vlaku
    if (trainNameWords.includes(filter)) return true;
    if (trainNameUpper.includes(filter)) return true;


    // vozidla
    if (Array.isArray(train.Vehicles) && train.Vehicles.some(v => v.toUpperCase().includes(filter))) return true;

    return false;
  }

  renderLastSearches();
});


function deleteAllCookies() {
  document.cookie.split(';').forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });
}

document.getElementById('noCookiesBtn').addEventListener('click', (e) => {
  e.preventDefault();
  deleteAllCookies();
  location.reload();
});

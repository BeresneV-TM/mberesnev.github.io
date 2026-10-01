/* ================================================================
   СВАДЕБНОЕ ПРИГЛАШЕНИЕ — СКРИПТЫ (js/script.js)

   СОДЕРЖАНИЕ ФАЙЛА:
     1. CONFIG      — все настройки сайта в одном месте (РЕДАКТИРОВАТЬ ЗДЕСЬ)
     2. Вспомогательные функции
     3. initCountdown        — обратный отсчёт до свадьбы
     4. initRevealOnScroll   — плавное появление блоков при прокрутке
     5. initHeaderState      — фон шапки при прокрутке
     6. spawnPetals          — падающие лепестки на главном экране
     7. initParallax         — параллакс-движение веточек при прокрутке
     8. initCalendarLink     — кнопка «Добавить в календарь» (файл .ics)
     9. initMapLink          — ссылка «Открыть карту» (Яндекс.Карты)
    10. initRsvpForm         — отправка анкеты через WhatsApp
    11. Запуск всех функций при загрузке страницы
================================================================ */

'use strict';

/* ----------------------------------------------------------------
   1. CONFIG — НАСТРОЙКИ САЙТА
   Основные данные, которые скрипт подставляет на страницу.
   Проверьте их при редактировании сайта!

   ВАЖНО: дату свадьбы нужно менять и здесь, и в тексте index.html
   (блоки «Дата и время» и главный экран), чтобы отсчёт и надписи
   совпадали.
---------------------------------------------------------------- */
const CONFIG = {
  // Дата и время начала сбора гостей в формате ISO с часовым поясом.
  // +03:00 — московское время. Пример: '2027-08-14T15:30:00+03:00'
  weddingDateISO: '2027-08-14T15:30:00+03:00',

  // Название события для файла календаря
  eventTitle: 'Свадьба Александра и Екатерины',

  // Место проведения — используется в календаре и в ссылке на карту
  venueName: 'Загородный клуб «Усадьба Лесная»',
  venueAddress: 'Московская область, Одинцовский округ, деревня Горки, улица Парковая, 9',

  // Продолжительность праздника в часах (для события в календаре)
  eventDurationHours: 8,

  // Имя файла календаря, который скачает гость
  calendarFileName: 'svadba-2027.ics',

  // Номер WhatsApp организатора для приёма ответов анкеты.
  // ТОЛЬКО цифры, начиная с кода страны, без «+», пробелов и скобок.
  // Пример: '79001234567'
  rsvpPhone: '79001234567',

  // Количество падающих лепестков на главном экране
  petalsCount: 14,

  // Цвета лепестков (мягкие оттенки свадебной палитры)
  petalColors: ['#E9C6C4', '#EFE3C2', '#CFC0DC', '#C3CFB4', '#C4D4E0'],
};


/* ----------------------------------------------------------------
   2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
   Мелкие помощники, используемые остальным кодом.
---------------------------------------------------------------- */

// Поиск одного элемента по CSS-селектору
const $ = (selector, root = document) => root.querySelector(selector);

// Поиск всех элементов по селектору (вернёт массив)
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

// Дополнение числа до двух знаков: 5 -> '05' (для таймера)
const pad2 = (num) => String(num).padStart(2, '0');

// Экранирование HTML в пользовательском тексте (безопасный вывод)
const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[ch]));

// Проверка системной настройки «уменьшить движение»
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ----------------------------------------------------------------
   3. ОБРАТНЫЙ ОТСЧЁТ ДО СВАДЬБЫ
   Каждую секунду пересчитывает остаток времени и обновляет цифры
   в ячейках #cd-days, #cd-hours, #cd-minutes, #cd-seconds.
   Когда дата наступит — заменит таймер поздравительной строкой.
---------------------------------------------------------------- */
function initCountdown() {
  const wrap = $('#countdown');
  if (!wrap) return;

  const target = new Date(CONFIG.weddingDateISO).getTime();
  if (Number.isNaN(target)) {
    console.warn('Проверьте формат CONFIG.weddingDateISO (пример: 2027-08-14T15:30:00+03:00)');
    return;
  }

  const cells = {
    days: $('#cd-days'),
    hours: $('#cd-hours'),
    minutes: $('#cd-minutes'),
    seconds: $('#cd-seconds'),
  };

  let timerId = null;

  const render = () => {
    const diff = target - Date.now();

    // Дата уже наступила — показываем сообщение вместо таймера
    if (diff <= 0) {
      if (timerId) clearInterval(timerId);
      wrap.innerHTML = '<p class="countdown__done">Этот день настал — мы стали семьёй!</p>';
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    cells.days.textContent    = String(Math.floor(totalSeconds / 86400));
    cells.hours.textContent   = pad2(Math.floor((totalSeconds % 86400) / 3600));
    cells.minutes.textContent = pad2(Math.floor((totalSeconds % 3600) / 60));
    cells.seconds.textContent = pad2(totalSeconds % 60);
  };

  render();
  timerId = setInterval(render, 1000);
}


/* ----------------------------------------------------------------
   4. ПЛАВНОЕ ПОЯВЛЕНИЕ БЛОКОВ ПРИ ПРОКРУТКЕ
   Следит за элементами с классом .reveal. Как только элемент
   попадает в область экрана — добавляет ему .reveal--visible,
   и CSS-анимация (см. блок 16 в style.css) плавно показывает его.
---------------------------------------------------------------- */
function initRevealOnScroll() {
  const items = $$('.reveal');
  if (!items.length) return;

  // Старые браузеры без IntersectionObserver: показываем всё сразу
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('reveal--visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          obs.unobserve(entry.target); // анимируем элемент только один раз
        }
      });
    },
    {
      threshold: 0.15,                       // сработает при видимости 15% блока
      rootMargin: '0px 0px -50px 0px',      // чуть раньше нижнего края экрана
    }
  );

  items.forEach((el) => observer.observe(el));
}


/* ----------------------------------------------------------------
   5. ШАПКА ПРИ ПРОКРУТКЕ
   Добавляет шапке класс .header--scrolled, когда гость прокрутил
   страницу ниже 40px, — появляется светлый фон с размытием.
---------------------------------------------------------------- */
function initHeaderState() {
  const header = $('#siteHeader');
  if (!header) return;

  let ticking = false;

  const update = () => {
    header.classList.toggle('header--scrolled', window.scrollY > 40);
    ticking = false;
  };

  // requestAnimationFrame не даёт обработчику работать чаще, чем нужно
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  update();
}


/* ----------------------------------------------------------------
   6. ПАДАЮЩИЕ ЛЕПЕСТКИ НА ГЛАВНОМ ЭКРАНЕ
   Создаёт лепестки со случайными размером, цветом, скоростью и
   точкой старта. Движение задаёт CSS-анимация petal-fall.
---------------------------------------------------------------- */
function spawnPetals() {
  const holder = $('#heroPetals');
  if (!holder || prefersReducedMotion()) return;

  const colors = CONFIG.petalColors;

  for (let i = 0; i < CONFIG.petalsCount; i++) {
    const petal = document.createElement('span');
    petal.className = 'petal';

    const size = 9 + Math.random() * 13;                  // 9–22 px
    const color = colors[i % colors.length];
    const drift = Math.round(Math.random() * 140 - 70);   // снос вбок: ±70 px
    const duration = 11 + Math.random() * 10;             // 11–21 c
    const delay = -Math.random() * duration;              // отрицательная
    // задержка распределяет лепестки по высоте экрана

    petal.style.left = (Math.random() * 100).toFixed(1) + '%';
    petal.style.width = Math.round(size) + 'px';
    petal.style.height = Math.round(size * 1.25) + 'px';
    petal.style.background = `linear-gradient(140deg, ${color}, ${color}cc)`;
    petal.style.setProperty('--drift', drift + 'px');
    petal.style.animationDuration = duration.toFixed(1) + 's';
    petal.style.animationDelay = delay.toFixed(1) + 's';

    holder.appendChild(petal);
  }
}


/* ----------------------------------------------------------------
   7. ПАРАЛЛАКС ПРИ ПРОКРУТКЕ
   Элементы с атрибутом data-parallax="0.14" плавно смещаются
   вниз при прокрутке. Чем больше число — тем заметнее движение.
   (В index.html это веточки по углам главного экрана.)
---------------------------------------------------------------- */
function initParallax() {
  const layers = $$('[data-parallax]');
  if (!layers.length || prefersReducedMotion()) return;

  let ticking = false;

  const update = () => {
    const y = window.scrollY;
    layers.forEach((layer) => {
      const speed = parseFloat(layer.dataset.parallax) || 0;
      layer.style.transform = `translate3d(0, ${(y * speed).toFixed(1)}px, 0)`;
    });
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
}


/* ----------------------------------------------------------------
   8. КНОПКА «ДОБАВИТЬ В КАЛЕНДАРЬ»
   Формирует файл событий .ics прямо в браузере и отдает его
   по клику — гость получает событие с датой, местом и названием.
   Работает без сервера.
---------------------------------------------------------------- */
function initCalendarLink() {
  const link = $('#calendarLink');
  if (!link) return;

  const start = new Date(CONFIG.weddingDateISO);
  if (Number.isNaN(start.getTime())) return;

  const end = new Date(start.getTime() + CONFIG.eventDurationHours * 60 * 60 * 1000);

  // Дата в формате iCal: 20270814T153000Z
  const toICSDate = (date) =>
    date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wedding Invitation//RU//',
    'BEGIN:VEVENT',
    'UID:' + Date.now() + '@wedding-invitation',
    'DTSTAMP:' + toICSDate(new Date()),
    'DTSTART:' + toICSDate(start),
    'DTEND:' + toICSDate(end),
    'SUMMARY:' + CONFIG.eventTitle,
    'LOCATION:' + `${CONFIG.venueName}, ${CONFIG.venueAddress}`,
    'DESCRIPTION:Ждём вас на нашей свадьбе! Подробности — в приглашении.',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  link.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsLines.join('\r\n'));
  link.setAttribute('download', CONFIG.calendarFileName);
}


/* ----------------------------------------------------------------
   9. ССЫЛКА «ОТКРЫТЬ КАРТУ»
   Собирает ссылку на поиск места в Яндекс.Картах из названия
   и адреса площадки (CONFIG выше).
---------------------------------------------------------------- */
function initMapLink() {
  const link = $('#mapLink');
  if (!link) return;

  const query = `${CONFIG.venueName}, ${CONFIG.venueAddress}`;
  link.href = 'https://yandex.ru/maps/?text=' + encodeURIComponent(query);
}


/* ----------------------------------------------------------------
   10. АНКЕТА RSVP — ОТПРАВКА ОТВЕТА
   Форма работает без сервера: собирает ответы гостя, собирает
   из них текст сообщения и открывает WhatsApp на номер
   CONFIG.rsvpPhone с готовым сообщением — остаётся нажать
   «Отправить». Гостю показывается подсказка о статусе.
---------------------------------------------------------------- */
function initRsvpForm() {
  const form = $('#rsvpForm');
  if (!form) return;

  const status = $('#rsvpStatus');

  // Показ сообщения о статусе отправки под формой
  const showStatus = (html, isError = false) => {
    if (!status) return;
    status.innerHTML = html;
    status.classList.add('rsvp-form__status--shown');
    status.classList.toggle('is-error', isError);
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault(); // не перезагружаем страницу

    const data = new FormData(form);

    const name = String(data.get('name') || '').trim();
    if (!name) {
      showStatus('Пожалуйста, укажите ваше имя — так мы поймём, кто отвечает!', true);
      $('#rsvpName').focus();
      return;
    }

    const willAttend = data.get('attendance') === 'yes';
    const guests = Number(data.get('guests') || 1);
    const kids = Number(data.get('kids') || 0);
    const contact = String(data.get('contact') || '').trim();
    const notes = String(data.get('notes') || '').trim();

    // Собираем текст сообщения для организатора
    let message = willAttend
      ? `Здравствуйте! Подтверждаю присутствие на свадьбе: ${name}.`
      : `Здравствуйте! К сожалению, не смогу присутствовать на свадьбе: ${name}. Но от всей души поздравляю молодых!`;

    if (willAttend && guests > 1) message += ` Нас будет ${guests} человек.`;
    if (willAttend && kids > 0) {
      message += ` С нами ${kids} ${kids === 1 ? 'ребёнок' : 'ребёнка'}.`;
    }
    if (contact) message += ` Связь со мной: ${contact}.`;
    if (notes) message += ` Комментарий: ${notes}.`;

    const url = `https://wa.me/${CONFIG.rsvpPhone}?text=${encodeURIComponent(message)}`;

    const opened = window.open(url, '_blank', 'noopener');

    if (opened) {
      showStatus(
        `Спасибо, <strong>${escapeHtml(name)}</strong>! Мы открыли WhatsApp с готовым ` +
        `сообщением — просто нажмите «Отправить». Если окно не открылось, ` +
        `<a href="${url}" target="_blank" rel="noopener">перейдите по этой ссылке</a>.`
      );
    } else {
      // Браузер заблокировал всплывающее окно — даём прямую ссылку
      showStatus(
        `Спасибо, <strong>${escapeHtml(name)}</strong>! Чтобы отправить ответ, ` +
        `<a href="${url}" target="_blank" rel="noopener">перейдите по этой ссылке</a> ` +
        `— откроется WhatsApp с готовым сообщением.`
      );
    }
  });
}


/* ----------------------------------------------------------------
   11. ЗАПУСК ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
   Все функции стартуют, когда DOM полностью построен.
---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initHeaderState();     // фон шапки при прокрутке
  initRevealOnScroll();  // появление блоков при прокрутке
  initCountdown();       // обратный отсчёт
  initCalendarLink();    // кнопка календаря
  initMapLink();         // ссылка на карту
  spawnPetals();         // лепестки на главном экране
  initParallax();        // параллакс веточек
  initRsvpForm();        // анкета RSVP
});

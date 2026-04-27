/* ─────────────────────────────────────────────────────────────
   WhenAmIFree — popup.js
   ───────────────────────────────────────────────────────────── */

// ── State ────────────────────────────────────────────────────
const state = {
  authToken: null,
  selectedDuration: 45,
  selectedDays: new Set([1, 2, 3, 4, 5]),
  selectedStyle: 'professional',
  lastResult: '',
  allCalendars: [],      // { id, summary }[]
  calendarToggles: {},   // { [calendarId]: boolean }
};

// ── DOM refs ─────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const screens = {
  auth: $('screen-auth'),
  controls: $('screen-controls'),
  result: $('screen-result'),
};

// ── Screen navigation ─────────────────────────────────────────
function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle('active', key === name);
  });
}

// ── Auth ──────────────────────────────────────────────────────
async function getToken(interactive = false) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'GET_AUTH_TOKEN', interactive }, (resp) => {
      if (chrome.runtime.lastError) return reject(chrome.runtime.lastError.message);
      if (resp?.error) return reject(resp.error);
      resolve(resp?.token);
    });
  });
}

async function removeToken(token) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'REMOVE_AUTH_TOKEN', token }, () => resolve());
  });
}

async function signOut() {
  if (state.authToken) {
    await removeToken(state.authToken);
    state.authToken = null;
  }
  await chrome.storage.local.remove('authToken');
  showScreen('auth');
}

// ── Timezone dropdown ─────────────────────────────────────────
function populateTimezones() {
  const sel = $('timezone-select');
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Comprehensive IANA timezone list
  const tzList = [
    'Africa/Abidjan','Africa/Accra','Africa/Addis_Ababa','Africa/Algiers','Africa/Asmara',
    'Africa/Bamako','Africa/Bangui','Africa/Banjul','Africa/Bissau','Africa/Blantyre',
    'Africa/Brazzaville','Africa/Bujumbura','Africa/Cairo','Africa/Casablanca','Africa/Ceuta',
    'Africa/Conakry','Africa/Dakar','Africa/Dar_es_Salaam','Africa/Djibouti','Africa/Douala',
    'Africa/El_Aaiun','Africa/Freetown','Africa/Gaborone','Africa/Harare','Africa/Johannesburg',
    'Africa/Juba','Africa/Kampala','Africa/Khartoum','Africa/Kigali','Africa/Kinshasa',
    'Africa/Lagos','Africa/Libreville','Africa/Lome','Africa/Luanda','Africa/Lubumbashi',
    'Africa/Lusaka','Africa/Malabo','Africa/Maputo','Africa/Maseru','Africa/Mbabane',
    'Africa/Mogadishu','Africa/Monrovia','Africa/Nairobi','Africa/Ndjamena','Africa/Niamey',
    'Africa/Nouakchott','Africa/Ouagadougou','Africa/Porto-Novo','Africa/Sao_Tome',
    'Africa/Tripoli','Africa/Tunis','Africa/Windhoek',
    'America/Adak','America/Anchorage','America/Anguilla','America/Antigua','America/Araguaina',
    'America/Argentina/Buenos_Aires','America/Argentina/Catamarca','America/Argentina/Cordoba',
    'America/Argentina/Jujuy','America/Argentina/La_Rioja','America/Argentina/Mendoza',
    'America/Argentina/Rio_Gallegos','America/Argentina/Salta','America/Argentina/San_Juan',
    'America/Argentina/San_Luis','America/Argentina/Tucuman','America/Argentina/Ushuaia',
    'America/Aruba','America/Asuncion','America/Atikokan','America/Bahia','America/Bahia_Banderas',
    'America/Barbados','America/Belem','America/Belize','America/Blanc-Sablon','America/Boa_Vista',
    'America/Bogota','America/Boise','America/Cambridge_Bay','America/Campo_Grande','America/Cancun',
    'America/Caracas','America/Cayenne','America/Cayman','America/Chicago','America/Chihuahua',
    'America/Costa_Rica','America/Creston','America/Cuiaba','America/Curacao','America/Danmarkshavn',
    'America/Dawson','America/Dawson_Creek','America/Denver','America/Detroit','America/Dominica',
    'America/Edmonton','America/Eirunepe','America/El_Salvador','America/Fort_Nelson',
    'America/Fortaleza','America/Glace_Bay','America/Godthab','America/Goose_Bay',
    'America/Grand_Turk','America/Grenada','America/Guadeloupe','America/Guatemala',
    'America/Guayaquil','America/Guyana','America/Halifax','America/Havana','America/Hermosillo',
    'America/Indiana/Indianapolis','America/Indiana/Knox','America/Indiana/Marengo',
    'America/Indiana/Petersburg','America/Indiana/Tell_City','America/Indiana/Vevay',
    'America/Indiana/Vincennes','America/Indiana/Winamac','America/Inuvik','America/Iqaluit',
    'America/Jamaica','America/Juneau','America/Kentucky/Louisville','America/Kentucky/Monticello',
    'America/Kralendijk','America/La_Paz','America/Lima','America/Los_Angeles','America/Lower_Princes',
    'America/Maceio','America/Managua','America/Manaus','America/Marigot','America/Martinique',
    'America/Matamoros','America/Mazatlan','America/Menominee','America/Merida','America/Metlakatla',
    'America/Mexico_City','America/Miquelon','America/Moncton','America/Monterrey',
    'America/Montevideo','America/Montserrat','America/Nassau','America/New_York',
    'America/Nipigon','America/Nome','America/Noronha','America/North_Dakota/Beulah',
    'America/North_Dakota/Center','America/North_Dakota/New_Salem','America/Ojinaga',
    'America/Panama','America/Pangnirtung','America/Paramaribo','America/Phoenix',
    'America/Port-au-Prince','America/Port_of_Spain','America/Porto_Velho','America/Puerto_Rico',
    'America/Punta_Arenas','America/Rainy_River','America/Rankin_Inlet','America/Recife',
    'America/Regina','America/Resolute','America/Rio_Branco','America/Santa_Isabel',
    'America/Santarem','America/Santiago','America/Santo_Domingo','America/Sao_Paulo',
    'America/Scoresbysund','America/Sitka','America/St_Barthelemy','America/St_Johns',
    'America/St_Kitts','America/St_Lucia','America/St_Thomas','America/St_Vincent',
    'America/Swift_Current','America/Tegucigalpa','America/Thule','America/Thunder_Bay',
    'America/Tijuana','America/Toronto','America/Tortola','America/Vancouver','America/Whitehorse',
    'America/Winnipeg','America/Yakutat','America/Yellowknife',
    'Antarctica/Casey','Antarctica/Davis','Antarctica/DumontDUrville','Antarctica/Macquarie',
    'Antarctica/Mawson','Antarctica/McMurdo','Antarctica/Palmer','Antarctica/Rothera',
    'Antarctica/Syowa','Antarctica/Troll','Antarctica/Vostok',
    'Arctic/Longyearbyen',
    'Asia/Aden','Asia/Almaty','Asia/Amman','Asia/Anadyr','Asia/Aqtau','Asia/Aqtobe',
    'Asia/Ashgabat','Asia/Atyrau','Asia/Baghdad','Asia/Bahrain','Asia/Baku','Asia/Bangkok',
    'Asia/Barnaul','Asia/Beirut','Asia/Bishkek','Asia/Brunei','Asia/Chita','Asia/Choibalsan',
    'Asia/Colombo','Asia/Damascus','Asia/Dhaka','Asia/Dili','Asia/Dubai','Asia/Dushanbe',
    'Asia/Famagusta','Asia/Gaza','Asia/Hebron','Asia/Ho_Chi_Minh','Asia/Hong_Kong','Asia/Hovd',
    'Asia/Irkutsk','Asia/Jakarta','Asia/Jayapura','Asia/Jerusalem','Asia/Kabul','Asia/Kamchatka',
    'Asia/Karachi','Asia/Kathmandu','Asia/Khandyga','Asia/Kolkata','Asia/Krasnoyarsk',
    'Asia/Kuala_Lumpur','Asia/Kuching','Asia/Kuwait','Asia/Macau','Asia/Magadan','Asia/Makassar',
    'Asia/Manila','Asia/Muscat','Asia/Nicosia','Asia/Novokuznetsk','Asia/Novosibirsk',
    'Asia/Omsk','Asia/Oral','Asia/Phnom_Penh','Asia/Pontianak','Asia/Pyongyang','Asia/Qatar',
    'Asia/Qostanay','Asia/Qyzylorda','Asia/Riyadh','Asia/Sakhalin','Asia/Samarkand','Asia/Seoul',
    'Asia/Shanghai','Asia/Singapore','Asia/Srednekolymsk','Asia/Taipei','Asia/Tashkent',
    'Asia/Tbilisi','Asia/Tehran','Asia/Thimphu','Asia/Tokyo','Asia/Tomsk','Asia/Ulaanbaatar',
    'Asia/Urumqi','Asia/Ust-Nera','Asia/Vientiane','Asia/Vladivostok','Asia/Yakutsk',
    'Asia/Yangon','Asia/Yekaterinburg','Asia/Yerevan',
    'Atlantic/Azores','Atlantic/Bermuda','Atlantic/Canary','Atlantic/Cape_Verde',
    'Atlantic/Faroe','Atlantic/Madeira','Atlantic/Reykjavik','Atlantic/South_Georgia',
    'Atlantic/St_Helena','Atlantic/Stanley',
    'Australia/Adelaide','Australia/Brisbane','Australia/Broken_Hill','Australia/Currie',
    'Australia/Darwin','Australia/Eucla','Australia/Hobart','Australia/Lindeman',
    'Australia/Lord_Howe','Australia/Melbourne','Australia/Perth','Australia/Sydney',
    'Europe/Amsterdam','Europe/Andorra','Europe/Astrakhan','Europe/Athens','Europe/Belgrade',
    'Europe/Berlin','Europe/Bratislava','Europe/Brussels','Europe/Bucharest','Europe/Budapest',
    'Europe/Busingen','Europe/Chisinau','Europe/Copenhagen','Europe/Dublin','Europe/Gibraltar',
    'Europe/Guernsey','Europe/Helsinki','Europe/Isle_of_Man','Europe/Istanbul','Europe/Jersey',
    'Europe/Kaliningrad','Europe/Kiev','Europe/Kirov','Europe/Lisbon','Europe/Ljubljana',
    'Europe/London','Europe/Luxembourg','Europe/Madrid','Europe/Malta','Europe/Mariehamn',
    'Europe/Minsk','Europe/Monaco','Europe/Moscow','Europe/Nicosia','Europe/Oslo','Europe/Paris',
    'Europe/Podgorica','Europe/Prague','Europe/Riga','Europe/Rome','Europe/Samara',
    'Europe/San_Marino','Europe/Sarajevo','Europe/Saratov','Europe/Simferopol','Europe/Skopje',
    'Europe/Sofia','Europe/Stockholm','Europe/Tallinn','Europe/Tirane','Europe/Ulyanovsk',
    'Europe/Uzhgorod','Europe/Vaduz','Europe/Vatican','Europe/Vienna','Europe/Vilnius',
    'Europe/Volgograd','Europe/Warsaw','Europe/Zagreb','Europe/Zaporozhye','Europe/Zurich',
    'Indian/Antananarivo','Indian/Chagos','Indian/Christmas','Indian/Cocos','Indian/Comoro',
    'Indian/Kerguelen','Indian/Mahe','Indian/Maldives','Indian/Mauritius','Indian/Mayotte',
    'Indian/Reunion',
    'Pacific/Apia','Pacific/Auckland','Pacific/Bougainville','Pacific/Chatham','Pacific/Chuuk',
    'Pacific/Easter','Pacific/Efate','Pacific/Enderbury','Pacific/Fakaofo','Pacific/Fiji',
    'Pacific/Funafuti','Pacific/Galapagos','Pacific/Gambier','Pacific/Guadalcanal','Pacific/Guam',
    'Pacific/Honolulu','Pacific/Kiritimati','Pacific/Kosrae','Pacific/Kwajalein','Pacific/Majuro',
    'Pacific/Marquesas','Pacific/Midway','Pacific/Nauru','Pacific/Niue','Pacific/Norfolk',
    'Pacific/Noumea','Pacific/Pago_Pago','Pacific/Palau','Pacific/Pitcairn','Pacific/Pohnpei',
    'Pacific/Port_Moresby','Pacific/Rarotonga','Pacific/Saipan','Pacific/Tahiti','Pacific/Tarawa',
    'Pacific/Tongatapu','Pacific/Wake','Pacific/Wallis',
    'UTC',
  ];

  tzList.forEach((tz) => {
    const opt = document.createElement('option');
    opt.value = tz;
    opt.textContent = tz.replace(/_/g, ' ');
    if (tz === detected) opt.selected = true;
    sel.appendChild(opt);
  });

  if (!sel.value) {
    sel.value = 'UTC';
  }
}

// ── Date helpers ──────────────────────────────────────────────
function toDateStr(date) {
  return date.toISOString().split('T')[0];
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function setQuickRange(range) {
  const today = new Date();
  let start, end;

  if (range === 'this-week') {
    start = startOfWeek(today);
    end = new Date(start);
    end.setDate(end.getDate() + 4);
  } else if (range === 'next-week') {
    start = startOfWeek(today);
    start.setDate(start.getDate() + 7);
    end = new Date(start);
    end.setDate(end.getDate() + 4);
  } else if (range === 'next-2-weeks') {
    start = startOfWeek(today);
    start.setDate(start.getDate() + 7);
    end = new Date(start);
    end.setDate(end.getDate() + 11);
  }

  $('date-start').value = toDateStr(start);
  $('date-end').value = toDateStr(end);
}

function initDefaultDates() {
  setQuickRange('next-week');
}

// ── Chip group helpers ────────────────────────────────────────
function bindSingleChipGroup(groupId, onSelect) {
  const group = $(groupId);
  group.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      group.querySelectorAll('.chip').forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      onSelect(chip);
    });
  });
}

function bindQuickDateChips() {
  const group = $('quick-date-chips');
  group.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      group.querySelectorAll('.chip').forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      setQuickRange(chip.dataset.range);
    });
  });
}

function bindDayChips() {
  $('day-chips').querySelectorAll('.day-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const day = parseInt(chip.dataset.day, 10);
      chip.classList.toggle('selected');
      if (chip.classList.contains('selected')) {
        state.selectedDays.add(day);
      } else {
        state.selectedDays.delete(day);
      }
    });
  });
}

// ── Work hours toggle ─────────────────────────────────────────
function bindWorkHoursToggle() {
  const toggle = $('toggle-work-hours');
  const customHours = $('custom-hours');

  function updateVisibility() {
    customHours.classList.toggle('visible', !toggle.checked);
  }

  toggle.addEventListener('change', updateVisibility);
  updateVisibility();
}

// ── Calendar API ──────────────────────────────────────────────
async function loadAndRenderCalendars(token) {
  const listEl = $('calendar-list');
  listEl.innerHTML = '<div class="calendar-loading">Loading calendars…</div>';

  try {
    const res = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?fields=items(id,summary,selected,accessRole)',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    const items = (data.items || []).filter(
      (c) => c.selected !== false && ['owner', 'writer', 'reader', 'freeBusyReader'].includes(c.accessRole)
    );
    state.allCalendars = items;

    // Load persisted toggle state
    const stored = await chrome.storage.local.get('calendarToggles');
    const saved = stored.calendarToggles || {};
    state.calendarToggles = {};
    items.forEach((cal) => {
      state.calendarToggles[cal.id] = saved[cal.id] !== false; // default on
    });

    renderCalendarList();
  } catch {
    listEl.innerHTML = '<div class="calendar-loading">Could not load calendars.</div>';
  }
}

function renderCalendarList() {
  const listEl = $('calendar-list');
  if (state.allCalendars.length === 0) {
    listEl.innerHTML = '<div class="calendar-loading">No calendars found.</div>';
    return;
  }

  listEl.innerHTML = '';
  state.allCalendars.forEach((cal) => {
    const item = document.createElement('div');
    item.className = 'calendar-item';
    const checked = state.calendarToggles[cal.id] !== false;
    const name = cal.summary || cal.id;

    item.innerHTML = `
      <span class="calendar-item-name" title="${name}">${name}</span>
      <label class="toggle-switch">
        <input type="checkbox" ${checked ? 'checked' : ''} data-cal-id="${cal.id}" />
        <div class="toggle-track"><div class="toggle-thumb"></div></div>
      </label>
    `;

    item.querySelector('input').addEventListener('change', async (e) => {
      state.calendarToggles[cal.id] = e.target.checked;
      await chrome.storage.local.set({ calendarToggles: { ...state.calendarToggles } });
    });

    listEl.appendChild(item);
  });
}

async function fetchFreeBusy(token, startDate, endDate, timezone) {
  const timeMin = new Date(`${startDate}T00:00:00`).toISOString();
  const timeMax = new Date(`${endDate}T23:59:59`).toISOString();

  // Use the user-toggled calendar list; fall back to primary if none loaded
  const calendarItems = state.allCalendars.length > 0
    ? state.allCalendars
        .filter((c) => state.calendarToggles[c.id] !== false)
        .map((c) => ({ id: c.id }))
    : [{ id: 'primary' }];

  const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ timeMin, timeMax, timeZone: timezone, items: calendarItems }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('AUTH_EXPIRED');
    throw new Error(err?.error?.message || `Calendar API error (${res.status})`);
  }

  return res.json();
}

// ── Free window computation ───────────────────────────────────
// Merge overlapping/adjacent busy intervals so gaps are computed correctly
// across events from multiple calendars.
function mergeBusy(slots) {
  if (slots.length === 0) return [];
  const sorted = [...slots].sort((a, b) => a.start - b.start);
  const merged = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i].start <= last.end) {
      if (sorted[i].end > last.end) last.end = sorted[i].end;
    } else {
      merged.push({ ...sorted[i] });
    }
  }
  return merged;
}

function computeFreeWindows(busyData, opts) {
  const {
    startDate, endDate, startHour, startMin, endHour, endMin,
    durationMins, selectedDays, timezone,
  } = opts;

  const calendars = busyData?.calendars || {};
  const allBusy = Object.values(calendars)
    .flatMap((cal) => cal.busy || [])
    .map((s) => ({ start: new Date(s.start), end: new Date(s.end) }));

  const results = {};

  const cursor = new Date(`${startDate}T00:00:00`);
  const limit = new Date(`${endDate}T23:59:59`);

  while (cursor <= limit) {
    const dayOfWeek = cursor.getDay();

    if (selectedDays.has(dayOfWeek)) {
      const dateKey = toDateStr(cursor);

      const dayStart = new Date(cursor);
      dayStart.setHours(startHour, startMin, 0, 0);

      const dayEnd = new Date(cursor);
      dayEnd.setHours(endHour, endMin, 0, 0);

      // Clamp busy events to the day's working window, then merge overlaps
      const clipped = allBusy
        .filter((b) => b.start < dayEnd && b.end > dayStart)
        .map((b) => ({
          start: b.start < dayStart ? new Date(dayStart) : new Date(b.start),
          end:   b.end   > dayEnd   ? new Date(dayEnd)   : new Date(b.end),
        }));

      const busyToday = mergeBusy(clipped);

      const freeSlots = [];
      let freeStart = dayStart;

      for (const busy of busyToday) {
        const gapMins = (busy.start - freeStart) / 60000;
        if (gapMins >= durationMins) {
          freeSlots.push({ start: new Date(freeStart), end: new Date(busy.start) });
        }
        if (busy.end > freeStart) {
          freeStart = new Date(busy.end);
        }
      }

      const tailMins = (dayEnd - freeStart) / 60000;
      if (tailMins >= durationMins) {
        freeSlots.push({ start: new Date(freeStart), end: new Date(dayEnd) });
      }

      if (freeSlots.length > 0) {
        results[dateKey] = freeSlots;
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return results;
}

// ── Time formatting ───────────────────────────────────────────
function formatTime(date, timezone) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  });
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function getTimezoneAbbr(timezone) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    }).formatToParts(new Date());
    return parts.find((p) => p.type === 'timeZoneName')?.value || timezone;
  } catch {
    return timezone;
  }
}

// ── Message generation ────────────────────────────────────────
function buildMessage(freeWindows, style, timezone) {
  const tzAbbr = getTimezoneAbbr(timezone);
  const dateEntries = Object.entries(freeWindows);

  if (dateEntries.length === 0) {
    return 'No available time slots were found for the selected date range and preferences.';
  }

  const slotLines = dateEntries.map(([dateKey, slots]) => {
    const dateLabel = formatDate(dateKey);
    const times = slots
      .map((s) => `${formatTime(s.start, timezone)} – ${formatTime(s.end, timezone)}`)
      .join(', ');
    return `${dateLabel}: ${times}`;
  });

  if (style === 'slots') {
    return slotLines.join('\n');
  }

  if (style === 'professional') {
    return [
      'Thank you for reaching out. I would be happy to connect — please find my available windows below:',
      '',
      slotLines.map((l) => `• ${l}`).join('\n'),
      '',
      `All times are in ${tzAbbr}. Please let me know which slot works best for you, and I will send a calendar invite.`,
      '',
      'Looking forward to speaking with you.',
    ].join('\n');
  }

  if (style === 'casual') {
    return [
      `Hey! Happy to chat — here's when I'm free:`,
      '',
      slotLines.map((l) => `• ${l}`).join('\n'),
      '',
      `(All times ${tzAbbr}) — just pick whatever works and I'll send over an invite!`,
    ].join('\n');
  }

  return slotLines.join('\n');
}

// ── Generate flow ─────────────────────────────────────────────
async function generate() {
  hideError();
  const btn = $('btn-generate');

  const startDate = $('date-start').value;
  const endDate = $('date-end').value;

  if (!startDate || !endDate) {
    showError('Please select a start and end date.', 'controls');
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    showError('Start date must be before end date.', 'controls');
    return;
  }

  if (state.selectedDays.size === 0) {
    showError('Please select at least one day of the week.', 'controls');
    return;
  }

  const workHoursOn = $('toggle-work-hours').checked;
  let startHour = 9, startMin = 0, endHour = 17, endMin = 0;

  if (!workHoursOn) {
    const customStart = $('custom-start').value;
    const customEnd = $('custom-end').value;
    if (!customStart || !customEnd) {
      showError('Please set custom start and end times.', 'controls');
      return;
    }
    [startHour, startMin] = customStart.split(':').map(Number);
    [endHour, endMin] = customEnd.split(':').map(Number);

    if (startHour * 60 + startMin >= endHour * 60 + endMin) {
      showError('Start time must be before end time.', 'controls');
      return;
    }
  }

  const timezone = $('timezone-select').value;

  btn.classList.add('loading');
  btn.disabled = true;

  try {
    if (!state.authToken) {
      state.authToken = await getToken(true);
    }

    let busyData;
    try {
      busyData = await fetchFreeBusy(state.authToken, startDate, endDate, timezone);
    } catch (err) {
      if (err.message === 'AUTH_EXPIRED') {
        await removeToken(state.authToken);
        state.authToken = await getToken(true);
        busyData = await fetchFreeBusy(state.authToken, startDate, endDate, timezone);
      } else {
        throw err;
      }
    }

    const freeWindows = computeFreeWindows(busyData, {
      startDate,
      endDate,
      startHour,
      startMin,
      endHour,
      endMin,
      durationMins: state.selectedDuration,
      selectedDays: state.selectedDays,
      timezone,
    });

    const message = buildMessage(freeWindows, state.selectedStyle, timezone);
    state.lastResult = message;

    $('result-textarea').value = message;
    showScreen('result');
  } catch (err) {
    let msg = err.message || 'Something went wrong. Please try again.';
    if (msg.toLowerCase().includes('oauth') || msg.toLowerCase().includes('auth')) {
      msg = 'Authentication failed. Please sign out and reconnect your calendar.';
    }
    showError(msg, 'controls');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

// ── Error helpers ─────────────────────────────────────────────
function showError(msg, screen) {
  if (screen === 'auth') {
    const el = $('auth-error');
    el.textContent = msg;
    el.style.display = 'block';
  } else {
    const el = $('controls-error');
    el.textContent = msg;
    el.style.display = 'block';
  }
}

function hideError() {
  $('auth-error').style.display = 'none';
  $('controls-error').style.display = 'none';
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg) {
  const toast = $('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

// ── Copy to clipboard ─────────────────────────────────────────
async function copyResult() {
  const text = $('result-textarea').value;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  const btn = $('btn-copy');
  btn.classList.add('copied');
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
  showToast('✓ Copied to clipboard');

  setTimeout(() => {
    btn.classList.remove('copied');
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy to clipboard';
  }, 2500);
}

// ── Init ──────────────────────────────────────────────────────
async function init() {
  populateTimezones();
  initDefaultDates();
  bindQuickDateChips();
  bindDayChips();
  bindWorkHoursToggle();

  bindSingleChipGroup('duration-chips', (chip) => {
    state.selectedDuration = parseInt(chip.dataset.duration, 10);
    $('custom-duration').value = '';
  });

  $('custom-duration').addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (val >= 5 && val <= 480) {
      state.selectedDuration = val;
      $('duration-chips').querySelectorAll('.chip').forEach((c) => c.classList.remove('selected'));
    }
  });

  bindSingleChipGroup('style-chips', (chip) => {
    state.selectedStyle = chip.dataset.style;
  });

  // Auth flow
  $('btn-connect').addEventListener('click', async () => {
    $('btn-connect').disabled = true;
    $('btn-connect').textContent = 'Connecting…';
    hideError();
    try {
      const token = await getToken(true);
      state.authToken = token;
      await chrome.storage.local.set({ authToken: token });
      showScreen('controls');
      loadAndRenderCalendars(token);
    } catch (err) {
      showError(err?.message || err || 'Unknown error. Check the extension ID and OAuth client type.', 'auth');
      $('btn-connect').disabled = false;
      $('btn-connect').innerHTML = '<svg viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Connect Calendar';
    }
  });

  const handleSignOut = async () => {
    await signOut();
  };

  $('btn-signout').addEventListener('click', handleSignOut);
  $('btn-signout-result').addEventListener('click', handleSignOut);

  $('btn-generate').addEventListener('click', generate);

  $('btn-back').addEventListener('click', () => {
    hideError();
    showScreen('controls');
  });

  $('btn-regenerate').addEventListener('click', generate);

  $('btn-copy').addEventListener('click', copyResult);

  // Check for existing token
  try {
    const stored = await chrome.storage.local.get('authToken');
    if (stored?.authToken) {
      // Silently validate token
      const token = await getToken(false);
      if (token) {
        state.authToken = token;
        showScreen('controls');
        loadAndRenderCalendars(token);
        return;
      }
    }
  } catch {
    // No valid token — stay on auth screen
  }

  showScreen('auth');
}

document.addEventListener('DOMContentLoaded', init);

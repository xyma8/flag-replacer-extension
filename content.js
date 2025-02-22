const userCountryCache = new Map(); // Сохраняем инфу - ник, страна
const pendingRequests = new Set(); // Список запросов (по username) для которых УЖЕ идет запрос
let CURRENT_USER; // Храним ник текущего пользователя (из состояния)

function fixInvalidJson(jsObjectString) {
  return jsObjectString
    .replace(/([{,])\s*([\w]+)\s*:/g, '$1"$2":') // Добавляем кавычки вокруг ключей
    .replace(/,\s*}/g, '}'); // Убираем последнюю запятую перед }
}

/**
 * Функция для получения инфы о самом пользователе из context
 */
function getCurrentUserCountry() {
  const scriptTags = document.querySelectorAll('script');

  for (let script of scriptTags) {
    // Ищем скрипт context
    if (script.textContent.includes('context = {')) {
      const match = script.textContent.match(/context\s*=\s*({[\s\S]*?});/);

      if (match) {
        try {
          // Получаем JS-объект context и преобразуем в JSON
          let rawData = fixInvalidJson(match[1]);

          const contextData = JSON.parse(rawData);

          if (
            contextData.user &&
            contextData.user.username &&
            contextData.user.country
          ) {
            // Сохраняем текущего пользователя в кеш
            userCountryCache.set(
              contextData.user.username,
              contextData.user.country.id
            );
            CURRENT_USER = contextData.user.username;
          }
        } catch (error) {
          console.error('Ошибка парсинга context:', error);
        }
      }
    }
  }

  return null;
}

/**
 * Функция для получения страны пользователя
 */
async function getUserCountryId(username) {
  if (userCountryCache.has(username)) {
    // Возвращаем пользователя из списка если уже сохранен
    return userCountryCache.get(username);
  }

  if (pendingRequests.has(username)) {
    return null; // Запрос уже отправлен, больше не надо
  }

  pendingRequests.add(username); // Помечаем пользователя как "запрашиваемого" (от лишних асинхронных запросов)

  try {
    //console.log('RESPONSE');
    const response = await fetch(`https://www.c4355.com/member/${username}`);
    const text = await response.text();

    // Ищем строку с `window.chesscom.profile`
    const match = text.match(/window\.chesscom\.profile\s*=\s*(\{[\s\S]*?\});/);

    if (match) {
      // Получаем JS-объект инфы о пользователе и преобразуем в JSON
      let rawData = fixInvalidJson(match[1]);

      const profileData = JSON.parse(rawData); // Парсим JSON
      const countryId = parseInt(profileData.countryId, 10); // Достаем id страны и приводим к int
      userCountryCache.set(username, countryId); // Сохраняем в кеш
      pendingRequests.delete(username); // Убираем из списка запросов

      return countryId;
    }
  } catch (error) {
    console.error(`Ошибка при загрузке профиля ${username}`, error);
  }

  // Если не удалось определить страну
  pendingRequests.delete(username); // Также убираем из списка запросов
  return null;
}

/**
 * Функция для замены серых флагов с определением страны (Россия, Беларусь)
 */
async function replaceSanctionedFlags() {
  // Ищем всех блоки пользователей с серым флагом
  const users = document.querySelectorAll('.country-sanctioned');

  for (const userElement of users) {
    let username = null;

    // Ищем ник в соседних элементах (рядом с `.country-sanctioned`)
    const parent = userElement.parentNode;
    if (parent) {
      const usernameElement = [...parent.children].find(
        (el) =>
          el.classList.contains('user-username-component') ||
          el.classList.toString().includes('user-username-component') ||
          el.classList.toString().includes('profile-card-username')
      );

      if (usernameElement) {
        username = usernameElement.textContent.trim();
      }
    }

    // Если ник не найден, ставим ник пользователя (костыль, надо continue а ник пытаться найти в других местах)
    if (!username) username = CURRENT_USER;

    // Определяем страну пользователя с серым флагом
    const countryId = await getUserCountryId(username);
    if (!countryId) continue;

    //console.log(username, countryId);
    userElement.classList.remove('country-sanctioned');
    userElement.classList.add(`country-${countryId}`);

    if (countryId === 22) {
      userElement.setAttribute('v-tooltip', 'Беларусь');
    } else if (countryId === 116) {
      userElement.setAttribute('v-tooltip', 'Россия');
    }

    // Рикролл
    userElement.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    userElement.style.cursor = 'default';
  }
}

/**
 * Наблюдатель для отслеживания изменений в DOM и применения замен.
 */
function observeDOMChanges() {
  const targetNode = document.body;
  const config = { childList: true, subtree: true };

  const observer = new MutationObserver(() => {
    replaceSanctionedFlags();
  });

  observer.observe(targetNode, config);
}

// При загрузке страницы читаем context
const currentUserCountryId = getCurrentUserCountry();

observeDOMChanges();
replaceSanctionedFlags();

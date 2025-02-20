/**
 * Функция для замены флагов, ссылок и текста на странице.
 */
function replaceFlagsAndEditLinks() {
  document
    .querySelectorAll('a[href*="on-the-invasion-of-ukraine"]')
    .forEach((element) => {
      // Замена класса "country-sanctioned" (серый флаг) на "country-116" (флаг России)
      element.classList.remove('country-sanctioned');
      element.classList.add('country-116');

      // Рикролл
      element.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

      // Замена текста в tooltip
      if (element.hasAttribute('v-tooltip')) {
        element.setAttribute('v-tooltip', 'Россия');
      }

      element.style.cursor = 'default';
    });
}

/**
 * Наблюдатель для отслеживания изменений в DOM и применения замен.
 */
function observeDOMChanges() {
  const targetNode = document.body;
  const config = { childList: true, subtree: true };

  const observer = new MutationObserver(() => {
    replaceFlagsAndEditLinks();
  });

  observer.observe(targetNode, config);
}

replaceFlagsAndEditLinks(); // Выполняем замену флагов
observeDOMChanges(); // Запускаем MutationObserver

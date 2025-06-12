let isMouseDown = false;
let isDraggingHeader = false;
let ignoreRub = false;
let startX = 0;
let startY = 0;
let lastX = 0;
let lastY = 0;
let rubCount = 0;
let targetElement = null;
const rubThreshold = 4;
const minMove = 10;
let dragTargetBox = null;

function getSelectedTextRange() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  return sel.getRangeAt(0);
}

function isInSelection(el) {
  const range = getSelectedTextRange();
  if (!range) return false;
  try {
    return range.intersectsNode(el);
  } catch {
    return false;
  }
}

document.addEventListener('mousedown', (e) => {
  const header = e.target.closest('.floating-header');
  const box = e.target.closest('.floating-box');

  if (header) {
    isDraggingHeader = true;
    dragTargetBox = header.closest('.floating-box');
    startX = e.clientX;
    startY = e.clientY;
    const rect = dragTargetBox.getBoundingClientRect();
    dragTargetBox.dataset.offsetX = e.clientX - rect.left;
    dragTargetBox.dataset.offsetY = e.clientY - rect.top;
    return;
  }

  // rub 무시 플래그 설정 (floating box 안에서 시작하면 무시)
  ignoreRub = !!box;

  isMouseDown = true;
  startX = e.clientX;
  lastX = startX;
  rubCount = 0;
  targetElement = document.elementFromPoint(e.clientX, e.clientY);
});

document.addEventListener('mousemove', (e) => {
  if (isDraggingHeader && dragTargetBox) {
    const offsetX = parseFloat(dragTargetBox.dataset.offsetX);
    const offsetY = parseFloat(dragTargetBox.dataset.offsetY);
    dragTargetBox.style.position = 'fixed';
    dragTargetBox.style.left = `${e.clientX - offsetX}px`;
    dragTargetBox.style.top = `${e.clientY - offsetY}px`;
    return;
  }

  if (!isMouseDown || ignoreRub) return;

  const dx = e.clientX - lastX;
  if (Math.abs(dx) < minMove) return;
  if (Math.sign(dx) !== Math.sign(lastX - startX)) {
    rubCount++;
    if (rubCount >= rubThreshold) {
      isMouseDown = false;

      const sel = window.getSelection();
      const selectedText = sel && !sel.isCollapsed && isInSelection(targetElement)
        ? sel.toString()
        : null;

      if (selectedText) {
        createFloatingBox(`<p>${selectedText}</p>`, e.clientX, e.clientY, targetElement);
      } else if (targetElement) {
        let htmlContent = targetElement.outerHTML;
        // citation-link면 title 내용 추가
        if (targetElement.tagName === 'A' && targetElement.classList.contains('citation-link')) {
          const title = targetElement.getAttribute('title');
          if (title) {
            htmlContent = `<a href="${targetElement.href}" class="citation-link">${targetElement.innerHTML}</a> <span style="white-space: nowrap; font-size: 0.9em; color: #555;">${title}</span>`;
          }
        }
        createFloatingBox(htmlContent, e.clientX, e.clientY, targetElement);
      }
    }
  }

  lastX = e.clientX;
});

document.addEventListener('mouseup', () => {
  isMouseDown = false;
  isDraggingHeader = false;
  dragTargetBox = null;
  ignoreRub = false;
  rubCount = 0;
  startX = 0;
  lastX = 0;
});
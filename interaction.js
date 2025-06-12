let isMouseDown = false;
let isDraggingHeader = false;
let ignoreRub = false;
let startX = 0;
let lastX = 0;
let rubCount = 0;
let direction = 0;
let targetElement = null;
const rubThreshold = 4;
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
  console.log('🟡 mousedown', e.clientX);

  const header = e.target.closest('.floating-header');
  const box = e.target.closest('.floating-box');

  if (header) {
    isDraggingHeader = true;
    dragTargetBox = header.closest('.floating-box');
    const rect = dragTargetBox.getBoundingClientRect();
    dragTargetBox.dataset.offsetX = e.clientX - rect.left;
    dragTargetBox.dataset.offsetY = e.clientY - rect.top;
    return;
  }

  ignoreRub = !!box;
  isMouseDown = true;
  startX = lastX = e.clientX;
  rubCount = 0;
  direction = 0;
  targetElement = document.elementFromPoint(e.clientX, e.clientY);
});

document.addEventListener('mousemove', (e) => {
  if (!isMouseDown || ignoreRub) return;

  const dx = e.clientX - lastX;
  const newDirection = Math.sign(dx);

  if (newDirection !== 0 && newDirection !== direction) {
    rubCount++;
    direction = newDirection;
    console.log(`🔁 rub change! rubCount=${rubCount}, direction=${direction}`);
  } else {
    console.log(`🟢 move without rub. dx=${dx}`);
  }

  lastX = e.clientX;

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
      if (targetElement.tagName === 'A' && targetElement.classList.contains('citation-link')) {
        const title = targetElement.getAttribute('title');
        if (title) {
          htmlContent = `<a href="${targetElement.href}" class="citation-link">${targetElement.innerHTML}</a> <span style="white-space: nowrap; font-size: 0.9em; color: #555;">${title}</span>`;
        }
      }
      createFloatingBox(htmlContent, e.clientX, e.clientY, targetElement);
    }
  }
});

document.addEventListener('mouseup', (e) => {
  console.log('🔴 mouseup', e.clientX);
  isMouseDown = false;
  isDraggingHeader = false;
  dragTargetBox = null;
  ignoreRub = false;
  rubCount = 0;
  direction = 0;
});

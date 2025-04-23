let isMouseDown = false;
let startX = 0;
let lastX = 0;
let rubCount = 0;
let targetElement = null;
const rubThreshold = 4;

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

function createHeader(box) {
  const header = document.createElement('div');
  header.className = 'floating-header';

  const leftButtons = document.createElement('div');
  const rightButtons = document.createElement('div');
  rightButtons.style.display = 'flex';
  rightButtons.style.gap = '6px';

  const closeBtn = document.createElement('span');
  closeBtn.className = 'close-btn';
  closeBtn.textContent = '×';
  closeBtn.style.cursor = 'pointer';
  closeBtn.addEventListener('click', () => box.remove());

  const copyBtn = document.createElement('span');
  copyBtn.className = 'close-btn';
  copyBtn.textContent = '□';
  copyBtn.style.cursor = 'pointer';
  copyBtn.addEventListener('click', () => {
    const bodyHTML = box.querySelector('.floating-body').innerHTML;
    navigator.clipboard.writeText(bodyHTML);
  });

  const saveBtn = document.createElement('span');
  saveBtn.className = 'close-btn';
  saveBtn.textContent = '↓';
  saveBtn.style.cursor = 'pointer';
  saveBtn.addEventListener('click', () => {
    const bodyHTML = box.querySelector('.floating-body').innerHTML;
    const blob = new Blob([bodyHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '내용.html';
    a.click();
    URL.revokeObjectURL(url);
  });

  rightButtons.appendChild(copyBtn);
  rightButtons.appendChild(saveBtn);
  rightButtons.appendChild(closeBtn);

  header.appendChild(leftButtons);   // 나중에 원본 페이지 버튼 넣기 좋음
  header.appendChild(rightButtons);

  return header;
}

function createFloatingBox(content, x, y) {
  const box = document.createElement('div');
  box.className = 'floating-box';
  box.style.position = 'fixed';
  box.style.left = `${x}px`;
  box.style.top = `${y}px`;

  const header = createHeader(box);
  box.appendChild(header);

  const body = document.createElement('div');
  body.className = 'floating-body';
  body.innerHTML = content;
  box.appendChild(body);

  document.body.appendChild(box);

  requestAnimationFrame(() => {
    const bodyRect = body.getBoundingClientRect();
    box.style.width = `${bodyRect.width + 2}px`;
    box.style.height = `${header.offsetHeight + bodyRect.height + 2}px`;
  });

  // 이동 기능 (fixed 유지)
  let offsetX = 0, offsetY = 0;
  header.addEventListener('mousedown', (e) => {
    offsetX = e.clientX - box.getBoundingClientRect().left;
    offsetY = e.clientY - box.getBoundingClientRect().top;

    function move(e) {
      box.style.left = `${e.clientX - offsetX}px`;
      box.style.top = `${e.clientY - offsetY}px`;
    }

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', move);
    }, { once: true });
  });

  // 닫기 버튼
  header.querySelector('.close-btn').addEventListener('click', () => {
    box.remove();
  });

  box.addEventListener('mousedown', (e) => e.stopPropagation());

  // 드래그로 resize
  body.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = box.offsetWidth;
    const startHeight = box.offsetHeight;

    function resize(e) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newWidth = startWidth + dx;
      const newHeight = startHeight + dy;
      box.style.width = `${newWidth}px`;
      box.style.height = `${newHeight}px`;
      body.style.height = `${newHeight - header.offsetHeight}px`;

      const scaleX = newWidth / startWidth;
      const scaleY = newHeight / startHeight;
      body.style.transform = `scale(${scaleX}, ${scaleY})`;
      body.style.transformOrigin = 'top left';
    }

    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', resize);
    }, { once: true });
  });
}

document.addEventListener('mousedown', (e) => {
  isMouseDown = true;
  startX = e.clientX;
  lastX = startX;
  rubCount = 0;
  targetElement = document.elementFromPoint(e.clientX, e.clientY);
});

document.addEventListener('mousemove', (e) => {
  if (!isMouseDown) return;
  const dx = e.clientX - lastX;
  if (Math.sign(dx) !== Math.sign(lastX - startX)) {
    rubCount++;
    if (rubCount >= rubThreshold) {
      isMouseDown = false;

      const sel = window.getSelection();
      const selectedText = sel && !sel.isCollapsed && isInSelection(targetElement)
        ? sel.toString()
        : null;

      if (selectedText) {
        createFloatingBox(`<p>${selectedText}</p>`, e.clientX, e.clientY);
      } else if (targetElement) {
        const clone = targetElement.cloneNode(true);
        createFloatingBox(clone.outerHTML, e.clientX, e.clientY);
      }
    }
  }
  lastX = e.clientX;
});

document.addEventListener('mouseup', () => {
  isMouseDown = false;
});

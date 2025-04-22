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

function createFloatingBox(content) {
  const box = document.createElement('div');
  box.className = 'floating-box';

  const header = document.createElement('div');
  header.className = 'floating-header';
  header.innerHTML = '<span>Floating</span><span class="close-btn">×</span>';
  box.appendChild(header);

  const body = document.createElement('div');
  body.className = 'floating-body';
  body.innerHTML = content;
  box.appendChild(body);

  document.body.appendChild(box);

  // 초기 크기 설정
  requestAnimationFrame(() => {
    const bodyRect = body.getBoundingClientRect();
    box.style.width = `${bodyRect.width + 2}px`;
    box.style.height = `${header.offsetHeight + bodyRect.height + 2}px`;
  });

  // 이동 기능
  let offsetX = 0, offsetY = 0;
  header.addEventListener('mousedown', (e) => {
    offsetX = e.clientX - box.offsetLeft;
    offsetY = e.clientY - box.offsetTop;

    function move(e) {
      box.style.left = (e.clientX - offsetX) + 'px';
      box.style.top = (e.clientY - offsetY) + 'px';
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

  box.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  // body를 드래그하여 resize
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

      // 콘텐츠 크기 조정 (scale 적용)
      const scaleX = newWidth / startWidth;
      const scaleY = newHeight / startHeight;
      body.style.transform = `scale(${scaleX}, ${scaleY})`;
      body.style.transformOrigin = 'top left';  // scale 기준점 설정
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
        createFloatingBox(`<p>${selectedText}</p>`);
      } else if (targetElement) {
        const clone = targetElement.cloneNode(true);
        createFloatingBox(clone.outerHTML);
      }
    }
  }
  lastX = e.clientX;
});

document.addEventListener('mouseup', () => {
  isMouseDown = false;
});

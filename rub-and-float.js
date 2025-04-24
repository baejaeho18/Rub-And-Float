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

function createHeader(box, parentElement) {
  const header = document.createElement('div');
  header.className = 'floating-header';
  header.style.position = 'relative'
  
  const leftButtons = document.createElement('div');
  leftButtons.style.display = 'flex';
  leftButtons.style.gap = '6px';
  const rightButtons = document.createElement('div');
  rightButtons.style.display = 'flex';
  rightButtons.style.gap = '6px';

  const moveToPageBtn = document.createElement('span');
  moveToPageBtn.className = 'move-to-page-btn';
  moveToPageBtn.textContent = '<';
  moveToPageBtn.style.cursor = 'pointer';
  moveToPageBtn.addEventListener('click', () => {
    if (box && parentElement) {
      parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  leftButtons.appendChild(moveToPageBtn)

  const closeBtn = document.createElement('span');
  closeBtn.className = 'close-btn';
  closeBtn.textContent = 'x';
  closeBtn.style.cursor = 'pointer';
  closeBtn.addEventListener('click', () => box.remove());

  const copyBtn = document.createElement('span');
  copyBtn.className = 'copy-btn';
  copyBtn.textContent = '□ ';
  copyBtn.style.cursor = 'pointer';
  copyBtn.addEventListener('click', async () => {
    const body = box.querySelector('.floating-body');
  
    // 1. 이미지 복사 시도
    const img = body.querySelector('img');
    if (img && img.src) {
      try {
        const response = await fetch(img.src);
        const blob = await response.blob();
        const clipboardItem = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([clipboardItem]);
        return;
      } catch (err) {
        console.error('이미지 복사 실패:', err);
      }
    }
  
    // 2. 텍스트 복사
    const text = body.innerText || body.textContent;
    if (text.trim()) {
      try {
        await navigator.clipboard.writeText(text.trim());
      } catch (err) {
        console.error('텍스트 복사 실패:', err);
      }
    }
  });

  const saveBtn = document.createElement('span');
  saveBtn.className = 'save-btn';
  saveBtn.textContent = '↓';
  saveBtn.style.cursor = 'pointer';
  saveBtn.addEventListener('click', () => {
    const body = box.querySelector('.floating-body');
    const bodyHTML = body.innerHTML;
  
    // 콘텐츠가 이미지일 경우
    const img = body.querySelector('img');
    if (img && img.src) {
      const extension = img.src.split('.').pop();  // 이미지 확장자 추출
      const blob = new Blob([bodyHTML], { type: 'image/' + extension });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image.${extension}`;  // 이미지 파일로 저장
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
  
    // 텍스트일 경우 HTML 확장자
    const text = body.innerText || body.textContent;
    if (text.trim()) {
      const blob = new Blob([bodyHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'content.txt';  
      a.click();
      URL.revokeObjectURL(url);
    }
  });

  rightButtons.appendChild(copyBtn);
  rightButtons.appendChild(saveBtn);
  rightButtons.appendChild(closeBtn);

  header.appendChild(leftButtons);
  header.appendChild(rightButtons);

  return header;
}

function createFloatingBox(content, x, y, parentElement) {
  const box = document.createElement('div');
  box.className = 'floating-box';
  box.style.position = 'fixed';
  box.style.left = `${x}px`;
  box.style.top = `${y}px`;

  const header = createHeader(box, parentElement);
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

  const defaultWidth = 300;
  const defaultHeight = 200;
  
  box.style.width = `${defaultWidth}px`;
  box.style.height = `${header.offsetHeight + defaultHeight}px`;
  
  const resizeObserver = new ResizeObserver(() => {
    const boxRect = box.getBoundingClientRect();
    const body = box.querySelector('.floating-body');
  
    const scaleX = boxRect.width / defaultWidth;
    const scaleY = (boxRect.height - header.offsetHeight) / defaultHeight;
    const scale = Math.min(scaleX, scaleY);
  
    // ▶ 커질 때만 scale 적용
    if (scale > 1) {
      body.style.transform = `scale(${scale})`;
    } else {
      body.style.transform = `scale(1)`;  // 그대로 두기
    }
  });
  resizeObserver.observe(box);

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
        createFloatingBox(`<p>${selectedText}</p>`, e.clientX, e.clientY, targetElement);
      } else if (targetElement) {
        const clone = targetElement.cloneNode(true);
        createFloatingBox(clone.outerHTML, e.clientX, e.clientY, targetElement);
      }
    }
  }
  lastX = e.clientX;
});

document.addEventListener('mouseup', () => {
  isMouseDown = false;
});

// floating-box.js
const floatingBoxes = [];

function createHeader(box, parentElement) {
  const header = document.createElement('div');
  header.className = 'floating-header';
  header.style.position = 'relative';

  const leftButtons = document.createElement('div');
  leftButtons.style.display = 'flex';
  leftButtons.style.gap = '6px';
  const rightButtons = document.createElement('div');
  rightButtons.style.display = 'flex';
  rightButtons.style.gap = '6px';

  const moveToPageBtn = document.createElement('span');
  moveToPageBtn.className = 'move-to-page-btn';
  moveToPageBtn.textContent = '↩';
  moveToPageBtn.style.cursor = 'pointer';
  moveToPageBtn.addEventListener('click', () => {
    if (box && parentElement) {
      parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  leftButtons.appendChild(moveToPageBtn);

  const closeBtn = document.createElement('span');
  closeBtn.className = 'close-btn';
  closeBtn.textContent = '🗙';
  closeBtn.style.cursor = 'pointer';
  closeBtn.addEventListener('click', () => {
    box.remove();
    const index = floatingBoxes.indexOf(box);
    if (index !== -1) floatingBoxes.splice(index, 1);
  });

  const copyBtn = document.createElement('span');
  copyBtn.className = 'copy-btn';
  copyBtn.textContent = '⧉';
  copyBtn.style.cursor = 'pointer';
  copyBtn.addEventListener('click', async () => {
    const body = box.querySelector('.floating-body');
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
  saveBtn.textContent = '⤓';
  saveBtn.style.cursor = 'pointer';
  saveBtn.addEventListener('click', async () => {
    const body = box.querySelector('.floating-body');
    const img = body.querySelector('img');
    if (img && img.src) {
      try {
        const response = await fetch(img.src);
        const blob = await response.blob();
        const mimeType = blob.type; // 예: 'image/jpeg'
        const extension = mimeType.split('/')[1]; // 'jpeg'
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `image.${extension}`; // 안전한 확장자 사용
        a.click();
        URL.revokeObjectURL(url);
        return;
      } catch (err) {
        console.error('이미지 저장 실패:', err);
      }
    }
  
    // 텍스트 저장
    const bodyHTML = body.innerHTML;
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

  // ✅ URL일 경우 iframe 삽입
  if (typeof content === 'string' && /^https?:\/\/\S+$/.test(content.trim())) {
    const iframe = document.createElement('iframe');
    iframe.src = content.trim();
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.loading = 'lazy';
    body.appendChild(iframe);
  } else {
    body.innerHTML = content;
  }

  box.appendChild(body);
  document.body.appendChild(box);
  floatingBoxes.push(box);

  requestAnimationFrame(() => {
    const bodyRect = body.getBoundingClientRect();
    box.style.width = `${bodyRect.width + 2}px`;
    box.style.height = `${header.offsetHeight + bodyRect.height + 2}px`;
  });

  const defaultWidth = 300;
  const defaultHeight = 200;
  box.style.width = `${defaultWidth}px`;
  box.style.height = `${header.offsetHeight + defaultHeight}px`;

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

  box.addEventListener('mousedown', (e) => e.stopPropagation());
}

export const loadingDirective = {
  mounted(el: HTMLElement, binding: { value: boolean }) {
    if (binding.value) {
      addOverlay(el);
    }
  },
  updated(el: HTMLElement, binding: { value: boolean }) {
    const existingOverlay = el.querySelector('.overlay');
    if (binding.value) {
      if (!existingOverlay) {
        addOverlay(el);
      }
    } else {
      if (existingOverlay) {
        el.removeChild(existingOverlay);
      }
    }
  },
};

function addOverlay(el: HTMLElement) {
  el.style.position = 'relative';
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.25)';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '1000';
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  spinner.style.border = '2px solid #f3f3f3';
  spinner.style.borderTop = '2px solid #3498db';
  spinner.style.borderRadius = '50%';
  spinner.style.width = '16px';
  spinner.style.height = '16px';
  spinner.style.animation = 'spin 2s linear infinite';
  overlay.appendChild(spinner);
  el.appendChild(overlay);
}

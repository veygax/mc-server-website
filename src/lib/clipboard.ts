// thanks https://gist.github.com/rproenca/64781c6a1329b48a455b645d361a9aa3

interface ClipboardInterface {
  copy: (text: string) => void;
}

declare global {
  interface Window {
    Clipboard: ClipboardInterface;
  }
}

const initClipboard = (): ClipboardInterface => {
  let textArea: HTMLTextAreaElement;

  function isiOS() {
    return navigator.userAgent.match(/ipad|iphone/i) || 
    (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);
  }

  function createTextArea(text: string) {
    textArea = document.createElement('textarea') as HTMLTextAreaElement;
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
  }

  function selectText() {
    if (isiOS()) {
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textArea.setSelectionRange(0, 999999);
    } else {
      textArea.select();
    }
  }

  function copyToClipboard() {
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }

  const copy = function(text: string) {
    createTextArea(text);
    selectText();
    copyToClipboard();
  };

  return {
    copy
  };
};

export const copyTextToClipboard = (text: string): void => {
  if (navigator.clipboard && !navigator.userAgent.match(/ipad|iphone/i)) {
    navigator.clipboard.writeText(text).catch(err => {
      console.warn('Clipboard API failed, falling back to execCommand', err);
      if (typeof window !== 'undefined') {
        window.Clipboard = window.Clipboard || initClipboard();
        window.Clipboard.copy(text);
      }
    });
  } else {
    if (typeof window !== 'undefined') {
      window.Clipboard = window.Clipboard || initClipboard();
      window.Clipboard.copy(text);
    }
  }
}; 
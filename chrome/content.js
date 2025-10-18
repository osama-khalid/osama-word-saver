// Prevent multiple injections
if (!window.multilingualTranslatorInjected) {
  window.multilingualTranslatorInjected = true;

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showTranslation") {
      showTranslationTooltip(request.text, request.translation, request.sourceLang);
      sendResponse({ success: true });
    }
  });

  function showTranslationTooltip(originalText, translation, sourceLang) {
    // Remove any existing tooltip
    const existing = document.getElementById('multilingual-translator-tooltip');
    if (existing) {
      existing.remove();
    }
    
    // Get the selection
    const selection = window.getSelection();
    if (!selection.rangeCount) {
      console.log("No selection range found");
      return;
    }
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.id = 'multilingual-translator-tooltip';
    tooltip.className = 'multilingual-translator-tooltip';
    
    // Create content with language badge
    const content = document.createElement('div');
    content.className = 'tooltip-content';
    
    // Add language badge if available
    if (sourceLang && sourceLang !== 'auto') {
      const badge = document.createElement('span');
      badge.className = 'language-badge';
      badge.textContent = sourceLang.toUpperCase();
      content.appendChild(badge);
    }
    
    const translationText = document.createElement('span');
    translationText.textContent = translation;
    content.appendChild(translationText);
    
    tooltip.appendChild(content);
    
    // Position the tooltip above the selected text
    const leftPos = rect.left + window.scrollX + (rect.width / 2);
    const topPos = rect.top + window.scrollY - 10;
    
    tooltip.style.position = 'absolute';
    tooltip.style.left = `${leftPos}px`;
    tooltip.style.top = `${topPos}px`;
    tooltip.style.transform = 'translate(-50%, -100%)';
    tooltip.style.zIndex = '999999';
    
    // Add to page
    document.body.appendChild(tooltip);
    
    console.log("Tooltip displayed:", translation, "Language:", sourceLang);
    
    // Auto-remove after 5 seconds
    const fadeTimeout = setTimeout(() => {
      tooltip.classList.add('fade-out');
      setTimeout(() => {
        if (tooltip.parentNode) {
          tooltip.remove();
        }
      }, 300);
    }, 5000);
    
    // Remove on click anywhere
    const clickHandler = () => {
      clearTimeout(fadeTimeout);
      if (tooltip.parentNode) {
        tooltip.remove();
      }
      document.removeEventListener('click', clickHandler);
    };
    
    // Add click listener after a short delay to prevent immediate removal
    setTimeout(() => {
      document.addEventListener('click', clickHandler);
    }, 100);
  }

  console.log("Osama's Word Saver content script loaded");
}
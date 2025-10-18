// Firefox compatibility - use browser namespace
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Global filter state
let activeLanguageFilter = null;

// Notify that popup is open (to close stats overlay if open)
(async () => {
  try {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      browserAPI.tabs.sendMessage(tabs[0].id, { action: "closeStatsOverlay" }).catch(() => {});
    }
  } catch (e) {}
})();

// Load and display saved words
async function loadWords(filterLang = null) {
  const result = await browserAPI.storage.local.get(['wordData']);
  const wordData = result.wordData || {};
  
  const wordList = document.getElementById('wordList');
  const totalWords = document.getElementById('totalWords');
  const totalLookups = document.getElementById('totalLookups');
  
  let entries = Object.entries(wordData);
  
  // Apply language filter if active
  if (filterLang) {
    entries = entries.filter(([, data]) => data.sourceLang === filterLang);
  }
  
  if (entries.length === 0) {
    wordList.innerHTML = '';
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    
    const icon = document.createElement('div');
    icon.className = 'empty-state-icon';
    icon.textContent = filterLang ? '🔍' : '🌐';
    
    const message = document.createElement('p');
    if (filterLang) {
      message.textContent = `No words found for language: ${filterLang.toUpperCase()}`;
      const hint = document.createElement('small');
      hint.style.opacity = '0.7';
      hint.textContent = 'Click the language badge again to show all words';
      message.appendChild(document.createElement('br'));
      message.appendChild(hint);
    } else {
      const line1 = document.createTextNode('No words saved yet.');
      const br1 = document.createElement('br');
      const line2 = document.createTextNode('Right-click on any text to get started!');
      const br2 = document.createElement('br');
      const hint = document.createElement('small');
      hint.style.opacity = '0.7';
      hint.textContent = 'Supports 100+ languages';
      
      message.appendChild(line1);
      message.appendChild(br1);
      message.appendChild(line2);
      message.appendChild(br2);
      message.appendChild(hint);
    }
    
    emptyDiv.appendChild(icon);
    emptyDiv.appendChild(message);
    wordList.appendChild(emptyDiv);
    
    totalWords.textContent = '0';
    totalLookups.textContent = '0';
    return;
  }
  
  // Sort by count (most looked up first)
  entries.sort((a, b) => b[1].count - a[1].count);
  
  // Calculate total lookups
  const lookupCount = entries.reduce((sum, [, data]) => sum + data.count, 0);
  
  // Get unique languages
  const languages = new Set();
  entries.forEach(([, data]) => {
    if (data.sourceLang && data.sourceLang !== 'auto') {
      languages.add(data.sourceLang);
    }
  });
  
  // Update stats
  totalWords.textContent = entries.length;
  totalLookups.textContent = lookupCount;
  
  // Display language count if available
  const languageCount = document.getElementById('languageCount');
  if (languageCount && languages.size > 0) {
    languageCount.textContent = languages.size;
  }
  
  // Display words
  wordList.innerHTML = '';
  entries.forEach(([word, data]) => {
    const isActiveFilter = filterLang && data.sourceLang === filterLang;
    
    const wordItem = document.createElement('div');
    wordItem.className = 'word-item';
    
    const wordHeader = document.createElement('div');
    wordHeader.className = 'word-header';
    
    const wordSpanish = document.createElement('div');
    wordSpanish.className = 'word-spanish';
    wordSpanish.textContent = word;
    wordHeader.appendChild(wordSpanish);
    
    if (data.sourceLang && data.sourceLang !== 'auto') {
      const langBadge = document.createElement('span');
      langBadge.className = 'lang-badge';
      if (isActiveFilter) langBadge.classList.add('active');
      langBadge.dataset.lang = data.sourceLang;
      langBadge.textContent = data.sourceLang.toUpperCase();
      langBadge.style.cursor = 'pointer';
      
      langBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        const clickedLang = langBadge.dataset.lang;
        if (activeLanguageFilter === clickedLang) {
          activeLanguageFilter = null;
          loadWords(null);
        } else {
          activeLanguageFilter = clickedLang;
          loadWords(clickedLang);
        }
      });
      
      wordHeader.appendChild(langBadge);
    }
    
    const wordEnglish = document.createElement('div');
    wordEnglish.className = 'word-english';
    wordEnglish.textContent = data.translation;
    
    const wordCount = document.createElement('div');
    wordCount.className = 'word-count';
    wordCount.textContent = `Looked up ${data.count} time${data.count > 1 ? 's' : ''}`;
    
    wordItem.appendChild(wordHeader);
    wordItem.appendChild(wordEnglish);
    wordItem.appendChild(wordCount);
    wordList.appendChild(wordItem);
  });
}

// Export button
document.getElementById('exportBtn').addEventListener('click', async () => {
  const btn = document.getElementById('exportBtn');
  btn.disabled = true;
  btn.textContent = 'Exporting...';
  
  try {
    const response = await browserAPI.runtime.sendMessage({ 
      action: "exportCSV",
      filterLanguage: activeLanguageFilter 
    });
    if (response && response.success) {
      btn.textContent = '✔ Exported!';
      setTimeout(() => window.close(), 500);
    } else {
      throw new Error('Export failed');
    }
  } catch (error) {
    console.error('Export error:', error);
    btn.textContent = '✗ Export Failed';
    setTimeout(() => {
      btn.textContent = 'Export CSV';
      btn.disabled = false;
    }, 2000);
  }
});

// Clear button
document.getElementById('clearBtn').addEventListener('click', async () => {
  if (confirm('Are you sure you want to clear all saved words?')) {
    await browserAPI.storage.local.set({ wordData: {} });
    activeLanguageFilter = null;
    loadWords();
  }
});

// Load words on popup open
loadWords();
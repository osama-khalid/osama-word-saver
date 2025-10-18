// Global filter state
let activeLanguageFilter = null;

// Notify that popup is open (to close stats overlay if open)
(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: "closeStatsOverlay" }).catch(() => {});
    }
  } catch (e) {}
})();

// Load and display saved words
async function loadWords(filterLang = null) {
  const result = await chrome.storage.local.get(['wordData']);
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
    const emptyMessage = filterLang 
      ? `<div class="empty-state">
           <div class="empty-state-icon">🔍</div>
           <p>No words found for language: <strong>${filterLang.toUpperCase()}</strong><br><small style="opacity: 0.7;">Click the language badge again to show all words</small></p>
         </div>`
      : `<div class="empty-state">
           <div class="empty-state-icon">🌐</div>
           <p>No words saved yet.<br>Right-click on any text to get started!<br><small style="opacity: 0.7;">Supports 100+ languages</small></p>
         </div>`;
    
    wordList.innerHTML = emptyMessage;
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
  wordList.innerHTML = entries.map(([word, data]) => {
    const isActiveFilter = filterLang && data.sourceLang === filterLang;
    const langBadge = data.sourceLang && data.sourceLang !== 'auto' 
      ? `<span class="lang-badge ${isActiveFilter ? 'active' : ''}" data-lang="${data.sourceLang}">${data.sourceLang.toUpperCase()}</span>` 
      : '';
    
    return `
      <div class="word-item">
        <div class="word-header">
          <div class="word-spanish">${word}</div>
          ${langBadge}
        </div>
        <div class="word-english">${data.translation}</div>
        <div class="word-count">Looked up ${data.count} time${data.count > 1 ? 's' : ''}</div>
      </div>
    `;
  }).join('');
  
  // Add click handlers to language badges
  document.querySelectorAll('.lang-badge').forEach(badge => {
    badge.style.cursor = 'pointer';
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      const clickedLang = badge.dataset.lang;
      
      if (activeLanguageFilter === clickedLang) {
        // Clicking same filter - turn it off
        activeLanguageFilter = null;
        loadWords(null);
      } else {
        // Clicking new filter - activate it
        activeLanguageFilter = clickedLang;
        loadWords(clickedLang);
      }
    });
  });
}

// Export button
document.getElementById('exportBtn').addEventListener('click', async () => {
  const btn = document.getElementById('exportBtn');
  btn.disabled = true;
  btn.textContent = 'Exporting...';
  
  try {
    const response = await chrome.runtime.sendMessage({ 
      action: "exportCSV",
      filterLanguage: activeLanguageFilter 
    });
    if (response && response.success) {
      btn.textContent = '✓ Exported!';
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
    await chrome.storage.local.set({ wordData: {} });
    activeLanguageFilter = null;
    loadWords();
  }
});

// Load words on popup open
loadWords();
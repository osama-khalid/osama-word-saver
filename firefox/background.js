// Firefox compatibility - use browser namespace
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const tabLanguages = new Map();

browserAPI.runtime.onInstalled.addListener(() => {
  browserAPI.contextMenus.create({
    id: "translateAndSave",
    title: "Osama's Word Saver",
    contexts: ["selection"]
  });
  console.log("Osama's Word Saver: Context menu created");
});

browserAPI.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const results = await browserAPI.tabs.executeScript(tabId, {
        code: `
          (function() {
            const htmlLang = document.documentElement.lang;
            if (htmlLang) return htmlLang.split('-')[0].toLowerCase();
            
            const metaLang = document.querySelector('meta[http-equiv="content-language"]');
            if (metaLang) return metaLang.content.split('-')[0].toLowerCase();
            
            const bodyText = document.body.innerText.substring(0, 500);
            return bodyText;
          })()
        `
      });
      
      let detectedLang = results[0];
      
      if (detectedLang && detectedLang.length > 5) {
        detectedLang = await detectLanguage(detectedLang);
      }
      
      if (detectedLang && detectedLang !== 'en') {
        tabLanguages.set(tabId, detectedLang);
        console.log(`🌐 Detected language for tab ${tabId}: ${detectedLang}`);
      }
    } catch (error) {
      console.log("ℹ️ Could not detect language:", error.message);
    }
  }
});

browserAPI.tabs.onRemoved.addListener((tabId) => {
  tabLanguages.delete(tabId);
});

async function detectLanguage(text) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text.substring(0, 200))}`;
    const response = await fetch(url);
    const data = await response.json();
    
    const detectedLang = data[2];
    console.log(`🔍 Language detected from text: ${detectedLang}`);
    return detectedLang || 'auto';
  } catch (error) {
    console.error("❌ Language detection error:", error);
    return 'auto';
  }
}

browserAPI.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "translateAndSave" || !tab?.id) return;

  const selectedText = (info.selectionText || "").trim();
  console.log("📝 Context menu clicked - Selected text:", selectedText);
  
  if (!selectedText) {
    console.log("⚠️ No text selected");
    return;
  }

  let sourceLang = tabLanguages.get(tab.id) || 'auto';
  
  await translateAndSave(selectedText, tab.id, sourceLang);
});

browserAPI.commands.onCommand.addListener(async (command) => {
  console.log("⌨️ Keyboard shortcut triggered:", command);
  
  const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab?.id) {
    console.log("⚠️ No active tab found");
    return;
  }

  if (command === "translate-selection") {
    try {
      const results = await browserAPI.tabs.executeScript(tab.id, {
        code: `
          (function() {
            let text = (window.getSelection()?.toString() || "").trim();
            if (text) return text;

            const el = document.activeElement;
            if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
              const start = el.selectionStart ?? 0;
              const end = el.selectionEnd ?? 0;
              const value = el.value || "";
              if (end > start) {
                return value.substring(start, end).trim();
              }
            }
            return "";
          })()
        `
      });

      const selectedText = (results[0] || "").trim();
      console.log("📝 Selected text:", selectedText);
      
      if (selectedText) {
        let sourceLang = tabLanguages.get(tab.id) || 'auto';
        await translateAndSave(selectedText, tab.id, sourceLang);
      } else {
        console.log("⚠️ No text selected");
        try {
          await browserAPI.tabs.executeScript(tab.id, {
            code: `
              (function() {
                const notification = document.createElement('div');
                notification.style.cssText = \`
                  position: fixed;
                  top: 20px;
                  left: 50%;
                  transform: translateX(-50%);
                  background: #ff6b6b;
                  color: white;
                  padding: 12px 24px;
                  border-radius: 8px;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  font-size: 14px;
                  font-weight: 600;
                  z-index: 999999;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                \`;
                notification.textContent = '⚠️ Please select some text first!';
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 2000);
              })()
            `
          });
        } catch (error) {
          console.error("❌ Could not show notification:", error);
        }
      }
    } catch (error) {
      console.error("❌ Translate selection error:", error);
    }
  } 
  
  else if (command === "show-stats") {
    try {
      const result = await browserAPI.storage.local.get(["wordData"]);
      const wordData = result.wordData || {};
      
      // Inject the full stats overlay code
      await browserAPI.tabs.executeScript(tab.id, {
        code: `
(function(data) {
  const existing = document.getElementById('multilingual-translator-stats-overlay');
  if (existing) {
    existing.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => existing.remove(), 300);
    return;
  }

  let activeLanguageFilter = null;

  function renderOverlay(filterLang = null) {
    let entries = Object.entries(data);
    
    if (filterLang) {
      entries = entries.filter(([, d]) => d.sourceLang === filterLang);
    }

    const totalWords = entries.length;
    const totalLookups = entries.reduce((sum, [, d]) => sum + d.count, 0);
    
    const languages = new Set();
    entries.forEach(([, d]) => {
      if (d.sourceLang && d.sourceLang !== 'auto') {
        languages.add(d.sourceLang);
      }
    });
    const languageCount = languages.size;
    
    entries.sort((a, b) => b[1].count - a[1].count);

    const overlay = document.getElementById('multilingual-translator-stats-overlay') || document.createElement('div');
    const isNew = !overlay.id;
    
    if (isNew) {
      overlay.id = 'multilingual-translator-stats-overlay';
      overlay.style.cssText = \`
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 500px;
        max-height: 85vh;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: fadeIn 0.3s ease-out;
      \`;
    }

    const header = \`
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white; text-align: center; position: relative;">
        <button id="close-overlay-btn" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 18px; color: white; font-weight: bold;">×</button>
        <h1 style="margin: 0 0 5px 0; font-size: 24px; font-weight: 700;">Osama's Word Saver</h1>
        <p style="margin: 0; font-size: 12px; opacity: 0.8;">Supports 100+ languages worldwide</p>
      </div>
    \`;

    const stats = \`
      <div style="padding: 15px 20px; background: rgba(102, 126, 234, 0.1); display: flex; justify-content: space-around;">
        <div style="text-align: center;">
          <div style="font-size: 32px; font-weight: 700; color: #667eea;">\${totalWords}</div>
          <div style="font-size: 12px; opacity: 0.8; text-transform: uppercase; color: #333;">Words</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 32px; font-weight: 700; color: #667eea;">\${totalLookups}</div>
          <div style="font-size: 12px; opacity: 0.8; text-transform: uppercase; color: #333;">Lookups</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 32px; font-weight: 700; color: #667eea;">\${languageCount}</div>
          <div style="font-size: 12px; opacity: 0.8; text-transform: uppercase; color: #333;">Languages</div>
        </div>
      </div>
    \`;

    let content = '';
    if (entries.length === 0) {
      const emptyMessage = filterLang 
        ? \`<div style="flex: 1; text-align: center; padding: 40px 20px; color: #999;">
             <div style="font-size: 48px;">🔍</div>
             <p>No words found for: <strong>\${filterLang.toUpperCase()}</strong></p>
           </div>\`
        : \`<div style="flex: 1; text-align: center; padding: 40px 20px; color: #999;">
             <div style="font-size: 48px;">🌐</div>
             <p>No words saved yet.</p>
           </div>\`;
      content = emptyMessage;
    } else {
      content = \`
        <div style="flex: 1; padding: 20px; max-height: 350px; overflow-y: auto;">
          \${entries.map(([word, d]) => {
            const isActiveFilter = filterLang && d.sourceLang === filterLang;
            const langBadge = d.sourceLang && d.sourceLang !== 'auto' 
              ? \`<span class="lang-badge-filter" data-lang="\${d.sourceLang}" style="background: \${isActiveFilter ? '#667eea' : 'rgba(102, 126, 234, 0.15)'}; color: \${isActiveFilter ? 'white' : '#667eea'}; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; cursor: pointer; user-select: none;">\${d.sourceLang.toUpperCase()}</span>\` 
              : '';
            
            return \`
              <div style="padding: 12px; margin-bottom: 10px; background: #f5f5f5; border-radius: 8px; border-left: 4px solid #667eea;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <div style="font-weight: 700; font-size: 16px; color: #667eea;">\${word}</div>
                  \${langBadge}
                </div>
                <div style="font-size: 14px; color: #666; margin-bottom: 4px;">\${d.translation}</div>
                <div style="font-size: 12px; color: #999;">Looked up \${d.count} time\${d.count > 1 ? 's' : ''}</div>
              </div>
            \`;
          }).join('')}
        </div>
      \`;
    }

    const actions = \`
      <div style="padding: 20px; background: white; border-top: 1px solid #ddd; display: flex; gap: 10px;">
        <button id="export-stats-btn" style="flex: 1; padding: 12px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; background: #667eea; color: white;" \${entries.length === 0 ? 'disabled' : ''}>
          Export CSV
        </button>
        <button id="clear-stats-btn" style="flex: 1; padding: 12px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; background: #f5f5f5; color: #666;">
          Clear All
        </button>
      </div>
    \`;

    if (isNew) {
      const style = document.createElement('style');
      style.textContent = \`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -45%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      \`;
      document.head.appendChild(style);
    }

    overlay.innerHTML = header + stats + content + actions;
    
    if (isNew) {
      document.body.appendChild(overlay);
    }

    const closeBtn = document.getElementById('close-overlay-btn');
    closeBtn.onclick = () => {
      overlay.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => overlay.remove(), 300);
    };

    document.querySelectorAll('.lang-badge-filter').forEach(badge => {
      badge.onclick = (e) => {
        e.stopPropagation();
        const clickedLang = badge.dataset.lang;
        activeLanguageFilter = activeLanguageFilter === clickedLang ? null : clickedLang;
        renderOverlay(activeLanguageFilter);
      };
    });

    const exportBtn = document.getElementById('export-stats-btn');
    if (exportBtn && !exportBtn.disabled) {
      exportBtn.onclick = async () => {
        exportBtn.disabled = true;
        exportBtn.textContent = 'Exporting...';
        try {
          const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
          const response = await browserAPI.runtime.sendMessage({ 
            action: "exportCSV",
            filterLanguage: activeLanguageFilter 
          });
          if (response?.success) {
            exportBtn.textContent = '✔ Exported!';
            setTimeout(() => overlay.remove(), 1000);
          }
        } catch (error) {
          exportBtn.textContent = '✗ Failed';
          setTimeout(() => {
            exportBtn.textContent = 'Export CSV';
            exportBtn.disabled = false;
          }, 2000);
        }
      };
    }

    const clearBtn = document.getElementById('clear-stats-btn');
    clearBtn.onclick = async () => {
      if (confirm('Are you sure you want to clear all saved words?')) {
        const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
        await browserAPI.storage.local.set({ wordData: {} });
        overlay.remove();
      }
    };

    const escHandler = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  renderOverlay();
})(${JSON.stringify(wordData)});
        `
      });
    } catch (error) {
      console.error("❌ Could not show stats overlay:", error);
    }
  }
});

browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 Message received:", request.action);
  
  if (request?.action === "exportCSV") {
    exportToCSV(request.filterLanguage)
      .then(() => {
        console.log("✅ Export completed successfully");
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error("❌ Export failed:", error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
});

async function translateAndSave(text, tabId, sourceLang = 'auto') {
  try {
    console.log(`🔄 Translating: "${text}" from language: ${sourceLang}`);
    
    if (!text) {
      console.log("⚠️ Empty text provided");
      return;
    }

    if (sourceLang === 'auto') {
      console.log("🔍 Auto-detecting language...");
      sourceLang = await detectLanguage(text);
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }
    
    const data = await response.json();

    const translation = data?.[0]?.[0]?.[0] || "";
    console.log(`✅ Translation: "${translation}" (${sourceLang} → en)`);

    if (!translation) {
      throw new Error("No translation returned from API");
    }

    const result = await browserAPI.storage.local.get(["wordData"]);
    const wordData = result.wordData || {};

    if (wordData[text]) {
      wordData[text].count += 1;
      if (sourceLang !== 'auto') {
        wordData[text].sourceLang = sourceLang;
      }
      console.log(`📊 Updated existing word - Count: ${wordData[text].count}`);
    } else {
      wordData[text] = {
        translation,
        count: 1,
        sourceLang: sourceLang !== 'auto' ? sourceLang : undefined,
        firstSeen: new Date().toISOString()
      };
      console.log(`✨ New word saved`);
    }

    await browserAPI.storage.local.set({ wordData });

    if (tabId) {
      try {
        await browserAPI.tabs.sendMessage(tabId, {
          action: "showTranslation",
          text,
          translation,
          sourceLang
        });
        console.log("✅ Tooltip displayed via content script");
      } catch (error) {
        console.log("ℹ️ Content script unavailable, injecting tooltip directly");
        try {
          await browserAPI.tabs.executeScript(tabId, {
            code: `
              (function(trans, lang) {
                const selection = window.getSelection();
                if (!selection.rangeCount) return;
                
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                
                const tooltip = document.createElement('div');
                tooltip.style.cssText = \`
                  position: absolute;
                  left: \${rect.left + window.scrollX + (rect.width / 2)}px;
                  top: \${rect.top + window.scrollY - 10}px;
                  transform: translate(-50%, -100%);
                  background: #fff59d;
                  color: #111;
                  padding: 12px 20px;
                  border-radius: 12px;
                  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  font-size: 16px;
                  font-weight: 600;
                  z-index: 999999;
                \`;
                
                const langBadge = lang && lang !== 'auto' 
                  ? \`<span style="background: rgba(102, 126, 234, 0.9); color: white; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; margin-right: 10px;">\${lang.toUpperCase()}</span>\` 
                  : '';
                
                tooltip.innerHTML = langBadge + trans;
                document.body.appendChild(tooltip);
                
                setTimeout(() => tooltip.remove(), 5000);
              })("${translation.replace(/"/g, '\\"')}", "${sourceLang}")
            `
          });
        } catch (scriptError) {
          console.error("❌ Could not inject tooltip:", scriptError);
        }
      }
    }

    console.log(`💾 Saved: "${text}" (${sourceLang}) → "${translation}" [Count: ${wordData[text].count}]`);
  } catch (error) {
    console.error("❌ Translation error:", error);
  }
}

async function exportToCSV(filterLanguage = null) {
  console.log("📤 Starting CSV export...");
  if (filterLanguage) {
    console.log(`🔍 Filtering by language: ${filterLanguage}`);
  }
  
  try {
    const result = await browserAPI.storage.local.get(["wordData"]);
    const wordData = result.wordData || {};
    console.log(`📊 Retrieved ${Object.keys(wordData).length} words from storage`);

    let entries = Object.entries(wordData);
    
    if (filterLanguage) {
      entries = entries.filter(([, data]) => data.sourceLang === filterLanguage);
      console.log(`🔍 Filtered to ${entries.length} words for language: ${filterLanguage}`);
    }
    
    if (entries.length === 0) {
      console.log("⚠️ No words to export");
      throw new Error("No words to export");
    }

    let csv = "Original Word,English Translation,Source Language,Lookup Count,First Seen\n";
    
    for (const [word, data] of entries) {
      const escapedWord = word.replace(/"/g, '""');
      const escapedTranslation = (data.translation || "").replace(/"/g, '""');
      const sourceLang = data.sourceLang || "auto";
      const count = data.count ?? 0;
      const firstSeen = data.firstSeen || "";
      
      csv += `"${escapedWord}","${escapedTranslation}","${sourceLang}",${count},"${firstSeen}"\n`;
    }

    console.log(`📝 CSV content created - ${csv.length} characters`);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().split("T")[0];
    const langSuffix = filterLanguage ? `_${filterLanguage}` : '';
    const filename = `multilingual_words${langSuffix}_${timestamp}.csv`;

    console.log(`💾 Initiating download: ${filename}`);

    await browserAPI.downloads.download({
      url: url,
      filename: filename,
      saveAs: false
    });

    console.log(`✅ Download initiated`);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error("❌ Export error details:", error);
    throw error;
  }
}

console.log("🌐 Osama's Word Saver Extension Loaded");
console.log("📋 Supports 100+ languages worldwide");
console.log("⌨️ Shortcuts: Ctrl+Shift+1 (translate), Ctrl+Shift+2 (stats)");
console.log("✅ Osama's Word Saver Background Script Ready");
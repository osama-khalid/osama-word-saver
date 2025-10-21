# Osama's Word Saver

A language learning browser extension that translates any word to English and saves it for later review. Perfect for language learners, students, and anyone reading content in foreign languages.

## Features

- **100+ Languages Supported** - Automatic language detection for global content
- **Instant Translation** - Right-click any word for immediate translation
- **Learning Statistics** - Track your progress by saving and counting word lookups
- **Language Filtering** - Filter saved words by source language
- **CSV Export** - Export your vocabulary 
- **Keyboard Shortcuts** - Quick translation without breaking your workflow
- **Privacy First** - All data stored locally on your device

## Installation

### Firefox

**Option 1: Firefox Add-ons Store** (Under Review)
- Install from [Firefox Add-ons Store](https://addons.mozilla.org/en-US/firefox/addon/osama-s-word-saver/) (Coming Soon)

**Option 2: Direct Installation**
1. Download [`osama-word-saver.xpi`](https://github.com/osama-khalid/osama-word-saver/raw/refs/heads/main/builds/osama-word-saver.xpi)
2. Open Firefox and navigate to `about:addons`
3. Click the gear icon ⚙️ in the top right
4. Select "Install Add-on From File..."
5. Choose the downloaded `.xpi` file
6. Click "Add" when prompted

**Option 3: Developer Mode** (For testing)
1. Navigate to `about:debugging` in Firefox
2. Click "This Firefox"
3. Click "Load Temporary Add-on..."
4. Navigate to the `firefox/` folder and select `manifest.json`

### Chrome / Edge / Brave

**Option 1: Chrome Web Store**
- Install from [Chrome Web Store](https://chrome.google.com/webstore) (https://chromewebstore.google.com/detail/osamas-word-saver/pcikbkcimoojkpmfibicoimkfoingipm?authuser=0&hl=en)

**Option 2: Direct Installation**
1. Download [`osama-word-saver-chrome.crx`](https://github.com/osama-khalid/osama-word-saver/raw/refs/heads/main/builds/osama-word-saver.crx)
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top right
4. Drag and drop the `.crx` file onto the extensions page
5. Click "Add extension" when prompted

**Option 3: Developer Mode** (For testing)
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome/` folder
5. The extension will appear in your toolbar

## Usage

### Translating Words

**Method 1: Right-Click Menu**
1. Select any word or phrase on a webpage
2. Right-click on the selection
3. Choose "Osama's Word Saver" from the context menu
4. Translation appears in a tooltip above the text
5. Word is automatically saved to your vocabulary list

**Method 2: Keyboard Shortcut**
1. Select any word or phrase
2. Press `Ctrl+Shift+1` (Windows/Linux) or `Cmd+Shift+1` (Mac)
3. Translation appears instantly
4. Word is saved automatically

### Viewing Your Vocabulary

**Extension Popup:**
1. Click the extension icon in your browser toolbar
2. View all saved words with their translations
3. See lookup counts for each word
4. Click language badges to filter by specific languages
5. Export to CSV or clear your list

**Statistics Overlay:**
1. Press `Ctrl+Shift+2` (Windows/Linux) or `Cmd+Shift+2` (Mac)
2. View statistics:
   - Total words saved
   - Total lookups
   - Number of languages
   - Full word list with counts
3. Filter by language by clicking badges
4. Export or clear directly from the overlay

### Exporting Your Vocabulary

1. Open the extension popup or statistics overlay
2. (Optional) Filter by a specific language first
3. Click "Export CSV"

**CSV Format:**
```
Original Word, English Translation, Source Language, Lookup Count, First Seen
hola, hello, es, 5, 2024-01-15T10:30:00Z
bonjour, hello, fr, 3, 2024-01-16T14:22:00Z
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Windows/Linux | Mac | Action |
|----------|---------------|-----|--------|
| Translate | `Ctrl+Shift+1` | `Cmd+Shift+1` | Translate selected text |
| Statistics | `Ctrl+Shift+2` | `Cmd+Shift+2` | Show statistics overlay |

## Supported Languages

The extension supports 100+ languages including:

**Popular Languages:**
- Spanish (es), French (fr), German (de), Italian (it), Portuguese (pt)
- Chinese (zh), Japanese (ja), Korean (ko)
- Arabic (ar), Russian (ru), Hindi (hi)
- Dutch (nl), Swedish (sv), Polish (pl), Turkish (tr)
- Urdu (ur), Pashto (ps), Farsi (Fa)

**And many more:** 

## Project Structure

```
osama-word-saver/
│
├── README.md                     # This file
├── LICENSE                       # MIT License
│
├── firefox/                      # Firefox Extension (Manifest V2)
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── content.css
│   ├── popup.html
│   ├── popup.js
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
├── chrome/                       # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── content.css
│   ├── popup.html
│   ├── popup.js
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
├── builds/                       # Packaged Extensions
│   ├── osama-word-saver.xpi
│   └── osama-word-saver.crx
│
└── docs/                         # Documentation & Screenshots
    └── screenshots/
```

## Privacy & Security

### What We Collect
**Nothing.** This extension collects zero data, has no analytics, no tracking, and no telemetry.

### Where Your Data is Stored
- All translated words are stored in your browser's local storage
- Data never leaves your device (except for translation requests)
- No cloud sync, no external databases, no servers

### Third-Party Services
- Translation requests are sent to **Google Translate API** (translate.googleapis.com)
- These requests are subject to [Google's Privacy Policy](https://policies.google.com/privacy)
- Only the selected text is sent for translation

### Permissions Explained
- `contextMenus` - Adds right-click translation option
- `downloads` - Enables CSV export functionality
- `storage` - Saves your vocabulary locally
- `activeTab` - Accesses selected text on current page only
- `tabs` - Detects page language for better accuracy
- `https://translate.googleapis.com/*` - Makes translation requests

### Security
- No code obfuscation - fully open source
- No external scripts loaded
- No ads or tracking pixels
- Regular security updates

For full privacy policy, see [`firefox/privacy_policy.txt`](firefox/privacy_policy.txt) or [`chrome/privacy_policy.txt`](chrome/privacy_policy.txt)

## Contributing

Contributions are welcome! Here's how you can help:

### Reporting Bugs
Email Osama: [osama-khalid@uiowa.edu](osama-khalid@uiowa.edu)

### Suggesting Features
1. Email Osama: [osama-khalid@uiowa.edu](osama-khalid@uiowa.edu)
2. Describe the feature and use case
3. Explain why it would be valuable

### Development Guidelines
- Maintain browser compatibility (Firefox & Chrome)
- Follow existing code style
- Test in both browsers before submitting
- Update documentation for new features
- Keep commits atomic and well-described

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Osama

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Support

If you find this extension useful, please:
- Star this repository
- Report bugs
- Suggest features
- Share with others learning languages

## 📧 Contact & Links

- **Email:** [osama-khalid@uiowa.edu](osama-khalid@uiowa.edu)
- **Firefox Add-on:** Coming Soon
- **Chrome Extension:** Coming Soon

---

**Made with ❤️ for language learners worldwide**

*Supporting 100+ languages • Open Source*

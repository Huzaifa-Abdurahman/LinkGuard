//developer : Huzaifa Abdurahmna
// Version : 2.0
// Known malicious domains database (in real implementation, this would be updated from a server)
const maliciousDomains = [
    'phishing-site.com',
    'fake-bank.net',
    'malware-download.org',
    'suspicious-login.com'
  ];
  
  // Suspicious patterns that indicate potential phishing
  const suspiciousPatterns = [
    /paypal-[a-z0-9]+\.com/i,
    /amazon-[a-z0-9]+\.net/i,
    /google-[a-z0-9]+\.org/i,
    /microsoft-[a-z0-9]+\.info/i,
    /bank-[a-z0-9]+\.tk/i,
    /secure-[a-z0-9]+\.ml/i,
    /login-[a-z0-9]+\.ga/i,
    /update-[a-z0-9]+\.cf/i
  ];
  
  // Suspicious TLDs (Top Level Domains)
  const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.cc', '.pw', '.top'];
  
  // URL shorteners that might hide malicious links
  const urlShorteners = [
    'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 
    'short.link', 'tiny.cc', 'rb.gy'
  ];
  
  class PhishingDetector {
    constructor() {
      this.initializeListeners();
    }
  
    initializeListeners() {
      // Listen for navigation events
      chrome.webNavigation.onBeforeNavigate.addListener((details) => {
        if (details.frameId === 0) { // Main frame only
          this.checkURL(details.url, details.tabId);
        }
      });
  
      // Listen for tab updates
      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.url) {
          this.checkURL(changeInfo.url, tabId);
        }
      });
    }
  
    async checkURL(url, tabId) {
      try {
        const riskLevel = this.analyzeURL(url);
        
        if (riskLevel.isRisky) {
          await this.handleRiskyURL(url, tabId, riskLevel);
        }
      } catch (error) {
        console.error('Error checking URL:', error);
      }
    }
  
    analyzeURL(url) {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      const fullURL = url.toLowerCase();
      
      let riskLevel = {
        isRisky: false,
        riskScore: 0,
        reasons: [],
        severity: 'low'
      };
  
      // Check against known malicious domains
      if (maliciousDomains.includes(domain)) {
        riskLevel.isRisky = true;
        riskLevel.riskScore += 100;
        riskLevel.reasons.push('Known malicious domain');
        riskLevel.severity = 'critical';
      }
  
      // Check suspicious patterns
      for (let pattern of suspiciousPatterns) {
        if (pattern.test(domain)) {
          riskLevel.isRisky = true;
          riskLevel.riskScore += 80;
          riskLevel.reasons.push('Suspicious domain pattern detected');
          riskLevel.severity = 'high';
          break;
        }
      }
  
      // Check for suspicious TLDs
      for (let tld of suspiciousTLDs) {
        if (domain.endsWith(tld)) {
          riskLevel.riskScore += 30;
          riskLevel.reasons.push('Suspicious top-level domain');
          if (riskLevel.riskScore >= 50) {
            riskLevel.isRisky = true;
            riskLevel.severity = 'medium';
          }
        }
      }
  
      // Check for URL shorteners
      if (urlShorteners.some(shortener => domain.includes(shortener))) {
        riskLevel.riskScore += 20;
        riskLevel.reasons.push('URL shortener detected - verify destination');
      }
  
      // Check for suspicious URL characteristics
      if (this.hasSuspiciousCharacteristics(urlObj)) {
        riskLevel.riskScore += 40;
        riskLevel.reasons.push('Suspicious URL characteristics');
        if (riskLevel.riskScore >= 50) {
          riskLevel.isRisky = true;
          riskLevel.severity = 'medium';
        }
      }
  
      // Check for homograph attacks (similar looking domains)
      if (this.checkHomographAttack(domain)) {
        riskLevel.isRisky = true;
        riskLevel.riskScore += 70;
        riskLevel.reasons.push('Possible homograph attack detected');
        riskLevel.severity = 'high';
      }
  
      return riskLevel;
    }
  
    hasSuspiciousCharacteristics(urlObj) {
      const domain = urlObj.hostname;
      const path = urlObj.pathname;
      
      // Check for excessive subdomains
      const subdomains = domain.split('.').length - 2;
      if (subdomains > 3) return true;
      
      // Check for suspicious keywords in domain/path
      const suspiciousKeywords = [
        'secure', 'login', 'update', 'verify', 'account', 'banking',
        'paypal', 'amazon', 'microsoft', 'google', 'apple'
      ];
      
      const fullURL = (domain + path).toLowerCase();
      let keywordCount = 0;
      for (let keyword of suspiciousKeywords) {
        if (fullURL.includes(keyword)) keywordCount++;
      }
      
      return keywordCount >= 2;
    }
  
    checkHomographAttack(domain) {
      // Common targets for homograph attacks
      const legitimateDomains = [
        'paypal.com', 'amazon.com', 'google.com', 'microsoft.com',
        'apple.com', 'facebook.com', 'twitter.com', 'instagram.com'
      ];
      
      for (let legitDomain of legitimateDomains) {
        if (this.calculateSimilarity(domain, legitDomain) > 0.8 && domain !== legitDomain) {
          return true;
        }
      }
      return false;
    }
  
    calculateSimilarity(str1, str2) {
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;
      
      if (longer.length === 0) return 1.0;
      
      const editDistance = this.levenshteinDistance(longer, shorter);
      return (longer.length - editDistance) / longer.length;
    }
  
    levenshteinDistance(str1, str2) {
      const matrix = [];
      
      for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
      }
      
      for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
      }
      
      for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
          if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      
      return matrix[str2.length][str1.length];
    }
  
    async handleRiskyURL(url, tabId, riskLevel) {
      // Store the risk information
      await chrome.storage.local.set({
        [`risk_${tabId}`]: {
          url: url,
          riskLevel: riskLevel,
          timestamp: Date.now()
        }
      });
  
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/favicon.ico',
        title: 'Security Warning',
        message: `Potentially dangerous website detected!\nRisk: ${riskLevel.severity.toUpperCase()}`
      });
  
      // Inject warning into the page
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: this.showWarningOverlay,
        args: [riskLevel]
      });
    }
  
    showWarningOverlay(riskLevel) {
      // This function runs in the content script context
      if (document.getElementById('phishing-warning-overlay')) return;
  
      const overlay = document.createElement('div');
      overlay.id = 'phishing-warning-overlay';
      overlay.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          z-index: 999999;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: Arial, sans-serif;
        ">
          <div style="
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          ">
            <div style="color: #d32f2f; font-size: 48px; margin-bottom: 20px;">⚠️</div>
            <h2 style="color: #d32f2f; margin: 0 0 15px 0;">Security Warning</h2>
            <p style="margin: 15px 0; color: #333; line-height: 1.5;">
              This website has been flagged as potentially dangerous.<br>
              <strong>Risk Level: ${riskLevel.severity.toUpperCase()}</strong>
            </p>
            <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 5px;">
              <strong>Detected Issues:</strong><br>
              ${riskLevel.reasons.join('<br>')}
            </div>
            <div style="margin-top: 25px;">
              <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                      style="
                background: #d32f2f;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                margin-right: 10px;
                font-size: 16px;
              ">
                Close Warning
              </button>
              <button onclick="window.history.back()" 
                      style="
                background: #1976d2;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
              ">
                Go Back Safely
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
    }
  }
  
  // Initialize the phishing detector
  new PhishingDetector();
// content.js - Content Script for additional page analysis

class ContentAnalyzer {
    constructor() {
      this.initializeAnalysis();
    }
  
    initializeAnalysis() {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.analyzePageContent());
      } else {
        this.analyzePageContent();
      }
    }
  
    analyzePageContent() {
      try {
        const riskFactors = this.checkPageRiskFactors();
        
        if (riskFactors.isRisky) {
          this.reportRiskToBackground(riskFactors);
        }
        
        // Monitor for dynamic content changes
        this.monitorDynamicContent();
      } catch (error) {
        console.error('Content analysis error:', error);
      }
    }
  
    checkPageRiskFactors() {
      let riskFactors = {
        isRisky: false,
        riskScore: 0,
        reasons: [],
        severity: 'low'
      };
  
      // Check for suspicious forms
      const suspiciousForms = this.checkSuspiciousForms();
      if (suspiciousForms.length > 0) {
        riskFactors.riskScore += 60;
        riskFactors.reasons.push('Suspicious login/payment forms detected');
        riskFactors.isRisky = true;
        riskFactors.severity = 'high';
      }
  
      // Check for suspicious scripts
      if (this.checkSuspiciousScripts()) {
        riskFactors.riskScore += 40;
        riskFactors.reasons.push('Suspicious JavaScript detected');
        if (riskFactors.riskScore >= 50) {
          riskFactors.isRisky = true;
          riskFactors.severity = 'medium';
        }
      }
  
      // Check for suspicious redirects
      if (this.checkSuspiciousRedirects()) {
        riskFactors.riskScore += 50;
        riskFactors.reasons.push('Suspicious redirect behavior detected');
        riskFactors.isRisky = true;
        riskFactors.severity = 'medium';
      }
  
      // Check for fake SSL indicators
      if (this.checkFakeSSLIndicators()) {
        riskFactors.riskScore += 70;
        riskFactors.reasons.push('Fake security indicators detected');
        riskFactors.isRisky = true;
        riskFactors.severity = 'high';
      }
  
      // Check page title and content for phishing keywords
      if (this.checkPhishingKeywords()) {
        riskFactors.riskScore += 30;
        riskFactors.reasons.push('Phishing-related content detected');
        if (riskFactors.riskScore >= 50) {
          riskFactors.isRisky = true;
          riskFactors.severity = 'medium';
        }
      }
  
      return riskFactors;
    }
  
    checkSuspiciousForms() {
      const forms = document.querySelectorAll('form');
      const suspiciousForms = [];
  
      forms.forEach(form => {
        const inputs = form.querySelectorAll('input');
        let hasPasswordField = false;
        let hasEmailField = false;
        let hasCreditCardField = false;
  
        inputs.forEach(input => {
          const type = input.type.toLowerCase();
          const name = (input.name || '').toLowerCase();
          const placeholder = (input.placeholder || '').toLowerCase();
  
          if (type === 'password') hasPasswordField = true;
          if (type === 'email' || name.includes('email') || placeholder.includes('email')) {
            hasEmailField = true;
          }
          if (name.includes('card') || name.includes('credit') || placeholder.includes('card')) {
            hasCreditCardField = true;
          }
        });
  
        // Check form action
        const action = form.action || '';
        const isHTTPS = action.startsWith('https://') || location.protocol === 'https:';
        
        if ((hasPasswordField && hasEmailField) || hasCreditCardField) {
          if (!isHTTPS || this.isSuspiciousFormAction(action)) {
            suspiciousForms.push(form);
          }
        }
      });
  
      return suspiciousForms;
    }
  
    isSuspiciousFormAction(action) {
      const suspiciousPatterns = [
        /bit\.ly/,
        /tinyurl/,
        /\.tk\//,
        /\.ml\//,
        /\.ga\//,
        /\.cf\//,
        /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/  // IP addresses
      ];
  
      return suspiciousPatterns.some(pattern => pattern.test(action));
    }
  
    checkSuspiciousScripts() {
      const scripts = document.querySelectorAll('script');
      const suspiciousPatterns = [
        /eval\s*\(/,
        /document\.write\s*\(/,
        /innerHTML\s*=/,
        /fromCharCode/,
        /unescape\s*\(/,
        /window\.location\s*=/
      ];
  
      for (let script of scripts) {
        const content = script.textContent || script.innerHTML;
        if (suspiciousPatterns.some(pattern => pattern.test(content))) {
          return true;
        }
      }
  
      return false;
    }
  
    checkSuspiciousRedirects() {
      // Check for immediate redirects
      const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
      if (metaRefresh) {
        const content = metaRefresh.getAttribute('content') || '';
        if (content.includes('url=') && parseInt(content) < 3) {
          return true; // Immediate redirect
        }
      }
  
      // Check for JavaScript redirects
      const scriptContent = Array.from(document.querySelectorAll('script'))
        .map(script => script.textContent || script.innerHTML)
        .join(' ');
  
      const redirectPatterns = [
        /window\.location\s*=\s*["'][^"']*["']/,
        /location\.href\s*=\s*["'][^"']*["']/,
        /window\.open\s*\(/
      ];
  
      return redirectPatterns.some(pattern => pattern.test(scriptContent));
    }
  
    checkFakeSSLIndicators() {
      // Look for fake padlock icons or SSL text
      const allText = document.body.textContent || '';
      const fakeSSLPatterns = [
        /🔒\s*(secure|ssl|https)/i,
        /secure\s*connection/i,
        /ssl\s*protected/i,
        /256[-\s]*bit\s*encryption/i
      ];
  
      // Check if these appear but site is not actually HTTPS
      if (location.protocol !== 'https:') {
        return fakeSSLPatterns.some(pattern => pattern.test(allText));
      }
  
      return false;
    }
  
    checkPhishingKeywords() {
      const title = document.title.toLowerCase();
      const bodyText = (document.body.textContent || '').toLowerCase();
      const combinedText = title + ' ' + bodyText;
  
      const phishingKeywords = [
        'verify your account',
        'suspend',
        'click here immediately',
        'urgent action required',
        'confirm your identity',
        'update payment information',
        'account will be closed',
        'click here to verify',
        'congratulations you have won',
        'limited time offer',
        'act now',
        'verify account information'
      ];
  
      return phishingKeywords.some(keyword => combinedText.includes(keyword));
    }
  
    monitorDynamicContent() {
      // Monitor for dynamically added suspicious content
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Re-analyze if significant content is added
            setTimeout(() => this.analyzePageContent(), 1000);
          }
        });
      });
  
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  
    reportRiskToBackground(riskFactors) {
      chrome.runtime.sendMessage({
        type: 'CONTENT_RISK_DETECTED',
        data: {
          url: window.location.href,
          riskFactors: riskFactors,
          timestamp: Date.now()
        }
      });
    }
  }
  
  // Initialize content analyzer
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    new ContentAnalyzer();
  }
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'ANALYZE_PAGE') {
      const analyzer = new ContentAnalyzer();
      const results = analyzer.checkPageRiskFactors();
      sendResponse(results);
    }
  });
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
import asyncio
import aiohttp
import re
import hashlib
import logging
from datetime import datetime
import urllib.parse
import ipaddress
import socket
import ssl
import requests
from urllib.parse import urlparse, parse_qs
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Malicious URL Detector API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","https://link-guard-rust.vercel.app", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class URLRequest(BaseModel):
    url: str

class ThreatResult(BaseModel):
    is_malicious: bool
    risk_level: str
    confidence_score: float
    threats_detected: List[str]
    recommendations: List[str]
    analysis_details: Optional[dict] = None

# Known malicious patterns and indicators
SUSPICIOUS_DOMAINS = [
    'bit.ly', 'tinyurl.com', 'goo.gl', 't.co',  # URL shorteners (not malicious but suspicious)
    'secure-bank-update.com', 'paypal-security.net',  # Common phishing patterns
]

MALICIOUS_KEYWORDS = [
    'phishing', 'scam', 'hack', 'virus', 'malware', 'trojan',
    'secure-login', 'verify-account', 'urgent-update', 'suspended-account',
    'click-here-now', 'limited-time', 'act-now', 'verify-immediately'
]

SUSPICIOUS_TLD = ['.tk', '.ml', '.ga', '.cf', '.cc', '.pw', '.top']

class URLAnalyzer:
    def __init__(self):
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10))
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def extract_domain_features(self, url: str) -> dict:
        """Extract domain-based features for analysis"""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            
            features = {
                'domain_length': len(domain),
                'subdomain_count': len(domain.split('.')) - 2,
                'has_ip': self._is_ip_address(domain),
                'suspicious_tld': any(domain.endswith(tld) for tld in SUSPICIOUS_TLD),
                'domain_entropy': self._calculate_entropy(domain),
                'suspicious_keywords': sum(1 for keyword in MALICIOUS_KEYWORDS if keyword in url.lower()),
                'url_length': len(url),
                'has_shortener': any(shortener in domain for shortener in SUSPICIOUS_DOMAINS),
                'https_used': parsed.scheme == 'https',
                'query_params_count': len(parse_qs(parsed.query)),
                'path_depth': len([p for p in parsed.path.split('/') if p]),
            }
            
            return features
        except Exception as e:
            logger.error(f"Error extracting domain features: {e}")
            return {}

    def _is_ip_address(self, domain: str) -> bool:
        """Check if domain is an IP address"""
        try:
            ipaddress.ip_address(domain)
            return True
        except ValueError:
            return False

    def _calculate_entropy(self, text: str) -> float:
        """Calculate Shannon entropy of text"""
        if not text:
            return 0
        
        entropy = 0
        for char in set(text):
            prob = text.count(char) / len(text)
            entropy -= prob * (prob.bit_length() - 1) if prob > 0 else 0
        
        return entropy

    async def check_ssl_certificate(self, domain: str) -> dict:
        """Check SSL certificate validity"""
        try:
            context = ssl.create_default_context()
            with socket.create_connection((domain, 443), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=domain) as ssock:
                    cert = ssock.getpeercert()
                    return {
                        'valid_ssl': True,
                        'cert_issuer': dict(x[0] for x in cert['issuer']).get('organizationName', 'Unknown'),
                        'cert_subject': dict(x[0] for x in cert['subject']).get('commonName', 'Unknown')
                    }
        except Exception as e:
            logger.warning(f"SSL check failed for {domain}: {e}")
            return {'valid_ssl': False, 'ssl_error': str(e)}

    async def check_url_reputation(self, url: str) -> dict:
        """Check URL against known reputation databases"""
        try:
            # Simulate reputation check (in production, integrate with VirusTotal, etc.)
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            
            reputation_score = 100  # Start with good reputation
            
            # Check against known bad domains
            if any(bad_domain in domain for bad_domain in SUSPICIOUS_DOMAINS):
                reputation_score -= 30
            
            # Check for suspicious patterns
            if any(keyword in url.lower() for keyword in MALICIOUS_KEYWORDS):
                reputation_score -= 40
            
            # Check TLD reputation
            if any(domain.endswith(tld) for tld in SUSPICIOUS_TLD):
                reputation_score -= 20
            
            return {
                'reputation_score': max(0, reputation_score),
                'is_known_bad': reputation_score < 50
            }
            
        except Exception as e:
            logger.error(f"Reputation check failed: {e}")
            return {'reputation_score': 50, 'is_known_bad': False}

    async def analyze_content(self, url: str) -> dict:
        """Analyze webpage content for malicious indicators"""
        try:
            if not self.session:
                return {'content_analysis': 'Session not available'}
            
            async with self.session.get(url, allow_redirects=True) as response:
                if response.status != 200:
                    return {'content_analysis': f'HTTP {response.status}'}
                
                content = await response.text()
                
                # Look for suspicious patterns in content
                suspicious_patterns = [
                    r'urgent.*update.*account',
                    r'verify.*identity.*immediately',
                    r'suspended.*account',
                    r'click.*here.*now',
                    r'limited.*time.*offer',
                    r'congratulations.*winner',
                    r'download.*codec.*player'
                ]
                
                pattern_matches = []
                for pattern in suspicious_patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        pattern_matches.append(pattern)
                
                return {
                    'content_length': len(content),
                    'suspicious_patterns': len(pattern_matches),
                    'pattern_details': pattern_matches[:3],  # Limit to first 3
                    'has_forms': '<form' in content.lower(),
                    'has_javascript': '<script' in content.lower(),
                    'external_links': len(re.findall(r'href=["\']https?://', content))
                }
                
        except Exception as e:
            logger.error(f"Content analysis failed: {e}")
            return {'content_analysis': f'Error: {str(e)}'}

    async def comprehensive_analysis(self, url: str) -> ThreatResult:
        """Perform comprehensive URL analysis"""
        try:
            # Extract domain features
            domain_features = self.extract_domain_features(url)
            
            # Check reputation
            reputation = await self.check_url_reputation(url)
            
            # SSL certificate check
            parsed = urlparse(url)
            ssl_info = {}
            if parsed.scheme == 'https':
                ssl_info = await self.check_ssl_certificate(parsed.netloc)
            
            # Content analysis
            content_info = await self.analyze_content(url)
            
            # Calculate risk score
            risk_score = self._calculate_risk_score(domain_features, reputation, ssl_info, content_info)
            
            # Determine risk level
            if risk_score >= 0.7:
                risk_level = "high"
                is_malicious = True
            elif risk_score >= 0.4:
                risk_level = "medium"
                is_malicious = False
            else:
                risk_level = "low"
                is_malicious = False
            
            # Generate threats and recommendations
            threats = self._identify_threats(domain_features, reputation, ssl_info, content_info)
            recommendations = self._generate_recommendations(risk_level, threats)
            
            return ThreatResult(
                is_malicious=is_malicious,
                risk_level=risk_level,
                confidence_score=risk_score,
                threats_detected=threats,
                recommendations=recommendations,
                analysis_details={
                    'domain_features': domain_features,
                    'reputation': reputation,
                    'ssl_info': ssl_info,
                    'content_info': content_info
                }
            )
            
        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            return ThreatResult(
                is_malicious=False,
                risk_level="unknown",
                confidence_score=0.0,
                threats_detected=[f"Analysis error: {str(e)}"],
                recommendations=["Unable to analyze URL due to technical error"],
                analysis_details={"error": str(e)}
            )

    def _calculate_risk_score(self, domain_features: dict, reputation: dict, ssl_info: dict, content_info: dict) -> float:
        """Calculate overall risk score"""
        score = 0.0
        
        # Domain-based scoring
        if domain_features.get('has_ip', False):
            score += 0.3
        if domain_features.get('suspicious_tld', False):
            score += 0.2
        if domain_features.get('suspicious_keywords', 0) > 0:
            score += min(0.3, domain_features['suspicious_keywords'] * 0.1)
        if domain_features.get('domain_entropy', 0) > 4:
            score += 0.1
        if domain_features.get('url_length', 0) > 100:
            score += 0.1
        if domain_features.get('has_shortener', False):
            score += 0.15
        
        # Reputation scoring
        if reputation.get('is_known_bad', False):
            score += 0.4
        elif reputation.get('reputation_score', 100) < 70:
            score += 0.2
        
        # SSL scoring
        if ssl_info.get('valid_ssl', True) == False:
            score += 0.2
        
        # Content scoring
        if isinstance(content_info, dict):
            if content_info.get('suspicious_patterns', 0) > 0:
                score += min(0.3, content_info['suspicious_patterns'] * 0.1)
        
        return min(1.0, score)

    def _identify_threats(self, domain_features: dict, reputation: dict, ssl_info: dict, content_info: dict) -> List[str]:
        """Identify specific threats"""
        threats = []
        
        if domain_features.get('has_ip', False):
            threats.append("Direct IP address usage")
        if domain_features.get('suspicious_tld', False):
            threats.append("Suspicious top-level domain")
        if domain_features.get('suspicious_keywords', 0) > 0:
            threats.append("Suspicious keywords detected")
        if domain_features.get('has_shortener', False):
            threats.append("URL shortening service")
        if reputation.get('is_known_bad', False):
            threats.append("Known malicious domain")
        if ssl_info.get('valid_ssl', True) == False:
            threats.append("Invalid SSL certificate")
        if isinstance(content_info, dict) and content_info.get('suspicious_patterns', 0) > 0:
            threats.append("Suspicious content patterns")
        
        return threats

    def _generate_recommendations(self, risk_level: str, threats: List[str]) -> List[str]:
        """Generate security recommendations"""
        recommendations = []
        
        if risk_level == "high":
            recommendations.extend([
                "Do not visit this URL",
                "Block this domain in your security software",
                "Report this URL to security authorities"
            ])
        elif risk_level == "medium":
            recommendations.extend([
                "Exercise caution when visiting this URL",
                "Verify the URL source before proceeding",
                "Use updated antivirus software"
            ])
        else:
            recommendations.extend([
                "URL appears to be safe",
                "Continue with normal browsing precautions"
            ])
        
        # Specific recommendations based on threats
        if "Invalid SSL certificate" in threats:
            recommendations.append("Avoid entering sensitive information")
        if "URL shortening service" in threats:
            recommendations.append("Expand shortened URLs before clicking")
        if "Suspicious keywords detected" in threats:
            recommendations.append("Be wary of phishing attempts")
        
        return recommendations

# API Endpoints
@app.get("/")
async def root():
    return {"message": "Malicious URL Detector API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/check-url", response_model=ThreatResult)
async def check_url(request: URLRequest):
    """Analyze URL for malicious content"""
    try:
        # Validate URL format
        if not request.url.strip():
            raise HTTPException(status_code=400, detail="URL cannot be empty")
        
        # Add protocol if missing
        url = request.url.strip()
        if not url.startswith(('http://', 'https://')):
            url = 'http://' + url
        
        # Perform analysis
        async with URLAnalyzer() as analyzer:
            result = await analyzer.comprehensive_analysis(url)
            
        logger.info(f"Analyzed URL: {url}, Risk: {result.risk_level}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing URL {request.url}: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/stats")
async def get_stats():
    """Get API statistics"""
    return {
        "total_checks": "N/A",  # Implement with database
        "malicious_detected": "N/A",
        "api_version": "1.0.0",
        "uptime": "N/A"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, debug=True)

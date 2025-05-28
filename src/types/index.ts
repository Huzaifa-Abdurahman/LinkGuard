export interface ThreatResult {
    is_malicious: boolean;
    risk_level: string;
    confidence_score?: number;
    threats_detected?: string[];
    recommendations?: string[];
  }
  
  export interface HistoryEntry {
    url: string;
    result: ThreatResult;
    timestamp: string;
  }
  
  export type RiskLevel = 'high' | 'medium' | 'low';
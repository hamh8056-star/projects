import clientPromise from './mongodb';

// Types pour la logique floue
export interface FuzzyConfig {
  temperature: FuzzyParam;
  ph: FuzzyParam;
  oxygen: FuzzyParam;
  salinity: FuzzyParam;
  turbidity: FuzzyParam;
}

export interface FuzzyParam {
  min: number;
  max: number;
  warning_low: number;
  warning_high: number;
  critical_low: number;
  critical_high: number;
}

// Configuration par défaut
export const defaultFuzzyConfig: FuzzyConfig = {
  temperature: {
    min: 18,
    max: 30,
    warning_low: 20,
    warning_high: 28,
    critical_low: 18,
    critical_high: 30
  },
  ph: {
    min: 6.5,
    max: 8.5,
    warning_low: 7.0,
    warning_high: 8.0,
    critical_low: 6.5,
    critical_high: 8.5
  },
  oxygen: {
    min: 4,
    max: 12,
    warning_low: 5,
    warning_high: 10,
    critical_low: 4,
    critical_high: 12
  },
  salinity: {
    min: 25,
    max: 35,
    warning_low: 28,
    warning_high: 32,
    critical_low: 25,
    critical_high: 35
  },
  turbidity: {
    min: 0,
    max: 50,
    warning_low: 5,
    warning_high: 30,
    critical_low: 0,
    critical_high: 50
  }
};

// Fonction pour récupérer la configuration depuis la base de données
export async function getFuzzyConfig(): Promise<FuzzyConfig> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const fuzzyConfig = await db.collection('fuzzy_config').findOne({});
    return fuzzyConfig?.config || defaultFuzzyConfig;
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration floue:', error);
    return defaultFuzzyConfig;
  }
}

// Fonction de logique floue pour évaluer un paramètre
export function evaluateFuzzyParameter(value: number, config: FuzzyParam): {
  status: 'normal' | 'warning' | 'critical';
  severity: number; // 0-1, où 1 est le plus critique
  message: string;
} {
  // Vérification des valeurs critiques
  if (value <= config.critical_low || value >= config.critical_high) {
    const severity = value <= config.critical_low 
      ? Math.max(0, (config.critical_low - value) / (config.critical_low - config.min))
      : Math.max(0, (value - config.critical_high) / (config.max - config.critical_high));
    
    return {
      status: 'critical',
      severity: Math.min(1, severity),
      message: value <= config.critical_low 
        ? `Valeur critique basse: ${value}`
        : `Valeur critique haute: ${value}`
    };
  }

  // Vérification des avertissements
  if (value <= config.warning_low || value >= config.warning_high) {
    const severity = value <= config.warning_low
      ? Math.max(0, (config.warning_low - value) / (config.warning_low - config.critical_low))
      : Math.max(0, (value - config.warning_high) / (config.critical_high - config.warning_high));
    
    return {
      status: 'warning',
      severity: Math.min(1, severity),
      message: value <= config.warning_low
        ? `Valeur en avertissement bas: ${value}`
        : `Valeur en avertissement haut: ${value}`
    };
  }

  // Valeur normale
  return {
    status: 'normal',
    severity: 0,
    message: `Valeur normale: ${value}`
  };
}

// Fonction pour analyser une mesure complète et générer des alertes
export async function analyzeMeasurement(measurement: any): Promise<Array<{
  type: 'warning' | 'error' | 'info';
  message: string;
  parameter: string;
  value: number;
  severity: number;
}>> {
  const config = await getFuzzyConfig();
  const alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    parameter: string;
    value: number;
    severity: number;
  }> = [];

  // Analyser chaque paramètre
  const parameters = [
    { key: 'temperature', name: 'Température' },
    { key: 'ph', name: 'pH' },
    { key: 'oxygen', name: 'Oxygène' },
    { key: 'salinity', name: 'Salinité' },
    { key: 'turbidity', name: 'Turbidité' }
  ];

  for (const param of parameters) {
    const value = measurement[param.key];
    if (value !== undefined && value !== null) {
      const evaluation = evaluateFuzzyParameter(parseFloat(value), config[param.key as keyof FuzzyConfig]);
      
      if (evaluation.status !== 'normal') {
        alerts.push({
          type: evaluation.status === 'critical' ? 'error' : 'warning',
          message: `${param.name}: ${evaluation.message}`,
          parameter: param.key,
          value: parseFloat(value),
          severity: evaluation.severity
        });
      }
    }
  }

  return alerts;
}

// Fonction pour obtenir le statut global d'un bassin basé sur toutes ses mesures
export async function getBassinFuzzyStatus(bassinId: string, measurements: any[]): Promise<{
  status: 'normal' | 'warning' | 'critical';
  alerts: any[];
  score: number; // Score global de 0-100
}> {
  const bassinMeasurements = measurements.filter(m => 
    (m.bassinId || m.bassin) === bassinId
  );

  if (bassinMeasurements.length === 0) {
    return {
      status: 'normal',
      alerts: [],
      score: 100
    };
  }

  const latestMeasurement = bassinMeasurements.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  const alerts = await analyzeMeasurement(latestMeasurement);
  
  // Calculer le score global
  const criticalAlerts = alerts.filter(a => a.type === 'error').length;
  const warningAlerts = alerts.filter(a => a.type === 'warning').length;
  
  let score = 100;
  score -= criticalAlerts * 30; // -30 points par alerte critique
  score -= warningAlerts * 10;  // -10 points par alerte d'avertissement
  
  score = Math.max(0, score);

  // Déterminer le statut global
  let status: 'normal' | 'warning' | 'critical' = 'normal';
  if (criticalAlerts > 0) {
    status = 'critical';
  } else if (warningAlerts > 0) {
    status = 'warning';
  }

  return {
    status,
    alerts,
    score
  };
} 
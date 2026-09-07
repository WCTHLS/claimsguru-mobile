export interface MicroServiceHealth {
  name: string;
  port: string;
  healthy: boolean;
  note: string;
}

export const MICROSERVICES: MicroServiceHealth[] = [
  { name: 'ingress', port: '8000', healthy: true, note: 'healthy' },
  { name: 'ocr', port: '8002', healthy: true, note: 'healthy' },
  { name: 'parser', port: '8003', healthy: true, note: 'healthy' },
  { name: 'coding', port: '8004', healthy: true, note: 'healthy' },
  { name: 'predictor', port: '8005', healthy: true, note: 'synthetic models' },
  { name: 'fraud', port: '—', healthy: true, note: 'healthy' },
  { name: 'validator', port: '8006', healthy: true, note: 'healthy' },
  { name: 'workflow', port: '8007', healthy: true, note: 'healthy' },
  { name: 'submission', port: '—', healthy: true, note: 'healthy' },
  { name: 'chat', port: '—', healthy: true, note: 'healthy' },
  { name: 'search', port: '—', healthy: true, note: 'healthy' },
];

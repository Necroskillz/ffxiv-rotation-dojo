import { type Metric, onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

const reportWebVitals = (onPerfEntry?: (metric: Metric) => void) => {
  if (onPerfEntry) {
    onCLS(onPerfEntry);
    onINP(onPerfEntry);
    onFCP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  }
};

export default reportWebVitals;

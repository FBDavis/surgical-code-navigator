import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx loading...');
console.log('DOM root element:', document.getElementById("root"));

try {
  console.log('Creating React root...');
  createRoot(document.getElementById("root")!).render(<App />);
  console.log('React app rendered successfully');
} catch (error) {
  console.error('Error rendering React app:', error);
}

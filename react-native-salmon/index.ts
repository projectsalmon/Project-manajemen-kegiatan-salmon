import { registerRootComponent } from 'expo';

// Global Crash Shield: Mencegah unhandled rejection atau background async exception mematikan aplikasi ke home OS
if (typeof (global as any).ErrorUtils !== 'undefined') {
  const originalErrorHandler = (global as any).ErrorUtils.getGlobalHandler();
  (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    console.warn('Global error caught (shielded from native force close):', error);
    // Log error cleanly instead of crashing the Android process
    if (!isFatal && originalErrorHandler) {
      try {
        originalErrorHandler(error, isFatal);
      } catch {
        // Suppress secondary crash
      }
    }
  });
}

// Inisialisasi awal notifikasi sistem & background handler sebelum mounting komponen
import './src/services/notificationService';
import App from './App';

registerRootComponent(App);

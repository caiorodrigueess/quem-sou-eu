import { io } from 'socket.io-client';

// Usa a variável de ambiente VITE_BACKEND_URL em produção, ou localhost em desenvolvimento
const URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? undefined : 'http://localhost:3001');

export const socket = io(URL, {
  autoConnect: true
});

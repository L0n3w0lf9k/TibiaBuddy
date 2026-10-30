import { createContext, useContext } from 'react';
import type { AppContextValue } from './types';
export const AppContext = createContext<AppContextValue | null>(null);
export function useApp() { const app=useContext(AppContext); if(!app) throw new Error('App context missing'); return app; }

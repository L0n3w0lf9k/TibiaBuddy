import { Moon } from 'lucide-react';
import { useApp } from '../context';
import { Field } from '../shared';
export default function AppearanceSettings() {
  const { state, update } = useApp();
  return <section className="card padded appearance-card">
    <div className="section-heading"><div><h2>Appearance</h2><p>Choose a comfortable view for daytime planning or late-night hunts.</p></div><Moon size={22} /></div>
    <Field label="Color theme"><select value={String(state.preferences.theme ?? 'system')} onChange={e => { const theme = e.target.value; void update(d => { d.preferences.theme = theme; }).catch(() => {}); }}>
      <option value="system">Use device setting</option><option value="light">Light</option><option value="dark">Dark</option>
    </select></Field>
    <p className="helper">The moon or sun button in the header switches themes quickly. Your choice is saved on this device and included in backups.</p>
  </section>;
}

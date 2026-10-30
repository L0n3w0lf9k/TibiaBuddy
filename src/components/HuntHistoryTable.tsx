import { Flag } from 'lucide-react';
import { huntHistory } from '../domain/huntHistory';
import type { HuntSession } from '../types';
import { number } from '../shared';
import './hunt-history.css';

function elapsed(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  const whole = Math.max(0, Math.floor(seconds));
  return [Math.floor(whole / 3600), Math.floor(whole % 3600 / 60), whole % 60].map(n => String(n).padStart(2, '0')).join(':');
}

function RecordedTime({ at }: { at: number }) {
  const date = new Date(at);
  if (!Number.isFinite(date.getTime())) return <span className="muted">Invalid date</span>;
  return <time dateTime={date.toISOString()} title={date.toLocaleString()}>{date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time>;
}

export default function HuntHistoryTable({ session }: { session: HuntSession }) {
  const rows = huntHistory(session);
  return <div className="hunt-history">
    <div className="table-wrap"><table className="data-table hunt-checkpoints">
      <thead><tr><th>Record</th><th>Hunt time</th><th>Recorded at</th><th className="numeric">Total XP</th><th className="numeric">Interval gain</th><th>Interval time</th><th className="numeric">Interval XP / hour</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.id}>
        <td><strong>{row.label}</strong></td>
        <td className="hunt-elapsed">{elapsed(row.activeSeconds)}</td>
        <td><RecordedTime at={row.at} /></td>
        <td className="numeric">{number(row.xp)}</td>
        <td className={'numeric ' + (row.gained !== null && row.gained < 0 ? 'negative' : row.gained !== null && row.gained > 0 ? 'positive' : '')}>{row.gained === null ? '—' : `${row.gained > 0 ? '+' : ''}${number(row.gained)}`}</td>
        <td className="hunt-elapsed">{row.intervalSeconds === null ? '—' : elapsed(row.intervalSeconds)}</td>
        <td className={'numeric ' + (row.rate !== null && row.rate < 0 ? 'negative' : '')}>{row.rate === null ? <span title={row.kind === 'start' ? 'Starting baseline' : 'No active hunting time between these records'}>—</span> : number(row.rate)}</td>
      </tr>)}</tbody>
    </table></div>
    {session.checkpoints.length === 0 && session.status !== 'completed' && <p className="hunt-checkpoint-hint"><Flag size={16} />Add an XP checkpoint above to record your progress and pace for each part of this hunt.</p>}
    <p className="table-footnote">Hunt time and interval time exclude pauses. Each interval’s XP/hour compares that record with the one immediately before it; the first checkpoint uses your starting XP. The live timer does not change past interval rates.</p>
  </div>;
}

export const zones = {
  'us-east': {label: 'US East (Virginia)', tz: 'America/New_York'},
  'us-central': {label: 'US Central (Illinois / Texas)', tz: 'America/Chicago'},
  'us-west': {label: 'US West (Oregon / N. California)', tz: 'America/Los_Angeles'},
  other: {label: 'Other zone', tz: null}
};
export function day(date, tz) {
  const p = new Intl.DateTimeFormat('en-US', {timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const get = t => p.find(x => x.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function validFixture(f) {
  return f && typeof f.id === 'string' && zones[f.zone]?.tz && /^\d{4}-\d{2}-\d{2}$/.test(f.date) && ['verified','unverified'].includes(f.status) && typeof f.source === 'string' && /^https:\/\//.test(f.source) && Number.isFinite(Date.parse(f.checkedAt)) && (f.start == null && f.end == null || [f.start,f.end].every(x => typeof x === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/.test(x) && Number.isFinite(Date.parse(x))) && Date.parse(f.end)>Date.parse(f.start) && day(new Date(f.start),zones[f.zone].tz)===f.date);
}
export function evaluate(data, zone, now = new Date()) {
  const tz = zones[zone]?.tz;
  if (!tz) return {state:'unknown', fixtures:[]};
  const today = day(now,tz);
  if (!data || data.schemaVersion!==1 || !Array.isArray(data.fixtures) || !Array.isArray(data.coverage) || !Number.isFinite(Date.parse(data.expiresAt)) || now>=new Date(data.expiresAt)) return {state:'stale',fixtures:[]};
  const fixtures=data.fixtures.filter(validFixture).filter(f=>f.zone===zone && f.date>=today).sort((a,b)=>a.date.localeCompare(b.date)||String(a.start||'').localeCompare(String(b.start||'')));
  const tonight=fixtures.filter(f=>f.date===today);
  const confirmed=tonight.filter(f=>f.status==='verified' && f.start);
  const coverage=data.coverage.some(c=>c.zone===zone && c.date===today && c.status==='verified' && /^https:\/\//.test(c.source||'') && Number.isFinite(Date.parse(c.checkedAt)));
  return {state:confirmed.length?'confirmed':tonight.length?'unknown':coverage?'none':'unknown',fixtures,tonight,confirmed};
}

import {zones, evaluate} from './engine.mjs';
const $=id=>document.getElementById(id), select=$('zone');
try { const saved=localStorage.getItem('premier-zone'); if (zones[saved]) select.value=saved; } catch {}
let data=null, failed=false;
const dateLabel=(date,tz)=>new Intl.DateTimeFormat('en-US',{timeZone:tz,weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(date);
const time=(date,tz)=>new Intl.DateTimeFormat('en-US',{timeZone:tz,hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(date));
function render(){
 const now=new Date(), tz=zones[select.value].tz, result=evaluate(data,select.value,now);
 $('date').textContent=dateLabel(now,tz||Intl.DateTimeFormat().resolvedOptions().timeZone);
 $('timezone').textContent=tz?`${tz} · daylight saving adjusted automatically`:'Choose a supported zone for local queue times';
 const age=data?.reviewedOn; $('freshness').textContent=age?`Sources reviewed ${age}${result.state==='stale'?' · snapshot expired':''}`:'Schedule feed unavailable';
 $('feed-status').textContent=failed?'The schedule file could not be loaded. No cached match times are being presented.':'Tracker.gg snapshot · Stage V26A6 · reviewed October 18, 2026. All imported windows are tentative, not Riot-verified. This is not a live feed. Maps are TBD. Saturday windows may vary by division; confirm in the client.';
 $('answer').textContent=result.state==='confirmed'?'Yes — there’s a queue tonight.':result.state==='none'?'No scheduled queue tonight.':'Schedule not confirmed.';
 $('detail').textContent=result.state==='confirmed'?'A verified queue window is listed below. Check your team’s eligibility and remaining matches in the client.':result.state==='none'?'Verified schedule coverage shows no queue for this zone today.':result.state==='stale'?'The schedule snapshot is unavailable or expired. Check the Premier Hub in VALORANT before making plans.':'We couldn’t verify tonight’s queue window. Check the Premier Hub in VALORANT before making plans.';
 $('window').replaceChildren(document.createTextNode('Queue window ')); const strong=document.createElement('strong'); strong.textContent=result.confirmed?.length?result.confirmed.map(f=>`${time(f.start,tz)} – ${time(f.end,tz)}${now>=new Date(f.end)?' · closed':now>=new Date(f.start)?' · open now':''}`).join(' / '):'Not available'; $('window').append(strong);
 const next=result.fixtures.find(f=>f.kind!=='Scrim' && f.start && new Date(f.end)>now);
 const tentative=result.tonight?.filter(f=>f.kind!=='Scrim' && f.status==='unverified' && f.start)||[];
 if(tentative.length && result.state!=='confirmed'){ $('answer').textContent='Tentatively, yes — check in game.'; $('detail').textContent='Tracker.gg lists a queue tonight. Times are tentative; confirm your division’s window in the Premier Hub.'; strong.textContent=tentative.map(f=>`${time(f.start,tz)} – ${time(f.end,tz)} · tentative`).join(' / '); }
 $('next').textContent=next?dateLabel(new Date(next.start),tz):'Next match unconfirmed';
 $('next-detail').textContent=next?`${next.kind} · ${time(next.start,tz)} – ${time(next.end,tz)}${next.status==='unverified'?' · tentative':''}`:'Dates and times will appear when a reliable schedule is available.';
 document.querySelector('.outline').textContent=next?(next.status==='verified'?'VERIFIED QUEUE WINDOW':'TENTATIVE · TRACKER.GG'):'AWAITING VERIFIED DATA';
 if(result.fixtures.length){ $('matches').replaceChildren(); for(const f of result.fixtures){const row=document.createElement('div');row.className='fixture';const text=document.createElement('span');text.textContent=`${f.date} · ${f.kind||'Premier'} · ${f.start?`${time(f.start,tz)} – ${time(f.end,tz)}`:'Time unconfirmed'}`;const link=document.createElement('a'); link.href=f.source;link.textContent=`${f.status==='verified'?'Verified':'Tentative'} · Tracker.gg ↗`; row.append(text,link);$('matches').append(row);} }
 else $('matches').innerHTML='<div class="empty"><span class="calendar" aria-hidden="true">▦</span><h3>No schedule entries available</h3><p>Missing schedule data doesn’t mean there’s no game.<br>Open VALORANT → Premier → Hub for the exact schedule.</p></div>';
}
select.addEventListener('change',()=>{try{localStorage.setItem('premier-zone',select.value)}catch{}render()});
async function refresh(){try{const response=await fetch('./schedule.json',{cache:'no-store',signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error('Unavailable');data=await response.json();failed=false}catch{data=null;failed=true}render()}
render();refresh();setInterval(render,30000);setInterval(refresh,300000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});

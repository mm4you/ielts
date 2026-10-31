'use client';
export function BeeMascot({mood='idle'}:{mood?:'idle'|'listening'|'correct'|'wrong'}){
 return <svg className={'bee-mascot bee-'+mood} viewBox="0 0 180 160" role="img" aria-label={mood==='correct'?'Ong vui vì bạn trả lời đúng':mood==='wrong'?'Ong động viên bạn thử lại':'Ong chính tả đồng hành cùng bạn'}>
 <ellipse cx="90" cy="143" rx="40" ry="7" fill="currentColor" opacity=".12"/>
 <g className="bee-float"><g className="bee-wings" fill="#eaf8ff" stroke="#89c6d7" strokeWidth="2"><ellipse cx="65" cy="64" rx="21" ry="31" transform="rotate(-35 65 64)"/><ellipse cx="115" cy="64" rx="21" ry="31" transform="rotate(35 115 64)"/></g>
 <path d="m128 111 17 8-19 5" fill="#443524"/><ellipse cx="91" cy="100" rx="42" ry="34" fill="#f8c94e" stroke="#443524" strokeWidth="3"/>
 <path d="M94 68c-8 16-8 48 0 65m19-60c-7 15-7 36 0 53" stroke="#443524" strokeWidth="12" fill="none"/>
 <path d="m73 77 25 40" stroke="#9b693a" strokeWidth="5"/><path d="M87 106h25v25H87z" fill="#b97746" stroke="#443524" strokeWidth="2"/><path d="m88 107 11 10 12-10" stroke="#f5d8a4" fill="none" strokeWidth="2"/><circle cx="60" cy="85" r="29" fill="#f8cf62" stroke="#443524" strokeWidth="3"/>
 <path d="m49 59-8-17m27 16 7-18" stroke="#443524" strokeWidth="3" strokeLinecap="round"/><circle cx="41" cy="40" r="4" fill="#443524"/><circle cx="76" cy="39" r="4" fill="#443524"/>
 <ellipse cx="49" cy="83" rx="4" ry="6" fill="#443524"/><ellipse cx="68" cy="83" rx="4" ry="6" fill="#443524"/>
 <circle cx="42" cy="93" r="5" fill="#ee9878" opacity=".8"/><circle cx="75" cy="93" r="5" fill="#ee9878" opacity=".8"/>
 <path d="M32 82a28 28 0 0 1 55 0" stroke="#4e7183" strokeWidth="5" fill="none"/><rect x="28" y="80" width="9" height="17" rx="4" fill="#4e7183"/><rect x="81" y="80" width="9" height="17" rx="4" fill="#4e7183"/><path d={mood==='wrong'?'M53 102q7-5 13 0':'M52 97q8 10 16 0'} fill="none" stroke="#443524" strokeWidth="3" strokeLinecap="round"/>
 <path d="m76 130-4 10m28-8 4 9" stroke="#443524" strokeWidth="3" strokeLinecap="round"/>
 </g></svg>;
}
export function RecallLandscape({bee=false}:{bee?:boolean}){
 return <svg className="recall-landscape" viewBox="0 0 1200 180" preserveAspectRatio="none" aria-hidden="true">{bee?<><path d="M0 100Q200 10 400 100T800 100T1200 80V180H0Z" fill="currentColor" opacity=".08"/><path d="M0 140Q300 90 550 140T1200 125V180H0Z" fill="currentColor" opacity=".12"/>{[90,210,350,820,960,1100].map((x,i)=><g key={x} transform={'translate('+x+' '+(120+i%2*15)+')'}><path d="M0 0v25" stroke="#72a879" strokeWidth="3"/><circle cy="-4" r="10" fill={i%2?'#e7a5b1':'#eac45e'}/><circle cy="-4" r="4" fill="#faf1cf"/></g>)}</>:<><path d="M0 110Q160 90 300 110T600 110T900 110T1200 110V180H0Z" fill="currentColor" opacity=".08"/><path d="M0 140Q150 120 300 140T600 140T900 140T1200 140V180H0Z" fill="currentColor" opacity=".14"/><g transform="translate(580 65)" stroke="currentColor" strokeWidth="2"><path d="m-44 34 44 30 44-30Z" fill="var(--paper)"/><path d="M0 34V-16L-30 34Z" fill="var(--paper)"/><path d="M0-16 28 34H0Z" fill="var(--brand-soft)"/></g></>}</svg>;
}

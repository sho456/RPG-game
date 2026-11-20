/* ===== 技・術のアイコン（SKICON：白いシルエットの絵柄 27 種＋技 → 絵柄の対応。js/rs/ui.js の skIcon が使う） ===== */
(function(){
/* viewBox 32×32・fill 白。穴は evenodd の切り抜き。線の絵柄は stroke 白・丸端 */
const S=(b)=>`<svg viewBox="0 0 32 32" aria-hidden="true">${b}</svg>`;
const L=(d,w)=>`<path d="${d}" fill="none" stroke="#fff" stroke-width="${w||3}" stroke-linecap="round" stroke-linejoin="round"/>`;
const P=(d)=>`<path d="${d}" fill="#fff" fill-rule="evenodd"/>`;
const SHIELD='M16 29C8 25.5 5.5 20 5.5 11.5L16 7l10.5 4.5C26.5 20 24 25.5 16 29Z ';
const ICONS={
 slash:S(P('M25 3l4 4L14 22l-4-4Z')+P('M7 16l2-2 9 9-2 2Z')+P('M10 21l2 2-7 7-3-1-1-3Z')+L('M3 10Q9 5 17 6',2.5)),
 multi:S(L('M5 27L15 5',3.5)+L('M12 29L22 7',3.5)+L('M19 29L29 9',3.5)+L('M4 12Q6 8 9 7',2)),
 sweep:S(P('M2 23Q16 -1 30 23Q16 12 2 23Z')+L('M7 28Q16 22 25 28',2.5)),
 fist:S(P('M7 11a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v9a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6Z')+'<path d="M12.5 9v8M16 9v8M19.5 9v8" stroke="rgba(0,0,0,.4)" stroke-width="1.2"/>'+L('M26 8l3-3M27 14h3M26 20l3 3',2.2)),
 smash:S(P('M5 3h16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z')+P('M11 14h4v10h-4Z')+L('M2 29l6-4 4 4 5-4 4 4 6-4',2.5)),
 pierce:S(L('M4 28L21 11',3.5)+P('M29 3L18 8l6 6Z')+L('M4 20l5-5M12 28l5-5',2)),
 volley:S(L('M8 14v16',3)+L('M16 8v22',3)+L('M24 14v16',3)+P('M8 3L3.5 13h9Z')+P('M16 1l-4.5 10h9Z')+P('M24 3l-4.5 10h9Z')),
 bow:S(L('M9 3Q27 16 9 29',3)+L('M9 3v26',1.4)+L('M3 16h24',2.6)+P('M30 16l-7-5v10Z')+L('M3 16l-2-3M3 16l-2 3',1.8)),
 flame:S(P('M16 2C18 9 25 12 25 20c0 6-4 10-9 10s-9-4-9-10c0-4 2-6 4-8 0 4 2 5 3 5-1-6 0-11 2-15Z M16 27c-3 0-5-2-5-5 0-2 2-4 5-7 3 3 5 5 5 7 0 3-2 5-5 5Z')),
 ice:(()=>{const a='<path d="M16 3v26M12 6l4 3.5L20 6M12 26l4-3.5L20 26" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>';return S(a+`<g transform="rotate(60 16 16)">${a}</g><g transform="rotate(120 16 16)">${a}</g>`);})(),
 bolt:S(P('M20 1L6 18h8l-3 13 15-18h-8l4-12Z')),
 sun:S('<circle cx="16" cy="16" r="6.5" fill="#fff"/>'+[0,45,90,135,180,225,270,315].map(r=>`<path d="M16 2.5v5" stroke="#fff" stroke-width="3.2" stroke-linecap="round" transform="rotate(${r} 16 16)"/>`).join('')),
 moon:S(P('M19 3A13 13 0 1 0 29 22 10.5 10.5 0 0 1 19 3Z')+P('M25 4l1.3 3 3 1.3-3 1.3-1.3 3-1.3-3-3-1.3 3-1.3Z')),
 orb:S('<circle cx="16" cy="16" r="11" fill="none" stroke="#fff" stroke-width="3"/>'+P('M16 7l2.5 6.5L25 16l-6.5 2.5L16 25l-2.5-6.5L7 16l6.5-2.5Z')),
 heart:S(P('M16 29C3 19 3 7 10.5 7 14 7 16 9.5 16 11.5 16 9.5 18 7 21.5 7 29 7 29 19 16 29Z M14 11h4v4h4v4h-4v4h-4v-4h-4v-4h4Z')),
 revive:S(P('M16 1L25 11h-6v6h-6v-6H7Z')+P('M13 19h6v3.5h4v6h-4V31h-6v-2.5H9v-6h4Z')),
 buff:S(P(SHIELD+'M16 11l6 7h-4v6h-4v-6h-4Z')),
 debuff:S(P('M16 30L4 15h7V2h10v13h7Z')+L('M2 31h28',2)),
 shield:S(P(SHIELD+'M14.5 11.5h3v4h4v3h-4v5h-3v-5h-4v-3h4Z')),
 taunt:S(P(SHIELD+'M14.4 11h3.2l-.6 8h-2Z M16 21a1.8 1.8 0 1 0 .01 0Z')),
 poison:S(P('M16 2S6 14 6 20c0 6 4 10 10 10s10-4 10-10C26 14 16 2 16 2Z M12 21a3 3 0 1 0 6 0 3 3 0 1 0-6 0Z M20 17a1.6 1.6 0 1 0 .01 0Z')),
 star:S(P('M16 1l4.2 9.8L31 12l-8 7.2L25.4 30 16 24.4 6.6 30 9 19.2 1 12l10.8-1.2Z')),
 clock:S('<circle cx="16" cy="16" r="12" fill="none" stroke="#fff" stroke-width="3"/>'+L('M16 8v8l6 4',3)),
 haste:S(P('M3 4l12 12L3 28h7l12-12L10 4Z')+P('M17 4l12 12-12 12h-4l12-12L13 4Z')),
 roar:S(P('M3 12h9l12-8v24l-12-8H3Z')+L('M27 10Q31 16 27 22',2.6)),
 eye:S(P('M1 16Q16 2 31 16 16 30 1 16Z M16 10.5a5.5 5.5 0 1 0 .01 0Z')+'<circle cx="16" cy="16" r="2.8" fill="#fff"/>'),
 skull:S(P('M16 2C8 2 4.5 8 4.5 13.5c0 4 2 6 4.5 7.5V27h14v-6c2.5-1.5 4.5-3.5 4.5-7.5C27.5 8 24 2 16 2Z M8.5 14a3.2 3.2 0 1 0 .01 0Z M19.5 14a3.2 3.2 0 1 0 .01 0Z M16 18l-2 3.5h4Z')+'<path d="M13 23v4M16 23v4M19 23v4" stroke="rgba(0,0,0,.45)" stroke-width="1.2"/>')
};
/* 技 s（SK の 1 件）→ 絵柄の名前 */

})();

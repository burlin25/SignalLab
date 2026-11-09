import {analyze,valid} from './stats.mjs';

const scenarios=[
  {name:'Checkout button',title:'Ship the new checkout button?',description:'An online retailer tested a more visible checkout button. The goal is to turn more store visits into completed orders.',counts:[10000,800,10000,960],traffic:240000,value:42,minimum:.005,unit:'Visitors'},
  {name:'Email subject line',title:'Use the new subject line?',description:'A marketing team tested a shorter subject line for its weekly newsletter. The conversion is a click through to the featured offer.',counts:[1800,119,1800,135],traffic:94000,value:3,minimum:.005,unit:'Recipients'},
  {name:'Pricing page',title:'Roll out the new pricing page?',description:'A software company simplified its pricing page to encourage trial signups. The team needs enough extra signups to justify maintaining the redesign.',counts:[200000,10000,200000,10400],traffic:600000,value:25,minimum:.005,unit:'Visitors'}
];
const decisions=['Launch B','Keep Testing','Stay With A'];
const $=id=>document.getElementById(id);
const pct=x=>(x*100).toFixed(2)+'%';
const points=x=>(x*100).toFixed(2)+' pp';
const signed=(x,format)=> (x>0?'+':'')+format(x);
const money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
const form=$('experiment');
const scale=$('scale');
let index=0;
let baseline=[];
let submitted=null;

$('scenarios').innerHTML=scenarios.map((s,i)=>`<button type="button" data-index="${i}"><b>0${i+1}</b> ${s.name}</button>`).join('');
$('choices').insertAdjacentHTML('beforeend',decisions.map((d,i)=>`<label class="option"><input type="radio" name="decision" value="${i}"> ${d}</label>`).join(''));

function reset(next) {
  index=next;
  const s=scenarios[index];
  submitted=null;
  form.reset();
  scale.value=1;
  $('results').hidden=true;
  $('hint').textContent='The analysis unlocks after you make a decision.';
  $('scenario-number').textContent=`CASE 0${index+1} / 03`;
  $('scenario-title').textContent=s.title;
  $('description').textContent=s.description;
  $('assumptions').innerHTML=`<div><dt>Value / conversion</dt><dd>${money.format(s.value)}</dd></div><div><dt>Annual traffic</dt><dd>${s.traffic.toLocaleString('en-US')}</dd></div><div><dt>Minimum lift</dt><dd>${points(s.minimum)}</dd></div>`;
  $('variants').innerHTML=['A','B'].map((letter,i)=>`<section class="variant" aria-label="Version ${letter}"><div class="variant-head"><span class="letter">${letter}</span><div><strong>Version ${letter}</strong><span>${i?'Challenger':'Control'}</span></div><output class="rate" id="rate${i}" aria-label="Version ${letter} conversion rate"></output></div><div class="fields"><label>${s.unit}<input id="n${i}" type="number" min="1" step="1" required value="${s.counts[2*i]}"></label><label>Conversions<input id="k${i}" type="number" min="0" step="1" required value="${s.counts[2*i+1]}"></label></div></section>`).join('');
  for (const button of $('scenarios').children) button.setAttribute('aria-pressed',String(Number(button.dataset.index)===index));
  baseline=[...s.counts];
  update();
}

function plot(id,rows,zero,format) {
  const values=rows.flatMap(row=>row.slice(1));
  if(zero) values.push(0);
  const min=Math.min(...values), max=Math.max(...values);
  const spread=max-min || .001;
  const x=v=>53+((v-min)/spread)*246;
  const height=rows.length*35+30;
  const label=rows.map(([name,p,l,h])=>`${name} ${format(p)}, interval ${format(l)} to ${format(h)}`).join('. ');
  $(id).innerHTML=`<svg viewBox="0 0 350 ${height}" role="img" aria-label="${label}" font-family="system-ui" font-size="11" fill="#546270">
    ${zero?`<line x1="${x(0)}" x2="${x(0)}" y1="0" y2="${height-23}" stroke="#8493a5" stroke-dasharray="3 3"/><text x="${x(0)}" y="${height-5}" text-anchor="middle">0 pp</text>`:''}
    ${rows.map(([name,p,l,h],i)=>{
      const y=18+i*35, color=i===0&&!zero?'#617183':'#2452ae';
      return `<text x="0" y="${y+4}">${name}</text><line x1="${x(l)}" x2="${x(h)}" y1="${y}" y2="${y}" stroke="${color}" stroke-width="2"/>${[l,h].map(v=>`<path d="M${x(v)} ${y-5}v10" stroke="${color}"/>`).join('')}<circle cx="${x(p)}" cy="${y}" r="4.5" fill="${color}"/><text x="350" y="${y+4}" text-anchor="end">${format(p)}</text>`;
    }).join('')}
    </svg><p>${label}</p>`;
}

function update() {
  const s=scenarios[index];
  const counts=['n0','k0','n1','k1'].map(id=>$(id).valueAsNumber);
  const analysis=analyze(...counts,s.minimum);
  for(let i=0;i<2;i++){
    const [n,k]=counts.slice(2*i,2*i+2);
    $('rate'+i).textContent=valid(n,k)?pct(k/n):'—';
    $('n'+i).setAttribute('aria-invalid',String(!valid(n,0)));
    $('k'+i).setAttribute('aria-invalid',String(!valid(n,k)));
  }
  $('error').hidden=Boolean(analysis);
  $('error').textContent='Enter positive whole visitor or recipient counts, with conversions between zero and the corresponding count.';
  $('submit').disabled=!analysis || !form.elements.decision.value;
  $('results').hidden=submitted===null || !analysis;
  if($('results').hidden) return;
  const {a,b,lift,relative,lo,hi,p,choice,weak,ranges}=analysis;
  const same=submitted===choice;
  $('verdict').textContent=same?'Your call is supported':submitted===1?'Your call is reasonable but cautious':'Your call is unsupported by the decision rule';
  $('result-title').textContent=decisions[choice];
  const evidence=weak?'Expected or observed outcome counts are below five. The normal approximation can be unreliable, so gather more data.':
    hi<0?'The interval is below zero. The evidence favors A.':
    lo<=0?'The interval includes zero. The evidence remains inconclusive.':
    choice===2?`The interval is above zero, but the observed gain falls below the ${points(s.minimum)} practical threshold.`:
    `The interval is above zero and the observed gain meets the ${points(s.minimum)} practical threshold.`;
  $('explanation').textContent=`The observed change is ${signed(lift,points)}. ${evidence}`;
  const metrics=[['A conversion rate',pct(a)],['B conversion rate',pct(b)],['Absolute lift',signed(lift,points)],['Relative lift',relative===null?'Undefined':signed(relative,pct)],['95% lift interval',`${points(lo)} to ${points(hi)}`],['Two-sided p-value',p<.0001?'&lt; 0.0001':p.toFixed(4)],['Estimated annual impact',money.format(lift*s.traffic*s.value)]];
  $('metrics').innerHTML=metrics.map(([label,value])=>`<div class="metric"><span>${label}</span><strong>${value}</strong></div>`).join('');
  plot('rate-plot',ranges.map((range,i)=>['AB'[i],...range]),false,pct);
  plot('lift-plot',[['B − A',lift,lo,hi]],true,points);
  $('multiple').textContent=scale.value+'×';
}

$('scenarios').addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(button) reset(Number(button.dataset.index));
});
$('reset-scenario').addEventListener('click',()=>reset(index));
form.addEventListener('input',event=>{
  if(event.target.type==='number'){
    baseline=['n0','k0','n1','k1'].map(id=>$(id).valueAsNumber);
    scale.value=1;
  }
  update();
});
form.addEventListener('submit',event=>{
  event.preventDefault();
  if($('submit').disabled) return;
  submitted=Number(form.elements.decision.value);
  $('hint').textContent=`Your analyzed call: ${decisions[submitted]}`;
  update();
  $('result-title').focus();
});
scale.addEventListener('input',()=>{
  ['n0','k0','n1','k1'].forEach((id,i)=>{$(id).value=Math.min(Number.MAX_SAFE_INTEGER,baseline[i]*Number(scale.value));});
  update();
});
document.querySelector('.method-link').addEventListener('click',()=>{$('method').open=true;});
reset(0);

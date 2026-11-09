export function valid(n, k) {
  return Number.isSafeInteger(n) && n > 0 && Number.isSafeInteger(k) && k >= 0 && k <= n;
}

// Complementary error function approximation (Numerical Recipes).
function erfc(x) {
  const t = 1 / (1 + x / 2);
  const coefficients = [0.17087277,-0.82215223,1.48851587,-1.13520398,0.27886807,-0.18628806,0.09678418,0.37409196,1.00002368];
  return t * Math.exp(-x*x - 1.26551223 + t * coefficients.reduce((a,b) => a*t+b));
}

export function analyze(nA,kA,nB,kB,minimum) {
  if (!valid(nA,kA) || !valid(nB,kB)) return null;
  const a=kA/nA, b=kB/nB, lift=b-a, pooled=(kA+kB)/(nA+nB);
  const margin = (p,n) => 1.96*Math.sqrt(p*(1-p)/n);
  const width=Math.hypot(margin(a,nA),margin(b,nB));
  const lo=lift-width, hi=lift+width;
  const nullSE=Math.sqrt(pooled*(1-pooled)*(1/nA+1/nB));
  const z=nullSE ? lift/nullSE : 0;
  const p=z===0 ? 1 : erfc(Math.abs(z)/Math.SQRT2);
  const weak=[nA,nB].some(n => n*pooled<5 || n*(1-pooled)<5) ||
    [kA,nA-kA,kB,nB-kB].some(count => count<5);
  const choice=weak || (lo<=0 && hi>=0) ? 1 : hi<0 || lift<minimum ? 2 : 0;
  return {a,b,lift,relative:a ? lift/a : null,lo,hi,z,p,weak,choice,
    ranges:[[a,Math.max(0,a-margin(a,nA)),Math.min(1,a+margin(a,nA))],
            [b,Math.max(0,b-margin(b,nB)),Math.min(1,b+margin(b,nB))]]};
}

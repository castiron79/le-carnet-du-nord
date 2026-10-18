// Publishing check only. Timers are still authored manually, never generated from this scan.
const amount = String.raw`\d+(?:[.,]\d+)?[¼½¾]?`;
const duration = new RegExp(String.raw`(?<![\d.,])(${amount})(?:\s*[–-]\s*${amount})?\s*(sekund(?:er)?|minut(?:er(?:na)?|en)?|min\b|timmar(?:na)?|timme)\b`, 'gi');
const numeric = value => Number(value.replace(/[¼½¾]/g, '')) + ({'¼':.25,'½':.5,'¾':.75}[value.at(-1)] || 0);

export function stepDurations(text) {
  const found = [];
  for (const match of text.matchAll(duration)) {
    const multiplier = match[2].toLowerCase().startsWith('sek') ? 1 : match[2].toLowerCase().startsWith('tim') ? 3600 : 60;
    const seconds = Math.round(numeric(match[1].replace(',','.')) * multiplier);
    const sides = /^\s+per\s+sida\b/i.test(text.slice(match.index + match[0].length));
    found.push({seconds, text:match[0], sides});
  }
  // This wording is a specific phase, unlike "någon/några minuter".
  for (const match of text.matchAll(/\b(?:sista minuten|en minut)\b/gi)) found.push({seconds:60,text:match[0],sides:false});
  return found;
}

export function validateTimerCoverage(instructionLines, manifest) {
  if (!manifest) return ['timers.json krävs vid publicering; använd en tom timers-lista om stegen saknar uttryckliga tider'];
  const errors=[];
  instructionLines.forEach((line,index)=>{
    const timers=manifest.timers.filter(timer=>timer.step===index+1);
    const available=timers.map(timer=>timer.seconds);
    for(const time of stepDurations(line)) {
      for(let side=0;side<(time.sides?2:1);side++) {
        const match=available.indexOf(time.seconds);
        if(match<0) errors.push(`Steg ${index+1}: saknar granskad timer för ${time.text}${time.sides?' per sida (två faser krävs)':''}`);
        else available.splice(match,1);
      }
    }
  });
  return errors;
}

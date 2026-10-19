// Historical handle equivalences; answer labels remain as recorded in source.
export const aliases:Record<string,string>={priestahh:'priestah',felo:'felony',crowder:'replays',kenny:'kuavo',lyynnz:'lynz'};
export function normalize(s:string){const n=s.trim().toLowerCase();return aliases[n]??n;}

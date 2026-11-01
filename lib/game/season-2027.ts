import season from '../../data/seasons/2027.json';
import catalogue from '../../data/players/guess-profiles.json';
import {normalize} from './identity';
export const seasonReferenceDate=season.checkedOn;
const overrides=season.roleOverrides as Record<string,{role:string;verifiedOn:string;source:string}>;
// Reuse independently verified birth/country/role evidence; a roster alone never
// creates a Guess Player profile. Announced lineups remain playable in roster games.
export const seasonProfiles=season.rosters.flatMap(roster=>roster.players.flatMap(handle=>{
 const base=catalogue.players.find(p=>normalize(p.handle)===normalize(handle));
 if(!base)return [];
 const override=overrides[base.handle];
 return [{...base,id:base.id+'.2027',role:override?.role||base.role,teamId:'s27:'+roster.team,team:roster.team,teamBasis:'announcement',teamDate:roster.startDate,
  sources:[...new Set([...base.sources,roster.source,...(override?[override.source]:[])])],
  seasonInfo:{season:2027,rosterSource:roster.source,roleDate:override?.verifiedOn||base.verifiedAsOf,roleSource:override?.source||base.sources[1],checkedOn:season.checkedOn}}];
}));
export function seasonProfileInfo(id:string){return seasonProfiles.find(p=>p.id===id)?.seasonInfo;}

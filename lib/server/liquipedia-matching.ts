// Derived review annotations only. No requests, source edits or identity merges.
import {normalize} from '../game/identity';
type Row=Record<string,unknown>;
export type SourceRecord={id:string;label:string;pagename:string;sourceUrl:string;row:Row;occurrences:number;conflict:boolean;fetchedAt:string[];possibleExistingMatch:boolean};
export type DivisionMarker={division:'mobile'|'warzone'|'codol';basis:'source-page'|'exact-team-page';pagename:string};
const value=(r:Row,k:string)=>typeof r[k]==='string'?r[k] as string:'';
function markers(pagename:string,basis:DivisionMarker['basis']):DivisionMarker[]{
  return (['mobile','warzone','codol'] as const).filter(d=>new RegExp(`(?:^|[/_(\\s-])${d}(?=$|[/_)\\s-])`,'i').test(pagename)).map(division=>({division,basis,pagename}));
}
export const reviewFilters=['all','ambiguous','division','staff','unresolved-team'] as const;
export type ReviewFilter=typeof reviewFilters[number];
export function annotateMatches(records:SourceRecord[],kind:'player'|'team',teams:SourceRecord[],existingPlayers:ReadonlySet<string>){
  const names=new Map<string,SourceRecord[]>(),pages=new Map<string,SourceRecord[]>(),existing=new Map<string,Set<string>>();
  const candidateKeys=new Map<string,string[]>(),conflictedTeamPages=new Set<string>();
  for(const team of teams){const page=value(team.row,'pagename');if(page){const members=pages.get(page)||[];members.push(team);pages.set(page,members);if(team.conflict)conflictedTeamPages.add(page);}}
  for(const r of records){
    // Case-insensitive names only flag collisions; they never establish identity.
    const name=(kind==='player'?value(r.row,'id'):value(r.row,'name')).normalize('NFC').trim().toLowerCase();
    if(name){const members=names.get(name)||[];members.push(r);names.set(name,members);}
    const keys=kind==='player'?[...new Set(['id','pagename','name'].map(k=>normalize(value(r.row,k))).filter(k=>existingPlayers.has(k)))]:[];
    candidateKeys.set(r.id,keys);
    for(const k of keys){const ids=existing.get(k)||new Set<string>();ids.add(r.id);existing.set(k,ids);}
  }
  const annotated=records.map(r=>{
    const name=(kind==='player'?value(r.row,'id'):value(r.row,'name')).normalize('NFC').trim().toLowerCase();
    const group=names.get(name)||[],namePeerCount=Math.max(0,group.length-1);
    // Bound per-row annotations; full group IDs and raw source pages remain in exports.
    const namePeers=group.slice(0,21).filter(p=>p.id!==r.id).slice(0,20).map(p=>({id:p.id,pagename:p.pagename,sourceUrl:p.sourceUrl}));
    const keys=candidateKeys.get(r.id)||[];
    const ambiguousExistingKeys=keys.filter(k=>(existing.get(k)?.size||0)>1);
    const reference=value(r.row,'teampagename');
    // Strict source pagename equality: no case folding, underscore/space conversion,
    // display-name matching, template matching, or fallback division selection.
    const candidates=kind==='player'&&reference?pages.get(reference)||[]:[];
    const teamLink={state:kind==='team'?'not-applicable':!reference?'missing-reference':!candidates.length?'not-in-snapshot':candidates.length>1?'ambiguous':'exact',reference,
      candidateCount:candidates.length,candidates:candidates.slice(0,20).map(t=>({id:t.id,label:t.label,pagename:t.pagename,sourceUrl:t.sourceUrl,fetchedAt:t.fetchedAt,conflict:t.conflict}))};
    const divisionMarkers=[...markers(value(r.row,'pagename'),'source-page'),...(kind==='player'&&candidates.length===1?markers(value(candidates[0].row,'pagename'),'exact-team-page'):[])];
    const flags=[...(r.conflict?['Conflicting source rows']:[]),...(namePeers.length?['Shared handle or team name']:[]),...(ambiguousExistingKeys.length?['Ambiguous existing handle match']:[]),...(kind==='player'&&value(r.row,'type').toLowerCase()==='staff'?['Currently marked staff; playing history needs review']:[]),...divisionMarkers.map(m=>`${m.division.toUpperCase()} marker (${m.basis})`),...(teamLink.state==='ambiguous'?['Multiple source objects on referenced team page']:[]),...(conflictedTeamPages.has(reference)?['Referenced team has conflicting source rows']:[])];
    return {...r,namePeers,namePeerCount,existingCandidateKeys:keys,ambiguousExistingKeys,teamLink,divisionMarkers,relevance:divisionMarkers.length?'explicit-division-marker':'unclassified-history-needed',flags};
  });
  return {records:annotated,ambiguityGroups:[...names.entries()].filter(([,members])=>members.length>1).map(([name,members])=>({name,sourceIds:members.map(r=>r.id)})),matchingSummary:{ambiguousNameGroups:[...names.values()].filter(v=>v.length>1).length,ambiguousNameRecords:annotated.filter(r=>r.namePeers.length).length,distinctExistingHandlesMatched:existing.size,ambiguousExistingHandles:[...existing.values()].filter(v=>v.size>1).length,ambiguousExistingRecords:annotated.filter(r=>r.ambiguousExistingKeys.length).length,exactTeamLinks:annotated.filter(r=>r.teamLink.state==='exact').length,ambiguousTeamLinks:annotated.filter(r=>r.teamLink.state==='ambiguous').length,missingTeamReferences:annotated.filter(r=>r.teamLink.state==='missing-reference').length,unresolvedTeamReferences:annotated.filter(r=>r.teamLink.state==='not-in-snapshot').length,explicitDivisionRecords:annotated.filter(r=>r.divisionMarkers.length).length,unclassifiedRecords:annotated.filter(r=>!r.divisionMarkers.length).length,staffRecords:kind==='player'?records.filter(r=>value(r.row,'type').toLowerCase()==='staff').length:0}};
}
export type AnnotatedRecord=ReturnType<typeof annotateMatches>['records'][number];
export function filterMatches(records:AnnotatedRecord[],filter:ReviewFilter){return records.filter(r=>filter==='all'||filter==='ambiguous'&&(r.namePeers.length>0||r.ambiguousExistingKeys.length>0||r.teamLink.state==='ambiguous')||filter==='division'&&r.divisionMarkers.length>0||filter==='staff'&&value(r.row,'type').toLowerCase()==='staff'||filter==='unresolved-team'&&['not-in-snapshot','missing-reference','ambiguous'].includes(r.teamLink.state));}

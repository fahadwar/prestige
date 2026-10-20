// Published identity enrichment. Never used to change scoring or game eligibility.
import data from '../../data/liquipedia/game-identities.json';
import {normalize} from './identity';
type ImportedPlayer={profileId:string;handle:string;realName:string;nationality:string;listedStatus:string;listedType:string;sourceUrl:string;fetchedAt:string;listedTeamId:string|null};
type ImportedTeam={id:string;name:string;pagename:string;sourceUrl:string;fetchedAt:string};
type Catalogue={schemaVersion:number;batchId:string|null;players:ImportedPlayer[];teams:ImportedTeam[]};
const catalogue=data as unknown as Catalogue;
const identities=new Map(catalogue.players.map(p=>[p.profileId,p]));
export const identityImportSummary={batchId:catalogue.batchId,identities:catalogue.players.length,linkedTeams:catalogue.teams.length,newPlayableTargets:0};
const teams=new Map(catalogue.teams.map(t=>[t.id,t]));
export function importedIdentity(profile:{id:string;handle:string;sources:string[]}){
 const p=identities.get(profile.id);
 if(!p||normalize(p.handle)!==normalize(profile.handle)||!profile.sources.includes(p.sourceUrl))return undefined;
 const team=p.listedTeamId?teams.get(p.listedTeamId):undefined;
 return {realName:p.realName,listedStatus:p.listedStatus,listedType:p.listedType,sourceUrl:p.sourceUrl,fetchedAt:p.fetchedAt,
  ...(team?{listedTeam:{name:team.name,pagename:team.pagename,sourceUrl:team.sourceUrl,fetchedAt:team.fetchedAt}}:{})};
}
export type GameIdentity=NonNullable<ReturnType<typeof importedIdentity>>;

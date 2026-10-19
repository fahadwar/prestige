import registry from '../../data/players/portraits.json';
import {normalize} from './identity';
export type Portrait={playerId:string;handle:string;image:string;source:string;originalSource:string;author:string;license:string;licenseUrl:string;photoDate:string;changes:string;position:string;status:'approved';fit?:'cover'|'contain'};
export function playerId(handle:string){return 'player-'+normalize(handle);}
export function getPortrait(handle:string):Portrait|undefined{return (registry as Record<string,Portrait>)[playerId(handle)];}

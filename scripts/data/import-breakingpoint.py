"""Import only match-verified Opening/Champs roster snapshots from public BP pages.
Input is the minimal participant evidence collected from embedded __NEXT_DATA__.
Dry run by default. Existing 2017-19 data and frozen daily schedules are preserved.
"""
import argparse,collections,hashlib,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
def dump(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def build(evidence):
 matches={m['matchId']:m for m in evidence['matches']};out=[];excluded=[]
 for entry in evidence['events']:
  e=entry['event'];year=e['season_id'];size=5 if year==2020 else 4
  for tid,mid in entry['firstMatches'].items():
   tid=int(tid);m=matches[mid];reason=None
   team=next((t for t in m.get('teams',[]) if t['id']==tid),None)
   signatures=[]
   for g in m.get('maps',[]):
    people={s['player_id']:s['player_tag'] for s in g['participants'] if s['team_id']==tid}
    signatures.append(people)
   if m.get('error'):reason='fetch_failed'
   elif m.get('status')!='complete' or m['eventId']!=e['id']:reason='invalid_match'
   elif not team or not signatures or any(len(s)!=size for s in signatures):reason='incomplete_map_participants'
   elif any(s!=signatures[0] for s in signatures):reason='lineup_changed_during_match'
   if reason:excluded.append({'eventId':e['id'],'teamId':tid,'matchId':mid,'reason':reason});continue
   # BP's shared team record can carry the current franchise name into old matches.
   teamName='Minnesota RØKKR' if tid==11 and year<=2025 else team['name']
   names=sorted(signatures[0].values(),key=str.lower)
   if len({n.lower() for n in names})!=size:raise ValueError('Duplicate player name')
   digest=hashlib.sha256(json.dumps(m,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
   opening='Champ' not in e['name'];label='افتتاح الموسم' if opening else 'بطولة العالم'
   out.append({'id':f'bp-{year}-{e["id"]}-{tid}','team':teamName,'season':year,'title':{2020:'MW',2021:'CW',2022:'Vanguard',2023:'MWII',2024:'MWIII',2025:'BO6',2026:'BO7'}[year],'event':e['name'].strip()+' · '+label+' · '+m['datetime'][:10],'eventId':f'bp-{e["id"]}','startDate':m['datetime'][:10],'endDate':m['datetime'][:10],'rosterSize':size,'players':names,'source':m['source'],'sourceSha256':digest,'sourceProvider':'Breaking Point','license':'Public match participant facts; no media or editorial text included','observedMaps':len(signatures),'observedMatchId':mid,'snapshotType':'opening-match' if opening else 'champs-verified-match'})
 return out,excluded
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('evidence',type=pathlib.Path);ap.add_argument('--apply',action='store_true');a=ap.parse_args();evidence=json.loads(a.evidence.read_text());new,excluded=build(evidence)
 print(json.dumps({'accepted':len(new),'bySeason':dict(sorted(collections.Counter(str(q['season']) for q in new).items())),'excluded':excluded},indent=2))
 if a.apply:
  old=json.loads((ROOT/'lib/game/rosters.json').read_text());old=[q for q in old if q.get('sourceProvider')!='Breaking Point'];combined=old+new;dump(ROOT/'lib/game/rosters.json',combined)
  dest=ROOT/'data/source/breakingpoint';dest.mkdir(exist_ok=True);dump(dest/'milestones.json',evidence)
  report={'scope':evidence['scope'],'accepted':len(new),'bySeason':dict(sorted(collections.Counter(str(q['season']) for q in new).items())),'excluded':excluded,'skippedMatches':evidence.get('selectionNotes',[])};dump(ROOT/'data/breakingpoint-coverage.json',report)
  cov=json.loads((ROOT/'data/coverage.json').read_text());cov['events']=[e for e in cov['events'] if e.get('sourceProvider')!='Breaking Point']
  for entry in evidence['events']:
   e=entry['event'];cov['events'].append({'slug':f'bp-{e["id"]}','sourceProvider':'Breaking Point','event':e['name'].strip(),'season':e['season_id'],'startDate':e['start_date'],'endDate':e['end_date'],'accepted':sum(q['eventId']==f'bp-{e["id"]}' for q in new),'excluded':[x for x in excluded if x['eventId']==e['id']]})
  cov['summary'].update(rosters=len(combined),players=len(set(p for q in combined for p in q['players'])),events=len(cov['events']),bySeason=dict(sorted(collections.Counter(str(q['season']) for q in combined).items())),excludedGroups=sum(len(e['excluded']) for e in cov['events']))
  dump(ROOT/'data/coverage.json',cov)

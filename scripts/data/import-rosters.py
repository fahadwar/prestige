"""Import BSD-licensed CWL event rosters. Preview by default; --apply writes outputs.
Only event/team groups with a stable, complete lineup across all observed maps
are published. Ambiguous groups remain in the coverage report for review.
"""
import argparse, collections, csv, hashlib, json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--apply',action='store_true');a=p.parse_args()
manifest=json.loads(Path('data/source/manifest.json').read_text());questions=[];report=[]
for event in manifest:
 source=Path('data/source')/event['filename']
 if hashlib.sha256(source.read_bytes()).hexdigest()!=event['sha256']:raise ValueError('Source checksum changed: '+event['filename'])
 rows=list(csv.DictReader(source.open()));teams=collections.defaultdict(set);maps=collections.defaultdict(set)
 for row in rows:
  team={'Team EnVyUs':'Team Envy','Envy':'Team Envy'}.get(row['team'],row['team']);player=row['player'].strip()
  teams[team].add(player);maps[(team,row['match id'])].add(player)
 size=5 if event['season']==2019 else 4;accepted=0;excluded=[]
 for team,lineup in sorted(teams.items()):
  sizes={len(v) for (t,_),v in maps.items() if t==team}
  if len(lineup)!=size or sizes!={size}:
   excluded.append({'team':team,'uniquePlayers':len(lineup),'observedMapSizes':sorted(sizes),'reason':'changing_or_incomplete_roster'});continue
  # Preserve original IDs and question labels for existing 2018 Champs sessions.
  key=team if event['slug']=='2018-champs' else event['slug']+'|'+team
  questions.append(dict(id=hashlib.sha256(key.encode()).hexdigest()[:12],team=team,season=event['season'],title=event['title'],event='CWL Champs 2018' if event['slug']=='2018-champs' else event['event'],eventId=event['slug'],startDate=event['startDate'],endDate=event['endDate'],rosterSize=size,players=sorted(lineup),source='https://github.com/WillTufff/COD-DataAnalysis/blob/c9b6b4e46fc4c742ebc75c15af20a28dd3d98ccd/pipeline/snapshots/cwl-archive/'+event['filename'],sourceSha256=event['sha256'],license='BSD-3-Clause',verification='source-consistent',observedMaps=sum(1 for t,_ in maps if t==team)))
  accepted+=1
 report.append({**event,'sourceRows':len(rows),'accepted':accepted,'excluded':excluded})
# Keep independently imported modern records and coverage when rebuilding CWL.
if Path('lib/game/rosters.json').exists():
 questions.extend(q for q in json.loads(Path('lib/game/rosters.json').read_text()) if q.get('sourceProvider')=='Breaking Point')
if Path('data/coverage.json').exists():
 report.extend(e for e in json.loads(Path('data/coverage.json').read_text())['events'] if e.get('sourceProvider')=='Breaking Point')
summary={'rosters':len(questions),'players':len(set(p for q in questions for p in q['players'])),'events':len(report),'bySeason':dict(collections.Counter(q['season'] for q in questions)),'excludedGroups':sum(len(e['excluded']) for e in report)}
print(json.dumps({'mode':'apply' if a.apply else 'preview',**summary}))
if a.apply:
 for name,value in [('lib/game/rosters.json',questions),('data/coverage.json',{'summary':summary,'events':report})]:
  target=Path(name)
  if target.exists():target.with_suffix('.json.bak').write_bytes(target.read_bytes())
  target.write_text(json.dumps(value,indent=2))

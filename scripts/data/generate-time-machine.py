import argparse,collections,hashlib,json,pathlib,random
root=pathlib.Path(__file__).resolve().parents[2];ap=argparse.ArgumentParser();ap.add_argument('--apply',action='store_true');args=ap.parse_args();rows=json.loads((root/'lib/game/rosters.json').read_text());aliases={'priestahh':'priestah','felo':'felony','crowder':'replays','kenny':'kuavo','lyynnz':'lynz'};norm=lambda s:aliases.get(s.strip().lower(),s.strip().lower());lineup=lambda q:tuple(sorted(map(norm,q['players'])));seasons=collections.defaultdict(set);groups=collections.defaultdict(list)
for q in rows:seasons[lineup(q)].add(q['season']);groups[(q['team'].strip().lower(),lineup(q))].append(q)
questions=[];excluded=[]
for (team,names),sources in sorted(groups.items()):
 if len(seasons[names])!=1:excluded.append({'team':sources[0]['team'],'players':sources[0]['players'],'seasons':sorted(seasons[names]),'reason':'lineup_observed_in_multiple_seasons'});continue
 q=sources[0];key=team+'|'+ '|'.join(names);questions.append({'id':'tm-'+hashlib.sha256(key.encode()).hexdigest()[:14],'team':q['team'],'players':q['players'],'rosterSize':q['rosterSize'],'season':q['season'],'evidence':[{'rosterId':s['id'],'event':s['event'],'startDate':s['startDate'],'endDate':s['endDate'],'source':s['source']} for s in sources]})
random.Random(2026101807).shuffle(questions);schedule={'startsOn':'2026-10-18','questionIds':[q['id'] for q in questions]};report={'questions':len(questions),'bySeason':dict(sorted(collections.Counter(str(q['season']) for q in questions).items())),'excludedGroups':excluded,'rule':'Reject any full normalized lineup seen in multiple seasons in the entire bundled archive, including under another team name.'}
for name,value in [('lib/game/time-puzzles.json',questions),('lib/game/time-schedule.json',schedule)]:
 p=root/name
 if p.exists() and json.loads(p.read_text())!=value:raise ValueError('Frozen Time Machine content differs; review and version before changing it')
 if args.apply:p.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
if args.apply:(root/'data/time-machine-coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(('Saved' if args.apply else 'Preview:'),len(questions),'questions;',len(excluded),'ambiguous groups excluded;',report['bySeason'])

"""Generate four disjoint roster groups; reject any competing archived lineup."""
import argparse,collections,hashlib,itertools,json,pathlib,random
args=argparse.ArgumentParser();args.add_argument("--apply",action="store_true");options=args.parse_args()
root=pathlib.Path(__file__).resolve().parents[2];rows=json.loads((root/'lib/game/rosters.json').read_text());aliases={'priestahh':'priestah','felo':'felony','crowder':'replays','kenny':'kuavo','lyynnz':'lynz'};norm=lambda s:aliases.get(s.strip().lower(),s.strip().lower());key=lambda q:frozenset(map(norm,q['players']));known={key(q) for q in rows if q['rosterSize']==4};rng=random.Random(20261018);puzzles=[];boards=set()
for year in range(2021,2027):
 events=collections.defaultdict(list)
 for q in rows:
  if q['season']==year and q['rosterSize']==4:events[q['eventId']].append(q)
 candidates=[]
 for event,qs in sorted(events.items()):
  for groups in itertools.combinations(qs,4):
   intended={key(g) for g in groups};board=frozenset().union(*intended)
   if len(board)!=16 or len(intended)!=4:continue
   if {s for s in known if s<=board}!=intended:continue
   candidates.append(groups)
 rng.shuffle(candidates);count=0
 for groups in candidates:
  board=frozenset(p for q in groups for p in map(norm,q['players']))
  if board in boards:continue
  boards.add(board);groupIds=sorted(q['id'] for q in groups);pid='cn-'+hashlib.sha256('|'.join(groupIds).encode()).hexdigest()[:14]
  tiles=[p for q in groups for p in q['players']];rng.shuffle(tiles)
  puzzles.append({'id':pid,'season':year,'tiles':tiles,'groups':[{'rosterId':q['id'],'team':q['team'],'season':q['season'],'event':q['event'],'date':q['startDate'],'players':q['players'],'source':q['source']} for q in groups]});count+=1
  if count==10:break
 if count!=10:raise ValueError(f'Insufficient unambiguous puzzles for {year}: {count}')
rng.shuffle(puzzles);dest=root/'lib/game/connections-puzzles.json';schedule=root/'lib/game/connections-schedule.json'
if dest.exists() and json.loads(dest.read_text())!=puzzles:raise ValueError('Generated puzzle catalogue differs from frozen version; review and version the schedule before changing it.')
if options.apply:
 dest.write_text(json.dumps(puzzles,ensure_ascii=False,indent=2)+'\n')
 expected={'startsOn':'2026-10-18','questionIds':[p['id'] for p in puzzles]}
 if schedule.exists() and json.loads(schedule.read_text())!=expected:raise ValueError('Frozen schedule changed')
 schedule.write_text(json.dumps(expected,indent=2)+'\n')
print(('Saved' if options.apply else 'Preview:'),len(puzzles),'puzzles; 10 per season 2021–2026; all alternative four-player lineups checked.')

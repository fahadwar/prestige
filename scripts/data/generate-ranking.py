import argparse,hashlib,json,pathlib,random
root=pathlib.Path(__file__).resolve().parents[2];a=argparse.ArgumentParser();a.add_argument('--apply',action='store_true');args=a.parse_args();profiles=json.loads((root/'data/players/guess-profiles.json').read_text())['players'];rng=random.Random(2026101806);puzzles=[];seen=set()
for anchor in profiles:
 for attempt in range(10000):
  group=[anchor]+rng.sample([p for p in profiles if p['id']!=anchor['id']],4)
  if len({p['birthDate'] for p in group})!=5:continue
  ids=tuple(sorted(p['id'] for p in group))
  if ids in seen:continue
  seen.add(ids);rng.shuffle(group)
  if [p['birthDate'] for p in group]==sorted(p['birthDate'] for p in group):continue
  puzzles.append({'id':'rk-'+hashlib.sha256('|'.join(ids).encode()).hexdigest()[:14],'players':[p['handle'] for p in group]});break
 else:raise ValueError('Unable to generate a puzzle')
rng.shuffle(puzzles);out=root/'lib/game/ranking-puzzles.json';schedule=root/'lib/game/ranking-schedule.json';expected={'startsOn':'2026-10-18','questionIds':[p['id'] for p in puzzles]}
if out.exists() and json.loads(out.read_text())!=puzzles:raise ValueError('Frozen catalogue differs; review/version changes explicitly')
if schedule.exists() and json.loads(schedule.read_text())!=expected:raise ValueError('Frozen daily schedule differs')
if args.apply:
 out.write_text(json.dumps(puzzles,ensure_ascii=False,indent=2)+'\n');schedule.write_text(json.dumps(expected,indent=2)+'\n')
print(('Saved' if args.apply else 'Preview:'),len(puzzles),'unique puzzles; every verified player appears; no equal birth dates.')

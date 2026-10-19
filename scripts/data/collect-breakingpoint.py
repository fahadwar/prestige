import argparse,json,re,urllib.request,time,concurrent.futures,pathlib
ap=argparse.ArgumentParser();ap.add_argument("--cache",type=pathlib.Path,required=True);ap.add_argument("--output",type=pathlib.Path,required=True);args=ap.parse_args()
ROOT=args.cache;ROOT.mkdir(parents=True,exist_ok=True)
HEAD={'User-Agent':'Mozilla/5.0'}
def fetch(path,key):
 dest=ROOT/(key+'.json')
 if dest.exists():return json.loads(dest.read_text())
 for attempt in range(3):
  try:
   raw=urllib.request.urlopen(urllib.request.Request('https://breakingpoint.gg'+path,headers=HEAD),timeout=35).read().decode();p=json.loads(re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>',raw)[1])['props']['pageProps'];dest.write_text(json.dumps(p));return p
  except Exception:
   if attempt==2:raise
   time.sleep(2+attempt*2)
def event(e):
 p=fetch('/events/'+str(e['id']),'event-'+str(e['id']));print('event',e['season_id'],e['id'],len(p['matches']),flush=True);return p
catalog=fetch('/events','catalog')['events'];chosen=[]
for year in range(2020,2027):
 es=[e for e in catalog if e['season_id']==year and e['division_id']==3 and e['name'].startswith('CDL') and 'Kick-Off' not in e['name']]
 chosen.extend([min(es,key=lambda e:e['start_date']),next(e for e in es if 'Champ' in e['name'])])
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: events=list(pool.map(event,chosen))
jobs={};targets=[]
for p in events:
 matches=sorted([m for m in p['matches'] if m['status']=='complete'],key=lambda m:m['datetime']);first={}
 for m in matches:
  for side in (1,2):
   tid=m['team_'+str(side)+'_id']
   if tid not in first:first[tid]=m['id'];jobs[m['id']]=m
 targets.append({'event':{k:p['event'][k] for k in ['id','name','season_id','start_date','end_date']},'firstMatches':first,'teams':[{k:t[k] for k in ['id','name']} for t in p['teams']]})
def match(mid):
 try:
  p=fetch('/match/'+str(mid),'match-'+str(mid));m=p['initialMatchState'];facts={'matchId':mid,'eventId':m['event_id'],'datetime':m['datetime'],'status':m['status'],'teams':[{ 'id':m['team_'+str(side)+'_id'],'name':p['team'+str(side)+'Name']} for side in (1,2)],'maps':[{'gameId':g['id'],'number':g['game_num'],'participants':[{k:s[k] for k in ['team_id','player_id','player_tag']} for s in g.get('player_stats',[])]} for g in m.get('games',[])],'source':'https://breakingpoint.gg/match/'+str(mid)}
  print('match',mid,len(facts['maps']),flush=True);return facts
 except Exception as ex: print('FAILED',mid,str(ex),flush=True);return {'matchId':mid,'error':str(ex)}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:facts=list(pool.map(match,sorted(jobs)))
# If first match is incomplete/inconsistent, try later completed matches for that
# team, preserving the rejected match and the precise reason in the audit trail.
import importlib.util
spec=importlib.util.spec_from_file_location('bp_import',pathlib.Path(__file__).with_name('import-breakingpoint.py'));imp=importlib.util.module_from_spec(spec);spec.loader.exec_module(imp)
selectionNotes=[]
for target,eventPage in zip(targets,events):
 for tid,original in list(target['firstMatches'].items()):
  while True:
   partial={'events':[{'event':target['event'],'firstMatches':{str(tid):target['firstMatches'][tid]}}],'matches':facts}
   rows,errors=imp.build(partial)
   if rows:break
   current=target['firstMatches'][tid];selectionNotes.append(errors[0])
   seen={n['matchId'] for n in selectionNotes if n['teamId']==int(tid) and n['eventId']==target['event']['id']}
   candidates=sorted([m for m in eventPage['matches'] if m['status']=='complete' and int(tid) in [m['team_1_id'],m['team_2_id']] and m['id'] not in seen],key=lambda m:m['datetime'])
   if not candidates:break
   candidate=candidates[0]['id']
   if not any(m['matchId']==candidate for m in facts):facts.append(match(candidate))
   target['firstMatches'][tid]=candidate
out={'selectionNotes':selectionNotes,'provider':'Breaking Point','scope':'First verifiable completed match per team at each season opening event and CDL Championship; not full-season transfer history','fetchedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'events':targets,'matches':facts}
args.output.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print('DONE',len(events),len(facts),flush=True)

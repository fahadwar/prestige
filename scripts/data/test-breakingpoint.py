import copy,importlib.util,pathlib,unittest
path=pathlib.Path(__file__).with_name('import-breakingpoint.py');spec=importlib.util.spec_from_file_location('bp',path);bp=importlib.util.module_from_spec(spec);spec.loader.exec_module(bp)
class ImportTests(unittest.TestCase):
 def sample(self):
  participants=[{'team_id':7,'player_id':i,'player_tag':f'P{i}'} for i in range(5)]
  return {'events':[{'event':{'id':1,'season_id':2020,'name':'CDL Launch Weekend'},'firstMatches':{'7':2}}],'matches':[{'matchId':2,'eventId':1,'datetime':'2020-01-24T12:00:00Z','status':'complete','teams':[{'id':7,'name':'Historical Team'}],'source':'https://breakingpoint.gg/match/2','maps':[{'participants':copy.deepcopy(participants)},{'participants':copy.deepcopy(participants)}]}]}
 def test_verified_five_player_snapshot(self):
  rows,errors=bp.build(self.sample());self.assertEqual(errors,[]);self.assertEqual(rows[0]['team'],'Historical Team');self.assertEqual(rows[0]['rosterSize'],5);self.assertEqual(rows[0]['observedMaps'],2)
 def test_incomplete_map_excluded(self):
  e=self.sample();e['matches'][0]['maps'][1]['participants'].pop();rows,errors=bp.build(e);self.assertEqual(rows,[]);self.assertEqual(errors[0]['reason'],'incomplete_map_participants')
 def test_substitute_during_series_excluded(self):
  e=self.sample();e['matches'][0]['maps'][1]['participants'][0].update(player_id=99,player_tag='Sub');rows,errors=bp.build(e);self.assertEqual(rows,[]);self.assertEqual(errors[0]['reason'],'lineup_changed_during_match')
 def test_stats_team_mismatch_excluded(self):
  e=self.sample()
  for g in e['matches'][0]['maps']:
   for p in g['participants']:p['team_id']=8
  self.assertEqual(bp.build(e)[1][0]['reason'],'incomplete_map_participants')
 def test_wrong_event_excluded(self):
  e=self.sample();e['matches'][0]['eventId']=55;self.assertEqual(bp.build(e)[1][0]['reason'],'invalid_match')
if __name__=='__main__':unittest.main()

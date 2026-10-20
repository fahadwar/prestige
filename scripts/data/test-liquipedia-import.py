"""Import rejection, idempotence and exact rollback tests in a temporary checkout."""
import importlib.util
import json
import pathlib
import tempfile
import unittest

SOURCE = pathlib.Path(__file__).with_name('import-liquipedia.py')
spec = importlib.util.spec_from_file_location('import_liquipedia', SOURCE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ImportTests(unittest.TestCase):
    def setUp(self):
        self.original_root, self.original_dest = module.ROOT, module.DEST
        self.temp = tempfile.TemporaryDirectory()
        module.ROOT = pathlib.Path(self.temp.name)
        module.DEST = module.ROOT / 'data/liquipedia/game-identities.json'
        self.profile = {'id': 'gp-test', 'handle': 'Nero', 'birthDate': '2000-01-01', 'countryCode': 'US', 'role': 'SMG', 'teamDate': '2025-01-01', 'sources': ['https://liquipedia.net/callofduty/Nero'], 'evidence': {'bpPlayerId': 1}}
        self.write('data/players/guess-profiles.json', {'players': [self.profile]})
        self.write('data/players/guess-profile-evidence.json', {'players': [{'playerId': 1, 'bpBirthDate': '2000-01-01', 'wikiBirthDate': '2000-01-01', 'role': 'SMG'}]})
        self.empty = {'schemaVersion': 1, 'batchId': None, 'players': [], 'teams': []}
        self.write('data/liquipedia/game-identities.json', self.empty)
        self.player = {'pageid': 1, 'namespace': 0, 'pagename': 'Nero', 'objectname': '1_player_Nero', 'id': 'Nero', 'name': 'Example Name', 'type': 'player', 'nationality': 'United States', 'status': 'Active', 'teampagename': 'Team'}
        self.team = {'pageid': 2, 'namespace': 0, 'pagename': 'Team', 'objectname': '2_team_Team', 'name': 'Example Team'}
    def tearDown(self):
        module.ROOT, module.DEST = self.original_root, self.original_dest
        self.temp.cleanup()
    def write(self, file, data):
        path = module.ROOT / file
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data))
        return path
    def export(self, kind, rows):
        value = {'schemaVersion': 1, 'reviewOnly': True, 'attribution': {'license': 'CC-BY-SA-3.0'}, 'quarantine': [], 'summary': {'kind': kind, 'rawRows': len(rows), 'uniqueRecords': len(rows), 'status': 'pagination-ended', 'warnings': []}, 'records': [{'row': r} for r in rows], 'sourcePages': [{'offset': 0, 'url': f'https://api.liquipedia.net/api/v3/{kind}?wiki=callofduty&offset=0&limit=100', 'fetchedAt': '2026-10-20T01:00:00Z', 'warnings': [], 'rows': rows}]}
        return self.write(kind + '.json', value)
    def build(self, players=None, teams=None):
        return module.build(self.export('player', players if players is not None else [self.player]), self.export('team', teams if teams is not None else [self.team]))
    def test_apply_idempotence_rollback_and_dry_run(self):
        before = module.DEST.read_bytes()
        data, report = self.build()
        self.assertEqual(module.DEST.read_bytes(), before)
        self.assertEqual(report['newPlayableTargets'], 0)
        self.assertEqual(report['importedIdentityRecords'], 1)
        self.assertEqual(module.apply(data, report), 'applied')
        self.assertEqual(module.apply(data, report), 'unchanged')
        module.rollback(data['batchId'])
        self.assertEqual(json.loads(module.DEST.read_text()), self.empty)
        with self.assertRaises(ValueError): module.rollback(data['batchId'])
    def test_wrong_person_and_country_rejected(self):
        for change in [{'id': 'Different'}, {'nationality': 'Canada'}, {'name': ''}, {'status': 'Unknown'}]:
            data, report = self.build([{**self.player, **change}])
            self.assertEqual(data['players'], [])
            self.assertEqual(len(report['rejectedExistingProfiles']), 1)
    def test_names_do_not_establish_identity(self):
        mobile = {**self.player, 'pageid': 3, 'pagename': 'Nero_(Mobile_player)', 'objectname': '3_player_Nero'}
        data, _ = self.build([self.player, mobile])
        self.assertEqual(len(data['players']), 1)
        self.assertEqual(data['players'][0]['pagename'], 'Nero')
        data, _ = self.build([mobile])
        self.assertEqual(data['players'], [])
    def test_staff_retained_and_divisions_not_merged(self):
        division = {**self.team, 'pageid': 3, 'pagename': 'Team/Warzone', 'objectname': '3_team_Team'}
        data, _ = self.build([{**self.player, 'type': 'staff'}], [self.team, division])
        self.assertEqual(data['players'][0]['listedType'], 'staff')
        self.assertEqual(data['teams'][0]['pagename'], 'Team')
        data, _ = self.build([{**self.player, 'teampagename': 'team'}])
        self.assertIsNone(data['players'][0]['listedTeamId'])
    def test_bad_evidence_and_mutated_export_rejected(self):
        self.write('data/players/guess-profile-evidence.json', {'players': []})
        with self.assertRaises(ValueError): self.build()
        p, t = self.export('player', [self.player]), self.export('team', [self.team])
        value = json.loads(p.read_text()); value['records'][0]['row']['name'] = 'Tampered'; p.write_text(json.dumps(value))
        with self.assertRaises(ValueError): module.build(p, t)
    def test_modified_catalogue_refuses_rollback(self):
        data, report = self.build(); module.apply(data, report)
        data['players'][0]['realName'] = 'Modified'; module.DEST.write_text(json.dumps(data))
        with self.assertRaises(ValueError): module.rollback(data['batchId'])

if __name__ == '__main__': unittest.main()

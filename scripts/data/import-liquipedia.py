"""Offline, evidence-gated import of Liquipedia identity facts for existing game profiles.

Dry-run default. This never creates target profiles or infers rosters/careers.
The input exports must retain their selected source pages and attribution.
"""
import argparse
import collections
import hashlib
import json
import pathlib
import tempfile
import unicodedata
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parents[2]
DEST = ROOT / 'data/liquipedia/game-identities.json'
ALIASES = {'priestahh': 'priestah', 'felo': 'felony', 'crowder': 'replays', 'kenny': 'kuavo', 'lyynnz': 'lynz'}
COUNTRIES = {'AU': 'Australia', 'BE': 'Belgium', 'CA': 'Canada', 'DE': 'Germany', 'DK': 'Denmark', 'ES': 'Spain', 'FR': 'France', 'GB': 'United Kingdom', 'MX': 'Mexico', 'SA': 'Saudi Arabia', 'US': 'United States'}
LICENSE = {'source': 'Liquipedia Call of Duty', 'url': 'https://liquipedia.net/callofduty/Main_Page', 'license': 'CC-BY-SA-3.0', 'licenseUrl': 'https://creativecommons.org/licenses/by-sa/3.0/', 'changes': 'Selected identity fields linked to existing verified game profiles; no historical roster, birth date, playing-role or career changes.'}

def norm(value):
    value = value.strip().lower()
    return ALIASES.get(value, value)

def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()

def source_url(page):
    return 'https://liquipedia.net/callofduty/' + '/'.join(urllib.parse.quote(p.replace(' ', '_'), safe="~()*!.'-") for p in page.split('/'))

def read_export(path, kind):
    if path.stat().st_size > 16 * 1024 * 1024:
        raise ValueError('Export exceeds safety bound')
    data = json.loads(path.read_text())
    if data.get('schemaVersion') != 1 or data.get('reviewOnly') is not True or data.get('summary', {}).get('kind') != kind or data.get('attribution', {}).get('license') != 'CC-BY-SA-3.0':
        raise ValueError('Unrecognized review export or missing license')
    if data.get('quarantine') or data['summary'].get('warnings'):
        raise ValueError('Resolve quarantined rows or API warnings before import')
    rows = []
    for i, page in enumerate(data['sourcePages']):
        query = urllib.parse.urlparse(page['url'])
        args = urllib.parse.parse_qs(query.query)
        if page['offset'] != i * 100 or len(page['rows']) > 100 or page.get('warnings') or query.scheme != 'https' or query.netloc != 'api.liquipedia.net' or query.path != '/api/v3/' + kind or args.get('wiki') != ['callofduty'] or args.get('offset') != [str(page['offset'])] or args.get('limit') != ['100']:
            raise ValueError('Invalid API page provenance')
        # ISO UTC fetch timestamp, checked without guessing a local timezone.
        from datetime import datetime
        datetime.fromisoformat(page['fetchedAt'].replace('Z', '+00:00'))
        for row in page['rows']:
            if not isinstance(row, dict) or not isinstance(row.get('pagename'), str) or not row['pagename'] or not isinstance(row.get('objectname'), str) or row.get('namespace') != 0 or not isinstance(row.get('pageid'), int) or row['pageid'] <= 0:
                raise ValueError('Missing source identity')
            rows.append({'row': row, 'sourceUrl': source_url(row['pagename']), 'apiUrl': page['url'], 'fetchedAt': page['fetchedAt']})
    if len(rows) != data['summary']['rawRows'] or len(rows) != data['summary']['uniqueRecords']:
        raise ValueError('Unexpected duplicate source rows or export totals')
    keys = [(r['row']['pageid'], r['row']['objectname']) for r in rows]
    if len(set(keys)) != len(keys):
        raise ValueError('Duplicate/conflicting source identities')
    if collections.Counter(digest(r['row']) for r in rows) != collections.Counter(digest(r['row']) for r in data['records']):
        raise ValueError('Selected rows disagree with exported records')
    return data, rows

def build(player_path, team_path):
    player_export, players = read_export(player_path, 'player')
    team_export, teams = read_export(team_path, 'team')
    catalogue = json.loads((ROOT / 'data/players/guess-profiles.json').read_text())
    evidence = json.loads((ROOT / 'data/players/guess-profile-evidence.json').read_text())
    proofs = {r['playerId']: r for r in evidence['players']}
    source_index = collections.defaultdict(list)
    team_index = collections.defaultdict(list)
    for record in players:
        source_index[record['sourceUrl']].append(record)
    for record in teams:
        team_index[record['row']['pagename']].append(record)
    accepted, rejected, accepted_teams = [], [], {}
    for profile in catalogue['players']:
        proof = proofs.get(profile.get('evidence', {}).get('bpPlayerId'))
        if not proof or proof.get('bpBirthDate') != profile['birthDate'] or proof.get('wikiBirthDate') != profile['birthDate'] or proof.get('role') != profile['role'] or not profile.get('teamDate'):
            raise ValueError('Existing profile eligibility evidence changed; re-review required')
        links = {s for s in profile['sources'] if s.startswith('https://liquipedia.net/callofduty/')}
        candidates = [r for link in links for r in source_index[link]]
        reason = None
        if len(candidates) != 1:
            reason = 'source_not_collected' if not candidates else 'ambiguous_source'
        else:
            record = candidates[0]
            row = record['row']
            if norm(row.get('id', '')) != norm(profile['handle']):
                reason = 'handle_disagreement_requires_alias_evidence'
            elif COUNTRIES.get(profile['countryCode']) != row.get('nationality'):
                reason = 'nationality_disagreement'
            elif not isinstance(row.get('name'), str) or not row['name'].strip():
                reason = 'missing_name'
            elif row.get('type') not in ['player', 'staff'] or row.get('status') not in ['Active', 'Inactive', 'Retired', 'Passed Away']:
                reason = 'unknown_status_or_type'
        if reason:
            rejected.append({'profileId': profile['id'], 'handle': profile['handle'], 'reason': reason})
            continue
        # A team link describes only the fetched profile, never the historical game clue.
        related = team_index.get(row.get('teampagename'), [])
        team_id = None
        if len(related) == 1:
            t = related[0]
            team_id = 'lp-team-' + str(t['row']['pageid']) + '-' + digest(t['row']['objectname'])[:10]
            accepted_teams[team_id] = {'id': team_id, 'name': t['row']['name'], 'pagename': t['row']['pagename'], 'sourceUrl': t['sourceUrl'], 'fetchedAt': t['fetchedAt'], 'evidence': t}
        accepted.append({'profileId': profile['id'], 'handle': profile['handle'], 'pageid': row['pageid'], 'objectname': row['objectname'], 'pagename': row['pagename'], 'realName': row['name'], 'nationality': row['nationality'], 'listedStatus': row['status'], 'listedType': row['type'], 'sourceUrl': record['sourceUrl'], 'fetchedAt': record['fetchedAt'], 'listedTeamReference': row.get('teampagename', ''), 'listedTeamId': team_id, 'verification': 'existing-profile-source-handle-country-and-game-evidence-agree', 'evidence': record})
    if len({r['profileId'] for r in accepted}) != len(accepted) or len({r['pageid'] for r in accepted}) != len(accepted):
        raise ValueError('An identity was linked to multiple game profiles')
    inputs = {'playerExportSha256': hashlib.sha256(player_path.read_bytes()).hexdigest(), 'teamExportSha256': hashlib.sha256(team_path.read_bytes()).hexdigest(), 'gameCatalogueSha256': digest(catalogue), 'gameEvidenceSha256': digest(evidence)}
    batch_id = 'lp-' + digest(inputs)[:20]
    imported = {'schemaVersion': 1, 'batchId': batch_id, 'attribution': LICENSE, 'inputs': inputs, 'players': accepted, 'teams': sorted(accepted_teams.values(), key=lambda t: t['id'])}
    report = {'batchId': batch_id, 'sourcePlayerRecords': len(players), 'sourceTeamRecords': len(teams), 'importedIdentityRecords': len(accepted), 'importedLinkedTeamRecords': len(accepted_teams), 'newPlayableTargets': 0, 'existingPlayableTargets': len(catalogue['players']), 'playerPagination': player_export['summary']['status'], 'teamPagination': team_export['summary']['status'], 'rejectedExistingProfiles': rejected, 'unapprovedSourcePlayerRecords': len(players) - len(accepted), 'limits': ['Identity enrichment only; no new playable targets qualify from these export fields.', 'No birth dates, AR/SMG/Flex roles, historical team clues or full careers are inferred.', 'Current staff/retired labels do not invalidate established playing history.']}
    return imported, report

def write_atomic(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode='w', dir=path.parent, delete=False) as f:
        json.dump(value, f, ensure_ascii=False, indent=2)
        f.write('\n')
        temporary = pathlib.Path(f.name)
    temporary.replace(path)

def apply(imported, report):
    previous = json.loads(DEST.read_text())
    if previous == imported:
        return 'unchanged'
    audit_path = ROOT / 'data/liquipedia/batches' / (imported['batchId'] + '.json')
    if audit_path.exists():
        audit = json.loads(audit_path.read_text())
        if audit['catalogueSha256'] != digest(imported) or audit['previousCatalogue'] != previous:
            raise ValueError('Batch already exists with different history; inspect before reapplying')
    else:
        write_atomic(audit_path, {'report': report, 'catalogueSha256': digest(imported), 'previousCatalogue': previous})
    write_atomic(DEST, imported)
    return 'applied'

def rollback(batch_id):
    if not batch_id.startswith('lp-') or len(batch_id) != 23 or any(c not in '0123456789abcdef' for c in batch_id[3:]):
        raise ValueError('Invalid batch ID')
    current = json.loads(DEST.read_text())
    audit = json.loads((ROOT / 'data/liquipedia/batches' / (batch_id + '.json')).read_text())
    if current.get('batchId') != batch_id or digest(current) != audit['catalogueSha256']:
        raise ValueError('Current catalogue differs; rollback refused')
    write_atomic(DEST, audit['previousCatalogue'])

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('players', nargs='?', type=pathlib.Path)
    parser.add_argument('teams', nargs='?', type=pathlib.Path)
    action = parser.add_mutually_exclusive_group()
    action.add_argument('--apply', action='store_true')
    action.add_argument('--rollback')
    args = parser.parse_args()
    if args.rollback:
        if args.players or args.teams:
            parser.error('Rollback takes only a batch ID')
        rollback(args.rollback)
        print(json.dumps({'rolledBack': args.rollback}))
    else:
        if not args.players or not args.teams:
            parser.error('Provide both player and team exports')
        imported, report = build(args.players, args.teams)
        report['action'] = apply(imported, report) if args.apply else 'dry-run'
        print(json.dumps(report, ensure_ascii=False, indent=2))

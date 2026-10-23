"""Fixed HA alarm transport and verified installation of the local sound asset."""
import hashlib
import json
import os
import shutil
import tempfile
import time
from pathlib import Path

SPEAKERS = ('media_player.big_speaker','media_player.kitchen_speaker')
ALARM_ID = 'input_text.le_carnet_larm_id'
ACTIVE = 'input_boolean.le_carnet_larm_aktiv'


def install_sound(source=None, destination=None):
    source = Path(source or Path(__file__).parent / 'media')
    destination = Path(destination or os.environ.get('CARNET_MEDIA_DIR','/media/le-carnet'))
    manifest = json.loads((source/'timer-alarm-v1.json').read_text(encoding='utf-8'))
    data = (source/'timer-alarm-v1.mp3').read_bytes()
    if hashlib.sha256(data).hexdigest() != manifest['sha256']:
        raise ValueError('Larmfilens kontrollsumma stämmer inte')
    destination.mkdir(parents=True,exist_ok=True)
    target = destination/'timer-alarm-v1.mp3'
    if target.exists():
        previous = hashlib.sha256(target.read_bytes()).hexdigest()
        if previous == manifest['sha256']:
            return
        shutil.copy2(target,destination/f'timer-alarm-v1.before-{previous[:12]}.mp3')
    handle, name = tempfile.mkstemp(prefix='alarm-',suffix='.tmp',dir=destination)
    try:
        with os.fdopen(handle,'wb') as file:
            file.write(data)
            file.flush()
            os.fsync(file.fileno())
        os.replace(name,target)
    finally:
        if os.path.exists(name): os.unlink(name)


class AlarmBridge:
    def __init__(self, request): self.request = request

    def state(self, entity):
        return self.request('states/'+entity, timeout=2)

    def ready(self):
        try:
            return (self.state('script.le_carnet_starta_timerlarm')['state']=='off'
                    and self.state('script.le_carnet_stoppa_timerlarm')['state']=='off'
                    and self.state(ACTIVE)['state']=='off')
        except (OSError,ValueError,RuntimeError): return False

    def start(self, alarm_id, until_at):
        self.request('services/script/turn_on',{'entity_id':'script.le_carnet_starta_timerlarm',
                     'variables':{'alarm_id':alarm_id,'ends_at':until_at}}, timeout=3)
        observed = {}
        deadline = time.monotonic()+5
        accepted = False
        while time.monotonic()<deadline:
            accepted = self.state(ALARM_ID).get('state')==alarm_id
            for entity in SPEAKERS:
                try:
                    player = self.state(entity)
                except (OSError,ValueError,RuntimeError):
                    observed[entity]='status_unavailable'
                    continue
                attrs = player.get('attributes',{})
                own = ('timer-alarm-v1.mp3' in str(attrs.get('media_content_id',''))
                       or attrs.get('media_title')=='Le Carnet timerlarm')
                if own and player.get('state')=='playing': observed[entity]='start_observed'
                elif player.get('state') in ('unavailable','unknown'): observed[entity]='unavailable'
            if accepted and len(observed)==2: break
            time.sleep(0.2)
        for entity in SPEAKERS: observed.setdefault(entity,'start_not_confirmed')
        if not accepted: raise RuntimeError('HA har inte bekräftat larm-ID')
        result = {'speakers':observed}
        if any(value!='start_observed' for value in observed.values()):
            self.notify(alarm_id,'Alla högtalare kunde inte bekräftas spela larmet')
        return result

    def stop(self, alarm_id):
        self.request('services/script/le_carnet_stoppa_timerlarm',{'alarm_id':alarm_id}, timeout=6)
        return {'stop_sent':True}

    def active(self, alarm_id):
        return self.state(ALARM_ID).get('state')==alarm_id and self.state(ACTIVE).get('state')=='on'

    def notify(self, alarm_id, reason):
        self.request('services/persistent_notification/create',{
            'notification_id':'le_carnet_timer_delivery', 'title':'Le Carnet: timerlarm behöver kontrolleras',
            'message':f'Timern är klar. Larm {alarm_id[:8]}: {reason}. Gamla eller osäkert levererade larm spelas inte om.'})

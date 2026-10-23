"""Build-only: pip install lameenc==1.9.0. Synthesised signal, CC0-1.0."""
import array
import hashlib
import json
import math
from pathlib import Path
import lameenc

rate = 44100
seconds = 29
samples = array.array('h')
peak = 0
energy = 0
for i in range(rate * seconds):
    t = i / rate
    phase = t % 1.8
    pulse = int(phase / 0.36)
    local = phase % 0.36
    value = 0.0
    if pulse < 3 and local < 0.24:
        envelope = min(1, local / 0.02, (0.24-local) / 0.03)
        frequency = (660, 880, 990)[pulse]
        value = 0.27 * envelope * (math.sin(2*math.pi*frequency*t) + 0.2*math.sin(4*math.pi*frequency*t)) / 1.2
    value *= min(1, t/0.05, (seconds-t)/0.1)
    sample = round(value * 32767)
    samples.append(sample)
    peak = max(peak,abs(sample))
    energy += sample*sample

encoder = lameenc.Encoder()
encoder.set_bit_rate(128)
encoder.set_in_sample_rate(rate)
encoder.set_channels(1)
encoder.set_quality(2)
encoded = encoder.encode(samples.tobytes()) + encoder.flush()
folder = Path(__file__).resolve().parents[1] / 'home-assistant-addon/rootfs/app/media'
folder.mkdir(parents=True,exist_ok=True)
target = folder / 'timer-alarm-v1.mp3'
target.write_bytes(encoded)
# MP3 frame length is 1152 samples. CBR payload estimates also include encoder padding.
manifest = {'file':target.name, 'sha256':hashlib.sha256(encoded).hexdigest(),
            'pcm_seconds':seconds,'max_seconds':30,'sample_rate':rate,'bit_rate':128000,
            'channels':1,'peak_dbfs':round(20*math.log10(peak/32767),2),
            'rms_dbfs':round(20*math.log10(math.sqrt(energy/len(samples))/32767),2),
            'license':'CC0-1.0','source':'Original synthesised three-tone signal; scripts/generate-timer-alarm.py',
            'encoder':'lameenc 1.9.0'}
(folder / 'timer-alarm-v1.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(json.dumps(manifest))

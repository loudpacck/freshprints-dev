#!/usr/bin/env python3
from PIL import Image
import numpy as np

files = [
    'public/pantheon_wars_assets/extras/greek/extra_birds_greek.png',
    'public/pantheon_wars_assets/extras/greek/extra_fire_greek.png',
    'public/pantheon_wars_assets/extras/greek/extra_smoke_greek.png',
    'public/pantheon_wars_assets/extras/greek/extra_ashes_greek.png',
    'public/pantheon_wars_assets/extras/greek/extra_enviroparticles_greek.png',
    'public/pantheon_wars_assets/buildings/greek/bldg_townhall_greek_t1.png',
    'public/pantheon_wars_assets/buildings/temples/temple_pantheon_citadel.png',
]

for f in files:
    img = Image.open(f).convert('RGBA')
    arr = np.array(img)
    opaque = int((arr[:,:,3] > 0).sum())
    name = f.split('/')[-1]
    print(f"{name}: {img.width}x{img.height} opaque={opaque}")

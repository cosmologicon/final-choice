# Pack images onto a single texture
# https://gamedev.stackexchange.com/a/2839

import pygame, glob

def imgs():
	for imgname in glob.glob("../../pyjam/final-choice/data/img/*.png"):
		iname = imgname.split("/")[-1][:-4]
		# if "rift" in iname: continue
		img = pygame.image.load(imgname).convert_alpha()
		yield iname, img

pygame.init()
pygame.display.set_mode((200, 200))

if False:
	# 766197
	# Even without the rift images (which we might not use) it's over 512x512.
	# So go with 1024x1024
	total = 0
	for iname, img in imgs():
		w, h = img.get_size()
		w += 2
		h += 2
		print(iname, w, h)
		total += w * h
	print(total)
	exit()

s = 1024
tpack = pygame.Surface((s, s)).convert_alpha()
tpack.fill((0, 0, 0, 0))
x, y = 0, 0
h = None
imgs = dict(imgs())
imgh = { imgname: img.get_height() + 4 for imgname, img in imgs.items() }
imgw = { imgname: img.get_width() + 4 for imgname, img in imgs.items() }
while imgs:
	if h is None:
		h = max(imgh[i] for i in imgs)
	opts = [i for i in imgs if imgh[i] <= h and imgw[i] + x <= s ]
	if not opts:
		y += h
		x = 0
		h = None
		continue
	i = max(opts, key = lambda i: imgh[i] * imgw[i])
	tpack.blit(imgs[i], (x, y))
	dw = (imgw[i] / 2 - 2) / s
	dh = (imgh[i] / 2 - 2) / s
	print('''\t"%s": [%s, %s, %s, %s],''' % (i, x/s + dw, y/s + dh, dw, dh))
	x += imgw[i]
	del imgs[i]
y += h
print(1024 * y)
pygame.image.save(tpack, "../data/sprites.png")

# Convert the asteroids from the PyWeek version into a single texture

import pygame

a = 128
s = 8 * a

pygame.init()
pygame.display.set_mode((s, s))

rocks = pygame.Surface((s, s)).convert_alpha()
rocks.fill((0, 0, 0, 0))

for jframe in range(61):
	img = pygame.image.load("../../pyjam/final-choice/data/rock/main-%d.png" % jframe).convert_alpha()
	w0, h0 = img.get_size()
	rect = pygame.Rect(0, 0, min(w0, h0), min(w0, h0))
	rect0 = img.get_rect(center = rect.center)
	panel = pygame.Surface(rect.size).convert_alpha()
	panel.fill((0, 0, 0, 0))
	panel.blit(img, rect0)
	panel = pygame.transform.smoothscale(panel, (a, a))
	y, x = divmod(jframe, 8)
	x, y = x * a, y * a
	rocks.blit(panel, (x, y))

pygame.image.save(rocks, "../data/rocks.png")

	
	

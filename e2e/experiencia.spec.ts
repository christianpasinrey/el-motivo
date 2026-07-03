import { test, expect } from '@playwright/test';

test('cartelera muestra las obras y navega a una', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('h1')).toContainText('Cada obra esconde una historia');
  const cartel = page.locator('.cartel').first();
  await expect(cartel).toBeVisible();
  await cartel.click();
  await expect(page).toHaveURL(/obra\/shostakovich-5/);
});

test('rito de entrada revela la experiencia', async ({ page }) => {
  await page.goto('./obra/shostakovich-5/');
  await expect(page.locator('#rito h1')).toContainText('Sinfonía nº 5');
  await page.locator('#entrar').click();
  await expect(page.locator('#rito')).toBeHidden({ timeout: 5000 });
  await expect(page.locator('#boton-cine')).toBeVisible();
});

test('la narrativa es legible sin JS', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4321/el-motivo/obra/shostakovich-5/');
  await expect(page.locator('.narrativa').first()).toBeVisible();
  await ctx.close();
});

test('modo cine se activa y Escape lo corta', async ({ page }) => {
  await page.goto('./obra/shostakovich-5/');
  await page.locator('#entrar').click();
  await page.locator('#boton-cine').click();
  await expect(page.locator('body')).toHaveClass(/modo-cine/);
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/modo-cine/);
});

test('momento de escucha existe con timestamp', async ({ page }) => {
  await page.goto('./obra/shostakovich-5/');
  const momento = page.locator('.momento').first();
  await expect(momento).toHaveAttribute('data-segundos', /\d+/);
});

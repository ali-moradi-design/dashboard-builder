import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('switches to Persian and right-to-left', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dashboards')
  await page.getByRole('radio', { name: 'فا' }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('داشبوردها')
})

test('switches theme', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('radio', { name: 'Dark' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('home page has no accessibility violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

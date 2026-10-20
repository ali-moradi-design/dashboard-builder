import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('renders the sample dashboard with all widget types', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Sales overview' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Sales overview' })).toBeVisible()
  // Every widget finished loading: no skeletons left, no error states.
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 30_000 })
  await expect(page.getByText('The query failed.')).toHaveCount(0)
  await expect(page.locator('[data-widget]')).toHaveCount(15)
  await expect(page.locator('canvas').first()).toBeVisible()
  await expect(page.getByRole('table', { name: 'Top products' }).getByRole('row')).toHaveCount(6)
  const results = await new AxeBuilder({ page }).exclude('canvas').analyze()
  expect(results.violations).toEqual([])
})

test('the global date filter updates widgets and the URL', async ({ page }) => {
  await page.goto('/d/sample-sales')
  const revenue = page.locator('[data-widget="kpi-revenue"] [data-testid="kpi-value"]')
  await expect(revenue).toHaveText(/€/, { timeout: 30_000 })
  const allTime = await revenue.textContent()
  await page.getByRole('button', { name: /Date range/ }).click()
  await page.getByRole('button', { name: '2024' }).click()
  await expect(page).toHaveURL(/from=2024-01-01&to=2024-12-31/)
  await expect(revenue).not.toHaveText(allTime ?? '')
  // The URL alone reproduces the view.
  await page.reload()
  await expect(page.getByRole('button', { name: /Date range/ })).toContainText('2024')
})

test('works in Persian, right to left', async ({ page }) => {
  await page.goto('/d/sample-sales')
  await page.getByRole('radio', { name: 'فا' }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('[data-widget="kpi-orders"] [data-testid="kpi-value"]')).toHaveText(
    /[۰-۹]/,
    { timeout: 30_000 },
  )
  await expect(page.getByText('نسبت به سال قبل').first()).toBeVisible()
})

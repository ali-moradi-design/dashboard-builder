import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('previews a sample dataset with DuckDB in the browser', async ({ page }) => {
  await page.goto('/datasets')
  await expect(page.getByRole('heading', { name: 'Store orders' })).toBeVisible()
  const table = page.getByRole('table', { name: 'Preview' })
  await expect(table.getByRole('row')).toHaveCount(11, { timeout: 30_000 })
  await expect(page.getByText('Rows 1–10 of 200')).toBeVisible()
  // Sort by revenue (TanStack Table).
  await table.getByRole('button', { name: 'Revenue' }).click()
  await expect(table.getByRole('columnheader', { name: 'Revenue' })).toHaveAttribute(
    'aria-sort',
    'descending',
  )
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('imports a CSV file that stays in the browser', async ({ page }) => {
  await page.goto('/datasets')
  const csv = 'city,visits,day\nBerlin,10,2025-01-01\nParis,7,2025-01-02\nTehran,12,2025-01-03\n'
  await page
    .getByTestId('csv-input')
    .setInputFiles({ name: 'visits.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
  await expect(page.getByRole('heading', { name: 'visits' })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('table', { name: 'Preview' }).getByRole('row')).toHaveCount(4)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'visits' })).toBeVisible()
  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('heading', { name: 'Store orders' })).toBeVisible()
})

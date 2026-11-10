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
  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(page.getByText('Rows 11–20 of 200')).toBeVisible()
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

test('a dashboard on an imported dataset still works after a reload', async ({ page }) => {
  await page.goto('/datasets')
  const csv = 'city,visits,day\nBerlin,10,2025-01-01\nParis,7,2025-01-02\nTehran,12,2025-01-03\n'
  await page
    .getByTestId('csv-input')
    .setInputFiles({ name: 'visits.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
  await expect(page.getByRole('heading', { name: 'visits' })).toBeVisible({ timeout: 30_000 })

  await page.goto('/')
  await page.getByRole('button', { name: 'New dashboard' }).click()
  await page.getByTestId('palette-kpi').click()
  await page.getByRole('button', { name: 'Edit query' }).click()
  await page.getByLabel('Dataset').selectOption({ label: 'visits' })
  await page.getByRole('button', { name: 'Apply to widget' }).click()
  await expect(page.getByTestId('kpi-value')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Saved')).toBeVisible()

  // Imported datasets are read from IndexedDB at startup, on every page.
  await page.reload()
  await expect(page.getByTestId('kpi-value')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('The dataset of this widget is missing.')).toHaveCount(0)
})

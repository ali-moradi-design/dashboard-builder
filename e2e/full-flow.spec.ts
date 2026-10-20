import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test('builds a full dashboard, exports it and imports it again', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'New dashboard' }).click()
  await expect(page).toHaveURL(/\/edit/)

  const title = page.getByLabel('Dashboard title')
  await title.fill('Germany sales')
  for (const type of ['heading', 'kpi', 'line', 'table'])
    await page.getByTestId(`palette-${type}`).click()
  await expect(page.locator('[data-testid="editable-grid"] [data-widget]')).toHaveCount(4)

  // Limit the table to Germany in the query builder (keyboard path).
  await page.getByRole('button', { name: 'Edit query' }).click()
  const dialog = page.getByRole('dialog', { name: /Query builder/ })
  await dialog.getByRole('button', { name: 'Add Country' }).click()
  await page.getByRole('button', { name: 'As a filter' }).click()
  await dialog.getByLabel('Value').fill('Germany')
  await dialog.getByRole('button', { name: 'Apply to widget' }).click()
  await expect(page.getByTestId('settings-query')).toContainText('Country is Germany')

  await expect(page.getByText('Saved')).toBeVisible()
  await page.getByRole('link', { name: 'Done' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Germany sales' })).toBeVisible()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 30_000 })
  await expect(page.getByText('The query failed.')).toHaveCount(0)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('germany-sales.dashboard.json')
  const path = await download.path()
  const json = JSON.parse(await readFile(path, 'utf8')) as {
    schemaVersion: number
    widgets: unknown[]
  }
  expect(json.schemaVersion).toBe(1)
  expect(json.widgets).toHaveLength(4)

  await page.goto('/')
  await page.getByTestId('import-input').setInputFiles(path)
  await expect(page.getByRole('heading', { level: 1, name: 'Germany sales' })).toBeVisible()
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Germany sales' })).toHaveCount(2)
})

test('rejects an invalid dashboard file', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('import-input').setInputFiles({
    name: 'x.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"schemaVersion":1,"id":"x"}'),
  })
  await expect(page.getByRole('alert')).toContainText('This is not a dashboard file')
})

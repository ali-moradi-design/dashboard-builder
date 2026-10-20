import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

async function newDashboard(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'New dashboard' }).click()
  await expect(page).toHaveURL(/\/edit/)
  await expect(page.getByText('This dashboard is empty.')).toBeVisible()
}

const widgets = (page: Page) => page.locator('[data-testid="editable-grid"] [data-widget]')

test('adds widgets, edits settings, undoes and redoes', async ({ page }) => {
  await newDashboard(page)
  await page.getByTestId('palette-kpi').click()
  await page.getByTestId('palette-text').click()
  await expect(widgets(page)).toHaveCount(2)
  await expect(page.getByRole('heading', { name: /Settings · Text/ })).toBeVisible()

  const title = page.getByLabel('Title', { exact: true })
  await title.fill('My notes')
  await expect(page.locator('[data-widget] h3', { hasText: 'My notes' })).toBeVisible()

  await page.getByRole('heading', { name: /Settings/ }).click()
  await page.keyboard.press('Control+z')
  await expect(page.locator('[data-widget] h3', { hasText: 'My notes' })).toHaveCount(0)
  await page.keyboard.press('Control+z')
  await expect(widgets(page)).toHaveCount(1)
  await page.keyboard.press('Control+Shift+z')
  await expect(widgets(page)).toHaveCount(2)
  await page.getByRole('button', { name: 'Redo' }).click()
  await expect(page.locator('[data-widget] h3', { hasText: 'My notes' })).toBeVisible()

  // Autosave: the dashboard survives a reload.
  await expect(page.getByText('Saved')).toBeVisible()
  await page.reload()
  await expect(widgets(page)).toHaveCount(2)
  const results = await new AxeBuilder({ page })
    .exclude('canvas')
    .exclude('.react-grid-layout')
    .analyze()
  expect(results.violations).toEqual([])
})

test('drags a widget type from the palette onto the grid', async ({ page }) => {
  await newDashboard(page)
  await page
    .getByTestId('palette-bar')
    .dragTo(page.getByTestId('editable-grid'), { targetPosition: { x: 200, y: 80 } })
  await expect(widgets(page)).toHaveCount(1)
  await expect(page.locator('[data-widget] canvas')).toBeVisible({ timeout: 30_000 })
})

test('builds a query by dragging fields', async ({ page }) => {
  await newDashboard(page)
  await page.getByTestId('palette-table').click()
  await page.getByRole('button', { name: 'Edit query' }).click()
  const dialog = page.getByRole('dialog', { name: /Query builder/ })
  await expect(dialog).toBeVisible()
  // Remove the default group-by, then drag Country into group by with the pointer.
  await dialog
    .getByRole('region', { name: 'Group by' })
    .getByRole('button', { name: 'Remove' })
    .click()
  const source = dialog.getByLabel('Drag Country')
  const target = dialog.getByRole('region', { name: 'Group by' })
  const s = await source.boundingBox()
  const t = await target.boundingBox()
  if (!s || !t) throw new Error('no boxes')
  await page.mouse.move(s.x + 20, s.y + s.height / 2)
  await page.mouse.down()
  await page.mouse.move(s.x + 40, s.y + s.height / 2, { steps: 5 })
  await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 15 })
  await page.mouse.up()
  await expect(dialog.getByTestId('qb-sentence')).toContainText('by Country')
  // Keyboard-friendly path: add a filter with the + menu.
  await dialog.getByRole('button', { name: 'Add Country' }).click()
  await page.getByRole('button', { name: 'As a filter' }).click()
  await dialog.getByLabel('Value').fill('Germany')
  await expect(dialog.getByTestId('qb-sentence')).toContainText('Country is Germany')
  await expect(dialog.getByRole('table', { name: 'Preview' }).getByRole('row')).toHaveCount(2, {
    timeout: 30_000,
  })
  await dialog.getByRole('button', { name: 'Apply to widget' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByTestId('settings-query')).toContainText('Country is Germany')
})

test('moves a widget on the grid and undoes the move', async ({ page }) => {
  await newDashboard(page)
  await page.getByTestId('palette-kpi').click()
  const item = page.locator('.react-grid-item').first()
  const before = await item.boundingBox()
  if (!before) throw new Error('no box')
  await page.mouse.move(before.x + 60, before.y + 60)
  await page.mouse.down()
  await page.mouse.move(before.x + 300, before.y + 60, { steps: 12 })
  await page.mouse.up()
  await expect.poll(async () => (await item.boundingBox())?.x).toBeGreaterThan(before.x + 100)
  await page.keyboard.press('Control+z')
  await expect
    .poll(async () => Math.round((await item.boundingBox())?.x ?? 0))
    .toBe(Math.round(before.x))
})

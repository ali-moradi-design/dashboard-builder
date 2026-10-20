import { createRegistry } from '@formweave/engine'
import { allFields } from '@formweave/engine/fields/all'
import { createRenderers, Form } from '@formweave/react'
import { basicRenderers } from '@formweave/react/fields'
import '@formweave/react/styles.css'

import type { Lang } from '../../model'
import type { FormDocument, FormValues } from './document'
import './theme.css'

/*
 * Adapter for widget settings forms, rendered by the formweave engine from the
 * user's form-builder project (vendor/form-builder submodule, pinned commit).
 * When the packages are published on npm, only the import paths change.
 */
export interface SettingsFormProps {
  document: FormDocument
  values: FormValues
  onChange: (values: FormValues, name: string | undefined) => void
  locale: Lang
  digits?: 'native' | 'latin'
}

const registry = createRegistry(allFields)
const renderers = createRenderers(basicRenderers)

/** Live settings form: no buttons, every change is reported. */
export function SettingsForm({
  document,
  values,
  onChange,
  locale,
  digits = 'native',
}: SettingsFormProps) {
  return (
    <Form
      className="fw-form settings-form"
      schema={document}
      registry={registry}
      renderers={renderers}
      locale={locale}
      digits={digits}
      defaultValues={values}
      actions={false}
      onChange={onChange}
    />
  )
}

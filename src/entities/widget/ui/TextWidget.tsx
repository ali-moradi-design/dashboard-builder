import { Markdown } from '@/shared/ui'

import type { RendererProps } from './types'

export function TextWidget({ settings: s }: RendererProps<'text'>) {
  return (
    <div className="h-full overflow-auto">
      <Markdown source={s.content} />
    </div>
  )
}

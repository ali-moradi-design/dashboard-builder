import { Redo2, Undo2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from 'zustand'

import { useEditor } from '@/entities/dashboard'
import { Button } from '@/shared/ui'

import { useUndoRedoShortcuts } from '../model/useShortcuts'

export function UndoRedoButtons() {
  const { t } = useTranslation()
  useUndoRedoShortcuts()
  const canUndo = useStore(useEditor.temporal, (s) => s.pastStates.length > 0)
  const canRedo = useStore(useEditor.temporal, (s) => s.futureStates.length > 0)
  const mod =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+'
  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon"
        onClick={() => useEditor.getState().undo()}
        disabled={!canUndo}
        aria-label={t('editor.undo')}
        title={`${t('editor.undo')} (${mod}Z)`}
      >
        <Undo2 className="rtl:-scale-x-100" aria-hidden />
      </Button>
      <Button
        size="icon"
        onClick={() => useEditor.getState().redo()}
        disabled={!canRedo}
        aria-label={t('editor.redo')}
        title={`${t('editor.redo')} (${mod}Shift+Z)`}
      >
        <Redo2 className="rtl:-scale-x-100" aria-hidden />
      </Button>
    </div>
  )
}

import { useState } from 'react'
import { useStore } from '../lib/store'
import { uid } from '../lib/seed'
import { taskKeys, taskProgress } from '../lib/derive'
import type { Task } from '../lib/types'
import {
  Checkbox,
  ChevronIcon,
  EmptyState,
  PencilIcon,
  PlusIcon,
  ProgressBar,
  SectionTitle,
  TrashIcon,
} from './ui'
import { formatLong, relativeLabel } from '../lib/date'

export default function TaskChecklist() {
  const { data, update, date, dayLog, updateDay } = useStore()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [adding, setAdding] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [showCategoryForm, setShowCategoryForm] = useState(false)

  const progress = taskProgress(data.tasks, dayLog)

  const setKey = (key: string, value: boolean) =>
    updateDay(date, (day) => {
      if (value) day.tasks[key] = true
      else delete day.tasks[key]
    })

  const toggleTask = (task: Task, value: boolean) =>
    updateDay(date, (day) => {
      for (const key of taskKeys(task)) {
        if (value) day.tasks[key] = true
        else delete day.tasks[key]
      }
    })

  const addTask = (categoryId: string) => {
    const label = draft.trim()
    if (!label) return
    update((d) => {
      d.tasks.push({ id: uid(), label, categoryId, subtasks: [] })
    })
    setDraft('')
    setAdding(null)
  }

  const renameTask = (id: string) => {
    const label = draft.trim()
    if (label) update((d) => {
      const t = d.tasks.find((t) => t.id === id)
      if (t) t.label = label
    })
    setEditing(null)
    setDraft('')
  }

  const deleteTask = (id: string) =>
    update((d) => {
      d.tasks = d.tasks.filter((t) => t.id !== id)
    })

  const addSubtask = (taskId: string, label: string) =>
    update((d) => {
      const t = d.tasks.find((t) => t.id === taskId)
      if (t) t.subtasks.push({ id: uid(), label })
    })

  const deleteSubtask = (taskId: string, subId: string) =>
    update((d) => {
      const t = d.tasks.find((t) => t.id === taskId)
      if (t) t.subtasks = t.subtasks.filter((s) => s.id !== subId)
    })

  return (
    <div className="space-y-4">
      <div className="card">
        <SectionTitle
          title="Daily Tasks"
          subtitle={`${relativeLabel(date)} · ${formatLong(date)}`}
        />
        <div className="flex items-end justify-between gap-4">
          <div className="text-3xl font-semibold tabular-nums">
            {Math.round(progress.percent)}
            <span className="text-lg text-neutral-400">%</span>
          </div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            {progress.done} / {progress.total} selesai
          </div>
        </div>
        <ProgressBar percent={progress.percent} className="mt-3" />
      </div>

      {data.categories.map((cat) => {
        const tasks = data.tasks.filter((t) => t.categoryId === cat.id)
        const keys = tasks.flatMap(taskKeys)
        const done = keys.filter((k) => dayLog.tasks[k]).length
        const isOpen = !collapsed[cat.id]

        return (
          <div key={cat.id} className="card">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [cat.id]: isOpen }))}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span className="text-neutral-400">
                  <ChevronIcon open={isOpen} />
                </span>
                <span className="truncate text-sm font-semibold">{cat.name}</span>
                <span className="chip bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                  {done}/{keys.length}
                </span>
              </button>
              <button
                className="btn-icon"
                title="Tambah task"
                onClick={() => {
                  setAdding(adding === cat.id ? null : cat.id)
                  setDraft('')
                }}
              >
                <PlusIcon />
              </button>
              <button
                className="btn-icon"
                title="Hapus kategori"
                onClick={() => {
                  if (!confirm(`Hapus kategori "${cat.name}" beserta task di dalamnya?`)) return
                  update((d) => {
                    d.categories = d.categories.filter((c) => c.id !== cat.id)
                    d.tasks = d.tasks.filter((t) => t.categoryId !== cat.id)
                  })
                }}
              >
                <TrashIcon />
              </button>
            </div>

            {adding === cat.id && (
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  addTask(cat.id)
                }}
              >
                <input
                  autoFocus
                  className="field"
                  placeholder="Nama task baru…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" className="btn-primary">
                  Tambah
                </button>
              </form>
            )}

            {isOpen && (
              <div className="mt-2 space-y-1">
                {tasks.length === 0 && <EmptyState>Belum ada task di kategori ini.</EmptyState>}
                {tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    checkedKeys={dayLog.tasks}
                    onToggle={(v) => toggleTask(task, v)}
                    onToggleSub={setKey}
                    editing={editing === task.id}
                    draft={draft}
                    setDraft={setDraft}
                    onStartEdit={() => {
                      setEditing(task.id)
                      setDraft(task.label)
                    }}
                    onCommitEdit={() => renameTask(task.id)}
                    onDelete={() => deleteTask(task.id)}
                    onAddSub={(label) => addSubtask(task.id, label)}
                    onDeleteSub={(subId) => deleteSubtask(task.id, subId)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div className="card">
        {showCategoryForm ? (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const name = newCategory.trim()
              if (!name) return
              update((d) => d.categories.push({ id: uid(), name }))
              setNewCategory('')
              setShowCategoryForm(false)
            }}
          >
            <input
              autoFocus
              className="field"
              placeholder="Nama kategori baru…"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              Simpan
            </button>
          </form>
        ) : (
          <button className="btn-ghost w-full" onClick={() => setShowCategoryForm(true)}>
            <PlusIcon /> Tambah kategori
          </button>
        )}
      </div>
    </div>
  )
}

function TaskRow({
  task,
  checkedKeys,
  onToggle,
  onToggleSub,
  editing,
  draft,
  setDraft,
  onStartEdit,
  onCommitEdit,
  onDelete,
  onAddSub,
  onDeleteSub,
}: {
  task: Task
  checkedKeys: Record<string, boolean>
  onToggle: (v: boolean) => void
  onToggleSub: (key: string, v: boolean) => void
  editing: boolean
  draft: string
  setDraft: (v: string) => void
  onStartEdit: () => void
  onCommitEdit: () => void
  onDelete: () => void
  onAddSub: (label: string) => void
  onDeleteSub: (subId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [subDraft, setSubDraft] = useState('')
  const keys = taskKeys(task)
  const doneCount = keys.filter((k) => checkedKeys[k]).length
  const allDone = doneCount === keys.length

  if (editing) {
    return (
      <form
        className="flex gap-2 px-2 py-1"
        onSubmit={(e) => {
          e.preventDefault()
          onCommitEdit()
        }}
      >
        <input autoFocus className="field" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="submit" className="btn-primary">
          Simpan
        </button>
      </form>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-1">
        <Checkbox
          className="flex-1"
          checked={allDone}
          onChange={onToggle}
          label={task.label}
          sublabel={
            task.subtasks.length > 0 ? `${doneCount}/${task.subtasks.length} sub-item selesai` : undefined
          }
        />
        <button
          className="btn-icon"
          onClick={() => setExpanded((v) => !v)}
          title="Sub-item"
        >
          <ChevronIcon open={expanded} />
        </button>
        <button className="btn-icon" onClick={onStartEdit} title="Edit">
          <PencilIcon />
        </button>
        <button className="btn-icon" onClick={onDelete} title="Hapus">
          <TrashIcon />
        </button>
      </div>

      {expanded && (
        <div className="mb-2 ml-8 space-y-1 border-l border-neutral-200 pl-3 dark:border-neutral-800">
          {task.subtasks.map((sub) => {
            const key = `${task.id}:${sub.id}`
            return (
              <div key={sub.id} className="flex items-center gap-1">
                <Checkbox
                  className="flex-1"
                  checked={!!checkedKeys[key]}
                  onChange={(v) => onToggleSub(key, v)}
                  label={sub.label}
                />
                <button className="btn-icon" onClick={() => onDeleteSub(sub.id)} title="Hapus sub-item">
                  <TrashIcon />
                </button>
              </div>
            )
          })}
          <form
            className="flex gap-2 pt-1"
            onSubmit={(e) => {
              e.preventDefault()
              const label = subDraft.trim()
              if (!label) return
              onAddSub(label)
              setSubDraft('')
            }}
          >
            <input
              className="field"
              placeholder="Tambah sub-item…"
              value={subDraft}
              onChange={(e) => setSubDraft(e.target.value)}
            />
            <button type="submit" className="btn-ghost">
              <PlusIcon />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

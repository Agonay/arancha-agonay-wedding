'use client'

import { useEffect, useState } from 'react'
import { getTasks, createTask, toggleTask, deleteTask, type TaskInput } from '@/features/tasks/actions'
import { Plus, CheckCircle2, Circle, Trash2, Flag, CalendarDays, Loader2 } from 'lucide-react'

interface TaskItem {
  id: string
  title: string
  description: string | null
  done: boolean
  done_at: string | null
  due_date: string | null
  priority: string
  created_at: string
}

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  low: { color: 'text-blue-600 bg-blue-50', label: 'Baja' },
  medium: { color: 'text-amber-600 bg-amber-50', label: 'Media' },
  high: { color: 'text-red-600 bg-red-50', label: 'Alta' },
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<TaskInput>({ title: '', description: '', priority: 'low', due_date: '' })
  const [submitting, setSubmitting] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getTasks().then((data) => {
      if (active) {
        setTasks(data)
        setLoaded(true)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      const newTask = await createTask({
        title: form.title,
        description: form.description,
        priority: form.priority,
        due_date: form.due_date || null,
      })
      setTasks((prev) => [newTask, ...prev])
      setForm({ title: '', description: '', priority: 'low', due_date: '' })
      setShowForm(false)
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (id: string, done: boolean) => {
    setToggling(id)
    try {
      await toggleTask(id, done)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, done, done_at: done ? new Date().toISOString() : null }
            : t
        )
      )
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteTask(id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const pending = tasks.filter((t) => !t.done).length
  const completed = tasks.filter((t) => t.done).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tareas</h1>
          <p className="text-gray-500 mt-1">
            {pending} pendiente{pending !== 1 ? 's' : ''} · {completed} completada{completed !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 bg-sage text-white text-sm font-medium rounded-lg hover:bg-sage-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva tarea
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage"
              placeholder="Ej: Contratar fotógrafo"
              required
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Prioridad</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TaskInput['priority'] })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Fecha límite (opcional)</label>
              <input
                type="date"
                value={form.due_date || ''}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Descripción (opcional)</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage resize-none"
              rows={2}
              placeholder="Detalles..."
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-charcoal text-white text-sm font-medium rounded-lg hover:bg-warm-gray transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Añadir
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setForm({ title: '', description: '', priority: 'low', due_date: '' })
              }}
              className="px-4 py-2 text-sm text-warm-gray hover:text-charcoal transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border p-6">
        {!loaded && <p className="text-sm text-gray-400 py-4 text-center">Cargando...</p>}

        {loaded && tasks.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Flag className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Todavía no hay tareas</p>
          </div>
        )}

        <div className="space-y-2">
          {tasks.map((task) => {
            const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.low
            const overdue =
              !task.done && task.due_date && task.due_date < new Date().toISOString().slice(0, 10)
            return (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  task.done ? 'opacity-50 bg-gray-50 border-gray-200' : 'bg-white border-cream-dark'
                }`}
              >
                <button
                  onClick={() => handleToggle(task.id, !task.done)}
                  disabled={toggling === task.id}
                  className={`mt-0.5 flex-shrink-0 ${task.done ? 'text-emerald-600' : 'text-gray-300 hover:text-sage'}`}
                  title={task.done ? 'Desmarcar' : 'Completar'}
                >
                  {task.done ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.done ? 'line-through text-warm-gray' : 'text-charcoal'}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-sm text-warm-gray mt-0.5">{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${prio.color}`}>
                      <Flag className="h-3 w-3" />
                      {prio.label}
                    </span>
                    {task.due_date && (
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                          overdue ? 'text-red-600 bg-red-50' : 'text-gray-500 bg-gray-100'
                        }`}
                      >
                        <CalendarDays className="h-3 w-3" />
                        {new Date(`${task.due_date}T12:00:00`).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                        })}
                        {overdue && ' · vencida'}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

import { render, screen, fireEvent } from '@testing-library/react'
import { RulesTable } from './RulesTable'
import type { RoutingRule } from '../types/routing'

const rules: RoutingRule[] = [
  { id: '1', version: 'v1', weightPct: 80, status: 'active' },
  { id: '2', version: 'v2-canary', weightPct: 20, status: 'inactive' },
]

test('рендерит версии всех правил', () => {
  render(<RulesTable rules={rules} onDelete={jest.fn()} />)
  expect(screen.getByText('v1')).toBeInTheDocument()
  expect(screen.getByText('v2-canary')).toBeInTheDocument()
})

test('рендерит empty state когда правил нет', () => {
  render(<RulesTable rules={[]} onDelete={jest.fn()} />)
  expect(screen.getByRole('status')).toBeInTheDocument()
  expect(screen.getByText(/нет правил/i)).toBeInTheDocument()
})

test('открывает диалог подтверждения при клике Delete', () => {
  render(<RulesTable rules={rules} onDelete={jest.fn()} />)
  fireEvent.click(screen.getByLabelText('Удалить правило v1'))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByText(/v1/)).toBeInTheDocument()
})

test('вызывает onDelete с правильным id при подтверждении', () => {
  const onDelete = jest.fn()
  render(<RulesTable rules={rules} onDelete={onDelete} />)
  fireEvent.click(screen.getByLabelText('Удалить правило v1'))
  fireEvent.click(screen.getByText('Удалить'))
  expect(onDelete).toHaveBeenCalledWith('1')
  expect(onDelete).toHaveBeenCalledTimes(1)
})

test('закрывает диалог без удаления при нажатии Отмена', () => {
  const onDelete = jest.fn()
  render(<RulesTable rules={rules} onDelete={onDelete} />)
  fireEvent.click(screen.getByLabelText('Удалить правило v1'))
  fireEvent.click(screen.getByText('Отмена'))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(onDelete).not.toHaveBeenCalled()
})

test('кнопки задизейблены когда isPending=true', () => {
  render(<RulesTable rules={rules} onDelete={jest.fn()} isPending />)
  fireEvent.click(screen.getByLabelText('Удалить правило v1'))
  expect(screen.getByText('Удаление…')).toBeDisabled()
  expect(screen.getByText('Отмена')).toBeDisabled()
})

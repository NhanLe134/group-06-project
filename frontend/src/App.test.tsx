import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import * as menuApi from './api/menu'

describe('App - E-Menu (US-01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('hien thi danh sach mon khi tai thanh cong', async () => {
    vi.spyOn(menuApi, 'fetchMenuItems').mockResolvedValue([
      {
        id: '1',
        name: 'Pho Bo',
        description: null,
        price: 65000,
        image_url: null,
        category: 'Mon chinh',
        status: 'available',
      },
    ])

    render(<App />)

    expect(await screen.findByText('Pho Bo')).toBeInTheDocument()
  })

  it('hien thi nhan Het hang cho mon out_of_stock (REQ-09)', async () => {
    vi.spyOn(menuApi, 'fetchMenuItems').mockResolvedValue([
      {
        id: '2',
        name: 'Bo Luc Lac',
        description: null,
        price: 89000,
        image_url: null,
        category: 'Mon chinh',
        status: 'out_of_stock',
      },
    ])

    render(<App />)

    expect(await screen.findByText('Het hang')).toBeInTheDocument()
  })

  it('hien thi thong bao loi khi API fail', async () => {
    vi.spyOn(menuApi, 'fetchMenuItems').mockRejectedValue(new Error('network error'))

    render(<App />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})

import { useEffect, useState } from 'react'
import './App.css'
import { fetchMenuItems, type MenuItem } from './api/menu'

type LoadState = 'loading' | 'error' | 'empty' | 'ready'

function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + ' d'
}

export default function App() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [state, setState] = useState<LoadState>('loading')

  useEffect(() => {
    let cancelled = false
    fetchMenuItems()
      .then((data) => {
        if (cancelled) return
        setItems(data)
        setState(data.length === 0 ? 'empty' : 'ready')
      })
      .catch(() => {
        if (cancelled) return
        setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="menu-page">
      <h1>E-Menu</h1>

      {state === 'loading' && <p role="status">Dang tai menu...</p>}
      {state === 'error' && (
        <p role="alert">Khong the tai menu luc nay. Vui long thu lai sau.</p>
      )}
      {state === 'empty' && <p>Hien chua co mon nao trong menu.</p>}

      {state === 'ready' && (
        <ul className="menu-list">
          {items.map((item) => (
            <li key={item.id} className={item.status === 'out_of_stock' ? 'menu-item is-oos' : 'menu-item'}>
              <div className="menu-item-name">
                {item.name}
                {item.status === 'out_of_stock' && <span className="badge">Het hang</span>}
              </div>
              {item.description && <p className="menu-item-desc">{item.description}</p>}
              <div className="menu-item-price">{formatPrice(item.price)}</div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

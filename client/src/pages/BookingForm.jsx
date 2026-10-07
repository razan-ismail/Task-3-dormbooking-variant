import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { roomNumber: '', startDate: '', endDate: '', purpose: '' }

// Server sends dates as full ISO strings ("2026-10-10T00:00:00.000Z"),
// but <input type="date"> only accepts "YYYY-MM-DD".
function toDateInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export default function BookingForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // TODO (edit mode): when there is an `id`, load the booking and fill the form.
  useEffect(() => {
    if (!id) return

    let ignore = false

    async function load() {
      try {
        const res = await api.get(`/bookings/${id}`)
        const b = res.data.booking ?? res.data
        if (!ignore) {
          setForm({
            roomNumber: b.roomNumber ?? '',
            startDate: toDateInput(b.startDate),
            endDate: toDateInput(b.endDate),
            purpose: b.purpose ?? '',
          })
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message || err.message || 'Could not load booking')
        }
      }
    }

    load()
    return () => { ignore = true }
  }, [id])

  // TODO: update `form` when an input changes.
  function onChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // TODO: POST a new booking, or PATCH the existing one when editing,
  // then go back to /bookings. Show the server's error message on failure.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    // Do NOT send bookedBy — server takes the booker from your token.
    const payload = {
      roomNumber: form.roomNumber,
      startDate: form.startDate,
      endDate: form.endDate,
      purpose: form.purpose,
    }

    try {
      if (id) {
        await api.patch(`/bookings/${id}`, payload)
      } else {
        await api.post('/bookings', payload)
      }
      nav('/bookings')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not save booking')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'New'} Booking</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Room number</label>
          <input
            name="roomNumber"
            value={form.roomNumber}
            onChange={onChange}
            placeholder="B2-104"
            required
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Start date</label>
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={onChange}
            required
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">End date</label>
          <input
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={onChange}
            required
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Purpose (optional)</label>
          <textarea
            name="purpose"
            value={form.purpose}
            onChange={onChange}
            rows={3}
            className="input"
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
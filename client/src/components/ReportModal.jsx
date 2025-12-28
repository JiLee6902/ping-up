import React, { useState } from 'react'
import { X, Flag } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'violence', label: 'Violence or dangerous acts' },
  { value: 'nudity', label: 'Nudity or sexual content' },
  { value: 'false_information', label: 'False information' },
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'other', label: 'Other' },
]

const ReportModal = ({ type, targetId, targetName, onClose }) => {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!reason) {
      toast.error('Please select a reason')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        reportType: type,
        reason,
        description: description.trim() || undefined,
      }

      if (type === 'user') {
        payload.reportedUserId = targetId
      } else if (type === 'post') {
        payload.reportedPostId = targetId
      } else if (type === 'comment') {
        payload.reportedCommentId = targetId
      }

      const { data } = await api.post('/api/report/create', payload)
      if (data.success) {
        toast.success(data.message)
        onClose()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      <div className='absolute inset-0 bg-black/50' onClick={onClose} />
      <div className='relative bg-white rounded-xl p-6 w-full max-w-md mx-4'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <Flag className='w-5 h-5 text-red-500' />
            <h3 className='text-lg font-semibold'>Report {type === 'user' ? 'User' : 'Post'}</h3>
          </div>
          <button onClick={onClose} className='p-1 hover:bg-gray-100 rounded-full'>
            <X className='w-5 h-5' />
          </button>
        </div>

        {targetName && (
          <p className='text-sm text-gray-500 mb-4'>
            Reporting: <span className='font-medium'>{targetName}</span>
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className='space-y-3 mb-4'>
            {REPORT_REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  reason === r.value ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type='radio'
                  name='reason'
                  value={r.value}
                  checked={reason === r.value}
                  onChange={(e) => setReason(e.target.value)}
                  className='w-4 h-4 text-red-500'
                />
                <span className='text-sm'>{r.label}</span>
              </label>
            ))}
          </div>

          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Provide more context about the issue...'
              className='w-full border border-gray-300 rounded-lg p-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-red-500'
              maxLength={500}
            />
          </div>

          <div className='flex justify-end gap-2'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={submitting || !reason}
              className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50'
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReportModal

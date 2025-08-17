import React, { useRef, useState, useEffect } from 'react'
import { Upload, X } from 'lucide-react'

type Props = {
  accept?: string
  multiple?: boolean
  onFiles?: (files: File[]) => void
  className?: string
  maxSizeMB?: number
}

export default function CustomFileUpload({
  accept,
  multiple = true,
  onFiles,
  className = '',
  maxSizeMB,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [files, setFiles] = useState<File[] | null>(null)
  const [previews, setPreviews] = useState<{ id: string; file: File; url: string }[]>([])
  const [isDragActive, setIsDragActive] = useState(false)

  function emitFiles(flist: FileList | null) {
    if (!flist) return
    const arr = Array.from(flist)

    // accept only images if accept not provided or contains image
    const isImageAccept = !accept || accept.includes('image')
    const normalized = arr.filter((f) => (isImageAccept ? f.type.startsWith('image/') : true))

    const maxFiltered = maxSizeMB
      ? normalized.filter((f) => f.size <= maxSizeMB * 1024 * 1024)
      : normalized

    if (multiple) {
      // merge with existing files, avoid exact duplicates by name+size
      const existing = files ?? []
      const merged = [...existing]
      for (const f of maxFiltered) {
        if (!merged.find((m) => m.name === f.name && m.size === f.size)) merged.push(f)
      }
      setFiles(merged)
      onFiles?.(merged)
      // generate previews for newly added
      const newPreviews = maxFiltered.map((f) => ({ id: `${f.name}-${f.size}-${Date.now()}`, file: f, url: URL.createObjectURL(f) }))
      setPreviews((p) => [...p, ...newPreviews])
    } else {
      setFiles(maxFiltered)
      onFiles?.(maxFiltered)
      // replace previews
      const newPreviews = maxFiltered.map((f) => ({ id: `${f.name}-${f.size}-${Date.now()}`, file: f, url: URL.createObjectURL(f) }))
      // revoke old urls
      previews.forEach((p) => URL.revokeObjectURL(p.url))
      setPreviews(newPreviews)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    emitFiles(e.target.files)
  // allow selecting same file again
  e.currentTarget.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragActive(false)
    emitFiles(e.dataTransfer.files)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragActive(true)
  }

  function handleDragLeave() {
    setIsDragActive(false)
  }

  function removePreview(id: string) {
    setPreviews((prev) => {
      const removed = prev.find((p) => p.id === id)
      if (removed) URL.revokeObjectURL(removed.url)
      const next = prev.filter((p) => p.id !== id)
      // also remove from files state
      setFiles((cur) => (cur ? cur.filter((f) => `${f.name}-${f.size}` !== `${removed?.file.name}-${removed?.file.size}`) : cur))
      onFiles?.(files ?? [])
      return next
    })
  }

  // cleanup on unmount
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <label
      className={`w-full block rounded-md cursor-pointer ${className}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        aria-hidden
      />

      <div
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 text-center text-sm text-grey-desc transition-all duration-200 ease-in-out hover:bg-white-2 hover:shadow-sm transform ${
          isDragActive ? 'bg-white-3 ring-2 ring-grey-desc' : 'bg-white'
        }`}
        style={{ willChange: 'transform, box-shadow, background-color' }}
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary-orange rounded-sm p-2 flex items-center justify-center">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <div className="text-grey-desc font-medium">Choose a file or drag here</div>
        </div>

        {previews && previews.length > 0 && (
          <div className="mt-3 w-full flex flex-wrap gap-3">
            {previews.map((p) => (
              <div key={p.id} className="relative w-32 h-32 rounded-md overflow-hidden bg-gray-50 border cursor-default">
                <img src={p.url} alt={p.file.name} className="w-full h-full object-cover cursor-default" />
                <button
                  type="button"
                  onClick={() => removePreview(p.id)}
                  aria-label={`Remove ${p.file.name}`}
                  className="absolute top-1 right-1 bg-white-2 rounded-full p-1 shadow-sm cursor-pointer hover:bg-bg-state-red"
                >
                  <X className="w-4 h-4 text-state-red" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </label>
  )
}

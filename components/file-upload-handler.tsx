import { useRef } from 'react'
import { supabase } from "@/lib/supabaseClient"
import { toast } from 'sonner'

interface FileUploadHandlerProps {
  onFileUploaded: (url: string, fileName: string, fileType: string) => void
  type: 'image' | 'video' | 'file'
  children: React.ReactNode
}

export const FileUploadHandler = ({ onFileUploaded, type, children }: FileUploadHandlerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${type}s/${fileName}` // Organize files by type

      // Upload the file
      const { error: uploadError, data } = await supabase.storage
        .from('questions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('questions')
        .getPublicUrl(filePath)

      onFileUploaded(publicUrl, file.name, file.type)
      toast.success('File uploaded successfully')
    } catch (error: any) {
      console.error('Error uploading file:', error)
      toast.error(error.message || 'Failed to upload file')
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div onClick={handleClick} style={{ cursor: 'pointer' }}>
      {children}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelected}
        accept={type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : '*/*'}
      />
    </div>
  )
}

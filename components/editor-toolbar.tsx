"use client"

import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ImageIcon,
  Video,
  FileText,
  Type,
  ActivityIcon as Function,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditorToolbarProps {
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onAlign: (alignment: 'left' | 'center' | 'right' | 'justify') => void;
  onFontChange: (font: string) => void;
  onSizeChange: (size: string) => void;
  onImageUpload: () => void;
  onVideoUpload: () => void;
  onFileUpload: () => void;
}

export function EditorToolbar({
  onBold,
  onItalic,
  onUnderline,
  onAlign,
  onFontChange,
  onSizeChange,
  onImageUpload,
  onVideoUpload,
  onFileUpload
}: EditorToolbarProps) {
  return (
    <div className="border-b border-gray-200 bg-white p-2 flex items-center gap-2">
      <Select defaultValue="arial" onValueChange={onFontChange}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Font" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="arial">Arial</SelectItem>
          <SelectItem value="times">Times New Roman</SelectItem>
          <SelectItem value="calibri">Calibri</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue="3" onValueChange={onSizeChange}>
        <SelectTrigger className="w-[70px]">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Small</SelectItem>
          <SelectItem value="2">Medium</SelectItem>
          <SelectItem value="3">Normal</SelectItem>
          <SelectItem value="4">Large</SelectItem>
          <SelectItem value="5">X-Large</SelectItem>
          <SelectItem value="6">XX-Large</SelectItem>
          <SelectItem value="7">XXX-Large</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1 border-l border-r px-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBold}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onItalic}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onUnderline}>
          <Underline className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 border-r px-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign('left')}>
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign('center')}>
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign('right')}>
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign('justify')}>
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Type className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onImageUpload}>
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onVideoUpload}>
          <Video className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onFileUpload}>
          <FileText className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}


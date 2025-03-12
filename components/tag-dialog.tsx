import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tag, X } from "lucide-react"
import { useState } from "react"

interface TagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTags: string[]
  availableTags: string[]
  onTagsChange: (tags: string[]) => void
}

export function TagDialog({
  open,
  onOpenChange,
  currentTags,
  availableTags,
  onTagsChange,
}: TagDialogProps) {
  const [newTag, setNewTag] = useState("")

  const handleAddTag = () => {
    if (newTag && !currentTags.includes(newTag)) {
      onTagsChange([...currentTags, newTag])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(currentTags.filter(tag => tag !== tagToRemove))
  }

  const handleSelectExistingTag = (tag: string) => {
    if (!currentTags.includes(tag)) {
      onTagsChange([...currentTags, tag])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Current tags */}
          <div className="flex flex-wrap gap-2">
            {currentTags.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1 bg-gray-200 px-2 py-1 rounded"
              >
                <span>{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add new tag */}
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add new tag..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <Button onClick={handleAddTag}>Add</Button>
          </div>

          {/* Available tags */}
          <div>
            <h3 className="text-sm font-medium mb-2">Available Tags</h3>
            <div className="flex flex-wrap gap-2">
              {availableTags
                .filter(tag => !currentTags.includes(tag))
                .map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectExistingTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
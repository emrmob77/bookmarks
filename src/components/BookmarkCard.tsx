import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Bookmark } from '@/types';
import { Button } from './ui/button';
import { MessageSquare } from 'lucide-react';
import { CommentList } from './CommentList';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete?: () => void;
  onUpdate?: () => void;
}

export function BookmarkCard({ bookmark, onDelete, onUpdate }: BookmarkCardProps) {
  const { data: session } = useSession();
  const [showComments, setShowComments] = useState(false);
  
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          {bookmark.commentCount || 0} Yorum
        </Button>
      </div>

      {showComments && (
        <div className="mt-4 border-t pt-4">
          <CommentList 
            bookmarkId={bookmark.id}
            onSuccess={() => {
              // Bookmark'ı güncelle
              onUpdate?.();
            }}
          />
        </div>
      )}
    </div>
  );
} 
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Comment } from '@/types';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CommentForm } from './CommentForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu';
import { MoreVertical, MessageSquare, Pencil, Trash } from 'lucide-react';
import { Textarea } from './ui/textarea';

interface CommentCardProps {
  comment: Comment;
  onDelete?: () => void;
  onUpdate?: () => void;
  onReply?: () => void;
  showReplyButton?: boolean;
}

export function CommentCard({
  comment,
  onDelete,
  onUpdate,
  onReply,
  showReplyButton = true
}: CommentCardProps) {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = session?.user?.id === comment.userId;
  const formattedDate = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: tr
  });

  const handleEdit = async () => {
    if (!editedContent.trim()) {
      toast.error('Yorum içeriği boş olamaz');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editedContent.trim() })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Yorum güncellenirken bir hata oluştu');
      }

      setIsEditing(false);
      toast.success('Yorumunuz güncellendi');
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Yorum silinirken bir hata oluştu');
      }

      toast.success('Yorum silindi');
      onDelete?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{comment.username}</span>
            <span className="text-sm text-muted-foreground">
              {formattedDate}
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={3}
                disabled={isSubmitting}
                className="resize-none"
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleEdit}
                  disabled={isSubmitting || !editedContent.trim()}
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                >
                  İptal
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm">{comment.content}</p>
          )}
        </div>

        {isOwner && !isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete}>
                <Trash className="mr-2 h-4 w-4" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {!isEditing && showReplyButton && (
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0"
            onClick={() => setIsReplying(!isReplying)}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            {isReplying ? 'İptal' : 'Yanıtla'}
          </Button>
          {comment.replyCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0"
              onClick={() => onReply?.()}
            >
              {comment.replyCount} yanıt
            </Button>
          )}
        </div>
      )}

      {isReplying && (
        <div className="ml-8">
          <CommentForm
            bookmarkId={comment.bookmarkId}
            parentId={comment.id}
            onSuccess={() => {
              setIsReplying(false);
              onReply?.();
            }}
            placeholder="Yanıtınızı yazın..."
          />
        </div>
      )}
    </div>
  );
} 
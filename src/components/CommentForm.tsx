import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { NewComment } from '@/types';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface CommentFormProps {
  bookmarkId: string;
  parentId?: string;
  onSuccess?: () => void;
  placeholder?: string;
}

export function CommentForm({
  bookmarkId,
  parentId,
  onSuccess,
  placeholder = 'Yorumunuzu yazın...'
}: CommentFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      toast.error('Yorum yapmak için giriş yapmalısınız');
      return;
    }

    if (!content.trim()) {
      toast.error('Yorum içeriği boş olamaz');
      return;
    }

    setIsSubmitting(true);

    try {
      const clientCommentId = uuidv4();
      console.log('Yorum gönderiliyor:', {
        bookmarkId,
        content: content.trim(),
        parentId,
        clientCommentId
      });

      const newComment: NewComment = {
        bookmarkId,
        content: content.trim(),
        parentId,
        clientCommentId
      };

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newComment)
      });

      const data = await response.json();
      console.log('Sunucu yanıtı:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Yorum eklenirken bir hata oluştu');
      }

      setContent('');
      toast.success('Yorumunuz eklendi');
      onSuccess?.();
    } catch (error: any) {
      console.error('Yorum gönderme hatası:', error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        disabled={isSubmitting}
        className="resize-none"
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
        </Button>
      </div>
    </form>
  );
} 
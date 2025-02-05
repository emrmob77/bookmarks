import { useState, useEffect } from 'react';
import { Comment, CommentResponse } from '@/types';
import { CommentCard } from './CommentCard';
import { CommentForm } from './CommentForm';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

interface CommentListProps {
  bookmarkId: string;
  parentId?: string;
  showForm?: boolean;
  showLoadMore?: boolean;
}

export function CommentList({
  bookmarkId,
  parentId,
  showForm = true,
  showLoadMore = true
}: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchComments = async (page: number = 1) => {
    try {
      const params = new URLSearchParams({
        bookmarkId,
        page: page.toString(),
        limit: '10'
      });

      if (parentId) {
        params.append('parentId', parentId);
      }

      const response = await fetch(`/api/comments?${params}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Yorumlar yüklenirken bir hata oluştu');
      }

      const data: CommentResponse = await response.json();
      
      if (page === 1) {
        setComments(data.comments);
      } else {
        setComments(prev => [...prev, ...data.comments]);
      }

      setHasMore(data.pagination.currentPage < data.pagination.totalPages);
      setCurrentPage(data.pagination.currentPage);
    } catch (error: any) {
      setError(error.message);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchComments()
      .finally(() => setIsLoading(false));
  }, [bookmarkId, parentId]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await fetchComments(currentPage + 1);
    setIsLoadingMore(false);
  };

  const handleCommentUpdate = () => {
    fetchComments(1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showForm && (
        <CommentForm
          bookmarkId={bookmarkId}
          parentId={parentId}
          onSuccess={handleCommentUpdate}
        />
      )}

      {comments.length === 0 ? (
        <p className="text-center text-muted-foreground">
          Henüz yorum yapılmamış
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onDelete={handleCommentUpdate}
              onUpdate={handleCommentUpdate}
              onReply={handleCommentUpdate}
              showReplyButton={!parentId}
            />
          ))}
        </div>
      )}

      {showLoadMore && hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              'Daha Fazla Yükle'
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 
'use client';

interface TagFilterProps {
  tags: string[];
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
}

export default function TagFilter({ tags, selectedTags, onTagSelect }: TagFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onTagSelect(tag)}
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            selectedTags.includes(tag)
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
} 
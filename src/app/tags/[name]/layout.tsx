import { Metadata } from 'next';
import { ReactNode } from 'react';
import Layout from '@/components/Layout';
import fs from 'fs';
import path from 'path';

type Props = {
  params: { name: string };
  children: ReactNode;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = params?.name;
  if (!name) {
    return {
      title: 'All Tags - Bookmarks',
      description: 'List of all tags and popular tags.',
    };
  }

  const decodedName = decodeURIComponent(name);
  
  try {
    const tagsPath = path.join(process.cwd(), 'public', 'tags.json');
    
    if (fs.existsSync(tagsPath)) {
      const tagsData = fs.readFileSync(tagsPath, 'utf8');
      const tags = JSON.parse(tagsData);
      const tag = tags.find((t: any) => t.name.toLowerCase() === decodedName.toLowerCase());

      if (tag?.metaTitle && tag?.metaDescription) {
        return {
          title: `${tag.metaTitle} - Bookmarks`,
          description: tag.metaDescription,
          openGraph: {
            title: `${tag.metaTitle} - Bookmarks`,
            description: tag.metaDescription,
          },
          twitter: {
            title: `${tag.metaTitle} - Bookmarks`,
            description: tag.metaDescription,
          }
        };
      }
    }
  } catch (error) {
    console.error('Error in generateMetadata:', error);
  }

  // Default metadata
  return {
    title: `${decodedName} - Bookmarks`,
    description: `Bookmarks and resources related to ${decodedName}.`,
  };
}

export default function TagLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Layout>
      {children}
    </Layout>
  );
} 
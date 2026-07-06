import { Metadata } from 'next'
import { db } from '@/lib/db'
import { getSymbol } from '@/lib/currencies'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const prompt = await db.prompt.findUnique({
      where: { id },
      include: { seller: true }
    });

    if (!prompt) {
      return {
        title: 'Prompt Not Found',
        description: 'The requested prompt could not be found.'
      }
    }

    const price = prompt.isFree ? 'Free' : `${getSymbol('USD')}${prompt.price}`;
    
    return {
      title: `${prompt.title} by ${prompt.seller.name} | MAGHGO`,
      description: prompt.description.substring(0, 160),
      openGraph: {
        title: `${prompt.title} - ${price} on MAGHGO`,
        description: prompt.description.substring(0, 160),
        type: 'article',
        authors: [prompt.seller.name],
      },
      twitter: {
        card: 'summary_large_image',
        title: prompt.title,
        description: prompt.description.substring(0, 160),
      }
    }
  } catch {
    return {
      title: 'MAGHGO Prompt',
    }
  }
}

export default function PromptLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

/**
 * Fetch and extract article content from URL
 * Uses Jina AI Reader for clean article extraction
 */
export async function fetchArticleContent(url) {
  try {
    console.log('[Article Fetch] Fetching:', url);
    
    // Use Jina AI Reader - free service that extracts clean article text
    const jinaUrl = `https://r.jina.ai/${url}`;
    
    const response = await fetch(jinaUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('[Article Fetch] Failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    const content = data.data?.content || data.content;
    
    console.log('[Article Fetch] Success, content length:', content?.length || 0);
    
    // Limit to first 4000 chars to avoid token limits
    return content ? content.substring(0, 4000) : null;
    
  } catch (error) {
    console.error('[Article Fetch] Error:', error);
    return null;
  }
}


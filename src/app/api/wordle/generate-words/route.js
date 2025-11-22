import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { tool_llm_complete } from '@/src/lib/tools';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient({ allowAnonymous: true });
    const body = await req.json();
    const { theme = 'animals' } = body || {};
    const mode = userId ? 'use' : 'try';

    // Generate a unique cache key based on theme and current hour
    // This ensures words change regularly but are consistent within an hour
    const hourKey = Math.floor(Date.now() / (60 * 60 * 1000));
    
    const system = `You are a word generator for a Wordle-style game. Generate EXACTLY 50 unique 5-letter words that fit the given theme.
    
CRITICAL RULES:
- Each word MUST be exactly 5 letters long
- All words must be real English words
- All words must fit the theme perfectly
- No proper nouns
- No plurals that seem forced (prefer singular forms when natural)
- Words should be recognizable and commonly known
- Return ONLY the word list, one word per line, no numbering or extra text
- Generate exactly 50 words`;

    const prompt = `Generate 50 unique 5-letter words for theme: "${theme}".

Examples for different themes:
- animals: tiger, zebra, otter, eagle, whale, panda, moose, rhino, koala, sloth
- foods: pasta, curry, bagel, pizza, chili, apple, sushi, tacos, bread, honey
- cities: paris, tokyo, miami, milan, delhi, osaka, sofia, cairo, seoul, perth
- verbs: build, write, teach, learn, speak, judge, laugh, dance, throw, climb
- brands: apple, tesla, nokia, gucci, prada, rolex

Now generate 50 words for theme "${theme}". Return only the words, one per line:`;

    const res = await tool_llm_complete({
      userId,
      args: { system, prompt },
      mode,
      supabase,
      fallbackAllowed: true
    });

    // Parse the LLM response to extract words
    const text = res?.output?.markdown || '';
    const words = text
      .split('\n')
      .map(line => line.trim().toLowerCase())
      .filter(word => /^[a-z]{5}$/.test(word)) // Only 5-letter words with no special chars
      .slice(0, 50); // Take first 50 valid words

    console.log('[Wordle Words] Generated', words.length, 'words for theme:', theme);

    // If we don't have enough words, add some fallbacks
    const fallbackWords = {
      animals: ['tiger','zebra','otter','eagle','whale','panda','camel','rhino','koala','sloth','moose','lemur','orca','gecko','raven','bison','llama','hippo','manta','coral','horse','sheep','snail','mouse','crane','hyena','eland','dingo','badger','viper','newts','robin','finch','macaw','skunk','possum','wombat','quail','loons','tapir','okapi','curlew','hoopoe','egret','ibis','wader','bittern'],
      foods: ['pasta','curry','bagel','pizza','chili','apple','olive','sushi','tacos','bread','mango','melon','peach','grape','berry','bacon','beans','honey','cream','lemon','salad','steak','chips','donut','candy','fries','wafer','toast','jelly','syrup','gravy','sauce','broth','crust','flour','sugar','spice','thyme','basil','clove','cumin','anise','dill'],
      cities: ['paris','tokyo','miami','milan','delhi','osaka','sofia','cairo','seoul','perth','dubai','lyon','berne','quito','accra','tunis','dakar','rabat','minsk','riga','vilnius','vaduz','asmara','luanda','mbabane','moroni','malabo','lusaka','harare','dodoma','nairobi','kigali','niamey','lome','cotonou','bamako','praia','banjul','conakry','bissau','maseru'],
      verbs: ['build','write','teach','learn','speak','judge','drawn','laugh','dance','throw','climb','think','drive','paint','sleep','jump','crawl','swing','float','glide','smile','frown','blink','shout','whisper','chase','grasp','twist','shake','blend','carve','knead','weave','pluck','strum','press','draft','erase','print','solve','guess','prove','argue','claim','boost'],
      brands: ['apple','tesla','nokia','sony','ikea','adobe','gucci','prada','visa','nvidia','intel','cisco','uber','lyft','zoom','slack','figma','canva','shopify','stripe','paypal','ebay','etsy','venmo','zelle','robinhood','coinbase','binance','kraken','ledger','trezor','metamask','uniswap','aave','yearn','compound','maker']
    };

    let finalWords = words;
    if (words.length < 50) {
      const fallback = fallbackWords[theme] || fallbackWords.animals;
      finalWords = [...new Set([...words, ...fallback])].slice(0, 50);
      console.log('[Wordle Words] Using fallback, now have', finalWords.length, 'words');
    }

    return NextResponse.json({
      ok: true,
      words: finalWords,
      theme,
      count: finalWords.length,
      cacheKey: `${theme}-${hourKey}`
    });
  } catch (e) {
    console.error('[API /wordle/generate-words] Error:', e);
    
    // Return fallback words on error
    const fallbackWords = {
      animals: ['tiger','zebra','otter','eagle','whale','panda','camel','rhino','koala','sloth'],
      foods: ['pasta','curry','bagel','pizza','chili','apple','olive','sushi','tacos','bread'],
      cities: ['paris','tokyo','miami','milan','delhi','osaka','sofia','cairo','seoul','perth'],
      verbs: ['build','write','teach','learn','speak','judge','drawn','laugh','dance','throw'],
      brands: ['apple','tesla','nokia','sony','ikea','adobe','gucci','prada','visa','nvidia']
    };
    
    const theme = 'animals';
    return NextResponse.json({
      ok: false,
      error: e.message,
      words: fallbackWords[theme],
      theme,
      count: 10,
      usedFallback: true
    });
  }
}



import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { githubUrl } = await request.json();

    if (!githubUrl) {
      return NextResponse.json({ error: 'GitHub URL is required' }, { status: 400 });
    }

    // Parse GitHub URL
    const urlMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch) {
      return NextResponse.json({ error: 'Invalid GitHub URL format' }, { status: 400 });
    }

    const [, owner, repo] = urlMatch;
    const cleanRepo = repo.replace(/\.git$/, '');

    // Fetch repository info from GitHub API
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`);
    if (!repoResponse.ok) {
      return NextResponse.json({ error: 'Repository not found or not accessible' }, { status: 404 });
    }

    const repoData = await repoResponse.json();

    // Fetch README
    let readmeContent = '';
    try {
      const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/readme`, {
        headers: { 'Accept': 'application/vnd.github.raw' }
      });
      if (readmeResponse.ok) {
        readmeContent = await readmeResponse.text();
      }
    } catch (e) {
      console.log('No README found');
    }

    // Fetch package.json to detect tech stack
    let packageJson = null;
    try {
      const packageResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/contents/package.json`, {
        headers: { 'Accept': 'application/vnd.github.raw' }
      });
      if (packageResponse.ok) {
        packageJson = JSON.parse(await packageResponse.text());
      }
    } catch (e) {
      console.log('No package.json found');
    }

    // Detect tech stack
    const techStack = [];
    if (packageJson) {
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      if (deps.react || deps.next) techStack.push('React');
      if (deps.next) techStack.push('Next.js');
      if (deps.express) techStack.push('Express');
      if (deps.vue) techStack.push('Vue');
      if (deps['@angular/core']) techStack.push('Angular');
    }
    if (repoData.language) {
      techStack.push(repoData.language);
    }

    // Use platform's OpenAI API key for GitHub analysis (not user's key)
    const openaiKey = process.env.OPENAI_API_KEY;
    
    console.log('[GitHub Analyze] Checking OpenAI key:', {
      hasKey: !!openaiKey,
      keyPrefix: openaiKey ? openaiKey.substring(0, 8) + '...' : 'NONE'
    });
    
    if (!openaiKey || openaiKey === '') {
      console.error('[GitHub Analyze] OPENAI_API_KEY not set in environment');
      return NextResponse.json({ 
        error: 'Platform OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.',
        hint: 'This should be the platform\'s key (not user\'s BYOK key)'
      }, { status: 500 });
    }

    const analysisPrompt = `Analyze this GitHub repository and generate an Clipcade adapter manifest.

Repository: ${repoData.full_name}
Description: ${repoData.description || 'No description'}
Language: ${repoData.language}
Tech Stack: ${techStack.join(', ')}

README excerpt:
${readmeContent.substring(0, 2000)}

${packageJson ? `Package.json dependencies: ${Object.keys({...packageJson.dependencies, ...packageJson.devDependencies}).join(', ')}` : ''}

Generate a JSON manifest for Clipcade with the following structure:
{
  "name": "App Name",
  "description": "Brief description",
  "techStack": ["React", "Next.js", etc],
  "manifest": {
    "id": "kebab-case-id",
    "name": "App Name",
    "version": "1.0.0",
    "inputs": {
      "exampleInput": { "type": "string", "required": true }
    },
    "permissions": ["openai.chat"],
    "run": {
      "url": "https://your-deployed-url.vercel.app/api/run",
      "method": "POST"
    }
  },
  "qualityChecks": [
    { "name": "Has valid inputs", "passed": true },
    { "name": "Permissions defined", "passed": true },
    { "name": "Mobile-friendly", "passed": true }
  ]
}

Return ONLY valid JSON, no markdown or explanation.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing code repositories and generating Clipcade adapter manifests. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI error:', error);
      return NextResponse.json({ error: 'Failed to analyze repository with AI' }, { status: 500 });
    }

    const openaiData = await openaiResponse.json();
    let analysisResult;

    try {
      const content = openaiData.choices[0].message.content;
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      return NextResponse.json({ error: 'Failed to parse AI analysis' }, { status: 500 });
    }

    // Add repository info
    analysisResult.githubUrl = githubUrl;
    analysisResult.repoName = repoData.full_name;
    analysisResult.stars = repoData.stargazers_count;

    return NextResponse.json(analysisResult);

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during analysis' },
      { status: 500 }
    );
  }
}

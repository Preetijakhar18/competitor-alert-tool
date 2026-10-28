import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';

export async function POST(req) {
  try {
    const body = await req.json();
    const targetDomain = body.domain;

    if (!targetDomain) {
      return NextResponse.json({ success: false, message: 'Domain is required' }, { status: 400 });
    }

    const targetUrl = targetDomain.startsWith('http') ? targetDomain : `https://${targetDomain}`;

    // 1. Fetch homepage
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    const $ = cheerio.load(response.data);

    let blogLink = '';
    $('a').each((_, element) => {
      const linkText = $(element).text().toLowerCase();
      const hrefAttr = $(element).attr('href');
      
      if ((linkText.includes('blog') || linkText.includes('articles') || linkText.includes('resources')) && hrefAttr) {
        blogLink = hrefAttr.startsWith('http') ? hrefAttr : new URL(hrefAttr, targetUrl).href;
        return false;
      }
    });

    if (!blogLink) {
      blogLink = `${targetUrl}/blog`;
    }

    // 2. Fetch blog listing page
    const blogResponse = await axios.get(blogLink, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const blogPage = cheerio.load(blogResponse.data);
    const rawArticles = [];

    blogPage('article, .blog-post, .post-item, h2').each((_, el) => {
      const postTitle = blogPage(el).find('h2, h3').text().trim() || blogPage(el).text().trim();
      const postAnchor = blogPage(el).find('a').attr('href') || blogPage(el).attr('href');
      const postSnippet = blogPage(el).find('p').text().trim() || 'No description available';

      if (postTitle && postAnchor) {
        const absoluteUrl = postAnchor.startsWith('http') ? postAnchor : new URL(postAnchor, targetUrl).href;
        
        if (!rawArticles.some(item => item.url === absoluteUrl)) {
          rawArticles.push({
            title: postTitle,
            url: absoluteUrl,
            metaDescription: postSnippet.slice(0, 140),
            publishDate: new Date().toISOString().split('T')[0]
          });
        }
      }
    });

    const topArticles = rawArticles.slice(0, 3); // Top 3 posts for AI enrichment
    const groqApiKey = process.env.GROQ_API_KEY;
    const enrichedPosts = [];

    // 3. Enrich with Groq API
    for (const post of topArticles) {
      let keyword = 'Growth Marketing';
      let searchVolume = '1.5K/mo';

      if (groqApiKey) {
        try {
          const groqRes = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              model: 'llama-3.3-70b-versatile',
              messages: [
                {
                  role: 'user',
                  content: `Analyze this article title: "${post.title}". Extract a primary SEO target keyword and estimate a realistic monthly search volume (e.g. 2.5K/mo). Return strictly in JSON format like {"keyword": "...", "volume": "..."}`
                }
              ],
              response_format: { type: "json_object" }
            },
            {
              headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );

          const aiContent = groqRes.data?.choices?.[0]?.message?.content;
          if (aiContent) {
            const parsed = JSON.parse(aiContent);
            keyword = parsed.keyword || keyword;
            searchVolume = parsed.volume || searchVolume;
          }
        } catch (groqErr) {
          console.log('Groq enrichment fallback used');
        }
      }

      enrichedPosts.push({
        ...post,
        targetKeyword: keyword,
        searchVolume: searchVolume
      });
    }

    return NextResponse.json({
      success: true,
      sourceBlogUrl: blogLink,
      posts: enrichedPosts
    });

  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 });
  }
}
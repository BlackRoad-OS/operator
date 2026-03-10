/**
 * SEOAnalyzer - Scrapes and validates real SEO signals from live pages.
 * Uses built-in fetch API (Node 20+). No external dependencies.
 */

/**
 * SEOAnalyzer - Scrapes and validates real SEO signals from live pages.
 * Every metric is fetched live. No assumptions. No yesterday's apples.
 */
class SEOAnalyzer {
  constructor(options = {}) {
    this.timeout = options.timeout || 15000;
    this.userAgent = options.userAgent || 'BlackRoad-SEO-Analyzer/1.0';
  }

  async analyzePage(url) {
    const ts = new Date().toISOString();
    let html, httpStatus;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);
      const resp = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timer);
      httpStatus = resp.status;
      html = await resp.text();
    } catch (err) {
      return {
        url, analyzed_at: ts, status: 'error',
        error: err.message, verified: false,
      };
    }

    // Simple HTML parsing using regex (no external deps)
    const getTag = (tag) => { const m = html.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i')); return m ? m[1].trim() : ''; };
    const getMeta = (attr, val) => { const m = html.match(new RegExp(`<meta[^>]*${attr}="${val}"[^>]*content="([^"]*)"`, 'i')); return m ? m[1] : ''; };
    const getLink = (rel) => { const m = html.match(new RegExp(`<link[^>]*rel="${rel}"[^>]*href="([^"]*)"`, 'i')); return m ? m[1] : ''; };

    const title = getTag('title');
    const metaDesc = getMeta('name', 'description');
    const canonical = getLink('canonical');
    const ogTitle = getMeta('property', 'og:title');
    const ogDesc = getMeta('property', 'og:description');
    const ogImage = getMeta('property', 'og:image');
    const robots = getMeta('name', 'robots');
    const h1s = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gis)].map(m => m[1].replace(/<[^>]*>/g, '').trim());
    const h2s = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gis)].map(m => m[1].replace(/<[^>]*>/g, '').trim());

    const links = { internal: 0, external: 0, nofollow: 0, broken_candidates: [] };
    const hostname = new URL(url).hostname;
    for (const m of html.matchAll(/<a[^>]*href="([^"]*)"[^>]*>/gi)) {
      const href = m[0]; const hrefVal = m[1];
      if (href.includes('nofollow')) links.nofollow++;
      if (hrefVal.startsWith('http') && !hrefVal.includes(hostname)) {
        links.external++;
      } else {
        links.internal++;
      }
    }

    const images = { total: 0, missing_alt: 0 };
    for (const m of html.matchAll(/<img[^>]*>/gi)) {
      images.total++;
      if (!m[0].includes('alt=')) images.missing_alt++;
    }

    const structuredData = [];
    for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis)) {
      try { structuredData.push(JSON.parse(m[1])); } catch { /* skip */ }
    }

    const score = this._calculateScore({
      title, metaDesc, canonical, ogTitle, ogImage,
      h1s, images, structuredData, httpStatus,
    });

    return {
      url,
      analyzed_at: ts,
      status: 'ok',
      verified: true,
      http_status: httpStatus,
      response_time_ms: null, // would need perf hooks for accuracy
      seo: {
        title: { value: title, length: title.length, optimal: title.length >= 30 && title.length <= 60 },
        meta_description: { value: metaDesc, length: metaDesc.length, optimal: metaDesc.length >= 120 && metaDesc.length <= 160 },
        canonical,
        robots,
        open_graph: { title: ogTitle, description: ogDesc, image: ogImage },
        headings: { h1_count: h1s.length, h1s, h2_count: h2s.length, h2s: h2s.slice(0, 10) },
        links,
        images,
        structured_data_count: structuredData.length,
        structured_data_types: structuredData.map(sd => sd['@type']).filter(Boolean),
      },
      score,
    };
  }

  _calculateScore({ title, metaDesc, canonical, ogTitle, ogImage, h1s, images, structuredData, httpStatus }) {
    let score = 0;
    let maxScore = 0;
    const checks = [];

    const check = (name, passed, weight = 1) => {
      maxScore += weight;
      if (passed) score += weight;
      checks.push({ name, passed, weight });
    };

    check('HTTP 200', httpStatus === 200, 2);
    check('Has title', title.length > 0, 2);
    check('Title length 30-60', title.length >= 30 && title.length <= 60, 1);
    check('Has meta description', metaDesc.length > 0, 2);
    check('Meta desc 120-160', metaDesc.length >= 120 && metaDesc.length <= 160, 1);
    check('Has canonical', canonical.length > 0, 1);
    check('Has OG title', ogTitle.length > 0, 1);
    check('Has OG image', ogImage.length > 0, 1);
    check('Exactly one H1', h1s.length === 1, 2);
    check('Images have alt text', images.total === 0 || images.missing_alt === 0, 1);
    check('Has structured data', structuredData.length > 0, 2);

    return {
      score,
      max_score: maxScore,
      percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      checks,
    };
  }

  async analyzeGitHubRepo(owner, repo) {
    const url = `https://github.com/${owner}/${repo}`;
    const result = await this.analyzePage(url);
    result.context = { owner, repo, type: 'github_repo' };
    return result;
  }

  async batchAnalyze(urls) {
    const results = await Promise.allSettled(
      urls.map(url => typeof url === 'string' ? this.analyzePage(url) : this.analyzeGitHubRepo(url.owner, url.repo))
    );
    return results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      return {
        url: typeof urls[i] === 'string' ? urls[i] : `${urls[i].owner}/${urls[i].repo}`,
        analyzed_at: new Date().toISOString(),
        status: 'error',
        error: r.reason?.message || 'Unknown error',
        verified: false,
      };
    });
  }
}

export { SEOAnalyzer };

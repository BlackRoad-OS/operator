'use strict';

const axios = require('axios');
const cheerio = require('cheerio');

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
    let resp;
    try {
      resp = await axios.get(url, {
        timeout: this.timeout,
        headers: { 'User-Agent': this.userAgent },
        maxRedirects: 5,
        validateStatus: () => true,
      });
    } catch (err) {
      return {
        url, analyzed_at: ts, status: 'error',
        error: err.message, verified: false,
      };
    }

    const $ = cheerio.load(resp.data || '');
    const title = $('title').text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDesc = $('meta[property="og:description"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const robots = $('meta[name="robots"]').attr('content') || '';
    const h1s = [];
    $('h1').each((_, el) => h1s.push($(el).text().trim()));
    const h2s = [];
    $('h2').each((_, el) => h2s.push($(el).text().trim()));

    const links = { internal: 0, external: 0, nofollow: 0, broken_candidates: [] };
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const rel = $(el).attr('rel') || '';
      if (rel.includes('nofollow')) links.nofollow++;
      if (href.startsWith('http') && !href.includes(new URL(url).hostname)) {
        links.external++;
      } else {
        links.internal++;
      }
    });

    const images = { total: 0, missing_alt: 0 };
    $('img').each((_, el) => {
      images.total++;
      if (!$(el).attr('alt')) images.missing_alt++;
    });

    const structuredData = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        structuredData.push(JSON.parse($(el).html()));
      } catch (_e) { /* skip malformed */ }
    });

    const score = this._calculateScore({
      title, metaDesc, canonical, ogTitle, ogImage,
      h1s, images, structuredData, httpStatus: resp.status,
    });

    return {
      url,
      analyzed_at: ts,
      status: 'ok',
      verified: true,
      http_status: resp.status,
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

module.exports = { SEOAnalyzer };

import { SEOAnalyzer } from '../src/seo/seo-analyzer.js';

jest.mock('axios');
import axios from 'axios';

describe('SEOAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new SEOAnalyzer();
    jest.clearAllMocks();
  });

  describe('analyzePage', () => {
    const wellOptimizedHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>BlackRoad OS - Enterprise Operating System Platform</title>
        <meta name="description" content="BlackRoad OS provides a comprehensive enterprise operating system platform with AI-powered automation, distributed computing, and real-time monitoring capabilities." />
        <link rel="canonical" href="https://blackroad.dev" />
        <meta property="og:title" content="BlackRoad OS" />
        <meta property="og:description" content="Enterprise OS Platform" />
        <meta property="og:image" content="https://blackroad.dev/og.png" />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">{"@type": "Organization", "name": "BlackRoad OS"}</script>
      </head>
      <body>
        <h1>BlackRoad OS Platform</h1>
        <h2>Features</h2>
        <h2>Documentation</h2>
        <a href="/docs">Docs</a>
        <a href="https://github.com/BlackRoad-OS" rel="nofollow">GitHub</a>
        <img src="logo.png" alt="BlackRoad Logo" />
      </body>
      </html>
    `;

    it('returns verified SEO data for well-optimized page', async () => {
      axios.get.mockResolvedValueOnce({ data: wellOptimizedHTML, status: 200, headers: {} });

      const result = await analyzer.analyzePage('https://example.com');
      expect(result.verified).toBe(true);
      expect(result.status).toBe('ok');
      expect(result.http_status).toBe(200);
      expect(result.seo.title.value).toContain('BlackRoad OS');
      expect(result.seo.meta_description.value).toContain('enterprise');
      expect(result.seo.canonical).toBe('https://blackroad.dev');
      expect(result.seo.open_graph.title).toBe('BlackRoad OS');
      expect(result.seo.open_graph.image).toBe('https://blackroad.dev/og.png');
      expect(result.seo.headings.h1_count).toBe(1);
      expect(result.seo.headings.h2_count).toBe(2);
      expect(result.seo.images.total).toBe(1);
      expect(result.seo.images.missing_alt).toBe(0);
      expect(result.seo.structured_data_count).toBe(1);
      expect(result.score.percentage).toBeGreaterThan(80);
    });

    it('returns low score for poorly optimized page', async () => {
      axios.get.mockResolvedValueOnce({ data: '<html><body><p>Hello</p></body></html>', status: 200, headers: {} });

      const result = await analyzer.analyzePage('https://example.com');
      expect(result.verified).toBe(true);
      expect(result.score.percentage).toBeLessThan(30);
    });

    it('returns error on network failure', async () => {
      axios.get.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const result = await analyzer.analyzePage('https://example.com');
      expect(result.verified).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toBe('ECONNREFUSED');
    });

    it('handles non-200 status codes', async () => {
      axios.get.mockResolvedValueOnce({ data: '<html><head><title>Not Found</title></head></html>', status: 404, headers: {} });

      const result = await analyzer.analyzePage('https://example.com');
      expect(result.verified).toBe(true);
      expect(result.http_status).toBe(404);
      // HTTP 200 check should fail
      const httpCheck = result.score.checks.find(c => c.name === 'HTTP 200');
      expect(httpCheck.passed).toBe(false);
    });

    it('counts images missing alt text', async () => {
      const html = '<html><body><img src="a.png" alt="desc" /><img src="b.png" /><img src="c.png" /></body></html>';
      axios.get.mockResolvedValueOnce({ data: html, status: 200, headers: {} });

      const result = await analyzer.analyzePage('https://example.com');
      expect(result.seo.images.total).toBe(3);
      expect(result.seo.images.missing_alt).toBe(2);
    });

    it('detects multiple H1 tags', async () => {
      const html = '<html><body><h1>First</h1><h1>Second</h1></body></html>';
      axios.get.mockResolvedValueOnce({ data: html, status: 200, headers: {} });

      const result = await analyzer.analyzePage('https://example.com');
      expect(result.seo.headings.h1_count).toBe(2);
      const h1Check = result.score.checks.find(c => c.name === 'Exactly one H1');
      expect(h1Check.passed).toBe(false);
    });
  });

  describe('analyzeGitHubRepo', () => {
    it('constructs correct URL and adds context', async () => {
      axios.get.mockResolvedValueOnce({ data: '<html><head><title>Test</title></head></html>', status: 200, headers: {} });

      const result = await analyzer.analyzeGitHubRepo('BlackRoad-OS', 'operator');
      expect(result.context.owner).toBe('BlackRoad-OS');
      expect(result.context.repo).toBe('operator');
      expect(axios.get).toHaveBeenCalledWith(
        'https://github.com/BlackRoad-OS/operator',
        expect.any(Object)
      );
    });
  });

  describe('batchAnalyze', () => {
    it('analyzes multiple URLs in parallel', async () => {
      axios.get
        .mockResolvedValueOnce({ data: '<html><head><title>Page1</title></head></html>', status: 200, headers: {} })
        .mockResolvedValueOnce({ data: '<html><head><title>Page2</title></head></html>', status: 200, headers: {} });

      const results = await analyzer.batchAnalyze(['https://a.com', 'https://b.com']);
      expect(results).toHaveLength(2);
      expect(results[0].verified).toBe(true);
      expect(results[1].verified).toBe(true);
    });

    it('handles mixed success and failure', async () => {
      axios.get
        .mockResolvedValueOnce({ data: '<html><head><title>OK</title></head></html>', status: 200, headers: {} })
        .mockRejectedValueOnce(new Error('timeout'));

      const results = await analyzer.batchAnalyze(['https://a.com', 'https://b.com']);
      expect(results[0].verified).toBe(true);
      expect(results[1].verified).toBe(false);
    });
  });

  describe('_calculateScore', () => {
    it('gives perfect score for optimal page', () => {
      const score = analyzer._calculateScore({
        title: 'A Perfect Title That Is Exactly Right',
        metaDesc: 'A'.repeat(140),
        canonical: 'https://example.com',
        ogTitle: 'OG Title',
        ogImage: 'https://example.com/image.png',
        h1s: ['One H1'],
        images: { total: 5, missing_alt: 0 },
        structuredData: [{ '@type': 'Organization' }],
        httpStatus: 200,
      });
      expect(score.percentage).toBe(100);
    });

    it('gives zero for completely empty page', () => {
      const score = analyzer._calculateScore({
        title: '',
        metaDesc: '',
        canonical: '',
        ogTitle: '',
        ogImage: '',
        h1s: [],
        images: { total: 1, missing_alt: 1 },
        structuredData: [],
        httpStatus: 500,
      });
      expect(score.percentage).toBeLessThan(10);
    });
  });
});

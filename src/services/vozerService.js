import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import https from 'https';
import puppeteer from 'puppeteer';

dotenv.config();

// Tao axios instance voi config tot hon
const client = axios.create({ 
  timeout: 30000,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true
  }),
  maxRedirects: 5
});

// Store login session
let isLoggedIn = false;
let sessionCookies = process.env.VOZER_COOKIES || '';

// Function de login bang Puppeteer (tu dong click button va lay cookie)
export const login = async (email, password) => {
  let browser = null;
  try {
    // Neu da co cookies trong env, su dung luon
    if (process.env.VOZER_COOKIES) {
      sessionCookies = process.env.VOZER_COOKIES;
      isLoggedIn = true;
      console.log('Using cookies from .env');
      return { success: true, message: 'Using cookies from environment' };
    }

    // Neu khong co email/password, thu dung tu env
    const loginEmail = email || process.env.VOZER_EMAIL;
    const loginPassword = password || process.env.VOZER_PASSWORD;

    if (!loginEmail || !loginPassword) {
      console.log('No credentials provided, using anonymous session');
      return { success: false, message: 'No credentials provided' };
    }

    console.log('Attempting to login with email:', loginEmail);

    // Khoi tao Puppeteer browser
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-gpu'
      ]
    };

    // Neu tren macOS, thu dung Chrome system
    if (process.platform === 'darwin') {
      const chromePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium'
      ];
      
      for (const chromePath of chromePaths) {
        const fs = await import('fs');
        if (fs.existsSync(chromePath)) {
          launchOptions.executablePath = chromePath;
          console.log('Using system Chrome:', chromePath);
          break;
        }
      }
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    
    // Set viewport va user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Truy cap trang login
    console.log('Navigating to login page...');
    await page.goto('https://vozer.io/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Doi trang load xong
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });

    // Nhap email va password
    console.log('Filling login form...');
    await page.type('input[name="email"]', loginEmail, { delay: 100 });
    await page.type('input[name="password"]', loginPassword, { delay: 100 });

    // Click checkbox "Remember me" neu co
    const rememberCheckbox = await page.$('input[name="remember"]');
    if (rememberCheckbox) {
      await rememberCheckbox.click();
    }

    // Click nut login (tim button submit)
    console.log('Clicking login button...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);

    console.log('Login button clicked, waiting for redirect...');

    // Doi mot chut de dam bao cookies duoc set
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Lay tat ca cookies sau khi login
    const cookies = await page.cookies();
    console.log('Cookies retrieved:', cookies.length, 'cookies');

    // Chuyen doi cookies thanh string format
    sessionCookies = cookies
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');

    console.log('Session cookies:', sessionCookies.substring(0, 100) + '...');

    // Dong browser
    await browser.close();

    isLoggedIn = true;
    return { 
      success: true, 
      message: 'Dang nhap thanh cong bang Puppeteer', 
      cookies: sessionCookies,
      cookieCount: cookies.length
    };
  } catch (error) {
    // Dong browser neu co loi
    if (browser) {
      await browser.close();
    }
    console.error('Login error:', error.message);
    return { success: false, message: 'Loi khi dang nhap: ' + error.message };
  }
};

// Helper function de lay headers voi cookies
const getHeaders = (url, referer = 'https://vozer.io/') => {
  return {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"macOS"',
    'Cache-Control': 'max-age=0',
    'Referer': referer,
    'Cookie': sessionCookies
  };
};

// Crawl noi dung mot chapter
export const crawlChapterContent = async (url) => {
  try {
    // Tu dong login neu chua login va co credentials
    if (!isLoggedIn && !sessionCookies) {
      console.log('Auto-login before crawling...');
      await login();
    }

    console.log('Crawling URL:', url);
    console.log('Using cookies:', sessionCookies ? sessionCookies.substring(0, 50) + '...' : 'No cookies');

    // Buoc 1: Truy cap trang chu truoc de lay Cloudflare cookies
    try {
      const homeResponse = await client.get('https://vozer.io/', {
        headers: getHeaders('https://vozer.io/', 'https://www.google.com/'),
        validateStatus: () => true
      });
      
      // Update cookies from home page
      const homeSetCookie = homeResponse.headers['set-cookie'];
      if (homeSetCookie) {
        const cfCookies = homeSetCookie.map(cookie => cookie.split(';')[0]).join('; ');
        sessionCookies = sessionCookies ? `${sessionCookies}; ${cfCookies}` : cfCookies;
        console.log('Got Cloudflare cookies');
      }
      
      // Doi 2 giay de giong nguoi dung that
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (cfError) {
      console.log('Cloudflare pre-request failed:', cfError.message);
    }

    // Buoc 2: Crawl chapter voi full cookies
    const response = await client.get(url, {
      headers: getHeaders(url, 'https://vozer.io/'),
      validateStatus: (status) => status < 500,
      timeout: 30000
    });

    // Debug: Log response length
    console.log('Response status:', response.status);
    console.log('Response data length:', response.data.length);
    
    if (response.status === 403) {
      console.log('Got 403 - Cloudflare blocked');
      throw new Error('Website blocked request (403 Forbidden). Try using cookies from browser.');
    }
    
    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const $ = cheerio.load(response.data);
    
    // Lay thong tin tu JSON-LD schema
    let novelTitle = '';
    let chapterTitle = '';
    let chapterNumber = '';
    
    try {
      const jsonLd = $('script[type="application/ld+json"]').first().html();
      if (jsonLd) {
        const data = JSON.parse(jsonLd);
        if (data['@graph']) {
          const chapterData = data['@graph'].find(item => item['@type'] === 'Chapter');
          if (chapterData) {
            chapterTitle = chapterData.name || '';
            chapterNumber = chapterData.position?.toString() || '';
            if (chapterData.isPartOf) {
              novelTitle = chapterData.isPartOf.name || '';
            }
          }
        }
      }
    } catch (e) {
      console.log('Khong the parse JSON-LD, su dung selector thay the');
    }
    
    // Debug: Check what we found in JSON-LD
    console.log('From JSON-LD - Novel:', novelTitle, 'Chapter:', chapterTitle, 'Number:', chapterNumber);
    
    // Fallback neu khong lay duoc tu JSON-LD
    if (!chapterTitle) {
      chapterTitle = $('#chapter-title, h1.title').first().text().trim();
      console.log('Fallback chapter title:', chapterTitle);
    }
    if (!novelTitle) {
      novelTitle = $('a[title]').first().attr('title') || '';
      console.log('Fallback novel title:', novelTitle);
    }
    
    // Lay noi dung chapter tu the ol.chap
    let chapterContent = '';
    const contentDiv = $('#content .chap');
    console.log('Found .chap elements:', contentDiv.length);
    
    if (contentDiv.length > 0) {
      // Lay tat ca the <p> trong ol.chap
      contentDiv.find('p').each((i, el) => {
        chapterContent += `<p>${$(el).html()}</p>\n`;
      });
      console.log('Content from .chap, paragraphs found:', contentDiv.find('p').length);
    } else {
      // Fallback: lay toan bo #content
      const contentFallback = $('#content');
      console.log('Fallback #content found:', contentFallback.length);
      chapterContent = contentFallback.html() || '';
    }
    
    // Lay link chapter truoc/sau
    const prevChapter = $('a[rel="prev"], a.prev-chapter, a:contains("Chương trước"), a:contains("Chap trước")').first().attr('href');
    const nextChapter = $('a[rel="next"], a.next-chapter, a:contains("Chương sau"), a:contains("Chap sau")').first().attr('href');
    
    return {
      novelTitle,
      chapterTitle,
      chapterNumber,
      content: chapterContent,
      navigation: {
        prev: prevChapter ? new URL(prevChapter, url).href : null,
        next: nextChapter ? new URL(nextChapter, url).href : null
      },
      url
    };
  } catch (error) {
    if (error?.meessage?.includes('503') || error?.code === 503) {
      sessionCookies = ''
    }
    throw new Error(`Khong the crawl chapter: ${error.message}`);
  }
};

// Crawl thong tin truyen
export const crawlNovelInfo = async (url) => {
  try {
    const response = await client.get(url, {
      headers: getHeaders(url),
      maxRedirects: 5,
      validateStatus: (status) => status < 400
    });

    const $ = cheerio.load(response.data);
    
    // Lay thong tin truyen tu JSON-LD schema (neu co)
    let title = '';
    let author = '';
    let cover = '';
    
    try {
      const jsonLd = $('script[type="application/ld+json"]').first().html();
      if (jsonLd) {
        const data = JSON.parse(jsonLd);
        if (data['@graph']) {
          const bookData = data['@graph'].find(item => item['@type'] === 'Book');
          if (bookData) {
            title = bookData.name || '';
            cover = bookData.image || '';
            if (bookData.author && bookData.author.name) {
              author = bookData.author.name;
            }
          }
        }
      }
    } catch (e) {
      console.log('Khong the parse JSON-LD');
    }
    
    // Fallback selectors
    if (!title) {
      title = $('h1, .novel-title, .story-title').first().text().trim();
    }
    if (!author) {
      author = $('.author, .story-author, [class*="author"]').first().text().trim();
    }
    if (!cover) {
      cover = $('.cover-img, .story-cover img, img[alt*="cover"]').first().attr('src');
    }
    
    const description = $('.description, .story-description, .summary, [class*="description"]').first().text().trim();
    const genres = [];
    $('.genre, .category, .tag, [class*="genre"], [class*="category"]').each((i, el) => {
      const text = $(el).text().trim();
      if (text) genres.push(text);
    });
    
    // Lay stats
    const status = $('.status, [class*="status"]').first().text().trim();
    const views = $('.views, .view-count, [class*="view"]').first().text().trim();
    const rating = $('.rating, .score, [class*="rating"]').first().text().trim();
    
    return {
      title,
      author,
      description,
      cover: cover ? new URL(cover, url).href : null,
      genres,
      status,
      views,
      rating,
      url
    };
  } catch (error) {
    throw new Error(`Khong the crawl thong tin truyen: ${error.message}`);
  }
};

// Crawl danh sach chapters
export const crawlChapters = async (url) => {
  try {
    const response = await client.get(url, {
      headers: getHeaders(url),
      maxRedirects: 5,
      validateStatus: (status) => status < 400
    });

    const $ = cheerio.load(response.data);
    
    const chapters = [];
    
    // Tim danh sach chapters (vozer.io thuong co cau truc dac biet)
    // Thu nhieu selector khac nhau
    const chapterSelectors = [
      '.chapter-list li a',
      '.list-chapter li a', 
      '.chapter-item a',
      'a[href*="/chuong-"]',
      'ul li a[href*="/chuong-"]'
    ];
    
    let foundChapters = false;
    for (const selector of chapterSelectors) {
      $(selector).each((i, el) => {
        const $el = $(el);
        const chapterTitle = $el.text().trim();
        const chapterUrl = $el.attr('href');
        
        // Chi lay link chua "/chuong-" de loc dung chapters
        if (chapterUrl && chapterUrl.includes('/chuong-')) {
          const chapterNumber = chapterUrl.match(/chuong-(\d+)/)?.[1] || 
                               chapterTitle.match(/\d+/)?.[0] || 
                               (chapters.length + 1).toString();
          
          chapters.push({
            number: chapterNumber,
            title: chapterTitle,
            url: chapterUrl.startsWith('http') ? chapterUrl : new URL(chapterUrl, url).href
          });
          foundChapters = true;
        }
      });
      
      if (foundChapters) break;
    }
    
    return {
      total: chapters.length,
      chapters
    };
  } catch (error) {
    throw new Error(`Khong the crawl danh sach chapters: ${error.message}`);
  }
};

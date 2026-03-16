import { crawlChapterContent, crawlNovelInfo, crawlChapters, login } from '../services/vozerService.js';

// Factory function de chon service dua tren type
const getServiceByType = (type) => {
  switch (type) {
    case 'vozer':
    default:
      return {
        crawlChapter: crawlChapterContent,
        crawlNovel: crawlNovelInfo,
        crawlChapters: crawlChapters,
        login: login
      };
    // Co the them cac service khac o day
    // case 'truyenfull':
    //   return truyenFullService;
    // case 'wikidich':
    //   return wikidichService;
  }
};

export const userLogin = async (req, res) => {
  try {
    const { username, password, type = 'vozer' } = req.body;
    
    const service = getServiceByType(type);
    const result = await service.login(username, password);
    
    res.json(result);
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Loi khi dang nhap',
      error: error.message
    });
  }
};

export const crawlChapter = async (req, res) => {
  try {
    const { url, type = 'vozer' } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL la bat buoc'
      });
    }

    const service = getServiceByType(type);
    const data = await service.crawlChapter(url);
    
    res.json({
      success: true,
      type,
      data
    });
  } catch (error) {
    console.error('Error crawling chapter:', error);
    res.status(500).json({
      success: false,
      message: 'Loi khi crawl chapter',
      error: error.message
    });
  }
};

export const crawlNovel = async (req, res) => {
  try {
    const { url, type = 'vozer' } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL la bat buoc'
      });
    }

    const service = getServiceByType(type);
    const data = await service.crawlNovel(url);
    
    res.json({
      success: true,
      type,
      data
    });
  } catch (error) {
    console.error('Error crawling novel:', error);
    res.status(500).json({
      success: false,
      message: 'Loi khi crawl thong tin truyen',
      error: error.message
    });
  }
};

export const crawlChapterList = async (req, res) => {
  try {
    const { url, type = 'vozer' } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL la bat buoc'
      });
    }

    const service = getServiceByType(type);
    const data = await service.crawlChapters(url);
    
    res.json({
      success: true,
      type,
      data
    });
  } catch (error) {
    console.error('Error crawling chapters:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi crawl danh sách chapters',
      error: error.message
    });
  }
};

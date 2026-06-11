// Новости журнала (/news/operations/*).

export type NewsItem = {
  id: number; // id_bbs
  theme: string;
  time: string; // "YYYY-MM-DD HH:mm:ss"
  viewed: boolean;
};

export type NewsDetail = {
  id: number;
  theme: string;
  time: string;
  html: string; // text_bbs — HTML, рендерим через htmlToBlocks
};

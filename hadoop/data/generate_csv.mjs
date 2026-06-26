/**
 * Tạo dữ liệu lớn cho Hadoop pipeline
 * Chạy: node generate_csv.mjs
 *
 * Dùng stream ghi từng dòng → không tốn RAM dù data hàng triệu dòng
 */
import { createWriteStream } from 'fs';

// ══════════════════════════════════════════════
//  CẤU HÌNH SỐ LƯỢNG DÒNG — chỉnh ở đây
// ══════════════════════════════════════════════
const TWEET_COUNT   = 10_000_000;   // 10 triệu tweets     (~1.4 GB)
const POST_COUNT    =    500_000;   // 500 nghìn posts      (~77  MB)
const COMMENT_COUNT = 20_000_000;   // 20 triệu comments   (~2.4 GB)
// Tổng: ~30.5 triệu dòng, ~3.9 GB
// Thời gian generate trên Windows: ~15-25 phút
// ══════════════════════════════════════════════

const KEYWORDS = [
  'ChatGPT','GPT-4','Gemini','Claude AI','Llama',
  'Stable Diffusion','Midjourney','OpenAI','AI safety','machine learning',
];
const SUBREDDITS = [
  'MachineLearning','artificial','ChatGPT','LocalLLaMA',
  'OpenAI','StableDiffusion','AIArt','technology',
];
const HASHTAGS = [
  'ChatGPT','AI','MachineLearning','OpenAI','GPT4',
  'ArtificialIntelligence','DeepLearning','LLM','GenerativeAI','AIArt',
  'Midjourney','StableDiffusion','NLP','DataScience','AGI',
];
const USERNAMES = [
  'tech_fan','ai_watcher','dev_guru','data_nerd','ml_explorer',
  'future_tech','ai_daily','deepmind_fan','llm_user','gpt_addict',
  'openai_fan','neural_net','algo_master','bot_builder','code_wizard',
];
const LOCATIONS = [
  'United States','United Kingdom','Canada','Germany',
  'France','India','Japan','Australia','Brazil','Singapore',
];
const TWEET_BODIES = [
  'Just tried {kw} and it blew my mind!',
  '{kw} is changing everything about how I work',
  'Incredible results with {kw} today. The future is here!',
  'Hot take: {kw} will replace 30pct of jobs in 5 years',
  'Been using {kw} for a month. Completely transformed my workflow',
  'The {kw} update is insane! Way better than before',
  'Why is nobody talking about {kw}? This is huge',
  '{kw} just solved a problem I had for weeks in 2 minutes',
  'Disappointed with {kw} honestly. Very overhyped.',
  'My experience with {kw} after 3 months: a thread',
  '{kw} vs competitors: who wins? My honest take',
  'Just published my analysis on {kw} performance',
  'The ethics of {kw} — we need to talk about this',
  'For anyone asking: yes {kw} is worth trying',
  'Things I wish I knew before using {kw}',
];
const REDDIT_TITLES = [
  'My experience with {kw} after 6 months',
  'How {kw} changed my productivity',
  '{kw} vs competitors: an honest comparison',
  'Anyone else think {kw} is overrated?',
  'Best practices for using {kw} in 2024',
  'I built something amazing with {kw}',
  'Daily discussion: {kw} latest updates',
  'Question: how do you use {kw} for work?',
  '{kw} just got a massive update — breakdown inside',
  'Unpopular opinion about {kw}',
];
const COMMENT_BODIES = [
  'Great point! I had the same experience with {kw}.',
  'I disagree. {kw} has been very useful for me.',
  'Thanks for sharing. {kw} really is impressive.',
  'Could you elaborate on the {kw} part?',
  'I switched to {kw} and never looked back.',
  'The {kw} community is growing so fast.',
  'Not surprised. {kw} keeps improving every month.',
  'Anyone tried the new {kw} features yet?',
  'This is exactly what I needed to know about {kw}.',
  'Hard to believe how fast {kw} is advancing.',
  '{kw} saved me hours of work this week.',
  'Still prefer the old approach over {kw} honestly.',
  'The documentation for {kw} needs a lot of work.',
  'Great write-up. {kw} deserves more attention.',
  'Just started with {kw} — any beginner tips?',
];

function rnd(min, max) { return (Math.random() * (max - min) + min) | 0; }
function pick(arr) { return arr[rnd(0, arr.length - 1)]; }
function pad(n, len = 7) { return String(n).padStart(len, '0'); }

function randDate(daysAgo = 180) {
  const ms = Date.now() - rnd(0, daysAgo) * 86400000 - rnd(0, 86400000);
  const d = new Date(ms);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

function esc(s) {
  return s.includes(',') || s.includes('"')
    ? '"' + s.replace(/"/g, '""') + '"'
    : s;
}

// Stream ghi từng CHUNK_SIZE dòng → tiết kiệm RAM
const CHUNK = 50_000;

async function writeFile(path, header, rowFn, total) {
  return new Promise((resolve, reject) => {
    const ws = createWriteStream(path, { encoding: 'utf8' });
    ws.on('error', reject);

    ws.write(header + '\n');

    let i = 1;
    function writeChunk() {
      let ok = true;
      while (i <= total && ok) {
        ok = ws.write(rowFn(i) + '\n');
        i++;
        if (i % 500_000 === 0) {
          process.stdout.write(`  ${(i / 1_000_000).toFixed(1)}M / ${(total / 1_000_000).toFixed(1)}M\r`);
        }
      }
      if (i > total) {
        ws.end();
      } else {
        ws.once('drain', writeChunk);
      }
    }

    ws.on('finish', resolve);
    writeChunk();
  });
}

const start = Date.now();

// ── TWEETS ────────────────────────────────────────────────────
console.log(`\nGenerating ${TWEET_COUNT.toLocaleString()} tweets...`);
await writeFile(
  './tweets.csv',
  'tweet_id,keyword,username,text,hashtags,retweet_count,like_count,created_at,lang,location',
  (i) => {
    const kw = pick(KEYWORDS);
    const body = pick(TWEET_BODIES).replace('{kw}', kw);
    const hts = Array.from({ length: rnd(1, 3) }, () => pick(HASHTAGS)).join('|');
    const rt = rnd(0, 8000);
    return [
      `t_${pad(i)}`, kw, pick(USERNAMES) + rnd(1, 9999),
      esc(body), hts, rt, rnd(rt, rt * 6 + 100),
      randDate(), 'en', pick(LOCATIONS),
    ].join(',');
  },
  TWEET_COUNT,
);
console.log(`✅ tweets.csv — ${TWEET_COUNT.toLocaleString()} rows`);

// ── REDDIT POSTS ──────────────────────────────────────────────
console.log(`\nGenerating ${POST_COUNT.toLocaleString()} reddit posts...`);
await writeFile(
  './reddit_posts.csv',
  'post_id,subreddit,keyword,title,author,score,num_comments,url,created_at,is_self',
  (i) => {
    const kw = pick(KEYWORDS);
    const sub = pick(SUBREDDITS);
    const score = rnd(1, 20000);
    return [
      `r_${pad(i)}`, sub, kw,
      esc(pick(REDDIT_TITLES).replace('{kw}', kw)),
      pick(USERNAMES) + rnd(1, 9999),
      score, rnd(0, Math.floor(score / 3)),
      `https://reddit.com/r/${sub}/r_${pad(i)}`,
      randDate(), rnd(0, 1) ? 'true' : 'false',
    ].join(',');
  },
  POST_COUNT,
);
console.log(`✅ reddit_posts.csv — ${POST_COUNT.toLocaleString()} rows`);

// ── REDDIT COMMENTS ───────────────────────────────────────────
console.log(`\nGenerating ${COMMENT_COUNT.toLocaleString()} reddit comments...`);
await writeFile(
  './reddit_comments.csv',
  'comment_id,post_id,subreddit,author,body,score,created_at,keyword',
  (i) => {
    const kw = pick(KEYWORDS);
    return [
      `c_${pad(i, 8)}`,
      `r_${pad(rnd(1, POST_COUNT))}`,
      pick(SUBREDDITS),
      pick(USERNAMES) + rnd(1, 9999),
      esc(pick(COMMENT_BODIES).replace('{kw}', kw)),
      rnd(0, 3000), randDate(), kw,
    ].join(',');
  },
  COMMENT_COUNT,
);
console.log(`✅ reddit_comments.csv — ${COMMENT_COUNT.toLocaleString()} rows`);

const mins = ((Date.now() - start) / 60000).toFixed(1);
console.log(`\n🎉 Hoàn thành trong ${mins} phút!`);
console.log(`   tweets.csv          ${TWEET_COUNT.toLocaleString()} dòng`);
console.log(`   reddit_posts.csv    ${POST_COUNT.toLocaleString()} dòng`);
console.log(`   reddit_comments.csv ${COMMENT_COUNT.toLocaleString()} dòng`);
console.log(`   Tổng: ${(TWEET_COUNT + POST_COUNT + COMMENT_COUNT).toLocaleString()} dòng`);

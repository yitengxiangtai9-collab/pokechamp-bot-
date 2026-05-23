/**
 * ポケモンチャンピオンズ 自動投稿ボット（完全無料版）
 * Claude API不使用・X API無料プランで動作
 *
 * 使い方:
 *   node bot.js --type tips     → バトルTips（毎日）
 *   node bot.js --type meta     → 環境考察（毎週）
 */

import { TwitterApi } from "twitter-api-v2";
import { TWEETS } from "./tweets.js";

// ==============================
// 設定
// ==============================
const TWITTER_APP_KEY     = process.env.TWITTER_APP_KEY;
const TWITTER_APP_SECRET  = process.env.TWITTER_APP_SECRET;
const TWITTER_ACCESS_TOKEN  = process.env.TWITTER_ACCESS_TOKEN;
const TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET;
const DRY_RUN = process.env.DRY_RUN === "true";

// 引数でツイートタイプを切り替え
const args = process.argv.slice(2);
const typeArg = args.find(a => a.startsWith("--type=") || a === "--type");
const POST_TYPE = typeArg?.startsWith("--type=")
  ? typeArg.split("=")[1]
  : (args[args.indexOf("--type") + 1] || "tips");

// ==============================
// ツイートをローテーションで取得
// ==============================
function pickTweet(type) {
  const list = TWEETS[type];
  if (!list || list.length === 0) throw new Error(`ツイートリストが空です: ${type}`);

  // 今日が何日目かでローテーション（7日周期）
  const today = new Date();
  // tips: 曜日ベース（0=日,1=月...）
  // meta: 常に最初の1つ（週1なので）
  if (type === "tips") {
    const dayOfWeek = today.getDay(); // 0〜6
    const index = dayOfWeek % list.length;
    console.log(`[picker] 曜日: ${dayOfWeek} → tips[${index}]`);
    return list[index];
  } else {
    const weekNum = Math.floor(today.getTime() / (7 * 24 * 60 * 60 * 1000));
    const index = weekNum % list.length;
    console.log(`[picker] 週番号: ${weekNum} → meta[${index}]`);
    return list[index];
  }
}

// ==============================
// X (Twitter) に投稿
// ==============================
async function postTweet(text) {
  if (DRY_RUN) {
    console.log("\n[DRY RUN] 実際には投稿しません。内容:");
    console.log("─".repeat(40));
    console.log(text);
    console.log("─".repeat(40));
    return { id: "dry-run", text };
  }

  const client = new TwitterApi({
    appKey:      TWITTER_APP_KEY,
    appSecret:   TWITTER_APP_SECRET,
    accessToken:  TWITTER_ACCESS_TOKEN,
    accessSecret: TWITTER_ACCESS_SECRET,
  });

  console.log("[Twitter] 投稿中...");
  const result = await client.v2.tweet(text);
  console.log(`[Twitter] 投稿完了! ID: ${result.data.id}`);
  return result.data;
}

// ==============================
// メイン処理
// ==============================
async function main() {
  console.log(`\n🎮 ポケモンチャンピオンズ 自動投稿ボット`);
  console.log(`📅 ${new Date().toLocaleString("ja-JP")}`);
  console.log(`📌 投稿タイプ: ${POST_TYPE}`);
  console.log(`🔧 DRY_RUN: ${DRY_RUN}\n`);

  if (!DRY_RUN) {
    if (!TWITTER_APP_KEY)     throw new Error("TWITTER_APP_KEY が未設定");
    if (!TWITTER_APP_SECRET)  throw new Error("TWITTER_APP_SECRET が未設定");
    if (!TWITTER_ACCESS_TOKEN)  throw new Error("TWITTER_ACCESS_TOKEN が未設定");
    if (!TWITTER_ACCESS_SECRET) throw new Error("TWITTER_ACCESS_SECRET が未設定");
  }

  try {
    const tweet = pickTweet(POST_TYPE);
    console.log(`[picker] 選択されたツイート:\n${tweet}\n`);
    await postTweet(tweet);
    console.log("\n✅ 完了!");
  } catch (err) {
    console.error(`\n❌ エラー: ${err.message}`);
    process.exit(1);
  }
}

main();

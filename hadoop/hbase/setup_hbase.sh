#!/bin/bash
# ============================================================
# HBase Setup — Tạo bảng và nhập dữ liệu
# Chạy: bash setup_hbase.sh
# ============================================================

echo "=== HBASE SETUP ==="

# Tạo bảng HBase qua hbase shell
hbase shell << 'EOF'

# Tạo bảng keywords_index (tra cứu nhanh theo keyword + tweet_id)
create 'keywords_index',
  {NAME => 'tweet_info',   VERSIONS => 1, COMPRESSION => 'SNAPPY'},
  {NAME => 'metrics',      VERSIONS => 3, COMPRESSION => 'SNAPPY'},
  {NAME => 'metadata',     VERSIONS => 1}

# Tạo bảng social_stats (thống kê tổng hợp)
create 'social_stats',
  {NAME => 'keyword_stats', VERSIONS => 5},
  {NAME => 'daily_stats',   VERSIONS => 1},
  {NAME => 'sentiment',     VERSIONS => 1}

# Xem danh sách bảng đã tạo
list

# Xem cấu trúc bảng keywords_index
describe 'keywords_index'
describe 'social_stats'

# Thêm dữ liệu mẫu để kiểm tra
put 'keywords_index', 'ChatGPT_t_0000001', 'tweet_info:keyword',       'ChatGPT'
put 'keywords_index', 'ChatGPT_t_0000001', 'tweet_info:username',      'tech_fan123'
put 'keywords_index', 'ChatGPT_t_0000001', 'tweet_info:text',          'Just tried ChatGPT and it blew my mind!'
put 'keywords_index', 'ChatGPT_t_0000001', 'metrics:retweet_count',    '1523'
put 'keywords_index', 'ChatGPT_t_0000001', 'metrics:like_count',       '8921'
put 'keywords_index', 'ChatGPT_t_0000001', 'metadata:created_at',      '2024-03-15 08:23:11'

# Thêm thống kê tổng hợp
put 'social_stats', 'ChatGPT',         'keyword_stats:mention_count',  '98432'
put 'social_stats', 'ChatGPT',         'keyword_stats:total_retweets', '4521034'
put 'social_stats', 'GPT-4',           'keyword_stats:mention_count',  '87651'
put 'social_stats', 'Midjourney',      'keyword_stats:mention_count',  '72341'

# Đọc lại kiểm tra
get 'keywords_index', 'ChatGPT_t_0000001'
get 'social_stats', 'ChatGPT'

# Đếm số row
count 'keywords_index'

EOF

echo "=== HBASE SETUP HOÀN THÀNH ==="
echo ""
echo "Row key design:"
echo "  keywords_index: {keyword}_{tweet_id}"
echo "  Column families: tweet_info, metrics, metadata"
echo ""
echo "  social_stats:   {keyword}"
echo "  Column families: keyword_stats, daily_stats, sentiment"

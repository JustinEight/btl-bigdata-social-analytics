# ============================================================
# SETUP WINDOWS — BTL Big Data Social Analytics
# Chạy file này bằng PowerShell (không cần admin)
# Cách chạy: Right-click → Run with PowerShell
# Hoặc trong PowerShell: cd <thư mục project> ; .\hadoop\setup_windows.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$SANDBOX_HOST = "localhost"
$SANDBOX_PORT = "2222"
$SANDBOX_USER = "root"
$SANDBOX_PASS = "hadoop"
$SCRIPT_DIR   = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Split-Path -Parent $SCRIPT_DIR

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  BTL Big Data — Windows Setup Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# ── Hàm tiện ích ──────────────────────────────────────────
function Info  ($msg) { Write-Host "[INFO]  $msg" -ForegroundColor Cyan }
function OK    ($msg) { Write-Host "[OK]    $msg" -ForegroundColor Green }
function Warn  ($msg) { Write-Host "[WARN]  $msg" -ForegroundColor Yellow }
function Err   ($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Step  ($n, $msg) { Write-Host "`n--- Bước $n : $msg ---" -ForegroundColor Magenta }

function Pause-Wait ($msg) {
    Write-Host "`n$msg" -ForegroundColor Yellow
    Read-Host "Nhấn Enter để tiếp tục..."
}

# ── Kiểm tra Node.js ──────────────────────────────────────
Step 0 "Kiểm tra môi trường"
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = node --version
    OK "Node.js $nodeVer đã cài"
} else {
    Err "Node.js chưa cài! Tải tại: https://nodejs.org (LTS)"
    Err "Cài xong rồi chạy lại script này."
    exit 1
}

if (Get-Command ssh -ErrorAction SilentlyContinue) {
    OK "SSH đã sẵn sàng (Windows built-in)"
} else {
    Err "SSH không tìm thấy. Bật OpenSSH trong Windows Settings → Optional Features"
    exit 1
}

# ── Bước 1: Tạo thư mục data ──────────────────────────────
Step 1 "Chuẩn bị thư mục data"
$dataDir = Join-Path $SCRIPT_DIR "data"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir | Out-Null
}
OK "Thư mục: $dataDir"

# ── Bước 2: Sinh CSV (chọn size) ─────────────────────────
Step 2 "Sinh dữ liệu CSV"

$csvChoice = Read-Host @"
Chọn kích thước dữ liệu:
  [1] Nhỏ   —  100,000 dòng (~15MB)   — nhanh, dùng để test
  [2] Vừa   —  1,000,000 dòng (~150MB) — phù hợp demo
  [3] Đầy đủ — 1,000,000,000 dòng (1 tỷ, ~131GB) — nộp thật (mất 3-5 giờ)
Nhập số
"@

switch ($csvChoice) {
    "1" { $tweetCount = 70000;  $postCount = 5000;  $commentCount = 25000  }
    "2" { $tweetCount = 700000; $postCount = 50000; $commentCount = 250000 }
    "3" { $tweetCount = 500000000; $postCount = 10000000; $commentCount = 490000000 }
    default {
        Warn "Không hợp lệ, chọn mặc định: Nhỏ (100K dòng)"
        $tweetCount = 70000; $postCount = 5000; $commentCount = 25000
    }
}

$generateScript = Join-Path $dataDir "generate_csv.mjs"
$tweetsFile     = Join-Path $dataDir "tweets.csv"
$postsFile      = Join-Path $dataDir "reddit_posts.csv"
$commentsFile   = Join-Path $dataDir "reddit_comments.csv"

# Patch số dòng tạm thời
$content = Get-Content $generateScript -Raw
$content = $content -replace "const TWEET_COUNT\s*=\s*[\d_]+",   "const TWEET_COUNT   = $tweetCount"
$content = $content -replace "const POST_COUNT\s*=\s*[\d_]+",    "const POST_COUNT    = $postCount"
$content = $content -replace "const COMMENT_COUNT\s*=\s*[\d_]+", "const COMMENT_COUNT = $commentCount"
Set-Content $generateScript $content -Encoding UTF8
OK "Đã cập nhật số dòng: tweets=$tweetCount, posts=$postCount, comments=$commentCount"

if ((Test-Path $tweetsFile) -and (Test-Path $postsFile) -and (Test-Path $commentsFile)) {
    $skip = Read-Host "File CSV đã tồn tại. Bỏ qua sinh lại? [y/n]"
    if ($skip -eq "y") {
        OK "Bỏ qua, dùng file cũ"
    } else {
        Info "Đang sinh CSV... (có thể mất vài phút)"
        Set-Location $dataDir
        node generate_csv.mjs
        Set-Location $PROJECT_ROOT
        OK "Sinh CSV xong"
    }
} else {
    Info "Đang sinh CSV... (có thể mất vài phút)"
    Set-Location $dataDir
    node generate_csv.mjs
    Set-Location $PROJECT_ROOT
    OK "Sinh CSV xong"
}

# Hiển thị kích thước
Get-ChildItem $dataDir -Filter "*.csv" | ForEach-Object {
    $sizeMB = [math]::Round($_.Length / 1MB, 2)
    Info "  $($_.Name) — $sizeMB MB"
}

# ── Bước 3: Kiểm tra Sandbox đang chạy ───────────────────
Step 3 "Kiểm tra HDP Sandbox"

Pause-Wait @"
Đảm bảo HDP Sandbox đang chạy trong VirtualBox:
  1. Mở VirtualBox
  2. Chọn HDP Sandbox → nhấn Start
  3. Chờ boot xong (~5-10 phút)
  4. Sandbox sẵn sàng khi thấy màn hình hiện địa chỉ IP
"@

Info "Kiểm tra kết nối SSH đến Sandbox..."
$sshTest = ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p $SANDBOX_PORT `
    "${SANDBOX_USER}@${SANDBOX_HOST}" "echo OK" 2>&1
if ($sshTest -match "OK") {
    OK "Kết nối Sandbox thành công!"
} else {
    Err "Không kết nối được Sandbox. Kiểm tra:"
    Err "  - VirtualBox đang chạy và Sandbox đã boot xong"
    Err "  - Port forwarding: Host 2222 → Guest 22"
    Warn "Nếu lần đầu, chạy trong Sandbox: passwd root (đổi pass thành 'hadoop')"
    exit 1
}

# ── Bước 4: Copy files lên Sandbox ───────────────────────
Step 4 "Copy files lên Sandbox"

$filesToCopy = @(
    @{ src = $tweetsFile;   dst = "/root/tweets.csv" },
    @{ src = $postsFile;    dst = "/root/reddit_posts.csv" },
    @{ src = $commentsFile; dst = "/root/reddit_comments.csv" },
    @{ src = (Join-Path $SCRIPT_DIR "mysql\setup_mysql.sql");       dst = "/root/setup_mysql.sql" },
    @{ src = (Join-Path $SCRIPT_DIR "hdfs\setup_hdfs.sh");          dst = "/root/setup_hdfs.sh" },
    @{ src = (Join-Path $SCRIPT_DIR "hbase\setup_hbase.sh");        dst = "/root/setup_hbase.sh" },
    @{ src = (Join-Path $SCRIPT_DIR "sqoop\import_commands.sh");    dst = "/root/import_commands.sh" },
    @{ src = (Join-Path $SCRIPT_DIR "hive\1_create_tables.hql");    dst = "/root/1_create_tables.hql" },
    @{ src = (Join-Path $SCRIPT_DIR "hive\2_queries.hql");          dst = "/root/2_queries.hql" },
    @{ src = (Join-Path $SCRIPT_DIR "pig\keyword_stats.pig");       dst = "/root/keyword_stats.pig" },
    @{ src = (Join-Path $SCRIPT_DIR "pig\daily_keyword.pig");       dst = "/root/daily_keyword.pig" },
    @{ src = (Join-Path $SCRIPT_DIR "pig\subreddit_stats.pig");     dst = "/root/subreddit_stats.pig" },
    @{ src = (Join-Path $SCRIPT_DIR "flume\flume-agent.conf");      dst = "/root/flume-agent.conf" },
    @{ src = (Join-Path $SCRIPT_DIR "oozie\workflow.xml");          dst = "/root/workflow.xml" },
    @{ src = (Join-Path $SCRIPT_DIR "oozie\coordinator.xml");       dst = "/root/coordinator.xml" },
    @{ src = (Join-Path $SCRIPT_DIR "oozie\job.properties");        dst = "/root/job.properties" }
)

foreach ($f in $filesToCopy) {
    if (Test-Path $f.src) {
        $fileName = Split-Path $f.src -Leaf
        Info "Copying $fileName..."
        scp -o StrictHostKeyChecking=no -P $SANDBOX_PORT $f.src "${SANDBOX_USER}@${SANDBOX_HOST}:$($f.dst)" 2>&1 | Out-Null
        OK "  $fileName → Sandbox:$($f.dst)"
    } else {
        Warn "Không tìm thấy: $($f.src)"
    }
}

# ── Bước 5: Chạy pipeline trong Sandbox ──────────────────
Step 5 "Chạy pipeline Hadoop"

Write-Host @"

Từ đây pipeline sẽ chạy tự động bên trong Sandbox.
Mỗi bước sẽ hỏi bạn có muốn chạy không (để dễ chụp màn hình).

"@ -ForegroundColor White

function Run-InSandbox ($label, $cmd) {
    $run = Read-Host "Chạy '$label'? [y/n]"
    if ($run -ne "y") { Warn "Bỏ qua $label"; return }
    Info "Đang chạy: $label"
    ssh -o StrictHostKeyChecking=no -p $SANDBOX_PORT "${SANDBOX_USER}@${SANDBOX_HOST}" $cmd
    OK "$label hoàn thành"
    Read-Host ">>> CHỤP MÀN HÌNH ngay! Nhấn Enter để tiếp tục..."
}

# 5a. Tạo thư mục Flume input
Run-InSandbox "Tạo thư mục Flume" @"
mkdir -p /home/user/data/incoming/tweets /home/user/data/incoming/reddit
cp /root/tweets.csv /home/user/data/incoming/tweets/tweets_2024-01-01.csv
cp /root/reddit_posts.csv /home/user/data/incoming/reddit/reddit_2024-01-01.csv
echo 'Thư mục Flume đã tạo xong'
ls -lh /home/user/data/incoming/tweets/
"@

# 5b. Setup HDFS
Run-InSandbox "Setup HDFS" @"
bash /root/setup_hdfs.sh
"@

# 5c. Setup MySQL
Run-InSandbox "Setup MySQL" @"
mysql -u root -phadoop < /root/setup_mysql.sql
echo 'MySQL setup xong — kiểm tra:'
mysql -u root -phadoop -e 'USE social_db; SELECT COUNT(*) AS tweets_count FROM tweets; SELECT COUNT(*) AS posts_count FROM reddit_posts;'
"@

# 5d. HBase
Run-InSandbox "Setup HBase" @"
bash /root/setup_hbase.sh
"@

# 5e. Sqoop import
Run-InSandbox "Sqoop Import" @"
bash /root/import_commands.sh
"@

# 5f. Hive tạo bảng
Run-InSandbox "Hive — Tạo bảng" @"
hive -f /root/1_create_tables.hql
"@

# 5g. Hive queries
Run-InSandbox "Hive — 5 Queries phân tích" @"
hive -f /root/2_queries.hql 2>&1 | tee /root/hive_results.txt
echo '=== KẾT QUẢ Q1-Q5 ==='
cat /root/hive_results.txt | grep -A 20 'Q1\|Q2\|Q3\|Q4\|Q5'
"@

# 5h. Pig scripts
Run-InSandbox "Pig — keyword_stats" @"
pig -x mapreduce /root/keyword_stats.pig 2>&1 | tail -20
hdfs dfs -cat /user/social_analytics/processed/pig_keyword_stats/part-r-00000 2>/dev/null | head -10
"@

Run-InSandbox "Pig — daily_keyword" @"
pig -x mapreduce /root/daily_keyword.pig 2>&1 | tail -20
hdfs dfs -cat /user/social_analytics/processed/pig_daily_keyword/part-r-00000 2>/dev/null | head -10
"@

Run-InSandbox "Pig — subreddit_stats" @"
pig -x mapreduce /root/subreddit_stats.pig 2>&1 | tail -20
hdfs dfs -cat /user/social_analytics/processed/pig_subreddit_stats/part-r-00000 2>/dev/null | head -10
"@

# 5i. Oozie (optional)
Run-InSandbox "Oozie — Upload workflow" @"
hdfs dfs -mkdir -p /user/oozie/social_analytics
hdfs dfs -put /root/workflow.xml    /user/oozie/social_analytics/
hdfs dfs -put /root/coordinator.xml /user/oozie/social_analytics/
echo 'Upload xong. Chạy pipeline:'
echo '  oozie job -config /root/job.properties -run'
hdfs dfs -ls /user/oozie/social_analytics/
"@

# ── Bước 6: Flume demo ───────────────────────────────────
Step 6 "Khởi động Flume (demo thu thập)"

$flumeDemo = Read-Host "Khởi động Flume agent để demo? [y/n]"
if ($flumeDemo -eq "y") {
    Write-Host @"

Flume sẽ chạy trong background 60 giây để demo.
Mở Ambari UI (http://localhost:8080) để xem logs trong khi chờ.

"@ -ForegroundColor Yellow
    ssh -o StrictHostKeyChecking=no -p $SANDBOX_PORT "${SANDBOX_USER}@${SANDBOX_HOST}" @"
# Copy thêm file để Flume thu thập
cp /root/tweets.csv /home/user/data/incoming/tweets/tweets_demo.csv

# Chạy Flume 60 giây
timeout 60 flume-ng agent \
  --conf /etc/flume/conf \
  --conf-file /root/flume-agent.conf \
  --name social_agent \
  -Dflume.root.logger=INFO,console 2>&1 | tail -30 &

echo 'Flume đang chạy...'
sleep 10
hdfs dfs -ls /user/social_analytics/raw/tweets/ 2>/dev/null || echo 'Đang chờ Flume ghi data...'
"@
    Read-Host ">>> CHỤP MÀN HÌNH Flume log! Nhấn Enter để tiếp tục..."
}

# ── Tổng kết ─────────────────────────────────────────────
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  PIPELINE HOÀN THÀNH!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Checklist màn hình cần nộp:" -ForegroundColor White
@(
    "[ ] Ambari dashboard — tất cả services màu xanh (http://localhost:8080)",
    "[ ] HDFS file browser — 3 file data trong /user/social_analytics/",
    "[ ] hdfs dfs -du -h  — hiện kích thước files",
    "[ ] MySQL: SELECT COUNT(*) — số dòng đã import",
    "[ ] HBase describe 'keywords_index'",
    "[ ] Sqoop log — 'Retrieved X records from MySQL'",
    "[ ] Flume log — 'Appending to file...'",
    "[ ] Hive Q1–Q5 — bảng kết quả từng query",
    "[ ] Pig DUMP — kết quả 3 scripts",
    "[ ] Oozie UI — workflow status (http://localhost:11000/oozie)"
) | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }

Write-Host ""
Write-Host "Xem hướng dẫn đầy đủ: hadoop\HUONG_DAN_WINDOWS.md" -ForegroundColor Cyan
Write-Host ""

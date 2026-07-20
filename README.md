# 回台減重計畫 App

單一 HTML 檔案(`index.html`),純前端、無後端,給使用者在 7/20 - 8/28(回台灣前)倒數期間追蹤飲食、運動、體重的小工具。資料持久化優先用執行環境提供的 `window.storage`(key-value,分 personal/shared);若環境沒有(例如直接用手機/瀏覽器打開檔案),會自動退回瀏覽器內建的 `localStorage`,資料一樣存得住。

## 使用者背景 / 目標
- 目標:64kg → 60kg(或更低),8/28 回台灣前
- 平常運動:5-8 磅啞鈴 + 跑步機 + 全身燃脂動作,參考的是 IG/FB reels 上「健身房練 VS 居家練」系列影片(直角肩、大腿內側、手臂塑形、拜拜肉)
- 冰箱食材:牛排、雞肉、鱸魚、牛肉片、蝦仁、豆腐/韓式嫩豆腐鍋、白飯、白麵、小黃瓜、蔥、蕃茄、水果(蕃茄/橘子/蘋果)、一根玉米
- 早餐習慣:通常只吃 1 顆水煮蛋,偶爾加水果
- 用 RENPHO Health App 藍牙體重計量體重/體脂/BMI/肌肉重量(無公開 API 可串接,所以是手動輸入)
- 前一天晚上準備隔天午餐,約 4:30 到家開始煮飯

## 已實作功能
1. **倒數 + 進度**:剩餘天數、完成天數、最新體重(頂部三個卡片)
2. **今日菜單**:一打開就看到今天早/午/晚餐+水果,不用點開(`renderTodayMenu()`);餐別名稱**粗體(900)、字放大**,內容字級加大易讀
3. **每日打卡清單**(7/20-8/28,40 天):
   - 運動依星期輪替:一三五重訓(肩→大腿內側→手臂→拜拜肉,4 部位循環)、二四六跑步機間歇+全身燃脂(開合跳/高抬腿/登山跑/深蹲跳)、日休息
   - 每個運動動作、每個飲食欄位都可以點 ✏️ 直接編輯,存檔後永久覆蓋預設文字(`dietover:`、`exover:` storage prefix)
   - 每個運動動作、每天整體都能打勾記錄完成(`ex:`、`dayplan:` prefix)
4. **體重/體脂/BMI/肌肉重量紀錄**:手動輸入四個數字,存成 `metricslog`(JSON array),畫體重趨勢 SVG 折線圖 + 目標線(60kg)+ 最新數值卡片 + 近 7 天歷史
5. **飲食紀錄 · 熱量(手動輸入)**:選餐別(早/午/晚/點心)→ 輸入食物;內建約 370 筆食物資料庫(分類涵蓋:雞豬牛羊海鮮蛋豆、澱粉根莖、麵包烘焙、蔬菜、水果、乳製品、堅果油脂、飲料、台式小吃夜市、麵食中式、日韓西式速食、甜點冰品)(`FOOD_DB`,以各種**食材**為主:各式肉類/海鮮/蛋豆、澱粉根莖、蔬菜、水果、乳製品、堅果油脂 + 台式外食),打字用**自訂建議清單**即時篩選、顯示名稱+熱量、點選帶入(取代 iOS 支援不佳的 `<datalist>`);資料庫沒有的加入後記成自訂食材(`customfoods`),下次會出現在建議 → 每筆可**選填一張照片**(`resizeImageToBase64` 縮成縮圖存 `thumb`);存進 `foodlog`(`{id,date,meal,name,kcal,thumb?}`)。可設「今日熱量目標」(存 `kcaltarget`),即時算今日總熱量、進度條、還可吃/超過多少;`buildAdvice()` 依「今天吃多少 + 今天是重訓/燃脂/休息日 + 哪幾餐還沒吃」動態給飲食或運動的調整建議(超標建議減澱粉或加運動、額度足則正常吃)。
6. **個人資料 · 減重分析**:輸入性別/年齡/身高/目前體重/目標體重/目標體脂/達成日期(存 `profile`)→ 用 Mifflin-St Jeor 算 BMR、乘活動係數 1.45 得 TDEE、依「還要減的公斤 × 7700 kcal ÷ 剩餘天數」算每日赤字 →「每日建議攝取」;若低於安全下限(女 1200/男 1500)會判定時程太趕、改用安全值並推算實際可達成日。同時給每日蛋白質建議(目標體重 ×1.6g)與運動建議,並**自動把每日建議攝取套進飲食紀錄的熱量目標**(`kcaltarget`)。
7. **拍照估熱量(AI · 選用)**:選好餐別(早/午/晚/點心)後,上傳一張食物照片 → 呼叫 Google Gemini 視覺模型辨識食物、估算整份熱量 → **自動新增**進所選餐別的飲食紀錄(含縮圖),數字為估計值可再刪改。因為是純前端靜態網頁,採「使用者自備金鑰」:到 [Google AI Studio](https://aistudio.google.com/apikey) 申請**免費** API 金鑰(不需信用卡)貼進 App,金鑰只存在使用者裝置的 `geminikey`(`shared:false`,**不會寫進程式碼/repo**);沒填金鑰時會顯示申請說明。直接從瀏覽器 `fetch` `generativelanguage.googleapis.com`;模型會**依序嘗試** `gemini-2.5-flash → 2.5-flash-lite → flash-latest → 2.0-flash`(舊的 `gemini-2.0-flash` 免費額度已被 Google 歸零,故擺最後備援),遇 429 配額用完就換下一個、金鑰無效(400/403)則立即停止並提示。
8. **喝水紀錄**:今日喝水杯數,＋／－ 按鈕加減,杯子圖示視覺化、顯示 ml、達標打勾;可設每日目標杯數(1 杯 250ml,存 `watergoal`),每天杯數存 `waterlog`(`{ "<iso>": 杯數 }`)。飲食/喝水/體重類與減重規劃類、原本計畫都會顯示。
9. **運動計畫 · 客製化**:使用者自己輸入「一週想練幾天 / 每次有氧幾分鐘 / 器材・想加強部位・偏好(自由文字)」→ 按「產生我的客製化運動計畫」。**有貼 AI 金鑰**時,把這些輸入連同個人資料(性別/目前・目標體重/達成日期)丟給 Google Gemini,回傳一週 7 天的客製課表(每天 type/focus/動作組數次數 + 提醒);**沒金鑰**時用內建規則(依天數把重訓與有氧交替排開、其餘休息)產生,失敗也會自動退回內建版。整包(輸入+產生的計畫)存 `workout`,可收合(`wocollapsed`),AI 呼叫共用 `geminiJSON()`,輸出以 `esc()` 轉義避免注入。此區塊與個人資料一樣只在 `full` / `origin` 計畫顯示。
10. **多計畫(長期使用)**:頂部可切換/新增計畫,新增時自己命名並選類型 —— `track`(飲食+喝水+體重=飲食紀錄+喝水+量測)、`full`(減重規劃=個人分析+飲食+喝水+量測)、`origin`(原本的完整回台計畫,含倒數/菜單/打卡)。計畫清單存 `plans`、目前計畫存 `currentplan`;**各計畫資料獨立**(非預設計畫的 storage key 會加 `p:<planId>:` 前綴,例如 `p:pl123:metricslog`),`customfoods` 為跨計畫共用。可改名、可刪除自建計畫(刪除會一併清掉該計畫的 metricslog/foodlog/kcaltarget/profile/waterlog/watergoal)。舊版的 `weight`/`calorie` 類計畫載入時會自動轉為 `track`。

## Storage Key 一覽
| Prefix / Key         | 內容                                   | Shared |
|----------------------|----------------------------------------|--------|
| `dayplan:<iso>`       | 當天整體是否打勾完成 ("1"/"0")          | false  |
| `ex:<iso>:<exi>`      | 第 exi 個運動動作是否打勾               | false  |
| `dietover:<iso>:<field>` | 使用者手動編輯覆蓋的飲食文字(field = breakfast/lunch/dinner/fruit) | false |
| `exover:<iso>:<exi>`  | 使用者手動編輯覆蓋的運動細節文字         | false  |
| `metricslog`          | JSON array,體重/體脂/BMI/肌肉重量歷史紀錄  | false  |
| `foodlog`             | JSON array `{id,date,meal,name,kcal}`,手動三餐飲食紀錄 | false |
| `kcaltarget`          | 每日熱量目標(kcal,分析後自動帶入、可自訂) | false  |
| `waterlog`            | JSON `{ "<iso>": 杯數 }`,每日喝水杯數          | false  |
| `watergoal`           | 每日喝水目標杯數(1 杯 250ml)                  | false  |
| `geminikey`           | 使用者自備的 Google Gemini 免費 API 金鑰(拍照估熱量 / 運動計畫用,只存本機、不進 repo) | false |
| `workout`             | JSON `{days,cardio,note,plan}`,運動需求輸入 + 產生的客製課表 | false |
| `wocollapsed`         | 運動計畫區塊是否收合 ("1"/"0")               | false  |
| `profile`             | JSON,個人資料(性別/年齡/身高/體重/目標) | false  |
| `customfoods`         | JSON array `{n,k}`,使用者自訂食材(跨計畫共用) | false |
| `plans`               | JSON array `{id,name,type}`,計畫清單         | false  |
| `currentplan`         | 目前所在計畫 id                          | false  |
| `p:<id>:<key>`        | 非預設計畫的各項資料(metricslog/foodlog/kcaltarget/profile…) | false |

## 字型
- 全站文字都用 **RedBeanCream(紅豆奶霜體)**,改以**外部字型檔**載入(涵蓋完整 6208 字元、5689 個中文,幾乎所有常用中文都有,使用者**手動輸入**的字也能正確顯示為此字體)
- `assets/redbean-full.woff2`(約 2.2MB,主要)/ `assets/redbean-full.woff`(約 2.6MB,備援):由原始 ttf 全字元轉檔
- `assets/紅豆奶霜體.ttf`:原始字型檔(完整版,4.3MB)
- 註:改用完整外部字型後,之後 HTML 新增任何中文字都**不用再重跑子集化**了(舊的 `redbean-subset.woff` 已移除)

## 已知限制 / 待改進方向
- 無法直接串接 RENPHO Health App 拉體重資料(無公開 API),仍須手動輸入
- 熱量是使用者手動輸入 + 內建食物資料庫的估值,非精確秤重,數字僅供參考;每筆紀錄可刪除
- Reminders(iPhone 提醒事項)是透過對話當時的 `reminder_create_v0` 工具一次性建立 39 筆(7/20-8/27,每天 16:20),**不是**由這個 HTML App 自動產生或管理的,App 本身沒有寫入提醒事項的程式碼
- 目前運動/飲食輪替邏輯是寫死在 JS 陣列裡(`liftPrograms`、`cardioExercises`、`lunchText`、`dinnerText`、`proteinRotation`),要換食材或動作需要改程式碼,沒有另外做設定畫面
- 沒有帳號系統,資料綁定在這個檔案的 storage 上,同一個裝置/瀏覽器打開才看得到之前的紀錄

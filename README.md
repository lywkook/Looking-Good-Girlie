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
0. **主畫面(計畫首頁)**:一進 App 先看到「我的計畫」清單(`#homeScreen`),每個計畫一張卡片(名稱+類型),點一下進入該計畫的完整畫面(`#appView`);App 內左上角 🏠 可回首頁。首頁也能直接新增計畫。
0b. **字體切換**:內建**粗線體(CuHsianTi)**與**紅豆奶霜體(RedBeanCream)**兩套完整中文字型,計畫選單 / 首頁都能一鍵切換比較(存 `fontpref`,預設粗線體)。
0c. **標題可編輯**:頂部「64→60 大作戰」標題可點 ✏️ 改字,自動儲存(`herotitle`,隨計畫獨立)。
1. **倒數 + 進度**:剩餘天數、完成天數、最新體重(頂部三個卡片)
2. **今日菜單**:一打開就看到今天早/午/晚餐+水果,不用點開(`renderTodayMenu()`)。每餐**一行呈現**(餐別粗體 + 食物內容 + ✏️ 同一 flex 列,不留空行),內容**只寫「吃什麼」**(精簡到食物本身)。可點 ✏️ 逐項編輯;也提供「🔄 不想吃這些?換一份」:**先選要換哪一餐**(早/午/晚/水果分頁,預設午餐)→ 輸入想吃的(如「牛肉麵、清淡的、日式」,可留空)→ **有 AI 金鑰**時用 Gemini 依熱量目標+冰箱食材只重生成「那一餐」並套用(存成當天 `dietover:`),**沒金鑰**時從該餐的內建替代清單(`MEAL_ALT`)換一個不同選項。
3. **每日打卡清單**(7/20-8/28,40 天):
   - 運動依星期輪替:一三五重訓(肩→大腿內側→手臂→拜拜肉,4 部位循環)、二四六跑步機間歇+全身燃脂(開合跳/高抬腿/登山跑/深蹲跳)、日休息
   - 每個運動動作、每個飲食欄位都可以點 ✏️ 直接編輯,存檔後永久覆蓋預設文字(`dietover:`、`exover:` storage prefix)
   - 每個運動動作、每天整體都能打勾記錄完成(`ex:`、`dayplan:` prefix)
4. **今日身體數據**(體重/體脂/BMI/肌肉重量):手動輸入四個數字,存成 `metricslog`(JSON array),畫體重趨勢 SVG 折線圖 + 目標線(60kg)+ 最新數值卡片 + 近 7 天歷史
5. **飲食紀錄 · 熱量(手動輸入)**:選餐別(早/午/晚/點心)→ 輸入食物;內建約 370 筆食物資料庫(分類涵蓋:雞豬牛羊海鮮蛋豆、澱粉根莖、麵包烘焙、蔬菜、水果、乳製品、堅果油脂、飲料、台式小吃夜市、麵食中式、日韓西式速食、甜點冰品)(`FOOD_DB`,以各種**食材**為主:各式肉類/海鮮/蛋豆、澱粉根莖、蔬菜、水果、乳製品、堅果油脂 + 台式外食),打字用**自訂建議清單**即時篩選、顯示名稱+熱量、點選帶入(取代 iOS 支援不佳的 `<datalist>`);資料庫沒有的加入後記成自訂食材(`customfoods`),下次會出現在建議 → 每筆可**選填一張照片**(`resizeImageToBase64` 縮成縮圖存 `thumb`);存進 `foodlog`(`{id,date,meal,name,unit,qty,kcal,thumb?}`,`kcal = unit × qty`)。**每筆可調數量**(新增時預設 1、紀錄裡有 −/＋ 即時重算熱量)、**點名稱可直接改名**、可用左側握把**拖曳換餐別**(pointer 事件、觸控/滑鼠皆可;四餐別固定顯示為放置區)。可設「今日熱量目標」(存 `kcaltarget`),即時算今日總熱量、進度條、還可吃/超過多少;`buildAdvice()` 依「今天吃多少 + 今天是重訓/燃脂/休息日 + 哪幾餐還沒吃」動態給飲食或運動的調整建議(超標建議減澱粉或加運動、額度足則正常吃)。
6. **個人資料 · 減重分析**(改為 **modal**,不在計畫內頁):於**主畫面**點該計畫卡片的「⚙️ 資料」開啟編輯,新增 full 計畫時自動跳出。輸入性別/年齡/身高/目前體重/目標體重/目標體脂/達成日期(存 `profile`)→ 用 Mifflin-St Jeor 算 BMR、乘活動係數 1.45 得 TDEE、依「還要減的公斤 × 7700 kcal ÷ 剩餘天數」算每日赤字 →「每日建議攝取」;若低於安全下限(女 1200/男 1500)會判定時程太趕、改用安全值並推算實際可達成日。同時給每日蛋白質建議(目標體重 ×1.6g)與運動建議,並**自動把每日建議攝取套進飲食紀錄的熱量目標**(`kcaltarget`)。
7. **拍照估熱量(AI · 選用)**:選好餐別(早/午/晚/點心)後,上傳一張食物照片 → 呼叫 Google Gemini 視覺模型辨識食物、估算整份熱量 → **自動新增**進所選餐別的飲食紀錄(含縮圖),數字為估計值可再刪改。**若 AI 有漏**:分析結果下方會出現「＋ 補食材到○餐」,飲食紀錄裡每一餐標題旁也有「＋ 補食材」按鈕(`focusMealInput()`)——點了會把餐別分頁切到那一餐、捲到並聚焦輸入框,直接補打漏掉的食材/飲料即可(存進同一餐)。因為是純前端靜態網頁,採「使用者自備金鑰」:到 [Google AI Studio](https://aistudio.google.com/apikey) 申請**免費** API 金鑰(不需信用卡)貼進 App,金鑰只存在使用者裝置的 `geminikey`(`shared:false`,**不會寫進程式碼/repo**);沒填金鑰時會顯示申請說明。直接從瀏覽器 `fetch` `generativelanguage.googleapis.com`、以 **`x-goog-api-key` 標頭**帶金鑰(比 query string 穩);金鑰會先 `cleanKey()` 去除空白/引號,並檢查是否符合 `AIza…` 格式(不符會在畫面警告)。模型會**依序嘗試** `gemini-2.5-flash → 2.5-flash-lite → flash-latest → 2.0-flash`(舊的 `gemini-2.0-flash` 免費額度已被 Google 歸零,故擺最後備援),遇 429 配額用完就換下一個、金鑰驗證問題(**401**/400/403)則立即停止並給明確的中文指引(重新複製或重建金鑰)。
8. **喝水紀錄**:今日喝水杯數,＋／－ 按鈕加減,杯子圖示視覺化、顯示 ml、達標打勾;可設每日目標杯數(1 杯 250ml,存 `watergoal`),每天杯數存 `waterlog`(`{ "<iso>": 杯數 }`)。飲食/喝水/體重類與減重規劃類、原本計畫都會顯示。
9. **冰箱有什麼 · 煮什麼**:整合成一個可收合區塊(`fridgeSection`)。**不預設**任何食材——由使用者**打字加入**、或點下方「常用」建議(`FRIDGE_PRESET`)快速加入;已加入的食材做成標籤、每個都可**按 ✕ 刪除**。按「推薦可以煮的菜」→ **有 AI 金鑰**用 Gemini 依所選食材+熱量目標推薦 5-6 道家常菜(菜名+估計熱量),**沒金鑰**用內建食譜庫(`RECIPES`,以所選食材比對)推薦。所選食材存 `fridge`(`{have}`)、可收合(`frcollapsed`),並**整合**進「換菜單」——換菜單的 AI 會優先參考冰箱實際有的食材。此區塊只在 `full` / `origin` 計畫顯示。
10. **運動計畫**(合併「客製化生成」+「每日打卡」):可收合(`wocollapsed`)。上半:自己輸入「一週想練幾天 / 每次有氧幾分鐘 / 器材・偏好」→「產生 / 重新調整運動計畫」——**有金鑰**用 Gemini 依個人資料生成一週課表、**沒金鑰**用內建規則,存 `workout`;下半 `#checkinBlock`(只在 `origin` 計畫顯示):原本的每日打卡清單(40 天輪替重訓/燃脂/休息、動作可 ✏️ 編輯、可打勾),上方有**日期選擇器**可跳到某一天(`jumpToDay()` 展開並高亮該日卡片)。原本獨立的「每日打卡計畫」區塊已併入此處。
11. **提醒**(`reminderSection`,只在 `origin` 計畫、可收合):條列式內容 **今晚晚餐 + 明日午餐 + 今日運動**(各可勾選),可開關、設定時間;預覽內容**即時反映**你在 App 裡改的菜單/運動;一鍵複製(貼到 iPhone 提醒事項/捷徑)。存 `reminder`/`rmcollapsed`。注意:純前端網頁**無法**在關閉時自動跳 iPhone 通知(無後端/iOS 限制),故以「即時內容 + 複製」方式呈現。
12. **多計畫(長期使用)**:頂部可切換/新增計畫,新增時自己命名並選類型 —— `track`(飲食+喝水+體重=飲食紀錄+喝水+量測)、`full`(減重規劃=個人分析+飲食+喝水+量測)、`origin`(原本的完整回台計畫,含倒數/菜單/打卡)。計畫清單存 `plans`、目前計畫存 `currentplan`;**各計畫資料獨立**(非預設計畫的 storage key 會加 `p:<planId>:` 前綴,例如 `p:pl123:metricslog`),`customfoods` 為跨計畫共用。可改名、可刪除自建計畫(刪除會一併清掉該計畫的 metricslog/foodlog/kcaltarget/profile/waterlog/watergoal)。舊版的 `weight`/`calorie` 類計畫載入時會自動轉為 `track`。

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
| `fridge`              | JSON `{have}`,冰箱食材(使用者自己加的)       | false  |
| `frcollapsed`         | 冰箱區塊是否收合 ("1"/"0")                    | false  |
| `reminder`            | JSON `{on,time,dinner,lunch,workout}`,提醒設定 | false  |
| `rmcollapsed`         | 提醒區塊是否收合 ("1"/"0")                    | false  |
| `herotitle`           | 頂部大標題(可自訂)                          | false  |
| `fontpref`            | 字體偏好 `cu`(粗線體)/ `redbean`(紅豆奶霜體)  | false  |
| `bgcolor` / `bgimage` | 背景主題色 / 自訂背景照片(base64)             | false  |
| `menucollapse` 等     | 各區塊收合狀態(menu/food/water…)             | false  |
| `profile`             | JSON,個人資料(性別/年齡/身高/體重/目標) | false  |
| `customfoods`         | JSON array `{n,k}`,使用者自訂食材(跨計畫共用) | false |
| `plans`               | JSON array `{id,name,type}`,計畫清單         | false  |
| `currentplan`         | 目前所在計畫 id                          | false  |
| `p:<id>:<key>`        | 非預設計畫的各項資料(metricslog/foodlog/kcaltarget/profile…) | false |

## 版面 / 字級
- 全站字級統一為 CSS 變數(`:root`):`--fs-title:22px`(區塊標題)、`--fs-num:24px`(強調數字)、`--fs-body:19px`(主要內容/輸入框)、`--fs-label:16px`(次要標籤/說明)、`--fs-hint:14.5px`(極小提示)。各元件一律引用這 5 個變數,避免大小不一;要整體放大/縮小只需改這幾個變數。
- 配色統一:全站主色為粉色(`--pink`,按鈕/選中標籤/強調),**喝水區**改用藍色(`--blue`/`--blue-soft`:圓點、數字、加減鈕、杯子)。

## 字型(兩套可切換)
- **粗線體 CuHsianTi**(`assets/cuhsian-full.woff2`,約 8.7MB,9129 字/8302 中文,預設)與 **紅豆奶霜體 RedBeanCream**(`assets/redbean-full.woff2/.woff`)並存,以 `--font-main` CSS 變數切換(`fontpref`)。原始 ttf 各存一份在 `assets/`。

## 字型(原紅豆奶霜體說明)
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

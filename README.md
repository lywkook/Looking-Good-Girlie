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
2. **今日菜單**:一打開就看到今天早/午/晚餐+水果,不用點開(`renderTodayMenu()`)
3. **每日打卡清單**(7/20-8/28,40 天):
   - 運動依星期輪替:一三五重訓(肩→大腿內側→手臂→拜拜肉,4 部位循環)、二四六跑步機間歇+全身燃脂(開合跳/高抬腿/登山跑/深蹲跳)、日休息
   - 每個運動動作、每個飲食欄位都可以點 ✏️ 直接編輯,存檔後永久覆蓋預設文字(`dietover:`、`exover:` storage prefix)
   - 每個運動動作、每天整體都能打勾記錄完成(`ex:`、`dayplan:` prefix)
4. **體重/體脂/BMI/肌肉重量紀錄**:手動輸入四個數字,存成 `metricslog`(JSON array),畫體重趨勢 SVG 折線圖 + 目標線(60kg)+ 最新數值卡片 + 近 7 天歷史
5. **飲食紀錄 · 熱量(手動輸入)**:選餐別(早/午/晚/點心)→ 輸入食物;內建常見食物資料庫(`FOOD_DB`,含使用者常吃食材與台式外食),打字用 `<datalist>` 跳建議並自動帶入熱量 → 存進 `foodlog`(JSON array `{id,date,meal,name,kcal}`)。可設「今日熱量目標」(存 `kcaltarget`),即時算今日總熱量、進度條、還可吃/超過多少;`buildAdvice()` 依「今天吃多少 + 今天是重訓/燃脂/休息日 + 哪幾餐還沒吃」動態給飲食或運動的調整建議(超標建議減澱粉或加運動、額度足則正常吃)。

## Storage Key 一覽
| Prefix / Key         | 內容                                   | Shared |
|----------------------|----------------------------------------|--------|
| `dayplan:<iso>`       | 當天整體是否打勾完成 ("1"/"0")          | false  |
| `ex:<iso>:<exi>`      | 第 exi 個運動動作是否打勾               | false  |
| `dietover:<iso>:<field>` | 使用者手動編輯覆蓋的飲食文字(field = breakfast/lunch/dinner/fruit) | false |
| `exover:<iso>:<exi>`  | 使用者手動編輯覆蓋的運動細節文字         | false  |
| `metricslog`          | JSON array,體重/體脂/BMI/肌肉重量歷史紀錄  | false  |
| `foodlog`             | JSON array `{id,date,meal,name,kcal}`,手動三餐飲食紀錄 | false |
| `kcaltarget`          | 每日熱量目標(kcal,可自訂)             | false  |

## 字型
- **全站文字**(`body` 與 `.cute` 標題/按鈕/標籤)都用內嵌 base64 的 **RedBeanCream**(使用者提供的紅豆奶霜體 ttf,已用 fontTools 做過**字元子集化 + 轉 woff** 縮小體積,收錄目前 HTML 裡實際出現的所有字元)
- 字型內沒有的字(少數 emoji、簡體字等)會 fallback 到 Noto Sans TC / 系統字
- `assets/紅豆奶霜體.ttf`:使用者上傳的原始字型檔(完整版,4.3MB)
- `assets/redbean-subset.woff`:目前實際內嵌進 HTML 的子集化版本(約 216KB,涵蓋全站字元)
- ⚠️ **重要**:因為現在是全站套用,之後如果在 HTML 裡新增任何新的中文字,現有的 subset woff 可能沒收錄,需要重新跑子集化(見下方指令),否則新字會 fallback 成 Noto Sans TC。

重新產生 subset 字型的指令(需要 `fonttools`,不需要 brotli,因為輸出 `.woff` 不是 `.woff2`):
```bash
python3 -c "
import re
html = open('index.html', encoding='utf-8').read()
chars = ''.join(sorted(set(html)))
open('chars.txt','w',encoding='utf-8').write(chars)
"
fonttools subset assets/紅豆奶霜體.ttf --text-file=chars.txt --flavor=woff \
  --output-file=assets/redbean-subset.woff --no-layout-closure --ignore-missing-glyphs
base64 -w0 assets/redbean-subset.woff > assets/redbean-subset.b64
# 再把 assets/redbean-subset.b64 的內容貼回 HTML 裡 @font-face 的 base64 字串
```

## 已知限制 / 待改進方向
- 無法直接串接 RENPHO Health App 拉體重資料(無公開 API),仍須手動輸入
- 熱量是使用者手動輸入 + 內建食物資料庫的估值,非精確秤重,數字僅供參考;每筆紀錄可刪除
- Reminders(iPhone 提醒事項)是透過對話當時的 `reminder_create_v0` 工具一次性建立 39 筆(7/20-8/27,每天 16:20),**不是**由這個 HTML App 自動產生或管理的,App 本身沒有寫入提醒事項的程式碼
- 目前運動/飲食輪替邏輯是寫死在 JS 陣列裡(`liftPrograms`、`cardioExercises`、`lunchText`、`dinnerText`、`proteinRotation`),要換食材或動作需要改程式碼,沒有另外做設定畫面
- 沒有帳號系統,資料綁定在這個檔案的 storage 上,同一個裝置/瀏覽器打開才看得到之前的紀錄

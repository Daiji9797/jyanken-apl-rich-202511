// 血糖値管理アプリのJavaScript

// ==============================================
// データベース定義
// ==============================================

/**
 * ローカル食品データベース（GI値と栄養情報）
 * 100gあたりの栄養成分データを保持
 * - gi: GI値（グリセミック・インデックス）血糖値の上がりやすさを示す指標
 * - carbs: 炭水化物（グラム）
 * - calories: カロリー（kcal）
 * - fiber: 食物繊維（グラム）
 */
const localFoodDatabase = {
    'ごはん': { gi: 84, carbs: 37, calories: 168, fiber: 0.5 },
    '白米': { gi: 84, carbs: 37, calories: 168, fiber: 0.5 },
    '玄米': { gi: 56, carbs: 35, calories: 165, fiber: 1.4 },
    'パン': { gi: 91, carbs: 46, calories: 264, fiber: 2.3 },
    '食パン': { gi: 91, carbs: 46, calories: 264, fiber: 2.3 },
    'ラーメン': { gi: 73, carbs: 55, calories: 436, fiber: 2.1 },
    'うどん': { gi: 85, carbs: 21, calories: 105, fiber: 0.8 },
    'そば': { gi: 59, carbs: 24, calories: 132, fiber: 2.0 },
    'パスタ': { gi: 65, carbs: 28, calories: 149, fiber: 1.5 },
    'そうめん': { gi: 68, carbs: 25, calories: 127, fiber: 0.9 },
    'じゃがいも': { gi: 90, carbs: 17, calories: 76, fiber: 1.3 },
    'さつまいも': { gi: 55, carbs: 31, calories: 132, fiber: 2.3 },
    'かぼちゃ': { gi: 65, carbs: 17, calories: 91, fiber: 2.8 },
    'バナナ': { gi: 55, carbs: 22, calories: 86, fiber: 1.1 },
    'りんご': { gi: 36, carbs: 14, calories: 54, fiber: 1.5 },
    'オレンジ': { gi: 43, carbs: 11, calories: 46, fiber: 1.0 },
    'ぶどう': { gi: 50, carbs: 15, calories: 59, fiber: 0.5 },
    'いちご': { gi: 40, carbs: 8, calories: 34, fiber: 1.4 },
    'ケーキ': { gi: 82, carbs: 51, calories: 344, fiber: 0.5 },
    'クッキー': { gi: 77, carbs: 68, calories: 465, fiber: 1.8 },
    'チョコレート': { gi: 91, carbs: 55, calories: 558, fiber: 3.5 },
    'アイスクリーム': { gi: 65, carbs: 23, calories: 207, fiber: 0.1 },
    'ドーナツ': { gi: 86, carbs: 51, calories: 375, fiber: 1.2 },
    'ピザ': { gi: 80, carbs: 33, calories: 266, fiber: 2.3 },
    'ハンバーガー': { gi: 66, carbs: 28, calories: 295, fiber: 1.5 },
    'カレーライス': { gi: 82, carbs: 55, calories: 420, fiber: 2.5 },
    '寿司': { gi: 65, carbs: 37, calories: 180, fiber: 0.6 },
    'おにぎり': { gi: 88, carbs: 40, calories: 179, fiber: 0.5 },
    '牛乳': { gi: 25, carbs: 5, calories: 67, fiber: 0 },
    'ヨーグルト': { gi: 25, carbs: 5, calories: 62, fiber: 0 },
    'オートミール': { gi: 55, carbs: 12, calories: 71, fiber: 1.7 },
    'コーンフレーク': { gi: 93, carbs: 24, calories: 120, fiber: 0.3 },
};

/**
 * GI値専用データベース
 * 詳細な栄養データはないが、GI値だけわかっている食品のリスト
 * 完全なデータがない場合の補助として使用
 */
const giDatabase = {
    'ごはん': 84, '白米': 84, '玄米': 56, 'もち米': 80,
    'パン': 91, '食パン': 91, 'フランスパン': 93, 'ライ麦パン': 58, '全粒粉パン': 50,
    'ラーメン': 73, 'うどん': 85, 'そば': 59, 'パスタ': 65, 'そうめん': 68,
    'じゃがいも': 90, 'さつまいも': 55, 'かぼちゃ': 65, 'とうもろこし': 75,
    'バナナ': 55, 'りんご': 36, 'オレンジ': 43, 'ぶどう': 50, 'いちご': 40,
    'すいか': 60, 'メロン': 65, 'もも': 41, 'なし': 32, 'キウイ': 53,
    'ケーキ': 82, 'クッキー': 77, 'チョコレート': 91, 'アイスクリーム': 65,
    'ドーナツ': 86, 'ピザ': 80, 'ハンバーガー': 66, 'カレーライス': 82,
    '寿司': 65, 'おにぎり': 88, '牛乳': 25, 'ヨーグルト': 25,
    'オートミール': 55, 'コーンフレーク': 93, 'グラノーラ': 71
};

// ==============================================
// グローバル変数
// ==============================================

let selectedFoods = [];      // ユーザーが選択した食品のリスト
let foodDataCache = {};       // 検索済み食品データのキャッシュ（同じ食品を再検索しないため）

// ==============================================
// 食品データ取得関数
// ==============================================

/**
 * 栄養成分からGI値を計算する関数
 * 食物繊維、脂質、タンパク質などの成分を考慮してGI値を推定
 * 
 * @param {Object} nutriments - 栄養成分データ（100gあたり）
 * @param {string} foodName - 食品名（カテゴリ判定用）
 * @param {string} productName - 商品名（カテゴリ判定用）
 * @returns {number} 計算されたGI値
 */
function calculateGIFromNutrients(nutriments, foodName = '', productName = '') {
    // 栄養成分の取得（100gあたり）
    const carbs = nutriments['carbohydrates_100g'] || nutriments['carbohydrates'];
    const fiber = nutriments['fiber_100g'] || nutriments['fiber'];
    const fat = nutriments['fat_100g'] || nutriments['fat'];
    const protein = nutriments['proteins_100g'] || nutriments['proteins'];
    const sugars = nutriments['sugars_100g'] || nutriments['sugars'];
    
    // 炭水化物データが必須
    if (carbs === undefined || carbs === null) {
        console.log('炭水化物データが不足しているため、GI値を計算できません');
        return null;
    }
    
    // 炭水化物がほぼない場合は低GI値
    if (carbs < 5) {
        return 15;
    }
    
    // 食品カテゴリに基づく基準GI値の決定
    const searchText = `${foodName} ${productName}`.toLowerCase();
    let baseGI = 55; // デフォルト（中GI）
    
    // カテゴリ別の基準GI値
    if (searchText.includes('パン') || searchText.includes('bread') || searchText.includes('ベーグル')) {
        baseGI = 75;
    } else if (searchText.includes('白米') || searchText.includes('rice') || searchText.includes('ごはん')) {
        baseGI = 73;
    } else if (searchText.includes('玄米') || searchText.includes('brown rice')) {
        baseGI = 55;
    } else if (searchText.includes('パスタ') || searchText.includes('pasta') || searchText.includes('スパゲッティ')) {
        baseGI = 50;
    } else if (searchText.includes('そば') || searchText.includes('soba')) {
        baseGI = 54;
    } else if (searchText.includes('うどん') || searchText.includes('udon')) {
        baseGI = 62;
    } else if (searchText.includes('じゃがいも') || searchText.includes('potato') || searchText.includes('ポテト')) {
        baseGI = 85;
    } else if (searchText.includes('さつまいも') || searchText.includes('sweet potato')) {
        baseGI = 55;
    } else if (searchText.includes('野菜') || searchText.includes('vegetable') || searchText.includes('サラダ')) {
        baseGI = 30;
    } else if (searchText.includes('果物') || searchText.includes('fruit') || searchText.includes('フルーツ')) {
        baseGI = 42;
    } else if (searchText.includes('ケーキ') || searchText.includes('cake') || searchText.includes('ドーナツ') || searchText.includes('donut')) {
        baseGI = 76;
    } else if (searchText.includes('チョコ') || searchText.includes('chocolate')) {
        baseGI = 49;
    } else if (searchText.includes('クッキー') || searchText.includes('cookie') || searchText.includes('ビスケット')) {
        baseGI = 64;
    } else if (searchText.includes('牛乳') || searchText.includes('milk') || searchText.includes('ヨーグルト') || searchText.includes('yogurt')) {
        baseGI = 31;
    } else if (searchText.includes('豆') || searchText.includes('bean') || searchText.includes('レンズ豆')) {
        baseGI = 29;
    } else if (searchText.includes('ナッツ') || searchText.includes('nuts') || searchText.includes('アーモンド')) {
        baseGI = 15;
    }
    
    // GI値の調整計算
    // 推定GI値 = 基準GI値 × (1 - 食物繊維係数) × (1 - 脂質係数) × (1 - タンパク質係数)
    let calculatedGI = baseGI;
    
    // 1. 食物繊維による補正（食物繊維が多いとGI値が下がる）
    // 食物繊維1gあたり約3%のGI値低下
    if (fiber !== undefined && fiber > 0 && carbs > 0) {
        const fiberRatio = fiber / carbs;
        const fiberReduction = fiberRatio * 0.35; // 最大35%の低下
        calculatedGI *= (1 - Math.min(fiberReduction, 0.35));
    }
    
    // 2. 脂質による補正（脂質が多いと吸収が遅くなりGI値が下がる）
    // 脂質1gあたり約1.5%のGI値低下
    if (fat !== undefined && fat > 0) {
        const fatReduction = (fat / 100) * 0.015;
        calculatedGI *= (1 - Math.min(fatReduction, 0.25)); // 最大25%の低下
    }
    
    // 3. タンパク質による補正（タンパク質が多いとGI値が下がる）
    // タンパク質1gあたり約1%のGI値低下
    if (protein !== undefined && protein > 0) {
        const proteinReduction = (protein / 100) * 0.01;
        calculatedGI *= (1 - Math.min(proteinReduction, 0.20)); // 最大20%の低下
    }
    
    // 4. 糖類の割合による補正（単純糖が多いとGI値が上がる）
    if (sugars !== undefined && sugars > 0 && carbs > 0) {
        const sugarRatio = sugars / carbs;
        if (sugarRatio > 0.5) {
            // 糖類が炭水化物の50%以上の場合、GI値を上げる
            calculatedGI *= (1 + (sugarRatio - 0.5) * 0.2); // 最大10%の上昇
        }
    }
    
    // GI値の範囲を1-100に制限
    calculatedGI = Math.max(1, Math.min(100, Math.round(calculatedGI)));
    
    console.log(`GI値計算: 基準=${baseGI}, 食物繊維=${fiber}g, 脂質=${fat}g, タンパク質=${protein}g → 計算GI=${calculatedGI}`);
    
    return calculatedGI;
}

/**
 * Open Food Facts APIから食品データを検索する関数
 * 日本語検索に対応（日本サイトのみで検索）
 * 
 * @param {string} foodName - 検索する食品名
 * @returns {Object|null} API検索結果またはnull
 */
async function searchOpenFoodFactsAPI(foodName) {
    try {
        // 日本版サイトで検索しJSON形式で取得
        const apiUrl = `https://jp.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(foodName)}&search_simple=1&json=1&page_size=5`;
        //　取得した結果は下記サイトで見やすくできます。${encodeURIComponent(foodName)}に検索文字列をダブルコート囲みでいれて結果を見てください。
        //　https://tools.m-bsys.com/dev_tools/json-beautifier.php
        console.log(`Open Food Facts (日本版) で検索中: ${foodName}`);
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // 検索結果がある場合
        if (data.products && data.products.length > 0) {
            // 検索結果の１番目を利用
            const product = data.products[0];
            
            // 栄養情報を抽出（100gあたり）
            const nutriments = product.nutriments || {};
            const productName = product.product_name || '';
            
            // GI値をローカルDBから取得するか、栄養成分から計算
            let calculatedGI;
            const searchText = `${foodName} ${productName}`.toLowerCase();
            
            // まずローカルのGIデータベースで完全一致を確認
            const giMatch = Object.keys(giDatabase).find(key => 
                searchText.includes(key.toLowerCase()) || 
                key.toLowerCase().includes(foodName.toLowerCase())
            );
            
            if (giMatch) {
                // ローカルDBに既知のGI値がある場合はそれを使用
                calculatedGI = giDatabase[giMatch];
                console.log(`GI値取得: ${giMatch} → ${calculatedGI} (ローカルDB)`);
            } else {
                // 栄養成分からGI値を計算
                calculatedGI = calculateGIFromNutrients(nutriments, foodName, productName);
                if (calculatedGI === null) {
                    console.log(`${productName}: 栄養成分データが不足しているため計算できません`);
                    return null;
                }
                console.log(`GI値計算: ${productName} → ${calculatedGI} (栄養成分から計算)`);
            }
            
            // 必須栄養成分の取得
            const carbs = nutriments['carbohydrates_100g'] || nutriments['carbohydrates']; // 炭水化物
            const calories = nutriments['energy-kcal_100g'] || nutriments['energy-kcal']; // カロリー
            const fiber = nutriments['fiber_100g'] || nutriments['fiber']; // 食物繊維
            const protein = nutriments['proteins_100g'] || nutriments['proteins']; // タンパク質
            const fat = nutriments['fat_100g'] || nutriments['fat']; // 脂質
            
            // 必須データが不足している場合はnullを返す
            if (carbs === undefined || calories === undefined) {
                console.log(`${productName}: 炭水化物またはカロリー情報が不足しています`);
                return null;
            }
            
            return {
                gi: calculatedGI,
                carbs: carbs,
                calories: calories,
                // 欠損は0にせず null で返す（データがないことを明示）
                fiber: (typeof fiber === 'number') ? fiber : null,
                protein: (typeof protein === 'number') ? protein : null,
                fat: (typeof fat === 'number') ? fat : null,
                source: giMatch ? 'Open Food Facts API (GI値: ローカルDB)' : 'Open Food Facts API (GI値: 計算)',
                productName: productName || foodName,
                calculated: !giMatch
            };
        }
        
        return null;
    } catch (error) {
        console.error('API検索エラー:', error);
        return null;
    }
}

/**
 * 食品データを検索して取得する関数
 * 多段階のフォールバック処理で可能な限りデータを提供
 * 
 * @param {string} foodName - 検索する食品名
 * @returns {Object|null} 食品データまたはnull
 */
async function fetchFoodData(foodName) {
    // キャッシュチェック: 過去に検索した食品ならキャッシュから返す
    if (foodDataCache[foodName]) {
        console.log(`${foodName}: キャッシュから取得`);
        return foodDataCache[foodName];
    }

    let foodData = null;
    let dataSource = '';

    // ステップ1: ローカルデータベースで完全一致検索
    if (localFoodDatabase[foodName]) {
        foodData = { ...localFoodDatabase[foodName], source: 'ローカルDB（完全一致）' };
        dataSource = 'ローカルDB（完全一致）';
    }
    // ステップ2: 部分一致で検索（例：「ご飯」で「ごはん」を見つける）
    else {
        const partialMatch = Object.keys(localFoodDatabase).find(key => 
            key.includes(foodName) || foodName.includes(key)
        );
        
        if (partialMatch) {
            foodData = { ...localFoodDatabase[partialMatch], source: 'ローカルDB（部分一致）' };
            dataSource = 'ローカルDB（部分一致）';
        }
        // ステップ3: Open Food Facts APIで検索
        else {
            console.log('ローカルDBに見つからないため、APIで検索します...');
            foodData = await searchOpenFoodFactsAPI(foodName);
            
            if (foodData) {
                dataSource = 'Open Food Facts API';
            }
        }
    }

    // ステップ4: どこにも見つからない場合はnullを返す。最後のif文で最終判定
    if (foodData) {
        foodDataCache[foodName] = foodData;
        console.log(`${foodName}: ${dataSource}から取得`);
    } else {
        console.log(`${foodName}: すべてのデータベースに見つかりませんでした`);
    }

    return foodData;
}

// ==============================================
// 食品追加・削除・表示の関数
// ==============================================

/**
 * 食品を追加する関数（ユーザーが食品名と量を入力した時に実行）
 */
async function addFood(foodEvent) {
    const foodName = $('#foodInput').val().trim();
    const amount = parseFloat($('#amountInput').val());

    // 入力チェック: 食品名と量が正しく入力されているか確認
    if (!foodName || !amount || amount <= 0) {
        alert('食品名と量を正しく入力してください');
        return;
    }

    // ローディング表示を追加
    // イベントオブジェクトは関数引数 `foodEvent` を使う
    const $addButton = (typeof foodEvent !== 'undefined' && foodEvent !== null)
        ? $(foodEvent.currentTarget || foodEvent.target)
        : $('.btn-add').first();
    const originalText = $addButton.text();
    $addButton.text('検索中...').prop('disabled', true);

    // データベースから食品データを取得
    const foodData = await fetchFoodData(foodName);

    // データが見つからない場合
    if (!foodData) {
        alert(`「${foodName}」のデータが見つかりませんでした。\n\n以下の可能性があります:\n・データベースに登録されていない食品\n・栄養成分データが不足している\n・別の名称で試してみてください`);
        $addButton.text(originalText).prop('disabled', false);
        return;
    }

    // 不足している栄養素がある場合はユーザーにアラートで通知する
    const missing = [];
    if (foodData.fiber === null) missing.push('食物繊維');
    if (foodData.protein === null) missing.push('タンパク質');
    if (foodData.fat === null) missing.push('脂質');

    if (missing.length > 0) {
        alert(`「${foodName}」の栄養データで以下の項目が不足しています: ${missing.join('、')}。\nGI推定は不完全なデータで行われたため、推定値に誤差がある可能性があります。`);
    }

    // 食品を選択リストに追加
    selectedFoods.push({
        name: foodName,
        amount: amount,
        data: foodData
    });

    // 画面を更新
    updateFoodList();
    
    // 入力フィールドをクリア
    $('#foodInput, #amountInput').val('');
    
    // ボタンを元に戻す
    $addButton.text(originalText).prop('disabled', false);
}

/**
 * 食品を削除する関数
 */
function removeFood(index) {
    selectedFoods.splice(index, 1);
    updateFoodList();
}

/**
 * 食品リストの表示を更新する関数
 */
function updateFoodList() {
    const $foodList = $('#foodList');
    
    if (selectedFoods.length === 0) {
        $foodList.html('<p style="color: #999;">まだ食品が追加されていません</p>');
        return;
    }

    const foodTags = selectedFoods.map((food, index) => `
        <div class="food-tag">
            <span>${food.name} (${food.amount}g)</span>
            <span class="remove" onclick="removeFood(${index})">×</span>
        </div>
    `).join('');
    
    $foodList.html(foodTags);
}

// Enterキーで食品を追加できるようにする
$('#foodInput').on('keypress', function(foodEvent) {
    if (foodEvent.key === 'Enter') {
        addFood(foodEvent);
    }
});

// ==============================================
// 血糖値計算関数
// ==============================================

/**
 * 血糖値を計算して結果を表示する関数
 */
function calculateBloodSugar() {
    if (selectedFoods.length === 0) {
        alert('食品を追加してください');
        return;
    }

    // 合計値を計算
    let totalCarbs = 0;      // 合計炭水化物
    let totalCalories = 0;   // 合計カロリー
    let totalFiber = 0;      // 合計食物繊維
    let weightedGI = 0;      // GI値の加重平均を計算するための値

    // 各食品のデータを集計
    selectedFoods.forEach(food => {
        const ratio = food.amount / 100;  // 100gあたりのデータなので、実際の量に換算
        const carbs = food.data.carbs * ratio;
        
        totalCarbs += carbs;
        totalCalories += food.data.calories * ratio;
        totalFiber += food.data.fiber * ratio;
        weightedGI += food.data.gi * carbs;  // 炭水化物量で重み付け
    });

    // 平均GI値を計算（炭水化物量で加重平均）
    const avgGI = totalCarbs > 0 ? weightedGI / totalCarbs : 0;

    // 血糖値上昇の予測値を計算
    // 簡易的な計算式: (炭水化物量 × GI値 / 100) × 2
    const predictedBS = (totalCarbs * avgGI / 100) * 2;

    // 結果を表示
    displayResults(predictedBS, totalCarbs, totalCalories, avgGI, totalFiber);
}

// ==============================================
// 結果表示関数
// ==============================================

/**
 * 計算結果を画面に表示する関数
 * 
 * @param {number} predictedBS - 予測血糖値上昇量
 * @param {number} carbs - 合計炭水化物量
 * @param {number} calories - 合計カロリー
 * @param {number} gi - 平均GI値
 * @param {number} fiber - 合計食物繊維
 */
function displayResults(predictedBS, carbs, calories, gi, fiber) {
    // 血糖値の状態を判定
    let status, statusClass;
    if (predictedBS < 140) {
        status = '正常範囲';
        statusClass = 'normal';
    } else if (predictedBS < 180) {
        status = '注意が必要';
        statusClass = 'warning';
    } else {
        status = '危険域';
        statusClass = 'danger';
    }

    // 結果カードを更新
    $('#resultCard').removeClass('normal warning danger').addClass(statusClass).html(`
        <div class="blood-sugar-label">予測血糖値上昇</div>
        <div class="blood-sugar-value">${predictedBS.toFixed(0)} mg/dL</div>
        <div class="status-badge">${status}</div>
    `);

    // 栄養情報を更新
    $('#carbsValue').text(carbs.toFixed(1));
    $('#caloriesValue').text(calories.toFixed(0));
    $('#giValue').text(gi.toFixed(0));
    $('#fiberValue').text(fiber.toFixed(1));

    // グラフを作成
    createTimeline(predictedBS);

    // アドバイスを生成
    generateAdvice(predictedBS, gi, fiber);

    // 結果セクションを表示
    $('#resultSection').fadeIn().get(0).scrollIntoView({ behavior: 'smooth' });
}

// グローバル変数: 時系列データを保持
let timelineData = [];

/**
 * 血糖値の時系列データを作成する関数
 * GI値、食物繊維、炭水化物量を考慮した生理学的モデル
 * 
 * @param {number} peakBS - 予測ピーク血糖値上昇量
 */
function createTimeline(peakBS) {
    // 食品データから平均GI値と食物繊維量を計算
    let totalCarbs = 0;
    let totalFiber = 0;
    let weightedGI = 0;
    
    selectedFoods.forEach(food => {
        const ratio = food.amount / 100;
        const carbs = food.data.carbs * ratio;
        totalCarbs += carbs;
        totalFiber += food.data.fiber * ratio;
        weightedGI += food.data.gi * carbs;
    });
    
    const avgGI = totalCarbs > 0 ? weightedGI / totalCarbs : 55;
    const fiberRatio = totalCarbs > 0 ? totalFiber / totalCarbs : 0;
    
    // GI値に基づくピーク時間の調整（分）
    // 高GI（70以上）: 30-45分でピーク
    // 中GI（55-69）: 45-60分でピーク
    // 低GI（55未満）: 60-90分でピーク
    let peakTime;
    if (avgGI >= 70) {
        peakTime = 30 + (100 - avgGI) * 0.3; // 30-39分
    } else if (avgGI >= 55) {
        peakTime = 45 + (70 - avgGI) * 0.5; // 45-52分
    } else {
        peakTime = 60 + (55 - avgGI) * 0.8; // 60-84分
    }
    
    // 食物繊維による遅延（食物繊維1gあたり約2分の遅延）
    peakTime += fiberRatio * 120; // 最大で約20分の遅延
    peakTime = Math.min(peakTime, 90); // 最大90分
    
    // GI値に基づく吸収速度係数
    // 高GI: 急速に上昇・下降
    // 低GI: 緩やかに上昇・下降
    const absorptionSpeed = avgGI / 70; // 0.2-1.4の範囲
    const decaySpeed = absorptionSpeed * 0.8; // 下降はやや緩やか
    
    // ガンマ分布様の曲線を生成
    timelineData = [];
    const baselineBS = 100; // 空腹時血糖値
    const timePoints = [0, 15, 30, 45, 60, 75, 90, 120, 150, 180]; //時間（分）ごとの固定配列
    
    timePoints.forEach(time => {
        let value;
        
        if (time === 0) {
            value = baselineBS;
        } else if (time <= peakTime) {
            // 上昇フェーズ: ベータ分布様の曲線
            const normalizedTime = time / peakTime;
            // 高GI: 急速上昇（指数的）、低GI: 緩やか上昇（線形に近い）
            const curve = Math.pow(normalizedTime, 2 - absorptionSpeed);
            value = baselineBS + peakBS * curve;
        } else {
            // 下降フェーズ: 指数減衰
            const timeSincePeak = time - peakTime;
            const halfLife = 60 / decaySpeed; // GI値が高いほど早く下がる
            const decayFactor = Math.exp(-0.693 * timeSincePeak / halfLife);
            value = baselineBS + peakBS * decayFactor;
        }
        
        // 最低でも空腹時血糖値に戻る
        value = Math.max(value, baselineBS);
        
        timelineData.push({
            time: time,
            value: Math.round(value)
        });
    });
    
    createLineChart();
}

// Chart.jsのインスタンスを保持（再描画時に破棄するため）
let bloodSugarChart = null;

/**
 * Chart.jsで折れ線グラフを作成する関数
 */
function createLineChart() {
    const canvas = document.getElementById('lineChart');
    const ctx = canvas.getContext('2d');

    // 既存のチャートがあれば破棄
    if (bloodSugarChart) {
        bloodSugarChart.destroy();
    }

    // データの準備
    const labels = timelineData.map(d => `${d.time}分`);
    const values = timelineData.map(d => d.value);

    // Chart.jsの設定
    bloodSugarChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '血糖値 (mg/dL)',
                data: values,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderWidth: 3,
                fill: true,
                tension: 0.4, // 曲線を滑らかに
                pointRadius: 5,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            family: '"Yu Mincho", "MS Mincho", serif', // 日本語フォント指定
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `血糖値: ${context.parsed.y.toFixed(0)} mg/dL`;
                        }
                    },
                    bodyFont: {
                        family: '"Yu Mincho", "MS Mincho", serif' // 日本語フォント指定
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '経過時間',
                        font: {
                            family: '"Yu Mincho", "MS Mincho", serif', // 日本語フォント指定
                            size: 13,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        font: {
                            family: '"Yu Mincho", "MS Mincho", serif', // 日本語フォント指定
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '血糖値 (mg/dL)',
                        font: {
                            family: '"Yu Mincho", "MS Mincho", serif', // 日本語フォント指定
                            size: 13,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        font: {
                            family: '"Yu Mincho", "MS Mincho", serif', // 
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
}

// ==============================================
// アドバイス生成関数
// ==============================================

/**
 * ユーザーへのアドバイスを生成する関数
 * 
 * @param {number} predictedBS - 予測血糖値
 * @param {number} gi - 平均GI値
 * @param {number} fiber - 食物繊維量
 */
function generateAdvice(predictedBS, gi, fiber) {
    const advices = [];

    // 血糖値レベルに応じたアドバイス
    if (predictedBS >= 180) {
        advices.push('血糖値が大きく上昇する可能性があります。食事量を減らすか、低GI食品に変更することをお勧めします。');
        advices.push('食後に軽い運動（15-30分の散歩など）を行うと血糖値の上昇を抑えられます。');
    } else if (predictedBS >= 140) {
        advices.push('血糖値がやや高めに上昇する可能性があります。野菜を先に食べるなど食べる順番を工夫しましょう。');
    } else {
        advices.push('適切な血糖値の範囲内です。このバランスの良い食事を続けましょう。');
    }

    // GI値に応じたアドバイス
    if (gi > 70) {
        advices.push('平均GI値が高めです。白米を玄米に、白いパンを全粒粉パンに変えると良いでしょう。');
    } else if (gi < 55) {
        advices.push('低GI食品中心の優れた食事です。血糖値が緩やかに上昇します。');
    }

    // 食物繊維に応じたアドバイス
    if (fiber < 3) {
        advices.push('食物繊維が少なめです。野菜やきのこ、海藻を追加すると血糖値の急上昇を防げます。');
    } else if (fiber >= 5) {
        advices.push('十分な食物繊維が含まれています。血糖値の上昇が緩やかになります。');
    }

    // 食事タイプ関連のアドバイスは未使用のため削除

    // アドバイスをリスト表示
    $('#adviceList').html(advices.map(advice => `<li>${advice}</li>`).join(''));
}


// jsを記述する際はここに記載していく

// ゲーム変数
let playerHP = 1000;
let enemyHP = 1000;
const maxHP = 1000;
let gameStarted = false;
let prayButtonUnlocked = false;
let isProcessing = false; // 処理中フラグ
let supporterSummoned = false; // 味方が召喚されたかどうか
let enemyPhase = 1; // 敵のフェーズ（1: 第1形態, 2: 第2形態）
let isNightBackground = false; // 夜背景かどうか

// jQuery準備完了後に実行
$(document).ready(function() {
  
  // タイプライター効果
  typeWriter();
  
  // スタートボタンのクリックイベント
  $('#battle-start').click(function() {
    startBattle();
  });
  
  // バトルメニューボタンのクリックイベント
  $('#Attack').click(function() {
    executeBattle('attack');
  });
  
  $('#Talk').click(function() {
    executeBattle('talk');
  });
  
  $('#break').click(function() {
    executeBattle('break');
  });
  
  $('#cry').click(function() {
    executeBattle('cry');
  });
  
  $('#pray').click(function() {
    executePray();
  });
  
  // 戻るボタンのクリックイベント
  $('#return-btn').click(function() {
    returnToStart();
  });
});

// タイプライター効果
function typeWriter() {
  const text1 = 'あなたはセカイを救うために戦っています。なにを選択するのかは自由です。';
  const text2 = 'しかし、選択によってセカイの運命が変わるかもしれません。';
  const text3 = '慎重に選んでください。';
  const element1 = $('#explanation');
  const element2 = $('#explanation2');
  const element3 = $('#explanation3');
  let index1 = 0;
  
  // 最初にテキストを空にする
  element1.text('');
  element2.text('');
  element3.text('');
  
  // 1つ目のテキストをタイプ
  function type1() {
    if (index1 < text1.length) {
      element1.text(element1.text() + text1.charAt(index1));
      index1++;
      setTimeout(type1, 80); // 80ミリ秒ごとに1文字追加
    } else {
      // 1つ目が終わったら2つ目を開始
      setTimeout(type2, 500); // 0.5秒待ってから2つ目を開始
    }
  }
  
  // 2つ目のテキストをタイプ
  let index2 = 0;
  function type2() {
    if (index2 < text2.length) {
      element2.text(element2.text() + text2.charAt(index2));
      index2++;
      setTimeout(type2, 80);
    } else {
      // 2つ目が終わったら3つ目を開始
      setTimeout(type3, 500);
    }
  }
  
  // 3つ目のテキストをタイプ
  let index3 = 0;
  function type3() {
    if (index3 < text3.length) {
      element3.text(element3.text() + text3.charAt(index3));
      index3++;
      setTimeout(type3, 80);
    }
  }
  
  type1();
}

// バトル開始処理
function startBattle() {
  gameStarted = true;
  playerHP = maxHP;
  enemyHP = maxHP;
  prayButtonUnlocked = false;
  supporterSummoned = false; // リセット
  enemyPhase = 1; // 第1形態からスタート
  isNightBackground = false; // 夜背景フラグをリセット
  
  // 敵画像を第1形態に設定
  $('.enemy-character').attr('src', 'img/character_battle_opponent_1.png');
  
  // 背景を通常に設定
  $('.background-image').attr('src', 'img/back_picture_standard.png');
  
  // UI更新
  $('#start-menu').hide();
  $('h1').hide();
  $('.Explanation').hide();
  $('p').not('#battle-message, #player-hp-text, #enemy-hp-text, .player-health p, .enemy-health p').hide();
  $('#battle-screen').show();
  $('#battle-menu').show();
  $('#message-window').show();
  $('#return-menu').hide();
  $('#pray').hide();
  $('.supporter-container').hide(); // 味方キャラを非表示
  $('#message').text('');
  showMessage('戦闘開始！行動を選んでください');
  
  // 体力ゲージ初期化
  updateHealthBars();
  
  // 60秒後に「いのる」ボタンを表示
  setTimeout(function() {
    if (gameStarted) {
      $('#pray').show();
      showMessage('いのるボタンが使えるようになりました！');
      prayButtonUnlocked = true;
    }
  }, 60000); // 60秒 = 60000ミリ秒
}

// 体力ゲージ更新
function updateHealthBars() {
  const playerPercent = (playerHP / maxHP) * 100; // プレイヤー体力の割合を計算
  const enemyPercent = (enemyHP / maxHP) * 100; // 敵体力の割合を計算
  
  $('#player-health-bar').css('width', playerPercent + '%'); // プレイヤーの体力バーの幅を設定
  $('#enemy-health-bar').css('width', enemyPercent + '%'); // 敵の体力バーの幅を設定
  
  $('#player-hp-text').text(playerHP + ' / ' + maxHP); // プレイヤーの体力テキストを更新
  $('#enemy-hp-text').text(enemyHP + ' / ' + maxHP); // 敵の体力テキストを更新
  
  // 体力に応じて色を変更
  if (playerPercent <= 30) {
    $('#player-health-bar').css('background', '#f44336');
  } else if (playerPercent <= 60) {
    $('#player-health-bar').css('background', '#ff9800');
  }
  
  if (enemyPercent <= 30) {
    $('#enemy-health-bar').css('background', '#f44336');
  } else if (enemyPercent <= 60) {
    $('#enemy-health-bar').css('background', '#ff9800');
  }
}

// メッセージウィンドウに表示
function showMessage(message) {
  $('#battle-message').html(message);
}

// 敵の行動を決定（ランダム）
function getEnemyAction() {
  // 夜背景の場合は「なみだする」を選択肢から除外
  let actions = ['attack', 'talk', 'cry'];
  if (isNightBackground) {
    actions = ['attack', 'talk'];
  }
  const randomAttack = Math.floor(Math.random() * actions.length); //行動の選択肢をランダムで選択
  return actions[randomAttack];
}

// ランダムダメージ生成（80-100）
function getRandomDamage() {
  return Math.floor(Math.random() * 21) + 80; // 80から100のランダム値
}

// バトル実行
function executeBattle(playerAction) {
  if (!gameStarted || isProcessing) return;
  
  // 処理中フラグをON、ボタン無効化
  isProcessing = true;
  $('#battle-menu button').prop('disabled', true);
  
  // アクション名を日本語に変換
  const actionNames = {
    'attack': 'たたかう',
    'talk': 'はなしあう',
    'break': 'こわす',
    'cry': 'なみだする'
  };
  
  // 【プレイヤーターン】
  showMessage(`あなたのターン！<br>${actionNames[playerAction]}を選択しました！`);
  
  // 基本ダメージ
  let playerBaseDamage = getRandomDamage();
  
  // 味方がいる場合は攻撃力1.2倍
  if (supporterSummoned) {
    playerBaseDamage = Math.floor(playerBaseDamage * 1.2);
  }
  
  let playerTurnDamage = 0;
  let playerActionResult = ''; 
  
  // プレイヤーの行動処理
  let playerSelfDamage = 0; // こわすの自傷ダメージ
  
  if (playerAction === 'break') {
    // こわすは1/5の確率で成功、失敗時は通常攻撃+自分の体力が現在値の半分になる
    const breakSuccess = Math.random() < 0.2; // 1/5 = 0.2
    if (breakSuccess) {
      playerTurnDamage = enemyHP; // 相手を一撃で倒す
      playerActionResult = `こわす大成功！敵を一撃で倒した！`;
    } else {
      playerTurnDamage = playerBaseDamage; // 通常攻撃を与える
      playerSelfDamage = Math.floor(playerHP / 2); // 現在HPの半分のダメージ
      playerActionResult = `こわす失敗...敵に ${playerTurnDamage} ダメージ！<br>あなたは ${playerSelfDamage} ダメージを受けた！`;
    }
  } else if (playerAction === 'cry') {
    playerTurnDamage = 0;
    playerActionResult = 'あなたは涙を流した...';
  } else {
    playerTurnDamage = playerBaseDamage;
    playerActionResult = `敵に ${playerTurnDamage} ダメージを与えた！`;
  }
  
  // プレイヤーのダメージを適用（敵へのダメージと自分への反動ダメージ）
  enemyHP = Math.max(0, enemyHP - playerTurnDamage);
  playerHP = Math.max(0, playerHP - playerSelfDamage);
  
  // 1秒後にプレイヤーの行動結果を表示
  setTimeout(function() {
    showMessage(`あなたのターン！<br>${actionNames[playerAction]}！<br>${playerActionResult}`);
    updateHealthBars();
    
    // プレイヤーまたは敵が倒れたかチェック
    if (enemyHP <= 0 || playerHP <= 0) {
      setTimeout(function() {
        checkGameEnd();
      }, 1000);
      return;
    }
    
    // 【敵ターン】1.2秒後に敵のターン開始
    setTimeout(function() {
      executeEnemyTurn(playerAction, playerBaseDamage);
    }, 1200);
    
  }, 1000);
}

// 敵のターン処理
function executeEnemyTurn(playerAction, playerBaseDamage) {
  // 敵の行動を決定
  const enemyAction = getEnemyAction();
  let enemyBaseDamage = getRandomDamage();
  
  // 第2形態の場合は攻撃力2倍
  if (enemyPhase === 2) {
    enemyBaseDamage = Math.floor(enemyBaseDamage * 2);
  }
  
  const actionNames = {
    'attack': 'たたかう',
    'talk': 'はなしあう',
    'cry': 'なみだする'
  };
  
  showMessage(`敵のターン！<br>敵は ${actionNames[enemyAction]} を選択！`);
  
  let enemyTurnDamage = 0;
  let enemyActionResult = '';
  
  // 敵の行動処理（こわすは選択されない）
  if (enemyAction === 'cry') {
    // 敵のなみだするは1/3の確率で夜背景に変化
    const nightChance = Math.random() < 1/3;
    if (nightChance && !isNightBackground) {
      isNightBackground = true;
      $('.background-image').attr('src', 'img/back_picture_night.png');
      enemyActionResult = '敵は涙を流した...辺りが夜の闇に包まれた！';
    } else {
      enemyActionResult = '敵は涙を流した...何も起こらなかった';
    }
    enemyTurnDamage = 0;
  } else {
    // 通常攻撃の倍率計算
    let multiplier = 1.0;
    
    if (enemyAction === 'attack') {
      if (playerAction === 'talk') {
        // プレイヤーのはなしあうは、敵のたたかうに弱い
        multiplier = 2.0;
        enemyActionResult = `相性が良い！`;
      }
    } else if (enemyAction === 'talk') {
      if (playerAction === 'attack') {
        // 敵のはなしあうは、プレイヤーのたたかうに弱い
        multiplier = 0.5;
        enemyActionResult = `相性が悪い！`;
      }
    }
    
    enemyTurnDamage = Math.floor(enemyBaseDamage * multiplier);
    
    // 夜背景の場合は攻撃力1.5倍
    if (isNightBackground) {
      enemyTurnDamage = Math.floor(enemyTurnDamage * 1.5);
    }
    
    // 味方がいる場合は受けるダメージ0.8倍
    if (supporterSummoned) {
      enemyTurnDamage = Math.floor(enemyTurnDamage * 0.8);
    }
    
    if (multiplier === 1.0) {
      enemyActionResult = `あなたに ${enemyTurnDamage} ダメージ！`;
    } else {
      enemyActionResult += `あなたに ${enemyTurnDamage} ダメージ！`;
    }
  }
  
  // ダメージ適用
  playerHP = Math.max(0, playerHP - enemyTurnDamage);
  
  // 1秒後に敵の行動結果を表示
  setTimeout(function() {
    showMessage(`敵のターン！<br>敵は ${actionNames[enemyAction]} ！<br>${enemyActionResult}`);
    updateHealthBars();
    
    // 勝敗判定
    setTimeout(function() {
      if (checkGameEnd()) {
        return;
      }
      
      // ターン終了、ボタン再有効化
      isProcessing = false;
      $('#battle-menu button').prop('disabled', false);
      showMessage('あなたのターン！行動を選んでください');
    }, 1200);
    
  }, 1000);
}

// いのる処理
function executePray() {
  if (!prayButtonUnlocked || isProcessing) {
    showMessage('まだ使えません');
    return;
  }
  
  // 処理中フラグをON、ボタン無効化
  isProcessing = true;
  $('#battle-menu button').prop('disabled', true);
  
  // 【プレイヤーターン：いのる】
  showMessage('あなたのターン！<br>いのる を選択しました！');
  
  setTimeout(function() {
    playerHP = Math.min(maxHP, playerHP + 120);
    let prayMessage = 'あなたのターン！<br>いのる！<br>いのりによって 120pt 回復しました！';
    
    // 1/3の確率で味方を召喚（まだ召喚されていない場合のみ）
    if (!supporterSummoned && Math.random() < 1/3) {
      supporterSummoned = true;
      $('.supporter-container').fadeIn(500);/*0.5秒でフェードインふわっと現れる*/
      prayMessage += '<br><br>味方が現れた！攻撃力が上がり、防御力も上がった！';
    }
    
    updateHealthBars();
    showMessage(prayMessage);
    
    // 【敵ターン】1.2秒後に敵のターン開始
    setTimeout(function() {
      const enemyAction = getEnemyAction();
      let enemyBaseDamage = getRandomDamage();
      
      // 第2形態の場合は攻撃力2倍
      if (enemyPhase === 2) {
        enemyBaseDamage = Math.floor(enemyBaseDamage * 2);
      }
      
      const actionNames = {
        'attack': 'たたかう',
        'talk': 'はなしあう',
        'cry': 'なみだする'
      };
      
      showMessage(`敵のターン！<br>敵は ${actionNames[enemyAction]} を選択！`);
      
      setTimeout(function() {
        let enemyTurnDamage = 0;
        let enemyActionResult = '';
        
        if (enemyAction === 'cry') {
          // 敵のなみだするは1/3の確率で夜背景に変化
          const nightChance = Math.random() < 1/3;
          if (nightChance && !isNightBackground) {
            isNightBackground = true;
            $('.background-image').attr('src', 'img/back_picture_night.png');
            enemyActionResult = '敵は涙を流した...辺りが夜の闇に包まれた！';
          } else {
            enemyActionResult = '敵は涙を流した...何も起こらなかった';
          }
          enemyTurnDamage = 0;
        } else {
          enemyTurnDamage = enemyBaseDamage;
          
          // 夜背景の場合は攻撃力1.5倍
          if (isNightBackground) {
            enemyTurnDamage = Math.floor(enemyTurnDamage * 1.5);
          }
          
          // 味方がいる場合は受けるダメージ0.8倍
          if (supporterSummoned) {
            enemyTurnDamage = Math.floor(enemyTurnDamage * 0.8);
          }
          
          enemyActionResult = `あなたに ${enemyTurnDamage} ダメージ！`;
        }
        
        playerHP = Math.max(0, playerHP - enemyTurnDamage);
        
        showMessage(`敵のターン！<br>敵は ${actionNames[enemyAction]} ！<br>${enemyActionResult}`);
        updateHealthBars();
        
        setTimeout(function() {
          if (checkGameEnd()) {
            return;
          }
          
          // ターン終了、ボタン再有効化
          isProcessing = false;
          $('#battle-menu button').prop('disabled', false);
          showMessage('あなたのターン！行動を選んでください');
        }, 1200);
      }, 1000);
    }, 1200);
  }, 1000);
}

// ゲーム終了判定
function checkGameEnd() {
  if (playerHP <= 0 && enemyHP <= 0) {
    showMessage('引き分け！両者倒れた...');
    endGame();
    return true;
  } else if (playerHP <= 0) {
    // 敗北時は背景を赤い画像に変更し、味方を消す
    $('.background-image').attr('src', 'img/back_picture_red.png');
    $('.supporter-container').hide();
    showMessage('敗北...セカイは鮮血に包まれた');
    endGame();
    return true;
  } else if (enemyHP <= 0) {
    // 敵のHPが0になった場合
    if (enemyPhase === 1) {
      // 第1形態を倒した場合、第2形態に変化
      transformEnemyPhase2();
      return true; // 処理を一旦止める
    } else {
      // 第2形態を倒した場合、勝利し敵を消す
      $('.enemy-container').hide();
      showMessage('勝利！セカイとじぶんをこわした！');
      endGame();
      return true;
    }
  }
  return false;
}

// 敵を第2形態に変化させる
function transformEnemyPhase2() {
  isProcessing = true;
  $('#battle-menu button').prop('disabled', true);
  
  // 第2形態への変化メッセージ
  showMessage('敵を倒した！<br>しかし...');
  
  setTimeout(function() {
    showMessage('8bitで戦うのはやめだ、16bitの性能を見せよう。<br>可哀そうだから体力を回復させてあげよう。');
    
    // 敵画像を第2形態に変更
    $('.enemy-character').attr('src', 'img/character_battle_opponent_2.png');
    
    setTimeout(function() {
      // 敵のフェーズを2に
      enemyPhase = 2;
      
      // 体力を両方とも全回復
      playerHP = maxHP;
      enemyHP = maxHP;
      
      // 体力ゲージの色を初期値（緑色）に戻す
      $('#player-health-bar').css('background', '#4CAF50');
      $('#enemy-health-bar').css('background', '#4CAF50');
      
      updateHealthBars();
      
      showMessage('敵が第2形態に変化した！<br>お互いの体力が全回復した！<br><br>あなたのターン！行動を選んでください');
      
      // ボタンを再有効化
      isProcessing = false;
      $('#battle-menu button').prop('disabled', false);
    }, 2500);
  }, 2000);
}

// ゲーム終了処理
function endGame() {
  gameStarted = false;
  $('#battle-menu').hide();
  $('#return-menu').show();
}

// スタート画面に戻る　容量が少ないのでreloadで対応
function returnToStart() {
  location.reload();
}

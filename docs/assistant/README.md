# MP3曲情報エディター（状況メモ）

## 目的
- Fantia配布MP3の文字化け修正、タグ編集（曲名/アーティスト/アルバム/トラック/ジャケ/歌詞）

## 技術/制約
- Next.js (App Router) / TypeScript / GitHub Pages (静的)
- File System Access API（Chrome/Edge想定）
- 元ファイル保護: *.mp3 → *.mp3.org バックアップ運用

## 主要モジュール
- useMp3Library: フォルダ選択、mp3列挙、TrackMeta収集、cover url管理、dir coverフォールバック
- useSettings: UI/再生設定の永続化（localStorage）
- usePlaylistPlayer: 再生制御（連続/シャッフル/ショートカット/追従スクロールはTrackList側）
- useTrackViews: TrackMeta + mapping を表示用に合成

## 既知課題
- 文字化け: Shift_JIS判定/復元、ID3v1/v2の扱い
- 書き込み: ブラウザ上で安全に上書き、.org運用UI

## 直近タスク（優先順）
1. xxx
2. yyy
3. zzz

## 再現手順（最短）
1) …
2) …

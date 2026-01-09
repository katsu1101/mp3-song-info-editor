/**
 * 指定されたイベントターゲットがユーザー入力フィールドかコンテンツ編集可能要素かを判定し、
 * 入力操作が意図されている可能性があることを示します。
 *
 * @param {EventTarget | null} target - イベントの対象。通常は操作対象の要素。
 * @returns {boolean} - 対象が入力フィールド、textarea、select、またはコンテンツ編集可能要素の場合trueを返す。それ以外の場合falseを返す。
 */
export const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;

  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  return target.isContentEditable;
};

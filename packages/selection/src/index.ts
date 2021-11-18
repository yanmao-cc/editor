import Cursor from './cursor';

interface Options {
  onSelect?: (range: Range) => void;
}

export default class {
  #contianer: HTMLElement;
  #options: Options;
  #currentRange?: Range;
  #cursor: Cursor;

  constructor(container: HTMLElement, options?: Options) {
    this.#contianer = container;
    this.#options = options || {};
    this.#cursor = new Cursor(container);
    this.#bind();
  }

  #bind() {
    this.#contianer.addEventListener('mousedown', this.#handleAnchor);
    this.#contianer.addEventListener('mouseup', this.#handleFocus);
    this.#contianer.addEventListener('mousemove', this.#handleMove);
  }

  #handleAnchor = (event: MouseEvent) => {
    if (!event.target) return;
    const start = this.getOffset(
      event.target as Node,
      event.clientY,
      event.clientX + 1,
    );
    if (!start) return;
    const { node, offset } = start;
    if (!node) return;
    this.#currentRange = new Range();
    this.#currentRange.setStart(node, offset);
  };

  #handleFocus = (event: MouseEvent) => {
    if (!this.#currentRange) return;
    const end = this.getOffset(
      event.target as Node,
      event.clientY,
      event.clientX + 1,
    );
    if (!end) return;
    const { node, offset } = end;
    if (!node) return;
    this.#currentRange.setEnd(node, offset);
    const { onSelect } = this.#options;
    if (onSelect) onSelect(this.#currentRange);
    this.#cursor.draw(this.#currentRange);
    this.#currentRange = undefined;
  };

  #handleMove = (event: MouseEvent) => {
    if (!event.target || !this.#currentRange) return;
    const end = this.getOffset(
      event.target as Node,
      event.clientY,
      event.clientX + 1,
    );
    if (!end) return;
    const { node, offset } = end;
    if (!node) return;
    this.#currentRange.setEnd(node, offset);
    this.#cursor.draw(this.#currentRange);
  };

  /**
   * 标准化鼠标所点击到相对于节点的top
   * @param element 目标节点
   * @param top 鼠标位置的 top
   * @returns
   */
  normalMouseTop(element: Element, top: number) {
    const rect = element.getBoundingClientRect();
    // 鼠标所在节点行高
    let textNode: Text | null = null;
    element.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        textNode = child as Text;
        return;
      }
    });
    if (textNode === null) return;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 0);
    const lineHeight = range.getBoundingClientRect().height;
    // 总行数
    const rows = rect.height / lineHeight;
    // 鼠标所点击的位置距离节点的top
    const value = top - rect.top;
    // 鼠标所在行
    let rowIndex = 0;
    for (; rowIndex < rows - 1; rowIndex++) {
      if (value <= (rowIndex + 1) * lineHeight) break;
    }
    // 鼠标所在的top
    return {
      top: rowIndex * lineHeight + rect.top,
      row: rowIndex,
      lineHeight,
    };
  }

  getOffset(target: Node, top: number, left: number) {
    // 文本节点就获取父级节点
    if (target.nodeType === Node.TEXT_NODE) {
      if (!target.parentNode) return null;
      target = target.parentNode;
    }
    const element = target as Element;
    let child = element.firstChild;
    const rect = element.getBoundingClientRect();
    // 鼠标所在位置到文本节点开头的宽度
    const width = left + 1 - rect.left;
    // 鼠标所在的top
    const info = this.normalMouseTop(element, top);
    if (!info) return null;
    // 索引
    let offset = 0;
    // 累计计算的宽度
    let offsetWidth = 0;
    // 选择的节点
    let offsetNode: Node | null = null;
    // 计算节点到鼠标位置的offset级所在位置的节点
    while (child && !offsetNode) {
      if (child.nodeType === Node.TEXT_NODE) {
        const length = child.textContent?.length || 0;
        offset = this.getTextOffset(
          child as Text,
          info.top,
          left,
          length,
        ).offset;
      }
      child = child.nextSibling;
    }
    // 在末尾没找到，就设定为最后一个 child
    if (!offsetNode) offsetNode = target.lastChild;

    console.log(
      'node:',
      offsetNode,
      ', offset:',
      offset,
      'offsetWidth:',
      offsetWidth,
      'width:',
      width,
      offsetNode?.textContent?.substring(0, offset),
    );
    return {
      node: offsetNode,
      offset,
    };
  }

  /**
   *
   * @param textNode 文本节点
   * @param top 鼠标 top
   * @param left 鼠标 left
   * @param length 字符长度
   * @param start 开始位置,默认 0
   * @param end 结束位置，默认字符长度
   * @returns
   */
  getTextOffset(
    textNode: Text,
    top: number,
    left: number,
    length: number,
    start: number = 0,
    end: number = length,
  ): { node: Text; offset: number } {
    const range = document.createRange();
    // 获取字符长度的一半
    const offset = Math.floor((end - start) / 2) + start;
    try {
      // 让 range 选中这个 offset
      range.setStart(textNode, offset),
        range.setEnd(
          textNode,
          Math.max(Math.min(offset, (textNode.textContent || '').length), 0),
        );
    } catch (error) {
      return {
        node: textNode,
        offset: 0,
      };
    }
    // 获取光标位置
    const rect = range.getBoundingClientRect();
    // 如果光标位置与小于鼠标点击位置的top, 就取后半段
    // 场景1：
    // abcdefg
    // 123
    //
    if (rect.top < top) {
      return this.getTextOffset(textNode, top, left, length, offset, end);
    } else if (rect.top > top) {
      return this.getTextOffset(textNode, top, left, length, start, offset);
    } else {
      // 如果光标位置等于 鼠标位置就返回 offset
      if (rect.left === left)
        return {
          node: textNode,
          offset,
        };
      // 光标位置 left 大于 鼠标位置left，取前半段
      if (rect.left > left) {
        // 如果当前left 减去前一个字符的一半宽度刚好小于鼠标位置，那就返回当前offset
        // ab|c 此时鼠标刚好点击在 b 的右侧部分
        const cloneRange = range.cloneRange();
        cloneRange.setStart(textNode, offset - 1);
        if (rect.left - cloneRange.getBoundingClientRect().width / 2 < left)
          return {
            node: textNode,
            offset,
          };
        // 第二个字符还没找到就算作第一个了
        if (offset - 1 === 0)
          return {
            node: textNode,
            offset: 0,
          };
        return this.getTextOffset(textNode, top, left, length, start, offset);
      } else {
        // 如果当前left 加上前下一个字符的一半宽度刚好大于鼠标位置，那就返回当前offset
        // a|bc 此时鼠标刚好点击在 b 的左侧部分
        const cloneRange = range.cloneRange();
        cloneRange.setEnd(textNode, offset + 1);
        if (rect.left + cloneRange.getBoundingClientRect().width / 2 >= left)
          return {
            node: textNode,
            offset,
          };
        // 倒数第二个字符还没找到就算作最后一个了
        if (offset + 1 === length)
          return {
            node: textNode,
            offset: length,
          };
        // 光标位置 left 小于 鼠标位置left，取后半段
        return this.getTextOffset(textNode, top, left, length, offset, end);
      }
    }
  }

  destroy() {
    this.#contianer.removeEventListener('mousedown', this.#handleAnchor);
    this.#contianer.removeEventListener('mouseup', this.#handleFocus);
  }
}

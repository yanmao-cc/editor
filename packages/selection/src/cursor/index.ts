import './index.less';

class Cursor {
  #root: HTMLElement;
  #cursor: HTMLDivElement;
  #selection: HTMLDivElement;
  #caret: HTMLDivElement;

  constructor(root: HTMLElement) {
    // 光标节点
    this.#cursor = document.createElement('div');
    this.#cursor.classList.add('editor-cursor');
    this.#caret = document.createElement('div');
    this.#caret.classList.add('editor-cursor-caret');
    this.#cursor.appendChild(this.#caret);
    // 光标选择节点
    this.#selection = document.createElement('div');
    this.#selection.classList.add('editor-selection');
    // 带滚动条的根节点
    this.#root = this.#findScrollNode(root);
    this.#root.appendChild(this.#cursor);
  }
  /**
   * 找到带滚动条的最上方节点，默认为 document.documentElement
   * @param node 节点
   * @returns
   */
  #findScrollNode(node: HTMLElement): HTMLElement {
    // 查找父级样式 overflow 或者 overflow-y 为 auto 或者 scroll 的节点
    const targetValues = ['auto', 'scroll'];
    let parent = node.parentElement;
    let sn: HTMLElement | null = null;
    while (parent && parent.nodeName.toLowerCase() !== 'body') {
      if (
        targetValues.includes(parent.style.overflow) ||
        targetValues.includes(parent.style.overflowY)
      ) {
        sn = parent;
        break;
      } else {
        parent = parent.parentElement;
      }
    }
    if (sn === null) sn = document.documentElement;
    return sn;
  }

  draw(range: Range) {
    if (range.collapsed) {
      const rect = range.getBoundingClientRect();
      this.#cursor.style.left = `${rect.left + this.#root.scrollLeft}px`;
      this.#cursor.style.top = `${rect.top + this.#root.scrollTop}px`;
      this.#cursor.classList.add('editor-cursor-blank');
      this.#cursor.style.opacity = '1';
      this.#caret.style.height = `${rect.height}px`;
      // 获取当前颜色
      const element = (
        range.startContainer.nodeType === Node.TEXT_NODE
          ? range.startContainer.parentElement
          : range.startContainer
      ) as HTMLElement;
      const style = window.getComputedStyle(element, null);
      this.#caret.style.borderColor = style.color;
    } else {
      this.clear();
      const { startContainer, startOffset, endContainer, endOffset } = range;

      let cloneRange = range.cloneRange();

      let next: Node | null = startContainer;
      let offset: number = startOffset;
      while (next) {
        // 新行开始
        // 获取开始位置的left 和 top
        const startRange = cloneRange.cloneRange();
        startRange.setStart(next, offset);
        startRange.collapse(true);
        const startRect = startRange.getBoundingClientRect();
        const overlay = document.createElement('div');
        overlay.classList.add('selection-overlay');
        overlay.style.position = 'absolute';
        // left
        const left = startRect.left + this.#root.scrollLeft;
        overlay.style.left = `${left}px`;
        // top
        let top = startRect.top + this.#root.scrollTop;
        overlay.style.top = `${top}px`;

        // 获取一行的末尾
        let height = startRect.height;
        let width = startRect.width;
        // 遍历下一个节点
        while (next) {
          // 选中这个节点，获取这个节点的高度
          cloneRange.selectNodeContents(next);
          const elementHeight = cloneRange.getBoundingClientRect().height;
          // 有换行，找到换行位置作为一行结束点
          if (elementHeight > height) {
            // 文本就每个字符去试高度
            if (next.nodeType === Node.TEXT_NODE) {
              const endRange = cloneRange.cloneRange();
              endRange.setStart(next, 0);
              for (let i = 0; i < (next.textContent?.length || 0); i++) {
                endRange.setEnd(next, i);
                if (endRange.getBoundingClientRect().top > top) {
                  endRange.setEnd(next, i - 1);
                  width += endRange.getBoundingClientRect().width;
                  offset = i;
                  break;
                }
              }
            } else {
            }
            break;
          }
          // 没有换行
          else {
            next = next.nextSibling;
          }
        }
      }
    }
  }

  clear() {
    this.#cursor.classList.remove('editor-cursor-blank');
    this.#cursor.style.opacity = '0';
    this.#selection.childNodes.forEach((child) => {
      this.#selection.removeChild(child);
    });
  }

  destroy() {
    this.#cursor.remove();
  }
}

export default Cursor;

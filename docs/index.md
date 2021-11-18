---
hero:
  title: editor
  desc: editor site example
  actions:
    - text: Getting Started
      link: /components
features:
  - icon: https://gw.alipayobjects.com/zos/bmw-prod/881dc458-f20b-407b-947a-95104b5ec82b/k79dm8ih_w144_h144.png
    title: Feature 1
    desc: Balabala
  - icon: https://gw.alipayobjects.com/zos/bmw-prod/d60657df-0822-4631-9d7c-e7a869c2f21c/k79dmz3q_w126_h126.png
    title: Feature 2
    desc: Balabala
  - icon: https://gw.alipayobjects.com/zos/bmw-prod/d1ee0c6f-5aed-4a45-a507-339a4bfe076c/k7bjsocq_w144_h144.png
    title: Feature 3
    desc: Balabala
footer: Open-source MIT Licensed | Copyright © 2020<br />Powered by [dumi](https://d.umijs.org)
---

## Hello editor!

```tsx
import React, { useRef, useEffect, useState } from 'react';
import CustomeSelection from '@aomao/selection';

export default () => {
  const customeSelection = useRef<CustomeSelection | null>(null);
  const container = useRef<HTMLElement | null>(null);
  const [boxRect, setBoxRect] = useState({});
  useEffect(() => {
    customeSelection.current = new CustomeSelection(container.current);
    const boxRect = container.current?.getBoundingClientRect();
    setBoxRect({
      top: boxRect?.top,
      left: boxRect?.left,
      width: boxRect?.width,
      height: boxRect?.height,
    });
  }, []);

  return (
    <>
      <div>Box: {JSON.stringify(boxRect)}</div>
      <div
        ref={container}
        style={{
          width: '100px',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        abcdefghijklm123456
      </div>
    </>
  );
};
```

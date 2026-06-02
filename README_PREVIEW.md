# Tardis Talk UI Directory v0.2

这是可直接运行的 Vite React 工程。解压后进入当前文件夹即可启动，不需要再进入二级目录。

## 本地预览

```bash
npm install
npm run dev
```

然后打开终端提示的地址，通常是：

```text
http://localhost:5173/
```

## 本版改动

- 保留原来的 TARDIS 动态背景和通话视觉。
- 底部按钮整理为通讯录式分区。
- 增加 3 个普通人自定义角色槽位，用于家人/朋友/同事/邻居等普通人。
- 随机来电者被接听 3 次后，可解锁为通讯录联系人。
- 不再把站长 Gemini API Key 注入前端；用户自己在页面里输入自己的 Key。

## 注意

- 真实语音通话仍需要用户自己的 Gemini API Key。
- UI 可以直接预览；没有 Key 时不要测试真实 Gemini Live 电话。

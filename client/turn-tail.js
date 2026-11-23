/**
 * 会话里的渲染结果展示 —— 挂载在 `conversation.chat.turnTail`。
 *
 * 这里记录三个必须守住的约束，每一个都是踩过坑才写下的：
 *
 * 1. **只能在本轮窗口内显示**。
 *    早先写的是"产物时间 ≥ 本轮开始时间"，那是错的 —— 其它会话的历史轮次开始时间
 *    都很早，同样满足条件，于是每个会话下面都挂了一张图。
 *    正确判据是产物时间落在 [turn.start.time, turn.end.time] 之间。
 *    时间窗不完整（缺 end）时一律不显示：宁可少显示，也不能污染别人的会话。
 *
 * 2. **取图必须走 POST**。实测 `GET /api/html-render/artifact` 到不了我们的路由
 *    （日志里连记录都没有，被前端的静态资源处理截走了），所以用 POST 取字节再转 blob URL。
 *
 * 3. **不承诺"点击看大图"**。blob URL 在组件卸载时会被释放，新标签页打开必然失败；
 *    这里改成页面内的放大/还原，不依赖 blob 生命周期。
 */
import React from 'react';

const { useState, useEffect } = React;

const JSON_HEADERS = { 'content-type': 'application/json' };

async function postJson(body) {
  const response = await fetch('/api/html-render/', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!response.ok) return null;
  return response.json();
}

export function TurnTailProbe(props) {
  const [artifact, setArtifact] = useState(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [zoomed, setZoomed] = useState(false);

  const turn = props && props.turn ? props.turn : null;
  const turnStart = turn && turn.start ? Number(turn.start.time) || 0 : 0;
  // 当前轮结束时 turn.end 可能还没落库，用"现在"兜底；
  // 已结束的历史轮次一定有 end，所以不会因此误显示。
  const turnEnd = turn && turn.end ? Number(turn.end.time) || 0 : Date.now();

  useEffect(() => {
    if (turnStart <= 0 || turnEnd <= 0) return undefined;

    let alive = true;
    let objectUrl = null;

    (async () => {
      const decision = { step: 'turntail-window', turnStart, turnEnd, createdAt: null, shown: false };
      try {
        const latest = await postJson({ action: 'latest' });
        if (!alive || !latest || latest.ok !== true || !latest.artifact) {
          decision.reason = 'no-artifact';
          await postJson({ action: 'diag', ...decision });
          return;
        }

        const createdAt = Number(latest.artifact.createdAtMs);
        decision.createdAt = createdAt;
        // 只认"落在本轮时间窗内"的产物 —— 这一条是"不污染其它会话"的全部依据
        if (!Number.isFinite(createdAt) || createdAt < turnStart || createdAt > turnEnd) {
          decision.reason = 'outside-window';
          await postJson({ action: 'diag', ...decision });
          return;
        }

        decision.shown = true;
        decision.reason = 'shown';
        setArtifact(latest.artifact);

        const response = await fetch('/api/html-render/', {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({ action: 'artifact', id: latest.artifact.id }),
        });
        if (!response.ok) return;

        const blob = await response.blob();
        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        setImgUrl(objectUrl);
      } catch {
        /* 取不到就只留横幅，绝不污染界面 */
      } finally {
        if (alive) await postJson({ action: 'diag', ...decision }).catch(() => {});
      }
    })();

    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [turnStart, turnEnd]);

  if (!artifact) return null;

  return React.createElement('div', { className: 'dhr-tail-wrap' }, [
    React.createElement('div', { className: 'dhr-tail', key: 'head' }, [
      React.createElement('span', { className: 'dhr-tail-dot', key: 'dot' }),
      React.createElement('span', { className: 'dhr-tail-text', key: 'text' }, '本轮渲染结果'),
      React.createElement(
        'span',
        { className: 'dhr-tail-sub', key: 'sub' },
        `${artifact.id.split('.').pop().toUpperCase()}${imgUrl ? ' · 点击放大' : ' · 加载中'}`,
      ),
    ]),
    imgUrl
      ? React.createElement('img', {
          className: zoomed ? 'dhr-tail-image dhr-tail-image-zoom' : 'dhr-tail-image',
          key: 'image',
          src: imgUrl,
          alt: 'html render result',
          onClick: () => setZoomed((value) => !value),
        })
      : null,
  ]);
}

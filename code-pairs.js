const languageNames = { python: 'Python', java: 'Java' };

function languageOf(block) {
  const code = block?.querySelector(':scope > pre > code');
  return Object.keys(languageNames).find(lang => code?.classList.contains('language-' + lang));
}

function pairBlocks(first, second) {
  const panels = [first, second].map(block => ({
    language: languageOf(block),
    codeId: block.querySelector('.copy-button').dataset.copy,
    panel: block.querySelector('pre'),
  }));
  panels.sort((a, b) => Number(a.language === 'java') - Number(b.language === 'java'));

  const group = document.createElement('div');
  group.className = 'code-block code-pair';
  const bar = document.createElement('div');
  bar.className = 'code-top';
  const tabs = document.createElement('div');
  tabs.className = 'code-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', '示例语言');
  const copy = first.querySelector('.copy-button');
  bar.append(tabs, copy);
  group.append(bar);

  function select(language) {
    for (const item of panels) {
      const active = item.language === language;
      item.tab.tabIndex = active ? 0 : -1;
      item.tab.setAttribute('aria-selected', String(active));
      item.panel.hidden = !active;
      if (active) {
        copy.dataset.copy = item.codeId;
        copy.textContent = '复制代码';
        copy.setAttribute('aria-label', '复制 ' + languageNames[language] + ' 代码');
      }
    }
  }

  for (const [index, item] of panels.entries()) {
    const tab = document.createElement('button');
    item.tab = tab;
    tab.type = 'button';
    tab.textContent = languageNames[item.language];
    tab.id = item.codeId + '-tab';
    tab.setAttribute('role', 'tab');
    const panelId = item.codeId + '-panel';
    tab.setAttribute('aria-controls', panelId);
    tab.onclick = () => select(item.language);
    tab.onkeydown = event => {
      const targets = {ArrowRight: 1 - index, ArrowLeft: 1 - index, Home: 0, End: panels.length - 1};
      if (!(event.key in targets)) return;
      event.preventDefault();
      const next = panels[targets[event.key]];
      select(next.language);
      next.tab.focus();
    };
    tabs.append(tab);
    item.panel.id = panelId;
    item.panel.setAttribute('role', 'tabpanel');
    item.panel.setAttribute('aria-labelledby', tab.id);
    item.panel.tabIndex = 0;
    item.panel.dataset.language = languageNames[item.language];
    group.append(item.panel);
  }

  first.replaceWith(group);
  second.remove();
  select('python');
}

export function enableCodePairs(article) {
  let inTemplate = false;
  for (const element of [...article.children]) {
    const anchor = element.matches('a[id]') ? element : element.querySelector(':scope > a[id]');
    if (anchor) inTemplate = anchor.id.startsWith('tpl-');
    if (element.matches('h1,h2,h3,h4,h5,h6')) inTemplate = false;
    if (!inTemplate || !element.isConnected || !element.classList.contains('code-block')) continue;
    const next = element.nextElementSibling;
    if (!next?.classList.contains('code-block')) continue;
    const first = languageOf(element);
    const second = languageOf(next);
    if (first && second && first !== second) {
      pairBlocks(element, next);
      inTemplate = false;
    }
  }
}

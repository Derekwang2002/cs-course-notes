import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const root = new URL(process.argv[2] || 'http://127.0.0.1:4173/');
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
});
try {
  const context = await browser.newContext({viewport: {width: 1280, height: 900}});
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {origin: root.origin});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const link = route => new URL(route, root).href;
  const response = await context.request.get(link('content/index.json'));
  assert.ok(response.ok());
  const chapters = await response.json();
  let count = 0;
  for (const id of [...chapters.map(c => c.id), 'syntax']) {
    const route = id === 'syntax' ? '#/syntax' : '#/lesson/' + id;
    await page.goto(link(route));
    await page.waitForFunction(id => document.querySelector('.prose') &&
      (id === 'syntax' ? document.querySelector('.lesson-header h1')?.textContent.includes('手册')
                       : document.querySelector('.lesson-header .eyebrow')?.textContent.includes('CHAPTER ' + id.toUpperCase() + ' ')), id);
    const n = await page.locator('.template-links a').count();
    assert.equal(await page.locator('.prose [id^="tpl-"]').count(), n, route + ' menu');
    assert.equal(await page.locator('.code-pair').count(), n, route + ' rendered pairs');
    assert.equal(await page.getByRole('tab', {name: 'Python', selected: true}).count(), n, route);
    count += n;
  }

  const anchor = 'tpl-generic-stack';
  const href = '#/syntax?section=' + anchor;
  await page.click('#search-open');
  await page.fill('#search-input', '同一份栈实现');
  await page.locator('#search-results').locator('a[href="' + href + '"]').click();
  await page.waitForFunction(id => {
    const top = document.getElementById(id)?.getBoundingClientRect().top;
    return top >= 0 && top < 160;
  }, anchor);

  const pair = page.locator('.code-pair').first();
  async function verifyCopy(language) {
    const panel = pair.getByRole('tabpanel', {name: language});
    const code = await panel.locator('code').textContent();
    await pair.getByRole('button', {name: '复制 ' + language + ' 代码'}).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), code, 'copy ' + language);
  }
  await verifyCopy('Python');
  await pair.getByRole('tab', {name: 'Python'}).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await pair.getByRole('tab', {name: 'Java'}).getAttribute('aria-selected'), 'true');
  await verifyCopy('Java');

  await page.setViewportSize({width: 390, height: 844});
  await page.goto(link('#/lesson/00?section=tpl-queue'));
  const queue = page.locator('.code-pair').last();
  await queue.getByRole('tab', {name: 'Java'}).click();
  assert.match(await queue.getByRole('tabpanel').innerText(), /queue\.poll\(/);
  await queue.getByRole('tab', {name: 'Python'}).click();
  assert.match(await queue.getByRole('tabpanel').innerText(), /queue\.popleft\(/);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'mobile overflow');
  assert.deepEqual(errors, []);
  console.log(count + ' bilingual examples rendered. Search, deep links, keyboard, clipboard and mobile switching passed at ' + root.origin);
} finally {
  await browser.close();
}

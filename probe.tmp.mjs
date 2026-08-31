import puppeteer from 'puppeteer'
const b = await puppeteer.launch({ args:['--no-sandbox','--disable-gpu'], protocolTimeout: 20000 })
const p = await b.newPage()
p.on('request', r => {}); 
await p.goto('http://localhost:4477/served.html', { waitUntil:'domcontentloaded', timeout:15000 })
const r = await p.evaluate(() => {
  const cs = el => el ? getComputedStyle(el) : null
  const body = cs(document.body)
  const shell = document.querySelector('.shell')
  const h1 = document.querySelector('h1')
  return {
    styleTagsInDom: document.querySelectorAll('style').length,
    titleInBody: !!document.body.querySelector('title'),
    bodyBg: body.backgroundColor,
    bodyFont: body.fontFamily.slice(0,40),
    bodyFontSize: body.fontSize,
    shellMaxWidth: shell ? cs(shell).maxWidth : 'NO .shell',
    h1Size: h1 ? cs(h1).fontSize : 'no h1',
    h1Weight: h1 ? cs(h1).fontWeight : '',
    rootGround: getComputedStyle(document.documentElement).getPropertyValue('--ground').trim(),
    sectionCount: document.querySelectorAll('section').length,
  }
})
console.log(JSON.stringify(r,null,1))
await b.close()

(async()=>{
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<12&&!document.querySelector('input[type=file][accept*=image]');i++)await sleep(500);
const nameEl=[...document.querySelectorAll('input[type=text],input:not([type])')].find(e=>/Лицензия|Диагностика|Песня|Витрина|Метод|Обучение|Шаг/.test(e.value));
const name=nameEl?nameEl.value:'';
if(!name)return 'NO FORM';
const songs=['Всё хорошо','Пока ты рядом','Весной воспрянет дух','Ведь я люблю тебя','Колыбельная','Мой любимый человек','Тень в пустоте','Судьбы граница','Я хочу жить проще',"It's all right",'Strange Wind','Behind the sun','The demon in the shadow','Cinema','The Border of Fate',"I'm fin"];
const n=name.replace(/[’‘]/g,"'");let file=null;
const si=songs.findIndex(s=>n.includes('«'+s+'»'));
if(si>=0){file=String(5+si).padStart(2,'0')+'.jpg'}
else if(/^Диагностика/.test(n))file='01.png';
else if(/^Песня на заказ/.test(n))file='02.png';
else if(/^Лицензия на песню или музыку/.test(n))file='03.png';
else if(/^Витрина/.test(n))file='04.png';
if(!file)return 'NO MAP: '+name;
const has=document.querySelectorAll('[class*=photo] img, img[src*="userapi"]').length;
const inp=document.querySelector('input[type=file][accept*=image]');
const ext=file.split('.').pop();
const b=await fetch('https://irektuhvatshin.ru/img/vk-services/'+file).then(x=>x.blob());
const f=new File([b],file,{type:b.type});const dt=new DataTransfer();dt.items.add(f);inp.files=dt.files;
inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}));
let ok=false;
for(let i=0;i<20;i++){await sleep(500);const bt=[...document.querySelectorAll('button')].find(e=>/Сохранить изменения/.test(e.innerText));if(bt){bt.click();ok=true;break}}
if(!ok)return 'NO CROP '+name;
await sleep(3500);
const sv=[...document.querySelectorAll('button')].find(e=>/Сохранить услугу/.test(e.innerText));
if(!sv)return 'NO SAVE '+name;
sv.click();await sleep(3500);
return 'OK '+file+' '+name;
})()

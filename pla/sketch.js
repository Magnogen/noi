// jshint esversion: 8
// noprotect

let $ = function (query='', item=0) {
  if (item == 'all') return document.querySelectorAll(query);
  return document.querySelectorAll(query).item(item);
};
let perlin = (x=0, y=0, z=0) => 0.5+tooloud.Perlin.noise(x, y, z);
let simplex = (x=0, y=0, z=0) => 0.5+2*tooloud.Simplex.noise(x, y, z);
let voronoi = (x=0, y=0, z=0) => {
  let [a, b, c] = tooloud.Worley.Euclidean(x, y, z);
  return a;
}
let manhattan = (x=0, y=0, z=0) => {
  let [a, b, c] = tooloud.Worley.Manhattan(x, y, z);
  return a;
}

let randomList = list => list[Math.floor(Math.random()*list.length)];

let randomEmote = () => {
  let eye = '::X';
  let nose = ' -';
  let mouth = ')P]}D3>';
  let special = ['\\o/', '*\\o/*', '(◕‿◕✿)', 'ʕ •ᴥ•ʔ', '^_^', '(°o°)', '(^_^)', '(^o^)',
                 '(^^)', '(≧∇≦)', '(/◕ヮ◕)/', '(^o^)丿', '(＾ｖ＾)'];
  if (Math.random() < 0.2) return randomList(special);
  return randomList(eye).replace(' ', '') +
         randomList(nose).replace(' ', '') +
         randomList(mouth).replace(' ', '');
}

function imagedata_to_image(imagedata, width, height) {
  let canvas = document.createElement('canvas');
  let ctx = canvas.getContext('2d');
  canvas.width = imagedata.width;
  canvas.height = imagedata.height;
  ctx.putImageData(imagedata, 0, 0);

  let image = new Image();
  image.src = canvas.toDataURL();
  image.width = width;
  image.height = height;
  return image;
}

let image = (()=>{
  let imgs = [];
  let coords = Array(64*64).fill().map((e,i)=>({x: i%64, y: Math.floor(i/64)}));
  coords = coords.map(e=>{ e.i = 4*(e.y*64+e.x); return e });
  
  return ((slice) => {
    let img = new ImageData(64, 64);

    for (let index in coords) {
      let {x, y, i} = coords[index];
      let v = perlin(4*x/64, 4*y/64, slice);
      v -= (Math.max(0, Math.hypot(x - 32, y - 32) - 8)/24)**3;
      if (Math.hypot(x - 32, y - 32) > 31) v *= 0.5;
      // if (x*y == 0 || x==63 || y==63) v = 1;
      let thresh = 0.1;
      if (0.5-thresh < v && v < 0.5+thresh) {
        v = 0.5+(v-0.5)/(2*thresh);
      } else v = v>0.5 ? 1 : 0;
      img.data[i+0]=img.data[i+1]=img.data[i+2] = 255;
      img.data[i+3] = 255*v;
    }
    
    return imagedata_to_image(img, 64, 64);
  });
})();

// (async () => {
//   while (true) {
//     $('[abcd]').innerHTML = '';
//     $('[abcd]').appendChild(image(Math.random()*1000));
//     await new Promise(requestAnimationFrame);
//   }
// })();

let ctx = $('canvas').getContext('2d');
ctx.canvas.width = ctx.canvas.offsetWidth * window.devicePixelRatio;
ctx.canvas.height = ctx.canvas.width / (1/1);
let rendering = false;

$('canvas').addEventListener('click', async e => {
  if (rendering) return;
  let w = Math.ceil(ctx.canvas.offsetWidth * window.devicePixelRatio);
  let h = Math.ceil(w / (1/1));
  $('[render] button').innerHTML = 'Initialising Preview...';
  start(w, h);
});

$('[render] button').addEventListener('click', async e => {
  if (rendering) return;
  let w = 1920;
  let h = w / (1/1);  
  $('[render] button').innerHTML = 'Initialising Render...';
  start(w, h);
});

let active_slider = false;

$('[type="slider"] [value]', 'all').forEach(option => {
  option.setAttribute('value', option.innerHTML);
  option.addEventListener('mousedown', function (e) {
    if (e.button != 0) return;
    this.classList.add('underline');
    document.body.classList.add('moving_slider');
    this.setAttribute('start_pos', e.x);
    this.setAttribute('start_val', +this.innerHTML);
    this.setAttribute('slow', e.shiftKey);
    active_slider = this;
  });
});

$('[type=radio]', 'all').forEach(group => {
  for (let option of group.children) {
    option.addEventListener('mousedown', function (e) {
      if (e.button != 0) return;
      for (let sib of group.children)
        sib.setAttribute('value', 'false')
      this.setAttribute('value', 'true');
    })
  }
});

document.addEventListener('mousemove', function (e) {
  if (!active_slider) return;
  let strt = +active_slider.getAttribute('start_pos');
  let val = +active_slider.getAttribute('start_val');
  let slow = active_slider.getAttribute('slow') == 'true';
  if (strt) {
    let speed = 1;
    if (slow) speed = 0.1;
    val += 2*speed*(e.x - strt)/window.innerWidth;
    let rules = unpackRules(active_slider.getAttribute('rules'));
    if (rules.min != undefined) val = Math.max(rules.min, val);
    if (rules.max != undefined) val = Math.min(rules.max, val);
    active_slider.setAttribute('value', val);
    active_slider.innerHTML = (+active_slider.getAttribute('value')).toFixed(2);
  }
});
document.addEventListener('mouseup', function (e) {
  if (!active_slider) return;
  active_slider.classList.remove('underline');
  document.body.classList.remove('moving_slider');
  active_slider.removeAttribute('start_pos');
  active_slider.removeAttribute('start_val');
  active_slider.removeAttribute('slow');
  active_slider = false;
});

function generateCoordinates(width, height, quick=false) {
  let coords = Array(width*height).fill().map((e, i) => ({ i: 4*i, x: i%width, y: Math.floor(i/width) }));
  if (quick) return coords;
  let [x, y] = [Math.random()-0.5, Math.random()-0.5];
  coords.sort((a, b) => (x*a.x + y*a.y) - (x*b.x + y*b.y));
  let rand = Math.random()*0.05;
  coords.sort((a, b) => {
    if (Math.random() < rand) return 0;
    return Math.hypot(a.x-width/2, a.y-height/2) - Math.hypot(b.x-width/2, b.y-height/2);
  });
  rand = 0.6;
  rand = (rand*Math.random()+1-rand/2)%1;
  coords.sort(a => Math.random()-rand);
  return coords;
}

function getOptions() {
  let layers = [];
  for (let layer of [...$('[layers]').children].filter(e => e.nodeName=='FIELDSET')) {
    let params = [];
    for (let param of layer.children) {
      let [name, type, value] = [param.getAttribute('option'), param.getAttribute('type'), ];
      for (let val of param.children) {
        if (type == 'radio') {
          if (val.getAttribute('value') == 'true')  value = val.innerHTML;
        } else if (type == 'slider')
          value = val.getAttribute('value');
      }
      if (name && value) params.push([name, value]);
    }
    layers.push(Object.fromEntries(params))
  }
  return layers;
}

function unpackRules(string) {
  return Object.fromEntries(string.split(',').map(e=>[e.split(':')[0],+e.split(':')[1]]));
}

async function start(width, height) {
  rendering = true;
  let seed = Math.floor(Math.random() * 10000);
  tooloud.Perlin.setSeed(seed);
  tooloud.Simplex.setSeed(seed);
  tooloud.Worley.setSeed(seed);
  $('[render] button').classList.add("rendering");
  $('[render] button').style.backgroundSize = `2% 1px`;
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  await new Promise(resolve => setTimeout(resolve, 250));
  let options = getOptions();
  console.log('final', options);
  let coords = generateCoordinates(width, height);
  for (let layer of options) {
    await renderLayer(width, height, layer, coords);
  }
  $('[render] button').classList.remove("rendering");
  $('[render] button').style.backgroundSize = '';
  $('[render] button').innerHTML = 'Done! ' + randomEmote();
  rendering = false;
  await new Promise(resolve => setTimeout(resolve, 2500));
  if (rendering) return;
  $('[render] button').innerHTML = 'Render';
}

async function renderLayer(width, height, options, coords) {
  let pixels = ctx.getImageData(0, 0, width, height);
  let last = performance.now();
  
  for (let index in coords) {
    let {x, y, i} = coords[index];
    if (options.colmode == 'RGB') {
      pixels.data[i + 0] = 255 * options.red;
      pixels.data[i + 1] = 255 * options.green;
      pixels.data[i + 2] = 255 * options.blue;
      pixels.data[i + 3] = 255;
    } else if (options.colmode == 'HSL') {
      let [r, g, b] = (function (h, s=1, l=0.5) {
        let a = s * Math.min(l, 1-l);
        let f = (n, k=(n+(h+360)/30)%12) => l - a * Math.max(Math.min(k-3, 9-k, 1), -1);                 
        return [f(0), f(8), f(4)]
      })(options.red*360, options.green, options.blue)
      pixels.data[i + 0] = 255 * r;
      pixels.data[i + 1] = 255 * g;
      pixels.data[i + 2] = 255 * b;
      pixels.data[i + 3] = 255;
    }
    
    // for (let channel of [0, 1, 2]) {
    //   let value=0,divisor=1;
    //   let scale = 4, octaves = 6, exponent = 2;
    //   for (let i = 0; i < octaves; i++) {
    //     let exp = exponent ** i;
    //     value += perlin(exp*scale*x/width, exp*scale*y/height, i+channel)/exp;
    //     divisor += 1/exp;
    //   }
    //   value /= divisor;
    //   pixels.data[i + channel] = 255 * value;
    // }
    // pixels.data[i + 3] = 255;
    
    if (performance.now() > last + 1000/60) {
      ctx.putImageData(pixels, 0, 0);
      let progress = (100*index/(width*height));
      $('[render] button').innerHTML = `${progress.toFixed(2)}%`;
      $('[render] button').style.backgroundSize = `${Math.max(2, 10*(progress/10).toFixed(1))}% 1px`;
      await new Promise(requestAnimationFrame);
      last = performance.now();
    }
  }
  ctx.putImageData(pixels, 0, 0);
}



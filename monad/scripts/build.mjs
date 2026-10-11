import {build} from 'esbuild';import fs from 'node:fs';
fs.mkdirSync('dist/assets',{recursive:true});
for(const file of ['index.html','style.css'])fs.copyFileSync(`src/${file}`,`dist/${file}`);
await build({entryPoints:['src/app.js'],bundle:true,minify:true,format:'esm',target:'es2022',outfile:'dist/app.js'});
for(const [source,target] of [['../web/assets/stepup-logo-on-navy.webp','dist/assets/stepup-logo-on-navy.webp'],['../web/assets/sneakers/shoe_1213.webp','dist/assets/shoe.webp']])if(fs.existsSync(source))fs.copyFileSync(source,target);

// Native app wallet, disclosures and NFT artwork share this isolated origin.
for(const file of ['wallet.html','wallet-config.js','draw.html','draw-config.js','shoe-catalog.js','legal.css','privacy.html','terms.html','delete-account.html','styles.css','invite.html'])fs.copyFileSync('../web/'+file,'dist/'+file);
for(const file of ['wallet.js','draw.js'])fs.copyFileSync('../web/assets/'+file,'dist/assets/'+file);
function copyTree(source,target){fs.mkdirSync(target,{recursive:true});for(const entry of fs.readdirSync(source,{withFileTypes:true})){const from=source+'/'+entry.name,to=target+'/'+entry.name;if(entry.isDirectory())copyTree(from,to);else fs.copyFileSync(from,to);}}
for(const dir of ['fonts','sneakers','sounds'])copyTree('../web/assets/'+dir,'dist/assets/'+dir);
copyTree('../web/.well-known','dist/.well-known');
fs.copyFileSync('../web/assets/favicon.svg','dist/assets/favicon.svg');

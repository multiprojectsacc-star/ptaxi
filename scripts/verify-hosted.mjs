import {createInterface} from 'node:readline';
const rl=createInterface({input:process.stdin});
console.log('Ready for private Site verification JSON on stdin.');
for await(const line of rl){const config=JSON.parse(line);process.env.TEST_BASE_URL=config.url;process.env.TEST_SITES_TOKEN=config.token;rl.close();await import('../tests/live-maps.integration.mjs');break;}

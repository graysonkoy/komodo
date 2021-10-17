import redis from 'redis';

const client = redis.createClient();
client.on('error', (error) => {
	console.log("ERROR", error);
})

export function checkRedis(slug) {
    return new Promise((resolve, reject) => {
        client.get(slug, (error, result) => {
            if(result) resolve(JSON.parse(result));
            else reject();
        });
    })
}

export function addToRedis(slug, data) {
    client.setex(slug, 3600, JSON.stringify(data));
}


import axios from 'axios';

export async function getClipInfo(url) {
    if (!url.includes('https://www.twitch.tv/')) throw 'invalid clip url';

    const slug = url.split('/').pop();
    console.log(slug);
    const request = await axios.get(`https://api.twitch.tv/helix/clips?id=${slug}`, {
        headers: {
            'Authorization': `Bearer ${process.env.TWITCH_ACCESS_TOKEN}`,
            'Client-ID': `${process.env.TWITCH_CLIENT_ID}`
        }
    });
    
    console.log(request.data);
    if(!request.data.slug) throw 'clip doesnt exist';
    return request.data;
}
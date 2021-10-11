import axios from 'axios';

export async function getClipInfo(url) {
    
    if(!url.includes('https://www.twitch.tv/')) throw 'invalid clip url';

    const slug = url.split('/').pop();
    console.log(slug);
    const request = await axios.get(`https://api.twitch.tv/helix/clips?id=${slug}`, {
        'headers': {
            'Authorization': 'Bearer bcr0eunhgshp3ipnb53xp76zmu886i',
            'Client-ID': 'd2ifygin4g8nfaw25qx22j2r470gkc'
        }
    });
    
    console.log(request.data);
    if(!request.data.slug) throw 'clip doesnt exist';
    return request.data;
}
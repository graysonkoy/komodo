import axios from 'axios';

export async function getClipInfo(urls) {
    
    const slugs = urls.map(url => {
        if(!url.includes('https://www.twitch.tv/')) throw 'invalid clip url';
        return url.split('/').pop();
    })
    
    const request = await axios.get(`https://api.twitch.tv/helix/clips?id=${slugs}`, {
        'headers': {
            'Authorization': 'Bearer bcr0eunhgshp3ipnb53xp76zmu886i',
            'Client-ID': 'd2ifygin4g8nfaw25qx22j2r470gkc'
        }
    });

    if(request.data.data.length !== urls.length) throw 'clip doesnt exist';
    return request.data.data;
}